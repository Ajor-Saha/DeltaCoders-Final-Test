import { GoogleGenAI, Type } from '@google/genai';
import axios from 'axios';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { externalResourcesTable } from '../db/schema/tbl-external-resources';
import { lessonsTable } from '../db/schema/tbl-lessons';
import { quizQuestionsTable } from '../db/schema/tbl-quiz-questions';
import { quizzesTable } from '../db/schema/tbl-quizzes';
import { subjectsTable } from '../db/schema/tbl-subjects';
import { topicsTable } from '../db/schema/tbl-topics';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

export const createAllTopics = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subject } = req.body;

      if (!subject || subject.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject name is required'));
      }

      // Step 2: Check if subject exists in database
      const existingSubject = await db
        .select()
        .from(subjectsTable)
        .where(eq(subjectsTable.subjectName, subject.trim()))
        .limit(1);

      if (existingSubject.length === 0) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              {},
              `Subject "${subject}" not found. Please create the subject first before generating topics.`
            )
          );
      }

      // Step 1: Call external API to generate topics with enhanced prompt
      const enhancedSubject = `Generate at least 10 topics for ${subject}. Include topics with different difficulty levels: Easy, Medium, and Hard. Ensure a good mix of foundational concepts and advanced topics.`;

      const response = await axios.post(
        process.env.TOPIC_LIST_URL!,
        { subject: enhancedSubject },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const topicList =
        response.data?.topic_list ||
        response.data?.data?.generatedTopics ||
        response.data?.generatedTopics;

      if (!topicList || !Array.isArray(topicList)) {
        return res
          .status(500)
          .json(
            new ApiResponse(
              500,
              {},
              'Failed to generate topics or invalid format'
            )
          );
      }

      const subjectRecord = existingSubject[0];

      // Step 3: Save topics to database
      const topicsToInsert = topicList.map((topic: any) => {
        // The API now returns objects with title, description, and difficulty
        let title: string;
        let description: string | null = null;
        let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';

        if (typeof topic === 'object' && topic !== null) {
          // New API format: topic is an object
          title = topic.title || topic.topic || topic.name || String(topic);
          description = topic.description || null;

          // Map difficulty directly from API response
          if (topic.difficulty) {
            const diff = topic.difficulty;
            if (diff === 'Medium' || diff === 'Intermediate') {
              difficulty = 'Medium';
            } else if (diff === 'Hard' || diff === 'Advanced') {
              difficulty = 'Hard';
            } else {
              difficulty = 'Easy';
            }
          }
        } else if (typeof topic === 'string') {
          // Fallback for string format (backward compatibility)
          title = topic;
        } else {
          // Fallback for any other format
          title = String(topic);
        }

        return {
          topicId: uuidv4(),
          subjectId: subjectRecord.subjectId,
          title: title.trim(),
          description,
          difficulty,
        };
      }); // Insert topics in batch
      const insertedTopics = await db
        .insert(topicsTable)
        .values(topicsToInsert)
        .returning();

      // Step 4: Return success response with database data
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            subject: {
              id: subjectRecord.subjectId,
              name: subjectRecord.subjectName,
            },
            topics: insertedTopics.map(topic => ({
              id: topic.topicId,
              title: topic.title,
              description: topic.description,
              difficulty: topic.difficulty,
              createdAt: topic.createdAt,
            })),
            summary: {
              totalTopics: insertedTopics.length,
            },
          },
          `Successfully generated and saved ${insertedTopics.length} topics for subject: ${subject}`
        )
      );
    } catch (error) {
      console.error('Error generating and saving topics:', error);
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Internal server error';
      res.status(500).json(new ApiResponse(500, null, errorMessage));
    }
  }
);

export const generateLearningContent = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subject, topic } = req.body;

      if (!subject || !topic) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject and topic are required'));
      }

      // Find the topic ID by searching for the topic name in the database
      let validatedTopicId = null;
      const existingTopic = await db
        .select()
        .from(topicsTable)
        .innerJoin(
          subjectsTable,
          eq(topicsTable.subjectId, subjectsTable.subjectId)
        )
        .where(
          eq(topicsTable.title, topic.trim()) &&
            eq(subjectsTable.subjectName, subject.trim())
        )
        .limit(1);

      if (existingTopic.length > 0) {
        validatedTopicId = existingTopic[0].topics.topicId;
        console.log('Found existing topic with ID:', validatedTopicId);
      } else {
        console.log(
          'No existing topic found for:',
          topic,
          'in subject:',
          subject
        );
        // Topic doesn't exist in database, but we can still generate content without linking
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const systemPrompt = `You are a Smart Study Companion for students from any academic field.
                                The user will provide both a subject and a topic. Your job is to generate clear, well-structured study notes that are easy to understand and useful for learning.

                                Guidelines for the notes:
                                - Do not need to generate greeting like here it is or ok I am okay just start with the notes.
                                - Start with a short introduction to the topic.
                                - Break the content into organized sections with headings and bullet points.
                                - Explain concepts in simple, beginner-friendly language.
                                - Include examples, formulas, or small code snippets if they are relevant.
                                - Avoid using the subject name as a heading — focus only on the topic.
                                - End with a concise summary or key takeaways.
                                - Keep the tone educational, concise, and engaging.`;

      const userPrompt = `${systemPrompt}

                        User Topic: "${topic}" and Subject: "${subject}".

                        Now, generate the study notes.`;

      // Generate content using streaming API for user experience
      console.log('Generating learning content...');
      const streamResponse = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
      });

      // Set up streaming response headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send initial metadata (before we have lessonId)
      res.write(
        `data: ${JSON.stringify({
          type: 'start',
          topicId: validatedTopicId,
          topicLinked: validatedTopicId !== null,
          subject: subject,
          topic: topic,
          message: 'Starting content generation...',
        })}\n\n`
      );

      // Collect all content chunks for database storage
      let fullGeneratedContent = '';

      // Stream content to user while collecting it
      for await (const chunk of streamResponse) {
        if (chunk.text) {
          fullGeneratedContent += chunk.text;

          // Stream to user
          res.write(
            `data: ${JSON.stringify({
              type: 'content',
              content: chunk.text,
            })}\n\n`
          );
        }
      }

      // After streaming is complete, save to database
      let savedLesson;

      if (fullGeneratedContent.trim() === '') {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: 'Failed to generate learning content',
          })}\n\n`
        );
        res.end();
        return;
      }

      if (validatedTopicId) {
        // Save with topic link
        const lessonData = {
          lessonId: uuidv4(),
          topicId: validatedTopicId,
          content: fullGeneratedContent,
        };

        try {
          savedLesson = await db
            .insert(lessonsTable)
            .values(lessonData)
            .returning();

          console.log(
            `Learning content saved to database with ID: ${savedLesson[0].lessonId} (linked to topic: ${validatedTopicId})`
          );
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          res.write(
            `data: ${JSON.stringify({
              type: 'warning',
              message: 'Content generated but failed to save to database',
            })}\n\n`
          );
        }
      } else {
        console.log(
          'Skipping lesson save - no matching topic found in database'
        );

        // Generate a temporary lesson object for response
        savedLesson = [
          {
            lessonId: uuidv4(),
            topicId: null,
            content: fullGeneratedContent,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }

      // Send final metadata and completion signal
      res.write(
        `data: ${JSON.stringify({
          type: 'metadata',
          lessonId: savedLesson ? savedLesson[0].lessonId : null,
          topicId: validatedTopicId,
          topicLinked: validatedTopicId !== null,
          savedToDatabase: validatedTopicId !== null && savedLesson,
          contentLength: fullGeneratedContent.length,
          createdAt: savedLesson ? savedLesson[0].createdAt : new Date(),
        })}\n\n`
      );

      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          message: validatedTopicId
            ? 'Content generation completed and saved to database (linked to existing topic)'
            : 'Content generation completed but not saved to lessons table (no matching topic found - please create the topic first)',
        })}\n\n`
      );

      res.end();
    } catch (error) {
      console.error('Error generating learning content:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const generateQuiz = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const {
        isNewQuiz,
        quizId,
        isTopicBased,
        topicId,
        subjectId,
        weakness,
        user_query,
      } = req.body;
      const userId = req.user.userId;

      // Validation
      if (isNewQuiz === undefined || typeof isNewQuiz !== 'boolean') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'isNewQuiz flag is required'));
      }

      if (isTopicBased === undefined || typeof isTopicBased !== 'boolean') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'isTopicBased flag is required'));
      }

      // If not new quiz, quizId is required
      if (!isNewQuiz && (!quizId || quizId.trim() === '')) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'quizId is required when isNewQuiz is false'
            )
          );
      }

      // If topic-based, topicId is required. If subject-based, subjectId is required
      if (isTopicBased && (!topicId || topicId.trim() === '')) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'topicId is required when isTopicBased is true'
            )
          );
      }

      if (!isTopicBased && (!subjectId || subjectId.trim() === '')) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'subjectId is required when isTopicBased is false'
            )
          );
      }

      let finalQuizId = quizId;
      let content = '';
      let topicInfo = null;
      let subjectInfo = null;

      // If new quiz, create quiz entry first
      if (isNewQuiz) {
        const newQuizId = uuidv4();
        const quizData = {
          quizId: newQuizId,
          userId,
          topicId: isTopicBased ? topicId : null,
          subjectId: isTopicBased ? null : subjectId,
          attemptCount: 0,
        };

        await db.insert(quizzesTable).values(quizData);
        finalQuizId = newQuizId;
        console.log(`New quiz created with ID: ${finalQuizId}`);
      }

      // Get content based on topic or subject
      if (isTopicBased) {
        // Get content from specific topic
        const topicData = await db
          .select()
          .from(topicsTable)
          .innerJoin(
            subjectsTable,
            eq(topicsTable.subjectId, subjectsTable.subjectId)
          )
          .where(eq(topicsTable.topicId, topicId))
          .limit(1);

        if (topicData.length === 0) {
          return res
            .status(404)
            .json(new ApiResponse(404, {}, 'Topic not found'));
        }

        topicInfo = topicData[0].topics;
        subjectInfo = topicData[0].subjects;

        // Get lessons content for this topic
        const lessons = await db
          .select()
          .from(lessonsTable)
          .where(eq(lessonsTable.topicId, topicId));

        if (lessons.length > 0) {
          content = lessons.map(lesson => lesson.content).join('\n\n');
        } else {
          content = `Topic: ${topicInfo.title}\nDescription: ${
            topicInfo.description || 'No description available'
          }`;
        }

        console.log(`Generating quiz for topic: ${topicInfo.title}`);
      } else {
        // Get content from all topics under the subject
        const subjectData = await db
          .select()
          .from(subjectsTable)
          .where(eq(subjectsTable.subjectId, subjectId))
          .limit(1);

        if (subjectData.length === 0) {
          return res
            .status(404)
            .json(new ApiResponse(404, {}, 'Subject not found'));
        }

        subjectInfo = subjectData[0];

        // Get all topics for this subject
        const topicsData = await db
          .select()
          .from(topicsTable)
          .where(eq(topicsTable.subjectId, subjectId));

        if (topicsData.length === 0) {
          content = `Subject: ${subjectInfo.subjectName}\nNo topics found for this subject.`;
        } else {
          // Get lessons for all topics
          const allLessons = [];
          for (const topic of topicsData) {
            const lessons = await db
              .select()
              .from(lessonsTable)
              .where(eq(lessonsTable.topicId, topic.topicId));

            if (lessons.length > 0) {
              allLessons.push(
                ...lessons.map(
                  lesson => `Topic: ${topic.title}\n${lesson.content}`
                )
              );
            } else {
              allLessons.push(
                `Topic: ${topic.title}\nDescription: ${
                  topic.description || 'No description available'
                }`
              );
            }
          }
          content = allLessons.join('\n\n');
        }

        console.log(`Generating quiz for subject: ${subjectInfo.subjectName}`);
      }

      if (!content.trim()) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, {}, 'No content available to generate quiz')
          );
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      console.log('Generating quiz questions...');

      const hasWeakness = weakness && weakness.trim() !== '';

      // Determine quiz length based on content
      const contentLength = content.length;
      let quizLength = 5; // default
      if (contentLength > 2000) quizLength = 10;
      else if (contentLength > 1000) quizLength = 8;
      else if (contentLength > 500) quizLength = 6;

      let quizPrompt = '';

      if (hasWeakness) {
        quizPrompt = `You are a Quiz Generator. Create a quiz based on the following content with focus on user's weakness areas:

**Content:** ${content}

**User Weakness Summary:** ${weakness}

**User Preferences:** ${user_query || 'No specific preferences'}

**Requirements:**
- Generate ${quizLength} multiple choice questions
- Focus more on the weakness areas mentioned: ${weakness}
- Each question should have 4 options (A, B, C, D)
- Include the correct answer (full option text including the letter)
- Mix of difficulty levels (easy, medium, hard)
${user_query ? `- Apply user preferences: ${user_query}` : ''}

Create a challenging but fair quiz that helps reinforce the weak areas.`;
      } else {
        quizPrompt = `You are a Quiz Generator. Create a quiz based on the following content:

**Content:** ${content}

**User Preferences:** ${user_query || 'No specific preferences'}

**Requirements:**
- Generate ${quizLength} multiple choice questions based on content length
- Questions should cover the main concepts from the content
- Each question should have 4 options (A, B, C, D)
- Include the correct answer (full option text including the letter)
- Mix of difficulty levels (easy, medium, hard)
${user_query ? `- Apply user preferences: ${user_query}` : ''}

Create a comprehensive quiz that tests understanding of the content.`;
      }

      const quizResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: quizPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: {
                      type: Type.STRING,
                    },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.STRING,
                      },
                    },
                    answer: {
                      type: Type.STRING,
                    },
                    difficulty: {
                      type: Type.STRING,
                    },
                  },
                  propertyOrdering: [
                    'question',
                    'options',
                    'answer',
                    'difficulty',
                  ],
                },
              },
            },
            propertyOrdering: ['quiz'],
          },
        },
      });

      const quizResponseText = quizResponse.text;

      if (!quizResponseText) {
        return res
          .status(500)
          .json(new ApiResponse(500, {}, 'Failed to generate quiz'));
      }

      const generatedQuiz = JSON.parse(quizResponseText);

      // Save quiz questions to database
      const questionsToInsert = generatedQuiz.quiz.map((q: any) => {
        const options = Array.isArray(q.options) ? q.options : [];
        const optionA = options[0] || `A) Option A`;
        const optionB = options[1] || `B) Option B`;
        const optionC = options[2] || `C) Option C`;
        const optionD = options[3] || `D) Option D`;

        return {
          questionId: uuidv4(),
          quizId: finalQuizId,
          question: q.question || 'Sample question',
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer: q.answer || optionA,
          difficulty: q.difficulty || 'medium',
          userChoice: null,
        };
      });

      const savedQuestions = await db
        .insert(quizQuestionsTable)
        .values(questionsToInsert)
        .returning();

      console.log(`Quiz questions saved: ${savedQuestions.length} questions`);

      // Prepare response
      const responseData = {
        quiz: {
          id: finalQuizId,
          isNewQuiz,
          isTopicBased,
          ...(topicInfo && {
            topic: {
              id: topicInfo.topicId,
              title: topicInfo.title,
              description: topicInfo.description,
              difficulty: topicInfo.difficulty,
            },
          }),
          subject: {
            id: subjectInfo?.subjectId || '',
            name: subjectInfo?.subjectName || '',
          },
        },
        questions: savedQuestions.map(q => ({
          id: q.questionId,
          question: q.question,
          options: [q.optionA, q.optionB, q.optionC, q.optionD],
          difficulty: q.difficulty,
          // Don't include correctAnswer in response for security
        })),
        quiz_metadata: {
          total_questions: savedQuestions.length,
          has_weakness_focus: hasWeakness,
          content_length_category:
            contentLength > 2000
              ? 'long'
              : contentLength > 1000
              ? 'medium'
              : 'short',
          weakness: weakness || '',
          user_query: user_query || '',
        },
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            `Quiz generated successfully with ${
              savedQuestions.length
            } questions${hasWeakness ? ' (focused on weakness areas)' : ''}`
          )
        );
    } catch (error) {
      console.error('Error generating quiz:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const getExternalResources = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.body;

      if (!subjectId || subjectId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject ID is required'));
      }

      // Validate subject exists
      const subjectData = await db
        .select()
        .from(subjectsTable)
        .where(eq(subjectsTable.subjectId, subjectId))
        .limit(1);

      if (subjectData.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Subject not found'));
      }

      const subject = subjectData[0];

      // Fetch all topics for this subject
      const topicsData = await db
        .select()
        .from(topicsTable)
        .where(eq(topicsTable.subjectId, subjectId));

      if (topicsData.length === 0) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'No topics found for this subject. Please add topics first.'
            )
          );
      }

      console.log(
        `Found ${topicsData.length} topics for subject: ${subject.subjectName}`
      );

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      // Define the grounding tool for web search
      const groundingTool = {
        googleSearch: {},
      };

      // Configure generation settings
      const config = {
        tools: [groundingTool],
      };

      // Use the topic titles from the database
      const topics = topicsData.map(topic => topic.title);

      // AGENT 1: Search for resources for each topic
      console.log('Agent 1: Searching for resources for each topic...');

      const topicResources = [];

      for (const topic of topics) {
        console.log(`Searching resources for topic: ${topic}`);

        const resourcePrompt = `Search and verify 2 best educational resources about "${topic}" in the context of "${subject.subjectName}".

        Requirements for resources:
        1. One must be a video from YouTube (make sure the video exists and is accessible)
        2. One must be an article/documentation from reputable educational sites like:
           - Khan Academy (khanacademy.org)
           - MIT OpenCourseWare (ocw.mit.edu)
           - Coursera (coursera.org)
           - edX (edx.org)
           - W3Schools (w3schools.com)
           - GeeksforGeeks (geeksforgeeks.org)
           - MDN Web Docs (developer.mozilla.org)

        For each resource, verify and provide:
        1. Clear, accurate title that matches the actual content
        2. Complete, working URL (must start with https:// and be directly accessible)
        3. Type (specify if video or article/documentation)
        4. Source platform name
        5. Difficulty level (beginner/intermediate/advanced)

        IMPORTANT:
        - Verify that each URL is valid and accessible
        - For YouTube videos, use only videos from reputable educational channels
        - For articles, prefer well-established educational platforms
        - Avoid URLs that require login or paid subscriptions
        - Double-check that links are not broken or outdated

        Keep the response focused on just these two carefully verified resources.`;

        const resourceResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: resourcePrompt,
          config,
        });

        topicResources.push({
          topic: topic,
          searchResults: resourceResponse.text,
        });
      }

      // AGENT 2: Structure and organize all resources
      console.log('Agent 2: Structuring and organizing all resources...');

      const structurePrompt = `Based on the following search results for different topics under the subject "${
        subject.subjectName
      }", create a well-structured list of external learning resources:

${topicResources
  .map(
    (tr, index) => `
**Topic ${index + 1}: ${tr.topic}**
${tr.searchResults}
`
  )
  .join('\n')}

Please organize these resources into a structured format with the following strict requirements:
1. Group resources by topic under the subject "${subject.subjectName}"
2. For each topic, verify and include exactly 2 resources:
   - One high-quality video resource (must be a working YouTube video)
   - One high-quality article/documentation resource (from reputable educational platforms)
3. URL Validation Requirements:
   - All URLs must start with https://
   - All URLs must be complete and directly accessible
   - YouTube video URLs should be in the format: https://www.youtube.com/watch?v=VIDEO_ID
   - Documentation URLs should be from established educational platforms
   - No shortened URLs or redirects
4. Remove any duplicate resources
5. Verify each resource is directly relevant to the topic
6. Ensure each URL leads to actual educational content
7. Skip any resource if its URL cannot be verified

Structure the response as a comprehensive JSON with the subject and all its topics with their resources.`;

      const structuredResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: structurePrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
              },
              description: {
                type: Type.STRING,
              },
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic_name: {
                      type: Type.STRING,
                    },
                    description: {
                      type: Type.STRING,
                    },
                    resources: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: {
                            type: Type.STRING,
                          },
                          url: {
                            type: Type.STRING,
                          },
                          type: {
                            type: Type.STRING,
                          },
                          source: {
                            type: Type.STRING,
                          },
                          difficulty: {
                            type: Type.STRING,
                          },
                        },
                        propertyOrdering: [
                          'title',
                          'url',
                          'type',
                          'source',
                          'difficulty',
                        ],
                      },
                    },
                  },
                  propertyOrdering: ['topic_name', 'description', 'resources'],
                },
              },
              total_topics: {
                type: Type.NUMBER,
              },
              total_resources: {
                type: Type.NUMBER,
              },
              search_timestamp: {
                type: Type.STRING,
              },
            },
            propertyOrdering: [
              'subject',
              'description',
              'topics',
              'total_topics',
              'total_resources',
              'search_timestamp',
            ],
          },
        },
      });

      const structuredResponseText = structuredResponse.text;

      if (!structuredResponseText) {
        return res
          .status(500)
          .json(
            new ApiResponse(500, {}, 'Failed to generate structured resources')
          );
      }

      const structuredResources = JSON.parse(structuredResponseText);

      // AGENT 3: Save resources to database
      console.log('Agent 3: Saving resources to database...');

      const resourcesToInsert = [];

      for (const topicData of structuredResources.topics || []) {
        const topicName = topicData.topic_name;
        const topicDescription = topicData.description || '';

        for (const resource of topicData.resources || []) {
          // Map difficulty to match our enum
          let difficulty = 'beginner';
          if (resource.difficulty) {
            const diff = resource.difficulty.toLowerCase();
            if (diff.includes('intermediate') || diff.includes('medium')) {
              difficulty = 'intermediate';
            } else if (diff.includes('advanced') || diff.includes('hard')) {
              difficulty = 'advanced';
            }
          }

          resourcesToInsert.push({
            resourceId: uuidv4(),
            subjectId,
            topicName,
            description: topicDescription,
            resourceTitle: resource.title || 'Untitled Resource',
            url: resource.url || '',
            type: resource.type || 'other',
            source: resource.source || 'Unknown',
            difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
          });
        }
      }

      // Insert resources into database
      let savedResources: any[] = [];
      if (resourcesToInsert.length > 0) {
        try {
          savedResources = await db
            .insert(externalResourcesTable)
            .values(resourcesToInsert)
            .returning();

          console.log(
            `Saved ${savedResources.length} external resources to database`
          );
        } catch (dbError) {
          console.error('Error saving resources to database:', dbError);
          // Continue with the response even if database save fails
        }
      }

      // Add timestamp and enhance metadata
      const enhancedResources = {
        ...structuredResources,
        subject: subject.subjectName,
        subject_id: subjectId,
        total_topics: structuredResources.topics?.length || 0,
        total_resources:
          structuredResources.topics?.reduce(
            (total: number, topic: any) =>
              total + (topic.resources?.length || 0),
            0
          ) || 0,
        saved_to_database: savedResources.length,
        search_metadata: {
          agents_used: ['resource_search', 'structuring', 'database_storage'],
          topics_source: 'fetched_from_database',
          search_date: new Date().toDateString(),
          grounding_enabled: true,
          processing_time: 'Multi-agent workflow completed',
          database_integration: true,
        },
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            enhancedResources,
            `External resources found and saved successfully for subject: ${subject.subjectName} with ${enhancedResources.total_topics} topics and ${enhancedResources.total_resources} resources. ${savedResources.length} resources saved to database.`
          )
        );
    } catch (error) {
      console.error('Error getting external resources:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const generateShortQuestions = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subject, merged_content, user_query } = req.body;

      if (!subject || subject.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject is required'));
      }

      if (!merged_content || merged_content.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Merged content is required'));
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      console.log('Generating short questions based on content...');

      // Determine the number of questions based on content length
      const contentLength = merged_content.length;
      let questionCount = 5; // default
      if (contentLength > 3000) questionCount = 12;
      else if (contentLength > 2000) questionCount = 10;
      else if (contentLength > 1500) questionCount = 8;
      else if (contentLength > 1000) questionCount = 6;

      const questionPrompt = `You are a Smart Study Question Generator. Based on the following content about "${subject}", generate ${questionCount} short, focused questions that test understanding of key concepts.

**Subject:** ${subject}

**Content:** ${merged_content}

**User Preferences:** ${user_query || 'No specific preferences provided'}

**Requirements:**
1. Generate ${questionCount} short questions (each question should be 10-20 words maximum)
2. Questions should cover the main concepts and important details from the content
3. ${
        user_query
          ? `Incorporate user preferences: ${user_query}`
          : 'Use a balanced mix of question types'
      }
4. Mix different types of questions:
   - Definition questions (What is...?)
   - Explanation questions (Why does...? How does...?)
   - Application questions (When would you use...?)
   - Comparison questions (What's the difference between...?)
5. Ensure questions are clear, specific, and directly answerable from the content
6. Vary the difficulty levels (beginner, intermediate, advanced)
7. Focus on the most important concepts that students should understand
8. Make questions concise but comprehensive
9. Avoid yes/no questions - prefer open-ended questions that require explanation
${
  user_query
    ? `10. Prioritize topics or question styles mentioned in user preferences: "${user_query}"`
    : ''
}

Generate questions that would help students review and test their understanding of the material effectively${
        user_query
          ? `, while following the user's specific requirements: ${user_query}`
          : ''
      }.`;

      const questionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: questionPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: {
                      type: Type.STRING,
                    },
                    question_type: {
                      type: Type.STRING,
                    },
                    difficulty: {
                      type: Type.STRING,
                    },
                    topic_focus: {
                      type: Type.STRING,
                    },
                  },
                  propertyOrdering: [
                    'question',
                    'question_type',
                    'difficulty',
                    'topic_focus',
                  ],
                },
              },
              total_questions: {
                type: Type.NUMBER,
              },
            },
            propertyOrdering: ['subject', 'questions', 'total_questions'],
          },
        },
      });

      const questionResponseText = questionResponse.text;

      if (!questionResponseText) {
        return res
          .status(500)
          .json(new ApiResponse(500, {}, 'Failed to generate questions'));
      }

      const generatedQuestions = JSON.parse(questionResponseText);

      // Prepare simplified response data
      const responseData = {
        subject,
        user_query: user_query || '',
        questions: generatedQuestions.questions,
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            `${
              generatedQuestions.questions.length
            } short questions generated successfully for ${subject}${
              user_query ? ' with user preferences applied' : ''
            }`
          )
        );
    } catch (error) {
      console.error('Error generating short questions:', error);
      res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { topicId, subjectId } = req.body;
    const userId = req.user.userId;

    // Check if either topicId or subjectId is provided
    if (!topicId && !subjectId) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, 'Either topicId or subjectId is required')
        );
    }

    // Create quiz record in database
    const quizId = uuidv4();
    const quizData = {
      quizId,
      userId,
      topicId: topicId || null,
      subjectId: subjectId || null,
      attemptCount: 0,
    };

    const savedQuiz = await db
      .insert(quizzesTable)
      .values(quizData)
      .returning();

    return res
      .status(200)
      .json(new ApiResponse(200, savedQuiz[0], 'Quiz created successfully'));
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json(new ApiResponse(500, null, 'Internal server error'));
  }
});
