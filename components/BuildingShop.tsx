'use client';

import { useGameStore } from '@/lib/store';
import { calculateBuildingCost, formatNumber } from '@/lib/gameData';

export default function BuildingShop() {
  const { cookies, buildings, buyBuilding } = useGameStore();

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <h2 className="text-3xl font-bold text-yellow-400 mb-6">Buildings</h2>
      
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {buildings.map((building) => {
          const cost = calculateBuildingCost(building);
          const canAfford = cookies >= cost;
          const production = building.baseProduction * building.count;

          return (
            <button
              key={building.id}
              onClick={() => buyBuilding(building.id)}
              disabled={!canAfford}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                canAfford
                  ? 'border-yellow-500/50 bg-gray-700 hover:bg-gray-600 hover:border-yellow-500 hover:scale-102 cursor-pointer'
                  : 'border-gray-700 bg-gray-900/50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">{building.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-100">
                        {building.name}
                      </h3>
                      <p className="text-sm text-gray-400">{building.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-yellow-400 font-semibold">
                      Cost: {formatNumber(cost)}
                    </span>
                    <span className="text-purple-400">
                      Produces: {building.baseProduction}/s
                    </span>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-gray-200">
                    {building.count}
                  </div>
                  {production > 0 && (
                    <div className="text-xs text-green-400">
                      {formatNumber(production)}/s
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}