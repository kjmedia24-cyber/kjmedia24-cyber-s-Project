import { createSupabaseServerClient } from "./supabaseServer";

export type Match = {
  id: string;
  player1: string;
  player2: string;
  winner: "player1" | "player2";
  kills1: number;
  kills2: number;
  createdAt: string;
};

export type FighterStats = {
  name: string;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
};

// -------------------------------
// GET ALL MATCHES
// -------------------------------
export async function getAllMatches(): Promise<Match[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Supabase는 created_at(스네이크) → 우리가 쓰는 createdAt(카멜)로 매핑
  return (
    data?.map((m) => ({
      id: m.id,
      player1: m.player1,
      player2: m.player2,
      winner: m.winner,
      kills1: m.kills1,
      kills2: m.kills2,
      createdAt: m.created_at,
    })) ?? []
  );
}

// -------------------------------
// ADD MATCH
// -------------------------------
export async function addMatch(input: {
  player1: string;
  player2: string;
  winner: "player1" | "player2";
  kills1: number;
  kills2: number;
}): Promise<Match> {
  const supabase = createSupabaseServerClient();

  const newMatch = {
    ...input,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("matches")
    .insert(newMatch)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    player1: data.player1,
    player2: data.player2,
    winner: data.winner,
    kills1: data.kills1,
    kills2: data.kills2,
    createdAt: data.created_at,
  };
}

// -------------------------------
// GET FIGHTER STATS
// -------------------------------
export async function getFighterStats(): Promise<FighterStats[]> {
  const matches = await getAllMatches();

  const map = new Map<string, FighterStats>();

  function ensure(name: string): FighterStats {
    if (!map.has(name)) {
      map.set(name, {
        name,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
      });
    }
    return map.get(name)!;
  }

  for (const m of matches) {
    const p1 = ensure(m.player1);
    const p2 = ensure(m.player2);

    // 승패
    if (m.winner === "player1") {
      p1.wins++;
      p2.losses++;
    } else {
      p2.wins++;
      p1.losses++;
    }

    // KDA 계산 (1:1 기준 상호 적용)
    p1.kills += m.kills1;
    p2.kills += m.kills2;

    p1.deaths += m.kills2;
    p2.deaths += m.kills1;
  }

  return Array.from(map.values()).sort((a, b) => b.wins - a.wins);
}
