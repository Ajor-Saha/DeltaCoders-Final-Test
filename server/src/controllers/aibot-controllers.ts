import { GoogleGenAI } from '@google/genai';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { desc, eq, inArray } from 'drizzle-orm';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { cognitiveAssessmentsTable } from '../db/schema/tbl-cognitive-assessments';
import { gameAnalyticsTable } from '../db/schema/tbl-game-analytics';
import { notesTable } from '../db/schema/tbl-notes';
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

// Helper functions for mental health analysis
function analyzeGamePerformance(game: any): string {
  const { gameName, score, cognitiveLoad, focus, attention, errors, duration } =
    game;

  switch (gameName) {
    case 'ColorMatchGame':
      return `Visual working memory assessment: ${
        attention > 70
          ? 'Strong pattern recognition abilities'
          : 'May benefit from visual memory exercises'
      }. ${
        errors < 3
          ? 'Good selective attention under time pressure'
          : 'Time pressure may be affecting visual processing'
      }.`;

    case 'MazeEscapeGame':
      return `Spatial reasoning evaluation: ${
        score > 800
          ? 'Excellent path planning and spatial intelligence'
          : score > 400
          ? 'Moderate spatial problem-solving skills'
          : 'Spatial reasoning could be enhanced'
      }. ${
        errors < 5
          ? 'Good decision-making efficiency'
          : 'May indicate decision fatigue or spatial processing challenges'
      }.`;

    case 'BugSmashGame':
      return `Sustained attention analysis: ${
        focus > 70
          ? 'Strong sustained attention and impulse control'
          : 'Sustained attention may need improvement'
      }. ${
        cognitiveLoad < 60
          ? 'Good stress tolerance during fast-paced tasks'
          : 'High cognitive load suggests stress during reaction-time tasks'
      }.`;

    default:
      return `General cognitive assessment: Focus ${focus}/100, Attention ${attention}/100, with ${errors} errors in ${duration} seconds.`;
  }
}

function analyzeLearningStress(assessment: any): string {
  const {
    subjectName,
    topicDifficulty,
    stressScore,
    attentionScore,
    cognitiveScore,
  } = assessment;

  const stressLevel =
    stressScore < 30 ? 'low' : stressScore < 60 ? 'moderate' : 'high';
  const difficultyImpact =
    topicDifficulty === 'Hard' && stressScore > 60
      ? 'Challenging topics appear to increase learning stress significantly'
      : topicDifficulty === 'Easy' && stressScore > 50
      ? 'Elevated stress even on easier topics suggests general learning anxiety'
      : 'Stress levels appear appropriate for topic difficulty';

  const attentionCorrelation =
    attentionScore < 50 && stressScore > 60
      ? 'High stress correlates with attention difficulties'
      : attentionScore > 70 && stressScore < 40
      ? 'Low stress environment supports strong focus'
      : 'Attention and stress levels show moderate correlation';

  return `${stressLevel} stress while learning ${subjectName}. ${difficultyImpact}. ${attentionCorrelation}.`;
}

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
      const { force = false } = req.body; // Allow forcing a resync
      console.log(`Starting data sync for user: ${userId} (force: ${force})`);

      // Check if user data already exists (unless force refresh)
      const dataExists = await checkUserDataExists(userId);

      if (dataExists && !force) {
        console.log(`User ${userId} data already exists. Skipping sync.`);
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { synced: 0, skipped: true, reason: 'Data already exists' },
              'User data already synced to vector database. Use force=true to refresh.'
            )
          );
      }

      if (dataExists && force) {
        console.log(`User ${userId} data exists. Force refresh requested...`);
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
        .limit(5); // Reduced from 10 to prevent memory overflow

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
        .limit(25); // Reduced from 50 to prevent memory issues

      // 3. Get recent quiz results with topic information
      const recentQuizResults = await db
        .select({
          resultId: quizResultsTable.resultId,
          score: quizResultsTable.score,
          totalMarks: quizResultsTable.totalMarks,
          timeTaken: quizResultsTable.timeTaken,
          completedAt: quizResultsTable.completedAt,
          quizId: quizzesTable.quizId,
          subjectId: quizzesTable.subjectId,
          topicId: quizzesTable.topicId,
          subjectName: subjectsTable.subjectName,
          topicTitle: topicsTable.title,
          topicDifficulty: topicsTable.difficulty,
        })
        .from(quizResultsTable)
        .innerJoin(
          quizzesTable,
          eq(quizResultsTable.quizId, quizzesTable.quizId)
        )
        .innerJoin(
          subjectsTable,
          eq(quizzesTable.subjectId, subjectsTable.subjectId)
        )
        .leftJoin(topicsTable, eq(quizzesTable.topicId, topicsTable.topicId))
        .where(eq(quizzesTable.userId, userId))
        .orderBy(quizResultsTable.completedAt)
        .limit(10); // Reduced from 20 to prevent memory issues

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
        .limit(5); // Reduced from 10 to prevent memory issues

      // 5. Get recent game analytics for mental health insights
      const recentGameAnalytics = await db
        .select({
          id: gameAnalyticsTable.id,
          userId: gameAnalyticsTable.userId,
          gameName: gameAnalyticsTable.gameName,
          duration: gameAnalyticsTable.duration,
          score: gameAnalyticsTable.score,
          totalActions: gameAnalyticsTable.totalActions,
          errors: gameAnalyticsTable.errors,
          cognitiveLoad: gameAnalyticsTable.cognitiveLoad,
          focus: gameAnalyticsTable.focus,
          attention: gameAnalyticsTable.attention,
          createdAt: gameAnalyticsTable.createdAt,
        })
        .from(gameAnalyticsTable)
        .where(eq(gameAnalyticsTable.userId, userId))
        .orderBy(desc(gameAnalyticsTable.createdAt))
        .limit(10); // Recent games for mental health pattern analysis

      // 6. Get cognitive assessments linked to quizzes
      const recentCognitiveAssessments = await db
        .select({
          assessmentId: cognitiveAssessmentsTable.assessmentId,
          userId: cognitiveAssessmentsTable.userId,
          quizId: cognitiveAssessmentsTable.quizId,
          weightedScore: cognitiveAssessmentsTable.weightedScore,
          stressScore: cognitiveAssessmentsTable.stressScore,
          attentionScore: cognitiveAssessmentsTable.attentionScore,
          cognitiveScore: cognitiveAssessmentsTable.cognitiveScore,
          createdAt: cognitiveAssessmentsTable.createdAt,
          // Join with quiz and topic data for context
          topicTitle: topicsTable.title,
          subjectName: subjectsTable.subjectName,
          topicDifficulty: topicsTable.difficulty,
        })
        .from(cognitiveAssessmentsTable)
        .innerJoin(
          quizzesTable,
          eq(cognitiveAssessmentsTable.quizId, quizzesTable.quizId)
        )
        .leftJoin(topicsTable, eq(quizzesTable.topicId, topicsTable.topicId))
        .leftJoin(
          subjectsTable,
          eq(quizzesTable.subjectId, subjectsTable.subjectId)
        )
        .where(eq(cognitiveAssessmentsTable.userId, userId))
        .orderBy(desc(cognitiveAssessmentsTable.createdAt))
        .limit(15); // Recent cognitive assessments for learning-stress correlation

      // 7. Get user's personal notes
      const userNotes = await db
        .select()
        .from(notesTable)
        .where(eq(notesTable.userId, userId))
        .orderBy(notesTable.createdAt)
        .limit(5); // Reduced from 10 to prevent memory issues

      // 5. Get user's personal notes
      const documents: Document[] = [];
      const BATCH_SIZE = 20; // Reduced from 50 to prevent memory issues
      const MAX_CONTENT_LENGTH = 500; // Limit content length per document

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
        const description = topic.description
          ? topic.description.substring(0, MAX_CONTENT_LENGTH)
          : 'Learning materials available.';

        documents.push(
          new Document({
            pageContent: `Topic: "${topic.title}" in ${topic.subjectName}. Difficulty: ${topic.difficulty}. ${description}`,
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

      // Process quiz results with topic linkage (performance data)
      for (const result of recentQuizResults) {
        // The score field is already stored as a percentage in the database
        const percentage = result.score || 0;

        // Ensure percentage is within valid range (0-100%)
        const validPercentage = Math.min(100, Math.max(0, percentage));

        const performance =
          validPercentage >= 80
            ? 'Excellent'
            : validPercentage >= 60
            ? 'Good'
            : 'Needs improvement';

        const topicContext = result.topicTitle
          ? ` on topic "${result.topicTitle}" (${result.topicDifficulty})`
          : '';

        documents.push(
          new Document({
            pageContent: `Quiz performance in ${
              result.subjectName
            }${topicContext}: Achieved ${validPercentage.toFixed(
              1
            )}% score. ${performance}. Time taken: ${
              result.timeTaken
            } seconds. Completed on: ${result.completedAt}. ${
              result.topicTitle
                ? `This quiz tested knowledge of ${result.topicTitle} topic.`
                : 'General subject quiz.'
            }`,
            metadata: {
              type: 'quiz_result',
              resultId: result.resultId,
              quizId: result.quizId,
              score: validPercentage,
              totalMarks: result.totalMarks,
              percentage: validPercentage,
              timeTaken: result.timeTaken,
              subjectName: result.subjectName,
              topicId: result.topicId,
              topicTitle: result.topicTitle,
              topicDifficulty: result.topicDifficulty,
              userId: userId,
            },
          })
        );
      }

      // Process short exam results with subject context
      for (const exam of recentShortExams) {
        const userScore = exam.userScore || 0;
        const totalMarks = exam.totalMarks || 1; // Prevent division by zero
        const percentage = totalMarks > 0 ? (userScore / totalMarks) * 100 : 0;

        // Cap percentage at 100% to prevent impossible scores
        const validPercentage = Math.min(100, Math.max(0, percentage));

        const status = exam.isCompleted ? 'Completed' : 'Incomplete';
        const performance =
          validPercentage >= 80
            ? 'Excellent'
            : validPercentage >= 60
            ? 'Good'
            : validPercentage > 0
            ? 'Needs improvement'
            : 'Not attempted';

        documents.push(
          new Document({
            pageContent: `Short answer exam in ${
              exam.subjectName || 'Unknown Subject'
            }: ${
              exam.totalQuestions
            } questions worth ${totalMarks} marks total. User achieved: ${userScore}/${totalMarks} marks (${validPercentage.toFixed(
              1
            )}% score). Performance level: ${performance}. Status: ${status}. ${
              exam.completedAt
                ? `Completed on ${exam.completedAt}`
                : `Created on ${exam.createdAt}`
            }`,
            metadata: {
              type: 'short_exam',
              examId: exam.examId,
              subjectId: exam.subjectId,
              subjectName: exam.subjectName,
              totalQuestions: exam.totalQuestions,
              totalMarks: totalMarks,
              userScore: userScore,
              percentage: validPercentage,
              performance: performance,
              isCompleted: exam.isCompleted,
              completedAt: exam.completedAt,
              userId: userId,
            },
          })
        );
      }

      // Process user's personal notes
      for (const note of userNotes) {
        documents.push(
          new Document({
            pageContent: `Personal note: "${note.title}". ${
              note.description || 'No description provided.'
            }`,
            metadata: {
              type: 'user_note',
              noteId: note.noteId,
              title: note.title,
              createdAt: note.createdAt,
              userId: userId,
            },
          })
        );
      }

      // Process game analytics for mental health insights
      for (const game of recentGameAnalytics) {
        const mentalHealthInsights = analyzeGamePerformance(game);

        documents.push(
          new Document({
            pageContent: `Mental Health Game Session - ${game.gameName}:
Game Performance: ${game.score} points in ${game.duration} seconds
Cognitive Metrics: Cognitive Load ${game.cognitiveLoad}/100, Focus ${
              game.focus
            }/100, Attention ${game.attention}/100
Interaction Data: ${game.totalActions} total actions with ${game.errors} errors
Session Date: ${game.createdAt}

Mental Wellbeing Analysis:
- Attention Capacity: ${
              game.attention > 70
                ? 'Strong sustained attention'
                : game.attention > 40
                ? 'Moderate attention span'
                : 'Attention challenges detected'
            }
- Stress Management: ${
              game.cognitiveLoad < 50
                ? 'Low cognitive stress during play'
                : game.cognitiveLoad < 80
                ? 'Moderate mental pressure'
                : 'High cognitive load experienced'
            }
- Focus Quality: ${
              game.focus > 70
                ? 'Excellent concentration ability'
                : game.focus > 40
                ? 'Average focus maintenance'
                : 'Difficulty maintaining focus'
            }
- Mental Resilience: ${
              game.errors < 3
                ? 'Good impulse control'
                : game.errors < 6
                ? 'Moderate decision-making'
                : 'May indicate decision fatigue or stress'
            }

Game-Specific Insights: ${mentalHealthInsights}`,
            metadata: {
              type: 'game_analytics',
              gameId: game.id,
              gameName: game.gameName,
              cognitiveLoad: game.cognitiveLoad,
              focus: game.focus,
              attention: game.attention,
              score: game.score,
              errors: game.errors,
              duration: game.duration,
              createdAt: game.createdAt,
              userId: userId,
            },
          })
        );
      }

      // Process cognitive assessments for learning-mental health correlation
      for (const assessment of recentCognitiveAssessments) {
        const learningStressCorrelation = analyzeLearningStress(assessment);

        documents.push(
          new Document({
            pageContent: `Cognitive Learning Assessment - ${
              assessment.subjectName
            } (${assessment.topicTitle}):
Academic Performance: Weighted score ${assessment.weightedScore} for ${
              assessment.topicDifficulty
            } difficulty topic
Cognitive Metrics: Overall cognitive performance ${
              assessment.cognitiveScore
            }/100
Learning Attention: Focus during study session ${assessment.attentionScore}/100
Learning Stress: Stress level while learning ${assessment.stressScore}/100
Assessment Date: ${assessment.createdAt}

Learning-Mental Health Analysis:
- Cognitive Function During Learning: ${
              assessment.cognitiveScore > 70
                ? 'High cognitive performance while studying'
                : assessment.cognitiveScore > 50
                ? 'Moderate cognitive engagement'
                : 'Cognitive challenges during learning'
            }
- Study Session Focus: ${
              assessment.attentionScore > 70
                ? 'Excellent study concentration'
                : assessment.attentionScore > 50
                ? 'Good study attention'
                : 'Focus difficulties while learning'
            }
- Learning-Related Stress: ${
              assessment.stressScore < 30
                ? 'Comfortable learning environment'
                : assessment.stressScore < 60
                ? 'Moderate learning pressure'
                : 'High stress during study sessions'
            }
- Subject-Stress Correlation: ${learningStressCorrelation}

Educational Impact: This assessment helps identify how mental state affects learning performance in ${
              assessment.subjectName
            }.`,
            metadata: {
              type: 'cognitive_assessment',
              assessmentId: assessment.assessmentId,
              quizId: assessment.quizId,
              subjectName: assessment.subjectName,
              topicTitle: assessment.topicTitle,
              topicDifficulty: assessment.topicDifficulty,
              cognitiveScore: assessment.cognitiveScore,
              attentionScore: assessment.attentionScore,
              stressScore: assessment.stressScore,
              weightedScore: assessment.weightedScore,
              createdAt: assessment.createdAt,
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
            // Force garbage collection if available to prevent memory buildup
            if (global.gc) {
              global.gc();
            }
            await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay
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
              gameAnalytics: recentGameAnalytics.length,
              cognitiveAssessments: recentCognitiveAssessments.length,
              personalNotes: userNotes.length,
            },
          },
          totalSynced > 0
            ? `Enhanced learning & mental health data synced successfully (${totalSynced}/${documents.length} documents)`
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

// Helper function to detect conversation type for intelligent response routing
function detectConversationType(userMessage: string): string {
  const message = userMessage.toLowerCase();

  const academicKeywords = [
    'quiz',
    'study',
    'learn',
    'topic',
    'subject',
    'exam',
    'grade',
    'homework',
    'score',
    'test',
    'assignment',
    'lesson',
    'course',
    'performance',
    'progress',
  ];

  const wellbeingKeywords = [
    'stress',
    'anxiety',
    'tired',
    'overwhelmed',
    'focus',
    'mental',
    'mood',
    'feeling',
    'pressure',
    'worried',
    'depression',
    'exhausted',
    'burnout',
    'motivation',
    'confidence',
    'frustrated',
    'emotional',
    'wellness',
    'health',
    'attention',
  ];

  const gameKeywords = [
    'game',
    'played',
    'colormatch',
    'maze',
    'bugsmash',
    'cognitive',
    'attention',
    'reaction',
    'memory',
    'spatial',
    'visual',
  ];

  const isAcademic = academicKeywords.some(keyword =>
    message.includes(keyword)
  );
  const isWellbeing = wellbeingKeywords.some(keyword =>
    message.includes(keyword)
  );
  const isGameRelated = gameKeywords.some(keyword => message.includes(keyword));

  if (isGameRelated || (isAcademic && isWellbeing)) return 'integrated';
  if (isAcademic) return 'academic';
  if (isWellbeing) return 'wellbeing';
  return 'general';
}

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

      // Detect conversation type for intelligent response routing
      const conversationType = detectConversationType(query);
      console.log(
        `Detected conversation type: ${conversationType} for query: ${query}`
      );

      // Filter and prioritize context based on conversation type
      const prioritizedDocs = relevantDocs.sort((a, b) => {
        const aType = a.metadata?.type || 'unknown';
        const bType = b.metadata?.type || 'unknown';

        // Prioritize based on conversation type
        if (
          conversationType === 'wellbeing' ||
          conversationType === 'integrated'
        ) {
          // Prioritize mental health data for wellbeing conversations
          if (aType === 'game_analytics' || aType === 'cognitive_assessment')
            return -1;
          if (bType === 'game_analytics' || bType === 'cognitive_assessment')
            return 1;
        }

        if (conversationType === 'academic') {
          // Prioritize academic data for study conversations
          if (aType === 'quiz_result' || aType === 'short_exam') return -1;
          if (bType === 'quiz_result' || bType === 'short_exam') return 1;
        }

        return 0; // Keep original order for general conversations
      });

      // Filter and process relevant context
      const relevantContext = prioritizedDocs
        .map(doc => {
          return {
            text: doc.pageContent,
            type: doc.metadata?.type || 'unknown',
            score: 1, // LangChain doesn't return scores in asRetriever, all are considered relevant
            source:
              doc.metadata?.type === 'quiz_result'
                ? `Quiz Result (${doc.metadata.resultId})`
                : doc.metadata?.type === 'short_exam'
                ? `Short Exam (${doc.metadata.examId})`
                : doc.metadata?.type === 'game_analytics'
                ? `Game Session (${doc.metadata.gameName})`
                : doc.metadata?.type === 'cognitive_assessment'
                ? `Cognitive Assessment (${doc.metadata.subjectName})`
                : doc.metadata?.type === 'user_note'
                ? `Personal Note (${doc.metadata.title})`
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

      // Create a comprehensive prompt for the AI with mental health support
      const systemPrompt = `You are an Advanced AI Learning Companion and Mental Wellbeing Assistant for Smart Study platform. You have dual expertise in academic support and mental health guidance.

## PRIMARY ROLES:
1. **Academic Tutor**: Help with subjects, topics, quiz performance, and learning progress
2. **Mental Wellbeing Companion**: Provide emotional support, stress management, and cognitive health insights

## ACADEMIC SUPPORT CAPABILITIES:
- Analyze quiz performance and learning progress using percentage-based scores
- Provide subject-specific tutoring and explanations
- Track learning patterns across topics and subjects
- Suggest study strategies based on performance data
- Quiz scores are stored as percentages (0-100%), interpret them correctly

## MENTAL WELLBEING CAPABILITIES:
- Analyze cognitive game performance for mental health insights
- Monitor stress levels, attention spans, and focus patterns during learning
- Provide emotional support and encouragement for learning challenges
- Suggest stress management techniques and study-life balance
- Track cognitive patterns over time through game analytics
- Offer mindfulness and mental health guidance
- Identify when learning stress may be affecting performance

## GAME ANALYTICS INTERPRETATION:
**ColorMatchGame**: Tests visual working memory, pattern recognition, selective attention
- High attention scores (70+) = Good focus ability, Low error rates = Strong visual processing
- High cognitive load (80+) = Experiencing mental pressure during visual tasks

**MazeEscapeGame**: Tests spatial reasoning, path planning, decision-making
- Efficient solutions = Good problem-solving skills, High scores = Strong spatial intelligence
- Many errors = May indicate decision fatigue or spatial processing challenges

**BugSmashGame**: Tests sustained attention, reaction speed, impulse control
- High focus scores = Good sustained attention, Low error rates = Good impulse control
- High stress tolerance = Better emotional regulation during pressure

## COGNITIVE ASSESSMENT UNDERSTANDING:
- **cognitiveScore**: Overall mental performance (70+ excellent, 50-70 good, <50 needs support)
- **attentionScore**: Focus ability during learning (70+ focused learner, <50 attention challenges)
- **stressScore**: Learning pressure (30- comfortable, 30-60 moderate, 60+ high stress)
- **Learning-Stress Correlation**: How mental state affects academic performance

## QUIZ SCORING SYSTEM:
- Scores are already calculated percentages (0-100%)
- Performance levels: 90-100% Excellent, 70-89% Good, 50-69% Average, <50% Needs improvement
- Focus on percentage achievement when analyzing performance
- NEVER calculate your own percentages or show impossible scores

## COMMUNICATION STYLE:
- **Academic Mode**: Professional, educational, encouraging about learning progress
- **Wellbeing Mode**: Empathetic, supportive, gentle, non-judgmental
- **Integrated Mode**: Combine both when discussing how mental state affects learning

## RESPONSE GUIDELINES:
1. **Always prioritize user mental health and emotional safety**
2. **Provide specific, actionable advice based on their comprehensive data**
3. **Acknowledge both academic achievements and emotional challenges**
4. **Suggest resources for both learning improvement and mental wellness**
5. **If serious mental health concerns arise, gently suggest professional help**
6. **Maintain encouraging tone while being realistic about challenges**
7. **Use game and cognitive data to provide personalized mental health insights**
8. **Connect learning performance with mental wellbeing patterns**

## CURRENT USER'S COMPREHENSIVE CONTEXT:
${contextText}

## CONVERSATION HISTORY:
${historyText}

## USER'S CURRENT QUERY:
${query}

Please provide a helpful, personalized response that integrates both academic support and mental wellbeing guidance based on the user's complete learning and mental health profile. Be specific about their performance patterns, acknowledge their emotional journey, and provide actionable advice for both academic success and mental wellness.`; // Generate response using Google GenAI with streaming
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
 * Check if user data exists in vector database
 * This function checks if user already has data synced to vector DB
 */
export const checkUserDataStatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.userId;
      console.log('Checking data status for user:', userId);

      // Check if user data already exists in vector DB
      const dataExists = await checkUserDataExists(userId);

      // Also get basic info about user's enrolled subjects
      const userEnrolledSubjects = await db
        .select({
          subjectId: userSubjectsTable.subjectId,
          subjectName: subjectsTable.subjectName,
        })
        .from(userSubjectsTable)
        .innerJoin(
          subjectsTable,
          eq(userSubjectsTable.subjectId, subjectsTable.subjectId)
        )
        .where(eq(userSubjectsTable.userId, userId))
        .limit(10);

      const response = {
        hasVectorData: dataExists,
        enrolledSubjectsCount: userEnrolledSubjects.length,
        lastSyncNeeded: !dataExists || userEnrolledSubjects.length === 0,
        subjects: userEnrolledSubjects.map(s => s.subjectName),
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            response,
            dataExists
              ? 'User data already exists in vector database'
              : 'User data needs to be synced to vector database'
          )
        );
    } catch (error) {
      console.error('Error checking user data status:', error);
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
