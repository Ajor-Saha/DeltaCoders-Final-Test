import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { eq, sql } from 'drizzle-orm';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { cognitiveAssessmentsTable } from '../db/schema/tbl-cognitive-assessments';
import { quizQuestionsTable } from '../db/schema/tbl-quiz-questions';
import { quizResultsTable } from '../db/schema/tbl-quiz-results';
import { quizzesTable } from '../db/schema/tbl-quizzes';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { quizId, answers, timeTaken } = req.body;

    if (!quizId || !answers || typeof timeTaken !== 'number') {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'Missing required fields'));
    }

    // Get quiz questions from database
    const questions = await db
      .select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quizId, quizId));

    if (!questions.length) {
      return res.status(404).json(new ApiResponse(404, null, 'Quiz not found'));
    }

    // Calculate score and update user choices
    let correctCount = 0;
    const weaknesses = [];
    const strengths = [];

    // Update each question with user's choice and track performance
    for (const [questionId, userChoice] of Object.entries(answers)) {
      const question = questions.find(q => q.questionId === questionId);
      if (question) {
        const isCorrect = userChoice === question.correctAnswer;
        if (isCorrect) {
          correctCount++;
          strengths.push(question.question);
        } else {
          weaknesses.push({
            question: question.question,
            userChoice: userChoice as string,
            correctAnswer: question.correctAnswer,
            difficulty: question.difficulty,
          });
        }

        // Update question with user's choice
        await db
          .update(quizQuestionsTable)
          .set({ userChoice: userChoice as string })
          .where(eq(quizQuestionsTable.questionId, questionId));
      }
    }
    const score = Math.round((correctCount / questions.length) * 100);

    // Generate AI feedback
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const feedbackPrompt = `As an educational AI, analyze this quiz performance and provide constructive feedback:

    Score: ${score}%
    Total Questions: ${questions.length}
    Correct Answers: ${correctCount}
    Time Taken: ${Math.round(timeTaken / 60)} minutes

    Strengths:
    ${strengths.map(s => '- ' + s).join('\n')}

    Areas for Improvement:
    ${weaknesses
      .map(
        w => `- Question: ${w.question}
      Your Answer: ${w.userChoice}
      Correct Answer: ${w.correctAnswer}`
      )
      .join('\n')}

    Please provide:
    1. A brief assessment of the performance
    2. Specific areas where the student showed strength
    3. Topics that need more attention
    4. Constructive suggestions for improvement
    Keep the feedback encouraging and actionable.`;

    const feedbackResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: feedbackPrompt,
    });

    const feedback = feedbackResponse.text;

    // Save quiz result
    const resultId = uuidv4();
    await db.insert(quizResultsTable).values({
      resultId,
      quizId,
      score,
      totalMarks: questions.length,
      timeTaken,
      summary: feedback,
    });

    // Update quiz attempt count
    await db
      .update(quizzesTable)
      .set({
        attemptCount: sql`${quizzesTable.attemptCount} + 1`,
      })
      .where(eq(quizzesTable.quizId, quizId));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          resultId,
          score,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          timeTaken,
          feedback,
          weaknesses: weaknesses.map(w => ({
            question: w.question,
            yourAnswer: w.userChoice,
            correctAnswer: w.correctAnswer,
            difficulty: w.difficulty,
          })),
        },
        'Quiz submitted successfully'
      )
    );
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Error submitting quiz'));
  }
});

export const analyzeQuizMentalStatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const url = process.env.MENTAL_STATUS_URL;
      if (!url) {
        return res
          .status(500)
          .json(
            new ApiResponse(500, null, 'MENTAL_STATUS_URL is not configured')
          );
      }

      const payload = { quiz_data: req.body.quiz_data };

      // Basic validation for expected fields (non-blocking; pass-through if missing)
      if (!payload || typeof payload !== 'object') {
        return res
          .status(400)
          .json(new ApiResponse(400, null, 'Invalid payload'));
      }

      const agentResp = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000,
      });

      let data: any = agentResp?.data;
      let normalized: any = null;

      try {
        if (typeof data === 'string') {
          normalized = JSON.parse(data);
        } else if (
          data?.result?.Output &&
          typeof data.result.Output === 'string'
        ) {
          normalized = JSON.parse(data.result.Output);
        }
      } catch (e) {
        // If parsing fails, we'll pass through the original data
        normalized = null;
      }

      // If the normalized object appears to contain the expected scores, persist and return it directly
      if (
        normalized &&
        typeof normalized === 'object' &&
        ('weighted_score' in normalized ||
          'attention_score' in normalized ||
          'stress_score' in normalized ||
          'cognitive_load_score' in normalized)
      ) {
        const quizId = req.body?.quiz_id as string | undefined;
        const userId = (req as any)?.user?.userId as string | undefined;
        try {
          if (quizId && userId) {
            await db.insert(cognitiveAssessmentsTable).values({
              assessmentId: uuidv4(),
              userId,
              quizId,
              weightedScore: String(normalized.weighted_score ?? 0),
              attentionScore: Number(normalized.attention_score ?? 0),
              stressScore: Number(normalized.stress_score ?? 0),
              cognitiveScore: Number(normalized.cognitive_load_score ?? 0),
            });
          }
        } catch (e) {
          console.error('Failed to store mental status:', e);
        }
        return res
          .status(200)
          .json(new ApiResponse(200, normalized, 'Mental status computed'));
      }

      // Otherwise, return the raw agent response data so the client can handle it
      // Try to persist if data already matches the scores shape
      try {
        const quizId = req.body?.quiz_id as string | undefined;
        const userId = (req as any)?.user?.userId as string | undefined;
        const d: any = data;
        if (
          d &&
          typeof d === 'object' &&
          ('weighted_score' in d ||
            'attention_score' in d ||
            'stress_score' in d ||
            'cognitive_load_score' in d) &&
          quizId &&
          userId
        ) {
          await db.insert(cognitiveAssessmentsTable).values({
            assessmentId: uuidv4(),
            userId,
            quizId,
            weightedScore: String(d.weighted_score ?? 0),
            attentionScore: Number(d.attention_score ?? 0),
            stressScore: Number(d.stress_score ?? 0),
            cognitiveScore: Number(d.cognitive_load_score ?? 0),
          });
        }
      } catch (e) {
        console.error('Failed to store mental status (raw):', e);
      }

      return res
        .status(200)
        .json(new ApiResponse(200, data, 'Mental status computed'));
    } catch (error: any) {
      console.error(
        'Error analyzing mental status:',
        error?.response?.data || error?.message || error
      );
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Failed to analyze mental status'));
    }
  }
);

export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;

    if (!quizId) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'Quiz ID is required'));
    }

    // Check if quiz exists
    const existingQuiz = await db
      .select()
      .from(quizzesTable)
      .where(eq(quizzesTable.quizId, quizId))
      .limit(1);

    if (!existingQuiz.length) {
      return res.status(404).json(new ApiResponse(404, null, 'Quiz not found'));
    }

    // Start transaction to delete all related data
    await db.transaction(async tx => {
      // Delete cognitive assessments related to this quiz
      await tx
        .delete(cognitiveAssessmentsTable)
        .where(eq(cognitiveAssessmentsTable.quizId, quizId));

      // Delete quiz results
      await tx
        .delete(quizResultsTable)
        .where(eq(quizResultsTable.quizId, quizId));

      // Delete quiz questions
      await tx
        .delete(quizQuestionsTable)
        .where(eq(quizQuestionsTable.quizId, quizId));

      // Finally delete the quiz itself
      await tx.delete(quizzesTable).where(eq(quizzesTable.quizId, quizId));
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { deletedQuizId: quizId },
          'Quiz and all related data deleted successfully'
        )
      );
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Error deleting quiz'));
  }
});

export const getQuizResults = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { quizId } = req.params;

      if (!quizId) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, 'Quiz ID is required'));
      }

      // Get quiz results with quiz details
      const results = await db
        .select({
          resultId: quizResultsTable.resultId,
          score: quizResultsTable.score,
          totalMarks: quizResultsTable.totalMarks,
          timeTaken: quizResultsTable.timeTaken,
          summary: quizResultsTable.summary,
          createdAt: quizResultsTable.createdAt,
          quizId: quizzesTable.quizId,
          topicId: quizzesTable.topicId,
          subjectId: quizzesTable.subjectId,
        })
        .from(quizResultsTable)
        .innerJoin(
          quizzesTable,
          eq(quizResultsTable.quizId, quizzesTable.quizId)
        )
        .where(eq(quizResultsTable.quizId, quizId))
        .orderBy(sql`${quizResultsTable.createdAt} DESC`);

      // Get cognitive assessments if available
      const cognitiveAssessments = await db
        .select()
        .from(cognitiveAssessmentsTable)
        .where(eq(cognitiveAssessmentsTable.quizId, quizId));

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            results,
            cognitiveAssessments,
            totalAttempts: results.length,
          },
          'Quiz results retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Error getting quiz results:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, 'Error retrieving quiz results'));
    }
  }
);
