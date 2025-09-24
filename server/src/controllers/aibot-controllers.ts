import { GoogleGenAI } from '@google/genai';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { eq, inArray } from 'drizzle-orm';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { quizResultsTable } from '../db/schema/tbl-quiz-results';
import { quizzesTable } from '../db/schema/tbl-quizzes';
import { shortQuestionExamsTable } from '../db/schema/tbl-short-question-exams';
import { subjectsTable } from '../db/schema/tbl-subjects';
import { topicsTable } from '../db/schema/tbl-topics';
import { userChatMessagesTable } from '../db/schema/tbl-user-chat-messages';
import { userChatsTable } from '../db/schema/tbl-user-chats';
import { userSubjectsTable } from '../db/schema/tbl-user-subjects';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

// Initialize OpenAI Embeddings and Pinecone for LangChain
const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
  dimensions: 512, // Match Pinecone index dimension
});

const pinecone = new PineconeClient();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

// Helper function to get user's vector store
async function getUserVectorStore(userId: string) {
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
    namespace: `user_${userId}`, // User-specific namespace
  });
  return vectorStore;
}

// Helper function to check if user data already exists in vector DB
async function checkUserDataExists(userId: string): Promise<boolean> {
  try {
    const vectorStore = await getUserVectorStore(userId);
    // Try to query for any existing documents for this user
    const testQuery = await vectorStore.similaritySearch('test', 1);
    return testQuery.length > 0;
  } catch (error) {
    console.log(`No existing data found for user ${userId}:`, error);
    return false;
  }
}

// Helper function to delete existing user data from vector DB
async function deleteExistingUserData(userId: string): Promise<void> {
  try {
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
    await pineconeIndex.namespace(`user_${userId}`).deleteAll();
    console.log(`Deleted existing data for user ${userId}`);
  } catch (error) {
    console.log(`No existing data to delete for user ${userId}:`, error);
  }
}
function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;

    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Helper function to get or create user chat
 * Checks if user already has an active chat, if not creates a new one
 */
async function getOrCreateUserChat(userId: string) {
  try {
    // Check if user already has an active chat
    const existingChat = await db
      .select()
      .from(userChatsTable)
      .where(eq(userChatsTable.userId, userId))
      .limit(1);

    if (existingChat.length > 0) {
      return {
        ...existingChat[0],
        isExisting: true,
      };
    }

    // Create new chat if none exists
    const chatId = nanoid();
    const newChat = await db
      .insert(userChatsTable)
      .values({
        chatId,
        userId,
        isActive: true,
      })
      .returning();

    return {
      ...newChat[0],
      isExisting: false,
    };
  } catch (error) {
    console.error('Error getting or creating user chat:', error);
    throw error;
  }
}

/**
 * Helper function to save chat message and AI response
 */
async function saveChatMessage(
  chatId: string,
  userId: string,
  userMessage: string,
  aiResponse: string
) {
  try {
    const messageId = nanoid();

    const savedMessage = await db
      .insert(userChatMessagesTable)
      .values({
        messageId,
        chatId,
        userId,
        userMessage,
        aiResponse,
      })
      .returning();

    return savedMessage[0];
  } catch (error) {
    console.error('Error saving chat message:', error);
    throw error;
  }
}

/**
 * Sync user data to vector database with memory optimization
 * This function fetches user data in batches and stores it as embeddings in Pinecone using LangChain
 */
export const syncUserDataToVectorDB = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId;
      console.log('Starting optimized data sync for user:', userId);

      // Check if user data already exists
      const dataExists = await checkUserDataExists(userId);
      if (dataExists) {
        console.log(
          `User ${userId} data already exists. Updating with fresh data...`
        );
        // Delete existing data to prevent duplicates and ensure fresh data
        await deleteExistingUserData(userId);
      }

      // Get user's vector store with user-specific namespace
      const vectorStore = await getUserVectorStore(userId);

      // 1. Get user's enrolled subjects (limited data first)
      const userEnrolledSubjects = await db
        .select({
          subjectId: userSubjectsTable.subjectId,
          subjectName: subjectsTable.subjectName,
          userLevel: userSubjectsTable.level,
          enrolledAt: userSubjectsTable.createdAt,
        })
        .from(userSubjectsTable)
        .innerJoin(
          subjectsTable,
          eq(userSubjectsTable.subjectId, subjectsTable.subjectId)
        )
        .where(eq(userSubjectsTable.userId, userId))
        .limit(10); // Limit subjects to prevent memory overflow

      if (userEnrolledSubjects.length === 0) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { synced: 0 },
              'User is not enrolled in any subjects yet'
            )
          );
      }

      const enrolledSubjectIds = userEnrolledSubjects.map(
        subject => subject.subjectId
      );

      // 2. Get topics in batches
      const userTopics = await db
        .select({
          topicId: topicsTable.topicId,
          subjectId: topicsTable.subjectId,
          title: topicsTable.title,
          description: topicsTable.description,
          difficulty: topicsTable.difficulty,
          subjectName: subjectsTable.subjectName,
        })
        .from(topicsTable)
        .innerJoin(
          subjectsTable,
          eq(topicsTable.subjectId, subjectsTable.subjectId)
        )
        .where(inArray(topicsTable.subjectId, enrolledSubjectIds))
        .limit(50); // Limit topics

      // 3. Get recent quiz results only (for performance data)
      const recentQuizResults = await db
        .select()
        .from(quizResultsTable)
        .innerJoin(
          quizzesTable,
          eq(quizResultsTable.quizId, quizzesTable.quizId)
        )
        .where(eq(quizzesTable.userId, userId))
        .orderBy(quizResultsTable.completedAt)
        .limit(20); // Only recent 20 quiz attempts

      // 4. Get recent short exam results only
      const recentShortExams = await db
        .select({
          examId: shortQuestionExamsTable.examId,
          userId: shortQuestionExamsTable.userId,
          subjectId: shortQuestionExamsTable.subjectId,
          totalQuestions: shortQuestionExamsTable.totalQuestions,
          totalMarks: shortQuestionExamsTable.totalMarks,
          userScore: shortQuestionExamsTable.userScore,
          isCompleted: shortQuestionExamsTable.isCompleted,
          createdAt: shortQuestionExamsTable.createdAt,
          completedAt: shortQuestionExamsTable.completedAt,
          subjectName: subjectsTable.subjectName,
        })
        .from(shortQuestionExamsTable)
        .leftJoin(
          subjectsTable,
          eq(shortQuestionExamsTable.subjectId, subjectsTable.subjectId)
        )
        .where(eq(shortQuestionExamsTable.userId, userId))
        .orderBy(shortQuestionExamsTable.createdAt)
        .limit(10); // Only recent 10 exams

      // Process documents in smaller batches to prevent memory issues
      const documents: Document[] = [];
      const BATCH_SIZE = 50;

      // Process subjects (small data)
      for (const subject of userEnrolledSubjects) {
        documents.push(
          new Document({
            pageContent: `User enrolled in: ${subject.subjectName} (Level: ${subject.userLevel}). Enrolled: ${subject.enrolledAt}. Has access to lessons, quizzes, and materials.`,
            metadata: {
              type: 'user_subject',
              subjectId: subject.subjectId,
              subjectName: subject.subjectName,
              userLevel: subject.userLevel,
              userId: userId,
            },
          })
        );
      }

      // Process topics (limited data)
      for (const topic of userTopics) {
        documents.push(
          new Document({
            pageContent: `Topic: "${topic.title}" in ${
              topic.subjectName
            }. Difficulty: ${topic.difficulty}. ${
              topic.description
                ? 'Description: ' + topic.description.substring(0, 200)
                : 'Learning materials available.'
            }`,
            metadata: {
              type: 'user_topic',
              topicId: topic.topicId,
              title: topic.title,
              difficulty: topic.difficulty,
              subjectName: topic.subjectName,
              userId: userId,
            },
          })
        );
      }

      // Process quiz results (performance data only)
      for (const result of recentQuizResults) {
        const percentage =
          (result.quiz_results.score / result.quiz_results.totalMarks) * 100;
        const performance =
          percentage >= 80
            ? 'Excellent'
            : percentage >= 60
            ? 'Good'
            : 'Needs improvement';

        documents.push(
          new Document({
            pageContent: `Quiz performance: ${result.quiz_results.score}/${
              result.quiz_results.totalMarks
            } (${percentage.toFixed(1)}%). ${performance}. Time: ${
              result.quiz_results.timeTaken
            }s. Date: ${result.quiz_results.completedAt}`,
            metadata: {
              type: 'quiz_result',
              resultId: result.quiz_results.resultId,
              score: result.quiz_results.score,
              totalMarks: result.quiz_results.totalMarks,
              percentage: percentage,
              timeTaken: result.quiz_results.timeTaken,
              userId: userId,
            },
          })
        );
      }

      // Process short exam results (performance data only)
      for (const exam of recentShortExams) {
        const percentage =
          exam.userScore && exam.totalMarks
            ? (exam.userScore / exam.totalMarks) * 100
            : 0;
        const status = exam.isCompleted ? 'Completed' : 'Incomplete';

        documents.push(
          new Document({
            pageContent: `Short exam in ${exam.subjectName}: ${
              exam.totalQuestions
            } questions, ${exam.totalMarks} marks. Score: ${
              exam.userScore || 0
            }/${exam.totalMarks} (${percentage.toFixed(
              1
            )}%). Status: ${status}`,
            metadata: {
              type: 'short_exam',
              examId: exam.examId,
              subjectName: exam.subjectName,
              totalQuestions: exam.totalQuestions,
              userScore: exam.userScore,
              percentage: percentage,
              isCompleted: exam.isCompleted,
              userId: userId,
            },
          })
        );
      }

      if (documents.length === 0) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { synced: 0 },
              'No learning data found to sync'
            )
          );
      }

      // Process documents in batches to prevent memory overflow
      const batches = [];
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        batches.push(documents.slice(i, i + BATCH_SIZE));
      }

      console.log(
        `Processing ${documents.length} documents in ${batches.length} batches for user ${userId}`
      );

      let totalSynced = 0;
      let failedBatches = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchIds = batch.map(
          (_, index) => `${userId}_batch${batchIndex}_${Date.now()}_${index}`
        );

        try {
          console.log(
            `Processing batch ${batchIndex + 1}/${batches.length} with ${
              batch.length
            } documents...`
          );
          await vectorStore.addDocuments(batch, { ids: batchIds });
          totalSynced += batch.length;
          console.log(
            `✅ Batch ${batchIndex + 1}/${
              batches.length
            } completed successfully (${batch.length} docs)`
          );

          // Small delay between batches to prevent overwhelming the system
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (batchError: any) {
          failedBatches++;
          console.error(`❌ Error processing batch ${batchIndex + 1}:`, {
            error: batchError.message,
            batchSize: batch.length,
            userId: userId,
          });

          // If it's a dimension error, stop processing
          if (batchError.message?.includes('dimension')) {
            console.error('Vector dimension mismatch detected. Stopping sync.');
            throw batchError;
          }

          // Continue with next batch for other errors
          console.log(`Continuing with next batch...`);
        }
      }

      console.log(
        `Successfully synced ${totalSynced}/${documents.length} documents for user ${userId} (${failedBatches} batches failed)`
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            synced: totalSynced,
            total: documents.length,
            failedBatches: failedBatches,
            breakdown: {
              enrolledSubjects: userEnrolledSubjects.length,
              availableTopics: userTopics.length,
              recentQuizResults: recentQuizResults.length,
              recentShortExams: recentShortExams.length,
            },
          },
          totalSynced > 0
            ? `User learning data synced successfully (${totalSynced}/${documents.length} documents)`
            : 'No documents were synced due to errors'
        )
      );
    } catch (error) {
      console.error('Error syncing user data to vector DB:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json(new ApiResponse(500, null, errorMessage));
    }
  }
);

/**
 * Query user chatbot with RAG
 * This function handles user queries using RAG with personalized context using LangChain
 * Also manages chat creation and message saving to database
 */
export const queryUserChatbot = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId;
      const { query, conversationHistory } = req.body;

      if (!query || query.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Query is required'));
      }

      console.log(`Processing chatbot query for user ${userId}: ${query}`);

      // Step 1: Get or create user chat
      const userChat = await getOrCreateUserChat(userId);
      console.log(
        `Chat ${
          userChat.isExisting ? 'retrieved' : 'created'
        } for user ${userId}: ${userChat.chatId}`
      );

      // Get user's vector store
      const vectorStore = await getUserVectorStore(userId);

      // Create a retriever for similarity search
      const retriever = vectorStore.asRetriever({
        k: 10, // Get top 10 relevant documents
      });

      // Search for relevant documents using LangChain
      const relevantDocs = await retriever.invoke(query);

      // Filter and process relevant context
      const relevantContext = relevantDocs
        .map(doc => {
          return {
            text: doc.pageContent,
            type: doc.metadata?.type || 'unknown',
            score: 1, // LangChain doesn't return scores in asRetriever, all are considered relevant
            source:
              doc.metadata?.type === 'user_quiz'
                ? `User Quiz (${doc.metadata.quizId})`
                : doc.metadata?.type === 'quiz_result'
                ? `Quiz Result (${doc.metadata.resultId})`
                : doc.metadata?.type === 'short_exam'
                ? `Short Exam (${doc.metadata.examId})`
                : doc.metadata?.type === 'short_question'
                ? `Short Question (${doc.metadata.questionId})`
                : 'Unknown source',
            metadata: doc.metadata,
          };
        })
        .slice(0, 5); // Limit to top 5 most relevant chunks

      // Prepare context for the AI model
      const contextText =
        relevantContext.length > 0
          ? relevantContext
              .map(ctx => `[${ctx.source}] ${ctx.text}`)
              .join('\n\n')
          : 'No relevant personal learning data found.';

      // Prepare conversation history
      const historyText =
        conversationHistory && conversationHistory.length > 0
          ? conversationHistory
              .map((msg: any) => `${msg.role}: ${msg.content}`)
              .join('\n')
          : '';

      // Initialize Google GenAI
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY!,
      });

      // Create a comprehensive prompt for the AI
      const systemPrompt = `You are an AI Study Assistant for a personalized learning platform. You help students by providing answers based on their personal learning history and progress.

IMPORTANT GUIDELINES:
1. Always prioritize information from the user's personal learning context below
2. If the user's context doesn't contain relevant information, provide general educational help
3. Reference specific lessons, quiz results, or exams when applicable
4. Be encouraging and supportive about their learning progress
5. Suggest areas for improvement based on their quiz performance
6. Keep responses concise but informative
7. If asked about their progress, analyze their quiz scores and learning patterns
8. Provide specific recommendations based on their weak areas identified from quiz results
9. Celebrate their achievements and encourage continued learning

USER'S PERSONAL LEARNING CONTEXT:
${contextText}

CONVERSATION HISTORY:
${historyText}

CURRENT USER QUERY: ${query}

Please provide a helpful, personalized response based on the user's learning history and current query. Be specific about their performance, mention their scores, and provide actionable study advice.`;

      // Generate response using Google GenAI with streaming
      const streamResponse = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
      });

      // Set up streaming response headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send initial metadata
      res.write(
        `data: ${JSON.stringify({
          type: 'start',
          chatId: userChat.chatId,
          messageId: null, // Will be updated after saving
          isNewChat: !userChat.isExisting,
          hasPersonalizedContext: relevantContext.length > 0,
          contextUsed: {
            relevantChunks: relevantContext.length,
            sources: relevantContext.map(ctx => ({
              type: ctx.type,
              source: ctx.source,
              relevanceScore: ctx.score,
              metadata: ctx.metadata,
            })),
          },
          message: 'Starting AI response generation...',
        })}\n\n`
      );

      // Collect all content chunks for database storage
      let fullResponseText = '';

      // Stream content to user while collecting it
      for await (const chunk of streamResponse) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullResponseText += chunkText;

          // Send chunk to client
          res.write(
            `data: ${JSON.stringify({
              type: 'chunk',
              content: chunkText,
            })}\n\n`
          );
        }
      }

      // Validate that we have response content
      if (!fullResponseText || fullResponseText.trim() === '') {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: 'Failed to generate AI response',
          })}\n\n`
        );
        res.end();
        return;
      }

      // Step 2: Save the chat message and AI response to database
      const savedMessage = await saveChatMessage(
        userChat.chatId,
        userId,
        query,
        fullResponseText
      );

      console.log(
        `Saved message ${savedMessage.messageId} to chat ${userChat.chatId}`
      );

      // Send final metadata and completion signal
      res.write(
        `data: ${JSON.stringify({
          type: 'metadata',
          chatId: userChat.chatId,
          messageId: savedMessage.messageId,
          isNewChat: !userChat.isExisting,
          savedToDatabase: true,
          responseLength: fullResponseText.length,
          chatInfo: {
            chatId: userChat.chatId,
            isActive: userChat.isActive,
            createdAt: savedMessage.createdAt,
          },
        })}\n\n`
      );

      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          message: userChat.isExisting
            ? 'Chatbot response generated and saved successfully'
            : 'New chat created and response generated successfully',
        })}\n\n`
      );

      console.log(
        `Generated streaming response for user ${userId} using ${relevantContext.length} relevant context chunks`
      );

      res.end();
    } catch (error) {
      console.error('Error querying chatbot:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json(new ApiResponse(500, null, errorMessage));
    }
  }
);

/**
 * Get user chat history
 * This function retrieves chat history for a specific user
 */
export const getUserChatHistory = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId;
      const { chatId, limit = 50, offset = 0 } = req.query;

      console.log(`Retrieving chat history for user ${userId}`);

      let whereCondition;
      if (chatId) {
        whereCondition = eq(userChatMessagesTable.chatId, chatId as string);
      } else {
        whereCondition = eq(userChatMessagesTable.userId, userId);
      }

      // Get chat messages with error handling for missing tables
      let messages: (typeof userChatMessagesTable.$inferSelect)[] = [];
      let activeChat: typeof userChatsTable.$inferSelect | null = null;

      try {
        messages = await db
          .select()
          .from(userChatMessagesTable)
          .where(whereCondition)
          .orderBy(userChatMessagesTable.createdAt)
          .limit(Number(limit))
          .offset(Number(offset));

        // Get active chat info
        const activeChatResult = await db
          .select()
          .from(userChatsTable)
          .where(eq(userChatsTable.userId, userId))
          .limit(1);

        activeChat = activeChatResult.length > 0 ? activeChatResult[0] : null;
      } catch (dbError: any) {
        if (dbError.code === '42P01') {
          // Table doesn't exist - return empty results instead of error
          console.log(
            `Chat tables don't exist yet for user ${userId}. Returning empty history.`
          );
          messages = [];
          activeChat = null;
        } else {
          throw dbError; // Re-throw other database errors
        }
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            messages: messages,
            activeChat: activeChat,
            total: messages.length,
          },
          'Chat history retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Error retrieving chat history:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json(new ApiResponse(500, null, errorMessage));
    }
  }
);

/**
 * Deactivate user chat
 * This function deactivates a user's chat (marks as inactive)
 */
export const deactivateUserChat = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;

      console.log(`Deactivating chat ${chatId} for user ${userId}`);

      const updatedChat = await db
        .update(userChatsTable)
        .set({ isActive: false })
        .where(eq(userChatsTable.chatId, chatId))
        .returning();

      if (updatedChat.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, null, 'Chat not found'));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, updatedChat[0], 'Chat deactivated successfully')
        );
    } catch (error) {
      console.error('Error deactivating chat:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json(new ApiResponse(500, null, errorMessage));
    }
  }
);
