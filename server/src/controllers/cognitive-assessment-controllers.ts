import { and, eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { cognitiveAssessmentsTable, quizQuestionsTable, quizzesTable } from '../db/schema';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface QuizResultData {
  quizId: string;
  score: number;
  timeTaken: number;
  weaknesses: Array<{
    question: string;
    yourAnswer: string;
    correctAnswer: string;
    difficulty: string;
  }>;
}

export const generateCognitiveAssessment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, 'User not authenticated'));
    }

    const { quizId, score, timeTaken, weaknesses } = req.body as QuizResultData;

    if (!quizId || score === undefined || timeTaken === undefined || !weaknesses) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, 'Missing required fields: quizId, score, timeTaken, weaknesses'));
    }

    // Verify quiz exists and belongs to user
    const quiz = await db
      .select()
      .from(quizzesTable)
      .where(and(eq(quizzesTable.quizId, quizId), eq(quizzesTable.userId, userId)))
      .limit(1);

    if (!quiz.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, 'Quiz not found or access denied'));
    }

    // Get all quiz questions with difficulty levels
    const quizQuestions = await db
      .select({
        difficulty: quizQuestionsTable.difficulty,
      })
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quizId, quizId));

    if (!quizQuestions.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, 'No questions found for this quiz'));
    }

    // Calculate weighted score based on difficulty levels
    const weightedScore = calculateWeightedScore(quizQuestions, weaknesses, score);

    // Generate cognitive scores using LLM
    const cognitiveScores = await generateCognitiveScoresWithLLM({
      score,
      timeTaken,
      totalQuestions: quizQuestions.length,
      weaknesses,
      weightedScore,
    });

    // Save cognitive assessment to database
    const assessmentId = uuidv4();
    await db.insert(cognitiveAssessmentsTable).values({
      assessmentId,
      userId,
      quizId,
      weightedScore: weightedScore.toString(),
      stressScore: cognitiveScores.stressScore,
      attentionScore: cognitiveScores.attentionScore,
      cognitiveScore: cognitiveScores.cognitiveScore,
    });

    return res.status(200).json(
      new ApiResponse(200, {
        assessmentId,
        weightedScore,
        stressScore: cognitiveScores.stressScore,
        attentionScore: cognitiveScores.attentionScore,
        cognitiveScore: cognitiveScores.cognitiveScore,
      }, 'Cognitive assessment generated successfully')
    );
  } catch (error: any) {
    console.error('Error generating cognitive assessment:', error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Error generating cognitive assessment'));
  }
});

// Calculate weighted score based on difficulty levels (3-hard, 2-medium, 1-easy)
const calculateWeightedScore = (
  questions: Array<{ difficulty: string }>,
  weaknesses: Array<{ difficulty: string }>,
  score: number
): number => {
  // Calculate total possible weighted points
  let totalWeightedPoints = 0;
  const difficultyWeights = { hard: 3, medium: 2, easy: 1 };

  questions.forEach(question => {
    const difficulty = question.difficulty.toLowerCase() as keyof typeof difficultyWeights;
    totalWeightedPoints += difficultyWeights[difficulty] || 1;
  });

  // Calculate points lost from incorrect answers
  let lostWeightedPoints = 0;
  weaknesses.forEach(weakness => {
    const difficulty = weakness.difficulty.toLowerCase() as keyof typeof difficultyWeights;
    lostWeightedPoints += difficultyWeights[difficulty] || 1;
  });

  // Calculate earned weighted points
  const earnedWeightedPoints = totalWeightedPoints - lostWeightedPoints;

  // Calculate weighted score as percentage
  const weightedScore = (earnedWeightedPoints / totalWeightedPoints) * 100;

  return Math.round(weightedScore * 100) / 100; // Round to 2 decimal places
};

// Generate cognitive scores using OpenAI LLM
const generateCognitiveScoresWithLLM = async (data: {
  score: number;
  timeTaken: number;
  totalQuestions: number;
  weaknesses: Array<{ question: string; yourAnswer: string; correctAnswer: string; difficulty: string }>;
  weightedScore: number;
}): Promise<{ stressScore: number; attentionScore: number; cognitiveScore: number }> => {
  try {
    const prompt = `
Based on the following quiz performance data, analyze and provide cognitive assessment scores on a scale of 0-100:

Quiz Performance:
- Score: ${data.score}%
- Weighted Score (considering difficulty): ${data.weightedScore}%
- Time Taken: ${data.timeTaken} seconds for ${data.totalQuestions} questions
- Average time per question: ${Math.round(data.timeTaken / data.totalQuestions)} seconds
- Number of mistakes: ${data.weaknesses.length}

Mistakes by difficulty:
${data.weaknesses.map(w => `- ${w.difficulty}: "${w.question}"`).join('\n')}

Please analyze this data and provide three scores (0-100 scale):

1. STRESS SCORE: How much stress/pressure the student likely experienced
   - Consider time pressure, number of mistakes, difficulty of missed questions
   - Higher score = more stress indicators
   - Factors: rushing (very fast completion), many mistakes on easy questions, inconsistent performance

2. ATTENTION SCORE: How well the student maintained focus and attention
   - Consider consistency, type of mistakes, time management
   - Higher score = better attention
   - Factors: consistent performance, appropriate time per question, fewer careless errors

3. COGNITIVE SCORE: Overall cognitive performance considering difficulty weighting
   - Consider weighted score, complexity of questions answered correctly/incorrectly
   - Higher score = better cognitive performance
   - Factors: handling of difficult questions, reasoning ability, knowledge application

Respond ONLY with a JSON object in this exact format:
{
  "stressScore": <number 0-100>,
  "attentionScore": <number 0-100>,
  "cognitiveScore": <number 0-100>
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an educational psychologist specializing in cognitive assessment. Analyze quiz performance data and provide accurate psychological scores.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const scores = JSON.parse(content);

    // Validate scores are within range
    const validateScore = (score: number): number => {
      return Math.max(0, Math.min(100, Math.round(score)));
    };

    return {
      stressScore: validateScore(scores.stressScore),
      attentionScore: validateScore(scores.attentionScore),
      cognitiveScore: validateScore(scores.cognitiveScore),
    };
  } catch (error) {
    console.error('Error generating cognitive scores with LLM:', error);

    // Fallback: Generate basic scores based on performance metrics
    const avgTimePerQuestion = data.timeTaken / data.totalQuestions;
    const expectedTimePerQuestion = 60; // 1 minute per question

    const stressScore = Math.min(100, Math.max(0,
      50 +
      (data.weaknesses.length / data.totalQuestions) * 30 + // More mistakes = more stress
      (avgTimePerQuestion < expectedTimePerQuestion * 0.5 ? 20 : 0) // Rushed = more stress
    ));

    const attentionScore = Math.min(100, Math.max(0,
      80 - (data.weaknesses.length / data.totalQuestions) * 50 + // Fewer mistakes = better attention
      (avgTimePerQuestion > expectedTimePerQuestion * 0.3 && avgTimePerQuestion < expectedTimePerQuestion * 1.5 ? 20 : 0)
    ));

    const cognitiveScore = Math.min(100, Math.max(0, data.weightedScore));

    return {
      stressScore: Math.round(stressScore),
      attentionScore: Math.round(attentionScore),
      cognitiveScore: Math.round(cognitiveScore),
    };
  }
};

export const getCognitiveAssessment = asyncHandler(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { quizId } = req.params;

    if (!userId) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, 'User not authenticated'));
    }

    const assessment = await db
      .select()
      .from(cognitiveAssessmentsTable)
      .where(
        and(
          eq(cognitiveAssessmentsTable.userId, userId),
          eq(cognitiveAssessmentsTable.quizId, quizId)
        )
      )
      .limit(1);

    if (!assessment.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, 'Cognitive assessment not found'));
    }

    return res.status(200).json(
      new ApiResponse(200, assessment[0], 'Cognitive assessment retrieved successfully')
    );
  } catch (error: any) {
    console.error('Error fetching cognitive assessment:', error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, 'Error fetching cognitive assessment'));
  }
});
