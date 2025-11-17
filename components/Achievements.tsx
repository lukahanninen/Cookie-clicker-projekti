'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';

export default function Achievements() {
  const { achievements } = useGameStore();
  const [showAll, setShowAll] = useState(false);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const displayAchievements = showAll
    ? achievements
    : achievements.filter((a) => a.unlocked);

  return (
    <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-yellow-400">
          Achievements ({unlockedCount}/{achievements.length})
        </h2>

        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-400 hover:text-blue-300 transition font-medium"
        >
          {showAll ? 'Show Unlocked' : 'Show All'}
        </button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {displayAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-4 rounded-xl border transition-all ${
              achievement.unlocked
                ? 'border-green-500 bg-green-900/30'
                : 'border-gray-700 bg-gray-900/40 opacity-50'
            }`}
          >
            <div className="text-4xl mb-2">{achievement.icon}</div>

            <h3 className="font-semibold text-sm text-gray-100 mb-1">
              {achievement.name}
            </h3>

            <p className="text-xs text-gray-400">
              {achievement.description}
            </p>

            {achievement.unlocked && (
              <div className="mt-2 text-xs text-green-400 font-semibold">
                ✓ Unlocked
              </div>
            )}
          </div>
        ))}
      </div>

      {/* When no achievements */}
      {displayAchievements.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          Start playing to unlock achievements!
        </p>
      )}
    </div>
  );
}
