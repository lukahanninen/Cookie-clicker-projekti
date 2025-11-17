'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/lib/store';
import CookieButton from '@/components/CookieButton';
import BuildingShop from '@/components/BuildingShop';
import UpgradeShop from '@/components/UpgradeShop';
import StatsDisplay from '@/components/StatsDisplay';
import Achievements from '@/components/Achievements';
import PrestigeModal from '@/components/PrestigeModal';
import { SAVE_INTERVAL, formatNumber } from '@/lib/gameData';
import { saveLeaderboardScore } from '@/lib/saveLeaderboard'; // <-- ADD THIS

export default function GamePage() {
  const router = useRouter();
  const { loadGame, saveGame, tick, calculateCPS, cookies, prestige } =
    useGameStore(); // <-- Get cookies + prestige

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineCookies, setOfflineCookies] = useState(0);

  /* ------------------------------ LOAD GAME ------------------------------ */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    loadGame().then(() => {
      const state = useGameStore.getState();
      const offline = state.calculateOfflineProgress(state.lastActive);

      if (offline > 0) {
        setOfflineCookies(offline);
        setShowOfflineModal(true);
      }

      calculateCPS();
    });

    const tickInterval = setInterval(() => tick(), 100);
    const saveInterval = setInterval(() => saveGame(), SAVE_INTERVAL);

    return () => {
      clearInterval(tickInterval);
      clearInterval(saveInterval);
      saveGame();
    };
  }, [loadGame, saveGame, tick, calculateCPS]);

  /* --------------------- SAVE LEADERBOARD EVERY 5 SEC -------------------- */
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      saveLeaderboardScore({
        user_id: user.id,
        username: user.email?.split('@')[0] || 'Player',
        total_cookies: cookies,
        prestige_level: prestige,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [user, cookies, prestige]);

  /* ------------------------------ LOADING UI ------------------------------ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl text-yellow-400">🍪 Loading...</div>
      </div>
    );
  }

  /* ------------------------------- GAME UI ------------------------------- */
  return (
    <div className="min-h-screen text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <CookieButton />
            <StatsDisplay />
            <Achievements />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <UpgradeShop />
            <BuildingShop />
          </div>
        </div>
      </div>

      <PrestigeModal />

      {/* --------------------------- Offline Modal -------------------------- */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-700">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-300 mb-6">
                While you were away, your buildings produced:
              </p>

              <div className="bg-gradient-to-br from-green-900/50 to-blue-900/50 rounded-lg p-6 mb-6 border border-green-700/50">
                <div className="text-5xl font-bold text-green-400">
                  +{formatNumber(offlineCookies)}
                </div>
                <div className="text-gray-300 mt-2">cookies</div>
              </div>

              <button
                onClick={() => setShowOfflineModal(false)}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-500 hover:to-blue-500 transition-all"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
