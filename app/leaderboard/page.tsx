'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LeaderboardEntry } from '@/types/game';
import { formatNumber } from '@/lib/gameData';

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('total_cookies', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading leaderboard:', error);
      return;
    }

    if (data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLeaderboard();

    // Real-time subscription to leaderboard changes
    const channel = supabase
      .channel('public:leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        (payload) => {
          console.log('Leaderboard update received:', payload);
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl text-yellow-400">🏆 Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Table */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🏆</span>
            <h1 className="text-3xl font-bold text-yellow-400">Leaderboard</h1>
          </div>
          <button
            onClick={() => router.push('/game')}
            className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors font-semibold"
          >
            ← Back to Game
          </button>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          {entries.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <div className="text-6xl mb-4">🍪</div>
              <p className="text-xl">No players on the leaderboard yet!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-yellow-600 to-amber-600">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Rank</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Player</th>
                    <th className="px-6 py-4 text-right font-bold text-gray-900">Total Cookies</th>
                    <th className="px-6 py-4 text-center font-bold text-gray-900">Prestige</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr
                      key={entry.user_id || index}
                      className={`border-b border-gray-700 hover:bg-gray-700 transition-colors ${
                        index < 3 ? 'bg-gray-750' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          <span className="font-bold text-gray-300">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-200">{entry.username}</td>
                      <td className="px-6 py-4 text-right font-bold text-yellow-400">
                        {formatNumber(entry.total_cookies)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full font-semibold border border-purple-700">
                          <span>⭐</span>
                          <span>{entry.prestige_level}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}