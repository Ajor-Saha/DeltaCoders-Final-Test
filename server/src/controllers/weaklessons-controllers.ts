import { GoogleGenAI } from '@google/genai';
import { and, eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { lessonsTable } from '../db/schema/tbl-lessons';
import { quizResultsTable } from '../db/schema/tbl-quiz-results';
import { quizzesTable } from '../db/schema/tbl-quizzes';
import { subjectsTable } from '../db/schema/tbl-subjects';
import { topicsTable } from '../db/schema/tbl-topics';
import { weakLessonsTable } from '../db/schema/tbl-weak-lessons';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

export const generateWeakLessons = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const userId = req.user.userId;

      // Validate subjectId
      if (!subjectId || subjectId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject ID is required'));
      }

      console.log(
        `Generating weak lessons for user ${userId}, subject ${subjectId}`
      );

      // Verify subject exists
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

      // Get all topics for this subject
      const topics = await db
        .select()
        .from(topicsTable)
        .where(eq(topicsTable.subjectId, subjectId));

      if (topics.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'No topics found for this subject'));
      }

      console.log(
        `Found ${topics.length} topics for subject: ${subject.subjectName}`
      );

      // First, get all quiz attempts by this user for this subject
      const userQuizAttempts = await db
        .select({
          resultId: quizResultsTable.resultId,
          score: quizResultsTable.score,
          totalMarks: quizResultsTable.totalMarks,
          completedAt: quizResultsTable.completedAt,
          quizId: quizzesTable.quizId,
          topicId: quizzesTable.topicId,
          topicTitle: topicsTable.title,
          topicDescription: topicsTable.description,
          difficulty: topicsTable.difficulty,
        })
        .from(quizResultsTable)
        .innerJoin(
          quizzesTable,
          eq(quizResultsTable.quizId, quizzesTable.quizId)
        )
        .innerJoin(topicsTable, eq(quizzesTable.topicId, topicsTable.topicId))
        .where(
          and(
            eq(quizzesTable.userId, userId),
            eq(quizzesTable.subjectId, subjectId)
          )
        );

      console.log(
        `Found ${userQuizAttempts.length} quiz attempts by user for this subject`
      );

      if (userQuizAttempts.length === 0) {
        // Get all topics info for context even if no quizzes attempted
        const allTopicsInfo = topics.map(topic => ({
          topicId: topic.topicId,
          title: topic.title,
          description: topic.description || 'No description available',
          difficulty: topic.difficulty,
          hasAttempts: false,
        }));

        return res.status(200).json(
          new ApiResponse(
            200,
            {
              subject: {
                id: subject.subjectId,
                name: subject.subjectName,
              },
              analysis: {
                totalTopics: topics.length,
                attemptedTopics: 0,
                weakTopics: 0,
                message:
                  'No quiz attempts found for this subject. Please complete some quizzes first to identify weak areas.',
              },
              topics: allTopicsInfo,
              weakTopics: [],
            },
            'No quiz attempts found for analysis'
          )
        );
      }

      // Group quiz attempts by topic to analyze performance
      const topicPerformanceMap = new Map();

      userQuizAttempts.forEach(attempt => {
        const topicId = attempt.topicId;
        if (!topicPerformanceMap.has(topicId)) {
          topicPerformanceMap.set(topicId, {
            topicId: attempt.topicId,
            title: attempt.topicTitle,
            description: attempt.topicDescription || 'No description available',
            difficulty: attempt.difficulty,
            attempts: [],
            totalScore: 0,
            totalPossible: 0,
          });
        }

        const topicData = topicPerformanceMap.get(topicId);
        topicData.attempts.push({
          score: attempt.score,
          totalMarks: attempt.totalMarks,
          completedAt: attempt.completedAt,
        });
        topicData.totalScore += attempt.score;
        topicData.totalPossible += attempt.totalMarks;
      });

      // Analyze performance and identify weak topics
      const weakTopics = [];
      const attemptedTopics = [];
      const poorPerformanceThreshold = 95; // Below 60% is considered poor

      for (const [topicId, topicData] of topicPerformanceMap.entries()) {
        const averagePercentage =
          topicData.totalPossible > 0
            ? (topicData.totalScore / topicData.totalPossible) * 100
            : 0;

        console.log(
          `Topic ${topicData.title}: ${averagePercentage.toFixed(
            1
          )}% average performance (${topicData.attempts.length} attempts)`
        );

        attemptedTopics.push({
          topicId: topicData.topicId,
          title: topicData.title,
          description: topicData.description,
          difficulty: topicData.difficulty,
          averagePerformance: Math.round(averagePercentage),
          quizAttempts: topicData.attempts.length,
          isWeak: averagePercentage < poorPerformanceThreshold,
        });

        if (averagePercentage < poorPerformanceThreshold) {
          // Get lesson content for this weak topic
          const lessons = await db
            .select()
            .from(lessonsTable)
            .where(eq(lessonsTable.topicId, topicData.topicId));

          const lessonContent =
            lessons.length > 0
              ? lessons.map(lesson => lesson.content).join('\n\n')
              : `Topic: ${topicData.title}\nDescription: ${topicData.description}\nDifficulty: ${topicData.difficulty}\n\nNo detailed lesson content available. This topic requires further study.`;

          weakTopics.push({
            topicId: topicData.topicId,
            title: topicData.title,
            description: topicData.description,
            difficulty: topicData.difficulty,
            averagePerformance: Math.round(averagePercentage),
            quizAttempts: topicData.attempts.length,
            lessonContent: lessonContent,
            lastAttempt:
              topicData.attempts[topicData.attempts.length - 1]?.completedAt,
          });
        }
      }

      // Also include topics that haven't been attempted for context
      const unattemptedTopics = topics
        .filter(topic => !topicPerformanceMap.has(topic.topicId))
        .map(topic => ({
          topicId: topic.topicId,
          title: topic.title,
          description: topic.description || 'No description available',
          difficulty: topic.difficulty,
          status: 'not_attempted',
        }));

      if (weakTopics.length === 0) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              subject: {
                id: subject.subjectId,
                name: subject.subjectName,
              },
              analysis: {
                totalTopics: topics.length,
                attemptedTopics: attemptedTopics.length,
                weakTopics: 0,
                averageOverallPerformance: Math.round(
                  attemptedTopics.reduce(
                    (sum, topic) => sum + topic.averagePerformance,
                    0
                  ) / (attemptedTopics.length || 1)
                ),
              },
              attemptedTopics,
              unattemptedTopics,
              weakTopics: [],
              message:
                'Great job! No weak areas identified based on quiz performance.',
            },
            'No weak topics found based on quiz performance'
          )
        );
      }

      console.log(
        `Found ${weakTopics.length} weak topics, generating AI lesson...`
      );

      // Generate comprehensive remedial lessons using AI
      const prompt = `You are an expert educational content creator. Based on the following analysis of a student's quiz performance in ${
        subject.subjectName
      }, create personalized remedial lesson plans to help them improve in their weak areas.

STUDENT PERFORMANCE ANALYSIS:
Subject: ${subject.subjectName}
Total Topics in Subject: ${topics.length}
Topics Attempted: ${attemptedTopics.length}
Weak Topics Identified: ${weakTopics.length}

WEAK AREAS REQUIRING ATTENTION:
${weakTopics
  .map(
    topic => `
Topic: ${topic.title}
Description: ${topic.description}
Difficulty Level: ${topic.difficulty}
Average Performance: ${topic.averagePerformance}% (${topic.quizAttempts} attempts)
Current Content Available:
${topic.lessonContent}

---
`
  )
  .join('')}

${
  unattemptedTopics.length > 0
    ? `
TOPICS NOT YET ATTEMPTED:
${unattemptedTopics
  .map(
    topic =>
      `- ${topic.title} (${topic.difficulty} difficulty): ${topic.description}`
  )
  .join('\n')}
`
    : ''
}

CONTEXT FOR BETTER LESSON DESIGN:
Subject Overview: ${
        subject.subjectName
      } - This appears to be an academic subject requiring structured learning approach.

Please generate a comprehensive remedial lesson plan that includes:

1. **Priority Learning Path**: Order the weak topics by recommended study sequence
2. **Targeted Lesson Content**: For each weak topic, provide:
   - Key concepts simplified and explained clearly
   - Common misconceptions and how to avoid them
   - Step-by-step examples with solutions
   - Practice exercises (3-5 questions with increasing difficulty)
   - Memory techniques or mnemonics where applicable
3. **Study Strategy**: Specific recommendations for this student based on their performance patterns
4. **Progress Milestones**: Clear checkpoints to measure improvement
5. **Additional Resources**: Suggested supplementary materials or study techniques

Format your response as structured, actionable content that directly addresses the student's weak areas while building confidence. Make the content engaging and easy to follow, with clear headings and bullet points.`;

      console.log('Generating AI-powered remedial lessons...');

      const genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY!,
      });

      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const aiGeneratedContent = result.text;

      console.log('AI content generated successfully');

      // Generate a unique ID for this weak lesson
      const weakLessonId = uuidv4();

      // Save the weak lesson to database
      const savedWeakLesson = await db
        .insert(weakLessonsTable)
        .values({
          weakLessonId: weakLessonId,
          userId: userId,
          subjectId: subjectId,
          lessonContent: JSON.stringify({
            analysis: {
              totalTopics: topics.length,
              attemptedTopics: attemptedTopics.length,
              weakTopicsCount: weakTopics.length,
              weakTopicIds: weakTopics.map(t => t.topicId),
              averageOverallPerformance: Math.round(
                attemptedTopics.reduce(
                  (sum, topic) => sum + topic.averagePerformance,
                  0
                ) / (attemptedTopics.length || 1)
              ),
              analysisDate: new Date().toISOString(),
              unattemptedTopicsCount: unattemptedTopics.length,
              unattemptedTopicIds: unattemptedTopics.map(t => t.topicId),
            },
            remedialContent: aiGeneratedContent,
            weakTopics: weakTopics,
            attemptedTopics: attemptedTopics,
            unattemptedTopics: unattemptedTopics,
          }),
        })
        .returning();

      console.log(
        'Weak lesson saved to database with ID:',
        savedWeakLesson[0]?.weakLessonId
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            lessonId: savedWeakLesson[0]?.weakLessonId,
            subject: {
              id: subject.subjectId,
              name: subject.subjectName,
            },
            analysis: {
              totalTopics: topics.length,
              attemptedTopics: attemptedTopics.length,
              weakTopics: weakTopics.length,
              unattemptedTopics: unattemptedTopics.length,
              averageOverallPerformance: Math.round(
                attemptedTopics.reduce(
                  (sum, topic) => sum + topic.averagePerformance,
                  0
                ) / (attemptedTopics.length || 1)
              ),
            },
            attemptedTopics,
            unattemptedTopics,
            weakTopics,
            remedialContent: aiGeneratedContent,
            generatedAt: new Date().toISOString(),
          },
          'Remedial lesson plan generated successfully based on quiz performance'
        )
      );
    } catch (error) {
      console.error('Error generating weak lessons:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const getUserWeakLessons = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const userId = req.user.userId;

      // Build where condition
      let whereCondition;
      if (subjectId && subjectId !== 'all') {
        whereCondition = and(
          eq(weakLessonsTable.userId, userId),
          eq(weakLessonsTable.subjectId, subjectId)
        );
      } else {
        whereCondition = eq(weakLessonsTable.userId, userId);
      }

      // Get user's weak lessons
      const weakLessons = await db
        .select({
          weakLessonId: weakLessonsTable.weakLessonId,
          userId: weakLessonsTable.userId,
          subjectId: weakLessonsTable.subjectId,
          lessonContent: weakLessonsTable.lessonContent,
          createdAt: weakLessonsTable.createdAt,
          updatedAt: weakLessonsTable.updatedAt,
          subjectName: subjectsTable.subjectName,
        })
        .from(weakLessonsTable)
        .innerJoin(
          subjectsTable,
          eq(weakLessonsTable.subjectId, subjectsTable.subjectId)
        )
        .where(whereCondition)
        .orderBy(weakLessonsTable.createdAt);

      // Parse lesson content for better presentation
      const formattedLessons = weakLessons.map(lesson => ({
        id: lesson.weakLessonId,
        userId: lesson.userId,
        subject: {
          id: lesson.subjectId,
          name: lesson.subjectName,
        },
        content: lesson.lessonContent ? JSON.parse(lesson.lessonContent) : null,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      }));

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            lessons: formattedLessons,
            total: formattedLessons.length,
          },
          'User weak lessons retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Error retrieving user weak lessons:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const regenerateLatestWeakLessons = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const userId = req.user.userId;

      // Validate subjectId
      if (!subjectId || subjectId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject ID is required'));
      }

      console.log(
        `Regenerating latest weak lessons for user ${userId}, subject ${subjectId}`
      );

      // Verify subject exists
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

      // Get all topics for this subject
      const topics = await db
        .select()
        .from(topicsTable)
        .where(eq(topicsTable.subjectId, subjectId));

      if (topics.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'No topics found for this subject'));
      }

      console.log(
        `Found ${topics.length} topics for subject: ${subject.subjectName}`
      );

      // Get ONLY the latest quiz attempt for each topic by this user for this subject
      const latestQuizAttempts = await db
        .select({
          resultId: quizResultsTable.resultId,
          score: quizResultsTable.score,
          totalMarks: quizResultsTable.totalMarks,
          completedAt: quizResultsTable.completedAt,
          quizId: quizzesTable.quizId,
          topicId: quizzesTable.topicId,
          topicTitle: topicsTable.title,
          topicDescription: topicsTable.description,
          difficulty: topicsTable.difficulty,
          rowNumber: quizResultsTable.resultId, // We'll use this for ranking
        })
        .from(quizResultsTable)
        .innerJoin(
          quizzesTable,
          eq(quizResultsTable.quizId, quizzesTable.quizId)
        )
        .innerJoin(topicsTable, eq(quizzesTable.topicId, topicsTable.topicId))
        .where(
          and(
            eq(quizzesTable.userId, userId),
            eq(quizzesTable.subjectId, subjectId)
          )
        )
        .orderBy(quizResultsTable.completedAt); // Order by completion time

      console.log(
        `Found ${latestQuizAttempts.length} total quiz attempts by user for this subject`
      );

      if (latestQuizAttempts.length === 0) {
        // Get all topics info for context even if no quizzes attempted
        const allTopicsInfo = topics.map(topic => ({
          topicId: topic.topicId,
          title: topic.title,
          description: topic.description || 'No description available',
          difficulty: topic.difficulty,
          hasAttempts: false,
        }));

        return res.status(200).json(
          new ApiResponse(
            200,
            {
              subject: {
                id: subject.subjectId,
                name: subject.subjectName,
              },
              analysis: {
                totalTopics: topics.length,
                attemptedTopics: 0,
                weakTopics: 0,
                message:
                  'No quiz attempts found for this subject. Please complete some quizzes first to identify current weak areas.',
              },
              topics: allTopicsInfo,
              weakTopics: [],
              isRegenerated: true,
            },
            'No recent quiz attempts found for analysis'
          )
        );
      }

      // Filter to get only the LATEST attempt for each topic
      const latestAttemptsByTopic = new Map();

      latestQuizAttempts.forEach(attempt => {
        const topicId = attempt.topicId;
        if (
          !latestAttemptsByTopic.has(topicId) ||
          new Date(attempt.completedAt) >
            new Date(latestAttemptsByTopic.get(topicId).completedAt)
        ) {
          latestAttemptsByTopic.set(topicId, attempt);
        }
      });

      console.log(
        `Analyzing latest attempts for ${latestAttemptsByTopic.size} topics`
      );

      // Analyze performance of latest attempts only
      const weakTopics = [];
      const attemptedTopics = [];
      const poorPerformanceThreshold = 95; // Below 60% is considered poor

      for (const [topicId, latestAttempt] of latestAttemptsByTopic.entries()) {
        const performancePercentage =
          latestAttempt.totalMarks > 0
            ? (latestAttempt.score / latestAttempt.totalMarks) * 100
            : 0;

        console.log(
          `Topic ${latestAttempt.topicTitle}: ${performancePercentage.toFixed(
            1
          )}% (Latest attempt on ${new Date(
            latestAttempt.completedAt
          ).toLocaleDateString()})`
        );

        attemptedTopics.push({
          topicId: latestAttempt.topicId,
          title: latestAttempt.topicTitle,
          description: latestAttempt.topicDescription,
          difficulty: latestAttempt.difficulty,
          latestPerformance: Math.round(performancePercentage),
          lastAttemptDate: latestAttempt.completedAt,
          isCurrentlyWeak: performancePercentage < poorPerformanceThreshold,
        });

        if (performancePercentage < poorPerformanceThreshold) {
          // Get lesson content for this currently weak topic
          const lessons = await db
            .select()
            .from(lessonsTable)
            .where(eq(lessonsTable.topicId, latestAttempt.topicId));

          const lessonContent =
            lessons.length > 0
              ? lessons.map(lesson => lesson.content).join('\n\n')
              : `Topic: ${latestAttempt.topicTitle}\nDescription: ${latestAttempt.topicDescription}\nDifficulty: ${latestAttempt.difficulty}\n\nNo detailed lesson content available. This topic requires further study based on recent performance.`;

          weakTopics.push({
            topicId: latestAttempt.topicId,
            title: latestAttempt.topicTitle,
            description:
              latestAttempt.topicDescription || 'No description available',
            difficulty: latestAttempt.difficulty,
            latestPerformance: Math.round(performancePercentage),
            lastAttemptDate: latestAttempt.completedAt,
            lessonContent: lessonContent,
            isCurrentWeakness: true,
          });
        }
      }

      // Topics that haven't been attempted recently
      const unattemptedTopics = topics
        .filter(topic => !latestAttemptsByTopic.has(topic.topicId))
        .map(topic => ({
          topicId: topic.topicId,
          title: topic.title,
          description: topic.description || 'No description available',
          difficulty: topic.difficulty,
          status: 'not_attempted_recently',
        }));

      if (weakTopics.length === 0) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              subject: {
                id: subject.subjectId,
                name: subject.subjectName,
              },
              analysis: {
                totalTopics: topics.length,
                recentlyAttemptedTopics: attemptedTopics.length,
                currentWeakTopics: 0,
                unattemptedTopics: unattemptedTopics.length,
                averageRecentPerformance: Math.round(
                  attemptedTopics.reduce(
                    (sum, topic) => sum + topic.latestPerformance,
                    0
                  ) / (attemptedTopics.length || 1)
                ),
              },
              attemptedTopics,
              unattemptedTopics,
              weakTopics: [],
              message:
                'Excellent! No current weak areas identified based on latest quiz performance.',
              isRegenerated: true,
            },
            'No current weak topics found based on recent quiz performance'
          )
        );
      }

      console.log(
        `Found ${weakTopics.length} currently weak topics based on latest attempts, generating updated AI lesson...`
      );

      // Generate comprehensive remedial lessons using AI based on LATEST performance
      const prompt = `You are an expert educational content creator. Based on the following analysis of a student's LATEST quiz performance in ${
        subject.subjectName
      }, create updated personalized remedial lesson plans to help them improve their CURRENT weak areas.

IMPORTANT: This analysis focuses on the student's MOST RECENT performance per topic to identify their CURRENT weaknesses.

CURRENT STUDENT PERFORMANCE ANALYSIS:
Subject: ${subject.subjectName}
Total Topics in Subject: ${topics.length}
Recently Attempted Topics: ${attemptedTopics.length}
Current Weak Topics (Latest Performance): ${weakTopics.length}

CURRENT WEAK AREAS REQUIRING IMMEDIATE ATTENTION:
${weakTopics
  .map(
    topic => `
Topic: ${topic.title}
Description: ${topic.description}
Difficulty Level: ${topic.difficulty}
Latest Performance: ${topic.latestPerformance}% (Last attempt: ${new Date(
      topic.lastAttemptDate
    ).toLocaleDateString()})
Current Status: NEEDS IMPROVEMENT
Available Content:
${topic.lessonContent}

---
`
  )
  .join('')}

${
  unattemptedTopics.length > 0
    ? `
TOPICS NOT RECENTLY ATTEMPTED:
${unattemptedTopics
  .map(
    topic =>
      `- ${topic.title} (${topic.difficulty} difficulty): ${topic.description}`
  )
  .join('\n')}
`
    : ''
}

RECENT PERFORMANCE CONTEXT:
${attemptedTopics
  .filter(topic => !topic.isCurrentlyWeak)
  .map(
    topic => `✓ ${topic.title}: ${topic.latestPerformance}% (Good performance)`
  )
  .join('\n')}

CONTEXT FOR UPDATED LESSON DESIGN:
Subject Overview: ${
        subject.subjectName
      } - Updated analysis based on most recent quiz attempts
Focus: Address CURRENT weaknesses and maintain strong areas

Please generate an UPDATED comprehensive remedial lesson plan that includes:

1. **Current Priority Learning Path**: Order the currently weak topics by urgency based on recent performance
2. **Updated Targeted Lesson Content**: For each currently weak topic, provide:
   - Key concepts that need immediate attention
   - Recent common mistakes and how to avoid them
   - Updated step-by-step examples with solutions
   - Fresh practice exercises (3-5 questions with increasing difficulty)
   - New memory techniques or reinforcement strategies
3. **Current Study Strategy**: Updated recommendations based on latest performance patterns
4. **Immediate Progress Milestones**: Clear short-term checkpoints to address current weaknesses
5. **Updated Resources**: Fresh supplementary materials or updated study techniques

Format your response as structured, actionable content that directly addresses the student's CURRENT weak areas while acknowledging their recent progress. Make the content engaging and focused on immediate improvement needs.`;

      console.log(
        'Generating updated AI-powered remedial lessons based on latest performance...'
      );

      const genAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY!,
      });

      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const aiGeneratedContent = result.text;

      console.log('Updated AI content generated successfully');

      // Generate a unique ID for this regenerated weak lesson
      const weakLessonId = uuidv4();

      // Save the regenerated weak lesson to database
      const savedWeakLesson = await db
        .insert(weakLessonsTable)
        .values({
          weakLessonId: weakLessonId,
          userId: userId,
          subjectId: subjectId,
          lessonContent: JSON.stringify({
            analysis: {
              type: 'latest_performance_analysis',
              totalTopics: topics.length,
              recentlyAttemptedTopics: attemptedTopics.length,
              currentWeakTopicsCount: weakTopics.length,
              currentWeakTopicIds: weakTopics.map(t => t.topicId),
              averageRecentPerformance: Math.round(
                attemptedTopics.reduce(
                  (sum, topic) => sum + topic.latestPerformance,
                  0
                ) / (attemptedTopics.length || 1)
              ),
              analysisDate: new Date().toISOString(),
              unattemptedTopicsCount: unattemptedTopics.length,
              unattemptedTopicIds: unattemptedTopics.map(t => t.topicId),
              regenerated: true,
            },
            remedialContent: aiGeneratedContent,
            currentWeakTopics: weakTopics,
            recentAttemptedTopics: attemptedTopics,
            unattemptedTopics: unattemptedTopics,
          }),
        })
        .returning();

      console.log(
        'Regenerated weak lesson saved to database with ID:',
        savedWeakLesson[0]?.weakLessonId
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            lessonId: savedWeakLesson[0]?.weakLessonId,
            subject: {
              id: subject.subjectId,
              name: subject.subjectName,
            },
            analysis: {
              type: 'latest_performance_analysis',
              totalTopics: topics.length,
              recentlyAttemptedTopics: attemptedTopics.length,
              currentWeakTopics: weakTopics.length,
              unattemptedTopics: unattemptedTopics.length,
              averageRecentPerformance: Math.round(
                attemptedTopics.reduce(
                  (sum, topic) => sum + topic.latestPerformance,
                  0
                ) / (attemptedTopics.length || 1)
              ),
              regenerated: true,
            },
            recentAttemptedTopics: attemptedTopics,
            unattemptedTopics,
            currentWeakTopics: weakTopics,
            remedialContent: aiGeneratedContent,
            generatedAt: new Date().toISOString(),
            isRegenerated: true,
          },
          'Updated remedial lesson plan generated successfully based on latest quiz performance'
        )
      );
    } catch (error) {
      console.error('Error regenerating latest weak lessons:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
