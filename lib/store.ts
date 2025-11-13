import { create } from "zustand";
import { GameState } from "@/types/game";
import {
  INITIAL_BUILDINGS,
  INITIAL_UPGRADES,
  INITIAL_ACHIEVEMENTS,
  calculateBuildingCost,
  PRESTIGE_MULTIPLIER_BASE,
} from "@/lib/gameData";
import { supabase } from "@/lib/supabase";

interface GameStore extends GameState {
  clickCookie: () => void;
  buyBuilding: (id: string) => void;
  buyUpgrade: (id: string) => void;
  tick: () => void;
  calculateCPS: () => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  prestige: () => Promise<void>;
  calculateOfflineProgress: (lastActive: number) => number;
  checkAchievements: () => void;
  reset: () => void;
}

const getInitialState = (): GameState => ({
  cookies: 0,
  totalCookies: 0,
  cps: 0,
  clickPower: 1,
  buildings: INITIAL_BUILDINGS.map((b) => ({ ...b, count: 0 })),
  upgrades: INITIAL_UPGRADES.map((u) => ({ ...u, purchased: false })),
  achievements: INITIAL_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false })),
  prestigeLevel: 0,
  prestigeMultiplier: 1,
  lastActive: Date.now(),
});

export const useGameStore = create<GameStore>((set, get) => ({
  ...getInitialState(),

  clickCookie: () => {
    const { clickPower, prestigeMultiplier } = get();
    const gain = clickPower * prestigeMultiplier;
    set((s) => ({
      cookies: s.cookies + gain,
      totalCookies: s.totalCookies + gain,
    }));
    get().checkAchievements();
  },

  buyBuilding: (id) => {
    const s = get();
    const building = s.buildings.find((b) => b.id === id);
    if (!building) return;
    const cost = calculateBuildingCost(building);
    if (s.cookies < cost) return;

    set({
      cookies: s.cookies - cost,
      buildings: s.buildings.map((b) =>
        b.id === id ? { ...b, count: b.count + 1 } : b
      ),
    });
    get().calculateCPS();
    get().checkAchievements();
  },

  buyUpgrade: (id) => {
    const s = get();
    const upgrade = s.upgrades.find((u) => u.id === id);
    if (!upgrade || upgrade.purchased || s.cookies < upgrade.cost) return;

    set({
      cookies: s.cookies - upgrade.cost,
      upgrades: s.upgrades.map((u) =>
        u.id === id ? { ...u, purchased: true } : u
      ),
    });
    get().calculateCPS();
    get().checkAchievements();
  },

  tick: () => {
    const { cps, prestigeMultiplier } = get();
    const cookiesThisTick = (cps * prestigeMultiplier) / 10;
    set((s) => ({
      cookies: s.cookies + cookiesThisTick,
      totalCookies: s.totalCookies + cookiesThisTick,
    }));
  },

  calculateCPS: () => {
    const { buildings, upgrades, prestigeMultiplier } = get();
    let total = 0;

    buildings.forEach((b) => {
      let buildingCPS = b.baseProduction * b.count;
      upgrades
        .filter(
          (u) =>
            u.purchased &&
            u.name.toLowerCase().includes(b.name.toLowerCase())
        )
        .forEach((u) => (buildingCPS *= u.multiplier));
      total += buildingCPS;
    });

    upgrades
      .filter((u) => u.purchased && u.name.toLowerCase().includes("all"))
      .forEach((u) => (total *= u.multiplier));

    set({ cps: total * prestigeMultiplier });
  },

  saveGame: async () => {
    const s = get();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    // Clean up functions before saving
    const cleanedAchievements = s.achievements.map(({ condition, ...rest }) => rest);

    const saveData = {
      cookies: s.cookies,
      totalCookies: s.totalCookies,
      cps: s.cps,
      clickPower: s.clickPower,
      buildings: s.buildings,
      upgrades: s.upgrades,
      achievements: cleanedAchievements,
      prestigeLevel: s.prestigeLevel,
      prestigeMultiplier: s.prestigeMultiplier,
      lastActive: Date.now(),
    };

    if (!user) {
      localStorage.setItem("cookieClickerSave", JSON.stringify(saveData));
      return;
    }

    await supabase.from("game_state").upsert({
      user_id: user.id,
      ...saveData,
      last_active: new Date().toISOString(),
    });

    await supabase.from("leaderboard").upsert({
      user_id: user.id,
      username: user.email?.split("@")[0] || "Anonymous",
      total_cookies: s.totalCookies,
      prestige_level: s.prestigeLevel,
      updated_at: new Date().toISOString(),
    });
  },

  loadGame: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    let data: any = null;

    if (user) {
      const { data: dbData } = await supabase
        .from("game_state")
        .select("*")
        .eq("user_id", user.id)
        .single();
      data = dbData;
    } else {
      const local = localStorage.getItem("cookieClickerSave");
      if (local) data = JSON.parse(local);
    }

    if (!data) return;

    const mergedAchievements = (data.achievements || []).map((a: any) => {
      const base = INITIAL_ACHIEVEMENTS.find((b) => b.id === a.id);
      return {
        ...base,
        ...a,
        condition: base?.condition || (() => false),
      };
    });

    set({
      cookies: data.cookies || 0,
      totalCookies: data.totalCookies || data.total_cookies || 0,
      cps: data.cps || 0,
      clickPower: data.clickPower || 1,
      buildings: data.buildings || INITIAL_BUILDINGS,
      upgrades: data.upgrades || INITIAL_UPGRADES,
      achievements: mergedAchievements,
      prestigeLevel: data.prestigeLevel || data.prestige_level || 0,
      prestigeMultiplier: data.prestigeMultiplier || data.multiplier || 1,
      lastActive: data.lastActive || Date.now(),
    });

    const offline = get().calculateOfflineProgress(data.lastActive || Date.now());
    if (offline > 0) {
      set((s) => ({
        cookies: s.cookies + offline,
        totalCookies: s.totalCookies + offline,
      }));
    }

    get().calculateCPS();
    get().checkAchievements();
  },

  calculateOfflineProgress: (lastActive) => {
    const now = Date.now();
    const elapsed = (now - lastActive) / 1000;
    const capped = Math.min(elapsed, 24 * 60 * 60);
    const { cps, prestigeMultiplier } = get();
    return cps * prestigeMultiplier * capped;
  },

  checkAchievements: () => {
    const s = get();
    const updated = s.achievements.map((a) => {
      if (!a.unlocked && typeof a.condition === "function" && a.condition(s)) {
        return { ...a, unlocked: true };
      }
      return a;
    });
    set({ achievements: updated });
  },

  prestige: async () => {
    const s = get();
    const newLevel = s.prestigeLevel + 1;
    const newMult = 1 + newLevel * PRESTIGE_MULTIPLIER_BASE;

    set({
      ...getInitialState(),
      prestigeLevel: newLevel,
      prestigeMultiplier: newMult,
    });
    await get().saveGame();
  },

  reset: () => set(getInitialState()),
}));
