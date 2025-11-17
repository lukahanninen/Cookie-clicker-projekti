import { supabase } from "./supabase";

export async function saveLeaderboardScore({
  user_id,
  username,
  total_cookies,
  prestige_level,
}: {
  user_id: string;
  username: string;
  total_cookies: number;
  prestige_level: number;
}) {
  const { error } = await supabase.from("leaderboard").upsert(
    {
      user_id,
      username,
      total_cookies,
      prestige_level,
    },
    { onConflict: "user_id" }
  );

  if (error) console.error("Leaderboard save error:", error);
}
