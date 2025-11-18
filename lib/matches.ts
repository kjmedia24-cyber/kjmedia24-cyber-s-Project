// lib/matches.ts
import { createFighter } from "./fighters";
import { createSupabaseServerClient } from "./supabaseServer";
import { getAllFighters } from "./fighters"; //

// ------------------------------
// TYPES
// ------------------------------
export type Match = {
  id: number;
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

// ------------------------------
// MATCHES: READ / WRITE
// ------------------------------

// DB 에서 전 경기 다 가져오기
export async function getAllMatches(): Promise<Match[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getAllMatches error:", error);
    throw new Error(error.message);
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    player1: row.player1,
    player2: row.player2,
    winner: row.winner as "player1" | "player2",
    kills1: row.kills1,
    kills2: row.kills2,
    createdAt: row.created_at,
  }));
}

// 경기 한 판 추가
export async function addMatch(input: {
  player1: string;
  player2: string;
  winner: "player1" | "player2";
  kills1: number;
  kills2: number;
}): Promise<Match> {
  const supabase = createSupabaseServerClient();

  const { player1, player2, winner, kills1, kills2 } = input;

  // 1) 양쪽 파이터를 fighters 테이블에 보장
  //    - 이미 있으면 그대로 리턴
  //    - 없으면 새로 insert 후 리턴
  const [fighter1, fighter2] = await Promise.all([
    createFighter(player1),
    createFighter(player2),
  ]);

  // 2) match 저장 (fighters 테이블에 있는 이름을 사용)
  const { data, error } = await supabase
    .from("matches")
    .insert({
      player1: fighter1.name,
      player2: fighter2.name,
      winner,
      kills1,
      kills2,
    })
    .select("*")
    .single();

  if (error) {
    console.error("addMatch insert error:", error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    player1: data.player1,
    player2: data.player2,
    winner: data.winner as "player1" | "player2",
    kills1: data.kills1,
    kills2: data.kills2,
    createdAt: data.created_at,
  };
}

// ------------------------------
// GET FIGHTER STATS
// ------------------------------

// 등록된 파이터 + 전적 기준으로 스탯 계산
export async function getFighterStats(): Promise<FighterStats[]> {
  // DB에서 전 경기 + 등록된 파이터 전체 불러오기
  const [matches, fighters] = await Promise.all([
    getAllMatches(),
    getAllFighters(),
  ]);

  const map = new Map<string, FighterStats>();

  // 1) fighters 테이블에 등록된 파이터들 먼저 깔아두기
  for (const f of fighters) {
    map.set(f.name, {
      name: f.name,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
    });
  }

  // 2) 전적 돌면서 스탯 누적
  for (const m of matches) {
    // 혹시 등록 안 된 이름이 전적에 등장하면 그때 새로 추가
    let p1 = map.get(m.player1);
    if (!p1) {
      p1 = { name: m.player1, wins: 0, losses: 0, kills: 0, deaths: 0 };
      map.set(m.player1, p1);
    }

    let p2 = map.get(m.player2);
    if (!p2) {
      p2 = { name: m.player2, wins: 0, losses: 0, kills: 0, deaths: 0 };
      map.set(m.player2, p2);
    }

    // 승/패
    if (m.winner === "player1") {
      p1.wins += 1;
      p2.losses += 1;
    } else {
      p2.wins += 1;
      p1.losses += 1;
    }

    // 킬 / 데스 (1:1 기준 서로의 킬 = 상대방의 데스)
    p1.kills += m.kills1;
    p2.kills += m.kills2;

    p1.deaths += m.kills2;
    p2.deaths += m.kills1;
  }

  // 승수 기준 내림차순 정렬
  return Array.from(map.values()).sort((a, b) => b.wins - a.wins);
}
