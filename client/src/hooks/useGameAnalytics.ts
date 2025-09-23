import { Axios } from '@/config/axios';
import useAuthStore from '@/store/store';
import { useCallback, useRef, useState } from 'react';

interface GameSessionData {
  gameName: string;
  duration: number;
  score: number;
  totalActions: number;
  errors: number;
}

interface GameTraits {
  cognitiveLoad: number;
  focus: number;
  attention: number;
}

interface UseGameAnalyticsReturn {
  startSession: () => void;
  trackAction: () => void;
  trackError: () => void;
  endSession: (finalScore: number) => Promise<void>;
  traits: GameTraits | null;
  isAnalyzing: boolean;
  sessionActive: boolean;
  currentStats: {
    duration: number;
    actions: number;
    errors: number;
  };
}

export const useGameAnalytics = (gameName: string): UseGameAnalyticsReturn => {
  const { accessToken, isAuthenticated } = useAuthStore();

  // State management
  const [traits, setTraits] = useState<GameTraits | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);

  // Session tracking
  const startTimeRef = useRef<number | null>(null);
  const actionsCountRef = useRef(0);
  const errorsCountRef = useRef(0);

  // Start game session
  const startSession = useCallback(() => {
    if (!isAuthenticated) return;

    startTimeRef.current = Date.now();
    actionsCountRef.current = 0;
    errorsCountRef.current = 0;
    setSessionActive(true);
    setTraits(null);

    console.log(`🎮 Game Analytics: Started tracking session for ${gameName}`);
  }, [gameName, isAuthenticated]);

  // Track user action (click, move, etc.)
  const trackAction = useCallback(() => {
    if (!sessionActive || !isAuthenticated) return;

    actionsCountRef.current += 1;
  }, [sessionActive, isAuthenticated]);

  // Track error/mistake
  const trackError = useCallback(() => {
    if (!sessionActive || !isAuthenticated) return;

    errorsCountRef.current += 1;
  }, [sessionActive, isAuthenticated]);

  // End session and analyze
  const endSession = useCallback(async (finalScore: number) => {
    if (!sessionActive || !startTimeRef.current || !isAuthenticated || !accessToken) {
      console.log('❌ Game Analytics: Cannot end session - missing requirements');
      return;
    }

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    const sessionData: GameSessionData = {
      gameName,
      duration,
      score: finalScore,
      totalActions: actionsCountRef.current,
      errors: errorsCountRef.current,
    };

    console.log('📊 Game Analytics: Sending session data:', sessionData);

    setIsAnalyzing(true);
    setSessionActive(false);

    try {
      const response = await Axios.post('/api/games/analyze', sessionData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        const gameTraits = response.data.data as GameTraits;
        setTraits(gameTraits);
        console.log('✅ Game Analytics: Traits calculated:', gameTraits);
      } else {
        console.error('❌ Game Analytics: Failed to analyze session:', response.data.message);
      }
    } catch (error: any) {
      console.error('❌ Game Analytics: Error analyzing session:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionActive, gameName, isAuthenticated, accessToken]);

  // Current session stats for debugging/display
  const currentStats = {
    duration: startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0,
    actions: actionsCountRef.current,
    errors: errorsCountRef.current,
  };

  return {
    startSession,
    trackAction,
    trackError,
    endSession,
    traits,
    isAnalyzing,
    sessionActive,
    currentStats,
  };
};
