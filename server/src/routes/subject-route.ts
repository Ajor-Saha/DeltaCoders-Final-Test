import { Router } from 'express';
import {
  addUserSubject,
  fixMissingQuizSubjectIds,
  getAllSubjects,
  getSubjectById,
  getSubjectProgress,
  getUserSubjects,
  removeUserSubject,
  updateUserSubjectLevel,
} from '../controllers/subject-controllers';
import { verifyJWT } from '../middleware/auth-middleware';

const subject_router = Router();

// Public routes
subject_router.route('/all').get(getAllSubjects);
subject_router.route('/fix-quiz-subjects').post(fixMissingQuizSubjectIds);

// Protected routes (require authentication)
subject_router.route('/add-subject').post(verifyJWT, addUserSubject);
subject_router.route('/user-subject').get(verifyJWT, getUserSubjects);
// Subject progress for the authenticated user
subject_router.route('/progress/:subjectId').get(verifyJWT, getSubjectProgress);
subject_router.route('/:subjectId').get(getSubjectById);
subject_router
  .route('/remove/:userSubjectId')
  .delete(verifyJWT, removeUserSubject);
subject_router
  .route('/update-level/:userSubjectId')
  .patch(verifyJWT, updateUserSubjectLevel);

export default subject_router;
