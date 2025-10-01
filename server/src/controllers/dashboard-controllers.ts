import { eq, sql } from 'drizzle-orm';
import { Request, Response } from 'express';
import { db } from '../db';
import { cognitiveAssessmentsTable } from '../db/schema/tbl-cognitive-assessments';
import { gameAnalyticsTable } from '../db/schema/tbl-game-analytics';
import { quizResultsTable } from '../db/schema/tbl-quiz-results';
import { quizzesTable } from '../db/schema/tbl-quizzes';
import { subjectsTable } from '../db/schema/tbl-subjects';
import { topicsTable } from '../db/schema/tbl-topics';
import { userSubjectsTable } from '../db/schema/tbl-user-subjects';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

export const getDashboardStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, null, 'User not authenticated'));
      }

      // Execute separate optimized queries for each statistic
      const [
        totalQuizzesResult,
        avgQuizScoreResult,
        totalGamesResult,
        avgCognitiveResult,
        coursesResult,
      ] = await Promise.all([
        // Total unique quizzes taken by user
        db
          .select({
            count: sql<number>`COUNT(DISTINCT ${quizResultsTable.quizId})`,
          })
          .from(quizResultsTable)
          .innerJoin(
            quizzesTable,
            eq(quizResultsTable.quizId, quizzesTable.quizId)
          )
          .where(eq(quizzesTable.userId, userId)),

        // Average quiz score percentage
        db
          .select({
            avg: sql<number>`COALESCE(ROUND(AVG(${quizResultsTable.score}/ ${quizResultsTable.totalMarks}), 1), 0)`,
          })
          .from(quizResultsTable)
          .innerJoin(
            quizzesTable,
            eq(quizResultsTable.quizId, quizzesTable.quizId)
          )
          .where(eq(quizzesTable.userId, userId)),

        // Total games played
        db
          .select({
            count: sql<number>`COUNT(*)`,
          })
          .from(gameAnalyticsTable)
          .where(eq(gameAnalyticsTable.userId, userId)),

        // Average cognitive score
        db
          .select({
            avg: sql<number>`COALESCE(ROUND(AVG(${cognitiveAssessmentsTable.cognitiveScore}), 1), 0)`,
          })
          .from(cognitiveAssessmentsTable)
          .where(eq(cognitiveAssessmentsTable.userId, userId)),

        // Total enrolled courses/subjects
        db
          .select({
            count: sql<number>`COUNT(*)`,
          })
          .from(userSubjectsTable)
          .where(eq(userSubjectsTable.userId, userId)),
      ]);

      const stats = {
        totalQuizzes: Number(totalQuizzesResult[0]?.count || 0),
        avgQuizScore: Number(avgQuizScoreResult[0]?.avg || 0),
        totalGamesPlayed: Number(totalGamesResult[0]?.count || 0),
        avgCognitiveScore: Number(avgCognitiveResult[0]?.avg || 0),
        coursesEnrolled: Number(coursesResult[0]?.count || 0),
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            stats,
            'Dashboard statistics retrieved successfully'
          )
        );
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      return res
        .status(500)
        .json(
          new ApiResponse(500, null, 'Failed to fetch dashboard statistics')
        );
    }
  }
);

export const getRecentQuizzes = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, null, 'User not authenticated'));
      }

      // Get recent 5 quiz results with topic name, score, time taken, and total questions
      const recentQuizzes = await db
        .select({
          resultId: quizResultsTable.resultId,
          quizId: quizResultsTable.quizId,
          score: quizResultsTable.score,
          totalMarks: quizResultsTable.totalMarks,
          timeTaken: quizResultsTable.timeTaken,
          completedAt: quizResultsTable.completedAt,
          subjectName: subjectsTable.subjectName,
          topicTitle: topicsTable.title,
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
        .orderBy(sql`${quizResultsTable.completedAt} DESC`)
        .limit(5);

      // Format the response to match frontend expectations
      const formattedQuizzes = recentQuizzes.map(quiz => ({
        resultId: quiz.resultId,
        quizId: quiz.quizId,
        score: quiz.score, // Convert to percentage
        totalMarks: quiz.totalMarks,
        timeTaken: quiz.timeTaken,
        completedAt: quiz.completedAt,
        subject: {
          name: quiz.subjectName,
        },
        topic: {
          title: quiz.topicTitle || 'General Quiz',
        },
      }));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            formattedQuizzes,
            'Recent quizzes retrieved successfully'
          )
        );
    } catch (error) {
      console.error('Error fetching recent quizzes:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Failed to fetch recent quizzes'));
    }
  }
);

export const getAllSubjectsWithProgress = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json(new ApiResponse(401, null, 'User not authenticated'));
      }

      // Get all subjects the user is enrolled in
      const userSubjects = await db
        .select({
          subjectId: userSubjectsTable.subjectId,
          subjectName: subjectsTable.subjectName,
          level: userSubjectsTable.level,
          enrolledAt: userSubjectsTable.createdAt,
        })
        .from(userSubjectsTable)
        .innerJoin(
          subjectsTable,
          eq(userSubjectsTable.subjectId, subjectsTable.subjectId)
        )
        .where(eq(userSubjectsTable.userId, userId));

      // For each subject, get total topics and completed topics (topics with attempted quizzes)
      const subjectsWithProgress = await Promise.all(
        userSubjects.map(async subject => {
          // Get total topics for this subject
          const totalTopicsResult = await db
            .select({
              count: sql<number>`COUNT(*)`,
            })
            .from(topicsTable)
            .where(eq(topicsTable.subjectId, subject.subjectId));

          const totalTopics = Number(totalTopicsResult[0]?.count || 0);

          // Get completed topics (topics where user has attempted quiz at least once)
          const completedTopicsResult = await db
            .select({
              count: sql<number>`COUNT(DISTINCT ${topicsTable.topicId})`,
            })
            .from(topicsTable)
            .innerJoin(
              quizzesTable,
              eq(topicsTable.topicId, quizzesTable.topicId)
            )
            .where(
              sql`${topicsTable.subjectId} = ${subject.subjectId} AND ${quizzesTable.userId} = ${userId} AND ${quizzesTable.attemptCount} > 0`
            );

          const completedTopics = Number(completedTopicsResult[0]?.count || 0);

          // Calculate progress percentage
          const progressPercentage =
            totalTopics > 0
              ? Math.round((completedTopics / totalTopics) * 100)
              : 0;

          return {
            subjectId: subject.subjectId,
            subjectName: subject.subjectName,
            level: subject.level,
            enrolledAt: subject.enrolledAt,
            totalTopics,
            completedTopics,
            progressPercentage,
          };
        })
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            subjectsWithProgress,
            'Subjects with progress retrieved successfully'
          )
        );
    } catch (error) {
      console.error('Error fetching subjects with progress:', error);
      return res
        .status(500)
        .json(
          new ApiResponse(500, null, 'Failed to fetch subjects with progress')
        );
    }
  }
);
