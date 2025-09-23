import { and, eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { subjectsTable } from '../db/schema/tbl-subjects';
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
            { userSubjects, totalSubjects: userSubjects.length },
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
