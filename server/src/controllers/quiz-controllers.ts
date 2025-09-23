import { GoogleGenAI } from '@google/genai';
import { eq, sql } from 'drizzle-orm';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
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
