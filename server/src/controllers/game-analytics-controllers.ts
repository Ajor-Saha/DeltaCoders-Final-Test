import { and, desc, eq } from 'drizzle-orm';
import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { gameAnalyticsTable } from '../db/schema/tbl-game-analytics';
import { ApiResponse } from '../utils/api-response';
import { asyncHandler } from '../utils/asyncHandler';

// Calculate traits based on game data
const calculateTraits = (gameData: {
  duration: number;
  score: number;
  totalActions: number;
  errors: number;
}) => {
  const { duration, score, totalActions, errors } = gameData;

  // Cognitive Load: Based on error rate (higher errors = higher cognitive load)
  const errorRate = totalActions > 0 ? errors / totalActions : 0;
  const cognitiveLoad = Math.min(
    100,
    Math.max(0, Math.min(100, Math.round(errorRate * 100 + 20)))
  );

  // Focus: Based on score efficiency (higher score in less time = better focus)
  const scorePerSecond = duration > 0 ? score / duration : 0;
  const focus = Math.min(
    100,
    Math.max(0, Math.round(scorePerSecond * 10 + 50))
  );

  // Attention: Based on action consistency (steady action rate = good attention)
  const actionsPerSecond = duration > 0 ? totalActions / duration : 0;
  const attention = Math.min(
    100,
    Math.max(0, Math.round(actionsPerSecond * 30 + 40))
  );

  return {
    cognitiveLoad: 100 - cognitiveLoad, // Invert so lower errors = lower cognitive load
    focus,
    attention,
  };
};

export const analyzeGameSession = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { gameName, duration, score, totalActions, errors } = req.body;
      const userId = req.user?.userId;

      // Validate required fields
      if (
        !gameName ||
        duration === undefined ||
        score === undefined ||
        totalActions === undefined ||
        errors === undefined
      ) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'All game data fields are required'));
      }

      // Validate game name
      const validGameNames = ['bug-smash', 'color-match', 'maze-escape'];
      if (!validGameNames.includes(gameName)) {
        return res
          .status(400)
          .json(new ApiResponse(400, {}, 'Invalid game name'));
      }

      // Calculate traits
      const traits = calculateTraits({ duration, score, totalActions, errors });

      // Save game session to database
      await db
        .insert(gameAnalyticsTable)
        .values({
          id: nanoid(),
          userId: userId!,
          gameName,
          duration,
          score,
          totalActions,
          errors,
          cognitiveLoad: traits.cognitiveLoad,
          focus: traits.focus,
          attention: traits.attention,
        })
        .returning();

      return res
        .status(200)
        .json(
          new ApiResponse(200, traits, 'Game session analyzed successfully')
        );
    } catch (error) {
      console.error('Error analyzing game session:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Internal server error'));
    }
  }
);

export const getUserGameHistory = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      const { gameType, limit = 10 } = req.query;

      let whereConditions = eq(gameAnalyticsTable.userId, userId!);

      // Filter by game type if provided
      if (gameType && typeof gameType === 'string') {
        whereConditions = and(
          eq(gameAnalyticsTable.userId, userId!),
          eq(gameAnalyticsTable.gameName, gameType)
        )!;
      }

      const sessions = await db
        .select()
        .from(gameAnalyticsTable)
        .where(whereConditions)
        .orderBy(desc(gameAnalyticsTable.createdAt))
        .limit(Number(limit));

      return res
        .status(200)
        .json(
          new ApiResponse(200, sessions, 'Game history retrieved successfully')
        );
    } catch (error) {
      console.error('Error fetching game history:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Internal server error'));
    }
  }
);

export const getUserTraitsSummary = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      // Get recent sessions (last 10)
      const recentSessions = await db
        .select()
        .from(gameAnalyticsTable)
        .where(eq(gameAnalyticsTable.userId, userId!))
        .orderBy(desc(gameAnalyticsTable.createdAt))
        .limit(10);

      if (recentSessions.length === 0) {
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              cognitiveLoad: 0,
              focus: 0,
              attention: 0,
              sessionCount: 0,
            },
            'No game sessions found'
          )
        );
      }

      // Calculate average traits
      const avgCognitiveLoad = Math.round(
        recentSessions.reduce(
          (sum, session) => sum + session.cognitiveLoad,
          0
        ) / recentSessions.length
      );
      const avgFocus = Math.round(
        recentSessions.reduce((sum, session) => sum + session.focus, 0) /
          recentSessions.length
      );
      const avgAttention = Math.round(
        recentSessions.reduce((sum, session) => sum + session.attention, 0) /
          recentSessions.length
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            cognitiveLoad: avgCognitiveLoad,
            focus: avgFocus,
            attention: avgAttention,
            sessionCount: recentSessions.length,
          },
          'Traits summary retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Error fetching traits summary:', error);
      return res
        .status(500)
        .json(new ApiResponse(500, {}, 'Internal server error'));
    }
  }
);
