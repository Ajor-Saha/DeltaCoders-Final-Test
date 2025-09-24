import { and, eq, isNull, sql } from 'drizzle-orm';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { quizzesTable } from '../db/schema/tbl-quizzes';
import { subjectsTable } from '../db/schema/tbl-subjects';
import { topicsTable } from '../db/schema/tbl-topics';
import { userSubjectsTable } from '../db/schema/tbl-user-subjects';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

export const addUserSubject = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Ensure the authenticated user exists
      const authUser = req.user;
      if (!authUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const { subjectName, level } = req.body;

      // Validate required fields
      if (!subjectName || subjectName.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject name is required'));
      }

      // Validate level if provided
      const validLevels = ['beginner', 'intermediate', 'advanced'];
      if (level && !validLevels.includes(level)) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'Level must be beginner, intermediate, or advanced'
            )
          );
      }

      const trimmedSubjectName = subjectName.trim();
      const userLevel = level || 'beginner'; // Default to beginner if not provided

      // Check if subject already exists
      const existingSubject = await db
        .select()
        .from(subjectsTable)
        .where(eq(subjectsTable.subjectName, trimmedSubjectName))
        .limit(1);

      let subjectId: string;

      if (existingSubject.length > 0) {
        // Subject exists, use existing subject ID
        subjectId = existingSubject[0].subjectId;
      } else {
        // Subject doesn't exist, create new subject
        subjectId = uuidv4();

        await db.insert(subjectsTable).values({
          subjectId: subjectId,
          subjectName: trimmedSubjectName,
        });
      }

      // Check if user-subject relationship already exists
      const existingUserSubject = await db
        .select()
        .from(userSubjectsTable)
        .where(
          and(
            eq(userSubjectsTable.userId, authUser.userId),
            eq(userSubjectsTable.subjectId, subjectId)
          )
        )
        .limit(1);

      if (existingUserSubject.length > 0) {
        // User-subject relationship exists, update the level
        const [updatedUserSubject] = await db
          .update(userSubjectsTable)
          .set({ level: userLevel as 'beginner' | 'intermediate' | 'advanced' })
          .where(
            and(
              eq(userSubjectsTable.userId, authUser.userId),
              eq(userSubjectsTable.subjectId, subjectId)
            )
          )
          .returning();

        return res.status(200).json(
          new ApiResponse(
            200,
            {
              userSubject: updatedUserSubject,
              subjectName: trimmedSubjectName,
            },
            'User subject level updated successfully'
          )
        );
      } else {
        // Create new user-subject relationship
        const newUserSubject = {
          id: uuidv4(),
          userId: authUser.userId,
          subjectId: subjectId,
          level: userLevel as 'beginner' | 'intermediate' | 'advanced',
        };

        const [createdUserSubject] = await db
          .insert(userSubjectsTable)
          .values(newUserSubject)
          .returning();

        return res.status(201).json(
          new ApiResponse(
            201,
            {
              userSubject: createdUserSubject,
              subjectName: trimmedSubjectName,
              isNewSubject: existingSubject.length === 0,
            },
            `Subject ${
              existingSubject.length === 0 ? 'created and ' : ''
            }added to user successfully`
          )
        );
      }
    } catch (error) {
      console.error('Error adding user subject:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const getUserSubjects = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Ensure the authenticated user exists
      const authUser = req.user;
      if (!authUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      // Get all user subjects with subject details
      const userSubjects = await db
        .select({
          id: userSubjectsTable.id,
          userId: userSubjectsTable.userId,
          subjectId: userSubjectsTable.subjectId,
          level: userSubjectsTable.level,
          createdAt: userSubjectsTable.createdAt,
          updatedAt: userSubjectsTable.updatedAt,
          subject: {
            subjectId: subjectsTable.subjectId,
            subjectName: subjectsTable.subjectName,
          },
        })
        .from(userSubjectsTable)
        .innerJoin(
          subjectsTable,
          eq(userSubjectsTable.subjectId, subjectsTable.subjectId)
        )
        .where(eq(userSubjectsTable.userId, authUser.userId));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            userSubjects,
            'User subjects retrieved successfully'
          )
        );
    } catch (error) {
      console.error('Error retrieving user subjects:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const removeUserSubject = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Ensure the authenticated user exists
      const authUser = req.user;
      if (!authUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const { userSubjectId } = req.params;

      // Validate userSubjectId
      if (!userSubjectId || userSubjectId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'User subject ID is required'));
      }

      // Check if user-subject relationship exists and belongs to the authenticated user
      const existingUserSubject = await db
        .select()
        .from(userSubjectsTable)
        .where(
          and(
            eq(userSubjectsTable.id, userSubjectId),
            eq(userSubjectsTable.userId, authUser.userId)
          )
        )
        .limit(1);

      if (existingUserSubject.length === 0) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              {},
              'User subject not found or does not belong to you'
            )
          );
      }

      // Delete the user-subject relationship
      await db
        .delete(userSubjectsTable)
        .where(
          and(
            eq(userSubjectsTable.id, userSubjectId),
            eq(userSubjectsTable.userId, authUser.userId)
          )
        );

      return res
        .status(200)
        .json(
          new ApiResponse(200, {}, 'Subject removed from user successfully')
        );
    } catch (error) {
      console.error('Error removing user subject:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const updateUserSubjectLevel = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Ensure the authenticated user exists
      const authUser = req.user;
      if (!authUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const { userSubjectId } = req.params;
      const { level } = req.body;

      // Validate required fields
      if (!userSubjectId || userSubjectId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'User subject ID is required'));
      }

      if (!level || level.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Level is required'));
      }

      // Validate level
      const validLevels = ['beginner', 'intermediate', 'advanced'];
      if (!validLevels.includes(level)) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              'Level must be beginner, intermediate, or advanced'
            )
          );
      }

      // Check if user-subject relationship exists and belongs to the authenticated user
      const existingUserSubject = await db
        .select()
        .from(userSubjectsTable)
        .where(
          and(
            eq(userSubjectsTable.id, userSubjectId),
            eq(userSubjectsTable.userId, authUser.userId)
          )
        )
        .limit(1);

      if (existingUserSubject.length === 0) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              {},
              'User subject not found or does not belong to you'
            )
          );
      }

      // Update the level
      const [updatedUserSubject] = await db
        .update(userSubjectsTable)
        .set({ level: level as 'beginner' | 'intermediate' | 'advanced' })
        .where(
          and(
            eq(userSubjectsTable.id, userSubjectId),
            eq(userSubjectsTable.userId, authUser.userId)
          )
        )
        .returning();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { userSubject: updatedUserSubject },
            'User subject level updated successfully'
          )
        );
    } catch (error) {
      console.error('Error updating user subject level:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const getAllSubjects = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get all subjects from the database
      const subjects = await db.select().from(subjectsTable);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { subjects, totalSubjects: subjects.length },
            'All subjects retrieved successfully'
          )
        );
    } catch (error) {
      console.error('Error retrieving subjects:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const getSubjectById = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;

      // Validate subjectId
      if (!subjectId || subjectId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject ID is required'));
      }

      // Get subject by ID with topics (title and description)
      const subjectWithTopics = await db
        .select({
          subjectId: subjectsTable.subjectId,
          subjectName: subjectsTable.subjectName,
          createdAt: subjectsTable.createdAt,
          updatedAt: subjectsTable.updatedAt,
          topics: {
            topicId: topicsTable.topicId,
            title: topicsTable.title,
            description: topicsTable.description,
            difficulty: topicsTable.difficulty,
          },
        })
        .from(subjectsTable)
        .leftJoin(
          topicsTable,
          eq(subjectsTable.subjectId, topicsTable.subjectId)
        )
        .where(eq(subjectsTable.subjectId, subjectId));

      if (subjectWithTopics.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, {}, 'Subject not found'));
      }

      // Group topics by subject
      const subject = {
        subjectId: subjectWithTopics[0].subjectId,
        subjectName: subjectWithTopics[0].subjectName,
        createdAt: subjectWithTopics[0].createdAt,
        updatedAt: subjectWithTopics[0].updatedAt,
        topics: subjectWithTopics
          .filter(row => row.topics && row.topics.topicId)
          .map(row => row.topics),
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            subject,
            'Subject details with topics retrieved successfully'
          )
        );
    } catch (error) {
      console.error('Error retrieving subject:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

export const fixMissingQuizSubjectIds = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      console.log('Starting to fix missing subjectId in quizzes...');

      // Find all quizzes where subjectId is null but topicId exists
      const quizzesWithMissingSubjectId = await db
        .select({
          quizId: quizzesTable.quizId,
          topicId: quizzesTable.topicId,
          userId: quizzesTable.userId,
        })
        .from(quizzesTable)
        .where(
          and(
            isNull(quizzesTable.subjectId),
            eq(quizzesTable.topicId, quizzesTable.topicId) // Ensure topicId exists
          )
        );

      console.log(
        `Found ${quizzesWithMissingSubjectId.length} quizzes with missing subjectId`
      );

      if (quizzesWithMissingSubjectId.length === 0) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { updatedCount: 0 },
              'No quizzes found with missing subjectId'
            )
          );
      }

      let updatedCount = 0;
      const updatePromises = [];

      // For each quiz with missing subjectId
      for (const quiz of quizzesWithMissingSubjectId) {
        if (quiz.topicId) {
          // Find the subjectId through topicId
          const topicResult = await db
            .select({
              subjectId: topicsTable.subjectId,
            })
            .from(topicsTable)
            .where(eq(topicsTable.topicId, quiz.topicId))
            .limit(1);

          if (topicResult.length > 0) {
            const subjectId = topicResult[0].subjectId;

            // Update the quiz with the correct subjectId
            const updatePromise = db
              .update(quizzesTable)
              .set({ subjectId: subjectId })
              .where(eq(quizzesTable.quizId, quiz.quizId));

            updatePromises.push(updatePromise);
            updatedCount++;

            console.log(
              `✅ Quiz ${quiz.quizId} mapped to subject ${subjectId} via topic ${quiz.topicId}`
            );
          } else {
            console.log(
              `❌ Topic ${quiz.topicId} not found for quiz ${quiz.quizId}`
            );
          }
        }
      }

      // Execute all updates
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(
          `✅ Successfully updated ${updatedCount} quizzes with missing subjectId`
        );
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            totalFound: quizzesWithMissingSubjectId.length,
            updatedCount: updatedCount,
            skippedCount: quizzesWithMissingSubjectId.length - updatedCount,
          },
          `Successfully fixed ${updatedCount} quizzes with missing subjectId`
        )
      );
    } catch (error) {
      console.error('Error fixing missing quiz subjectIds:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);

// Get per-subject progress for the authenticated user
export const getSubjectProgress = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const authUser = req.user;
      if (!authUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, {}, 'Not authenticated'));
      }

      const { subjectId } = req.params;
      if (!subjectId || subjectId.trim() === '') {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Subject ID is required'));
      }

      // Fetch all topics under this subject
      const subjectTopics = await db
        .select({ topicId: topicsTable.topicId })
        .from(topicsTable)
        .where(eq(topicsTable.subjectId, subjectId));

      const totalTopics = subjectTopics.length;

      // Find distinct topicIds where the user has attempted (attemptCount > 0) a quiz for this subject
      // Note: This relies on quizzes.subjectId being set. Use fixMissingQuizSubjectIds to backfill if needed.
      const attemptedRows = await db
        .select({ topicId: quizzesTable.topicId })
        .from(quizzesTable)
        .where(
          and(
            eq(quizzesTable.userId, authUser.userId),
            eq(quizzesTable.subjectId, subjectId),
            // drizzle-orm doesn't have a universal gt import in older versions; use raw SQL for safety
            // attempt_count > 0
            // @ts-ignore - sql boolean expression
            sql`${quizzesTable.attemptCount} > 0`,
            // Ensure topicId is not null
            // @ts-ignore - sql boolean expression
            sql`${quizzesTable.topicId} IS NOT NULL`
          )
        )
        .groupBy(quizzesTable.topicId);

      const completedTopicIds = Array.from(
        new Set((attemptedRows || []).map(r => r.topicId).filter(Boolean))
      ) as string[];

      const response = {
        subject_id: subjectId,
        total_topics: totalTopics,
        total_completed_topics: completedTopicIds.length,
        completed_topics: completedTopicIds,
      };

      return res
        .status(200)
        .json(new ApiResponse(200, response, 'Subject progress retrieved'));
    } catch (error) {
      console.error('Error getting subject progress:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Internal server error'));
    }
  }
);
