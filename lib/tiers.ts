import { createSupabaseServerClient } from "./supabaseServer";

export type TierId =
  | "ABSOLUTE"
  | "HAKYUNG"
  | "PAEWANG"
  | "TUSHIN"
  | "GEUKJEON"
  | "GANGJA"
  | "SHINYE";

export type Tier = {
  id: TierId;
  emojiLabel: string; // 예: "🩸 절대(絶對)"
  badgeClass: string; // tailwind gradient 클래스
};

export const KOREAN_TIERS: Tier[] = [
  {
    id: "ABSOLUTE",
    emojiLabel: "🩸 절대(絶對)",
    badgeClass: "from-[#ff0000] to-[#a32300]",
  },
  {
    id: "HAKYUNG",
    emojiLabel: "🎴 화경(化境)",
    badgeClass: "from-[#aa413b] to-[#5f5f5f]",
  },
  {
    id: "PAEWANG",
    emojiLabel: "🎭 패왕(覇王)",
    badgeClass: "from-[#922413] to-[#b24fce]",
  },
  {
    id: "TUSHIN",
    emojiLabel: "👺 투신(鬪神)",
    badgeClass: "from-[#ff6e2b] to-[#ffd000]",
  },
  {
    id: "GEUKJEON",
    emojiLabel: "🔱 극전(極戰)",
    badgeClass: "from-[#a57347] to-[#f6dea6]",
  },
  {
    id: "GANGJA",
    emojiLabel: "💀 강자(強者)",
    badgeClass: "from-[#907575] to-[#ffcec6]",
  },
  {
    id: "SHINYE",
    emojiLabel: "🥋 신예(新銳)",
    badgeClass: "from-[#dbd6a6] to-[#ffffff]",
  },
];

// --- DB 연동 부분 ---

// fighter_name -> TierId
export async function getTierAssignments(): Promise<Record<string, TierId>> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("fighter_tiers")
    .select("fighter_name, tier_id");

  if (error) {
    console.error("[getTierAssignments] error:", error);
    throw error;
  }

  const assignments: Record<string, TierId> = {};

  for (const row of data ?? []) {
    assignments[row.fighter_name as string] = row.tier_id as TierId;
  }

  return assignments;
}

export async function setTierForFighter(
  name: string,
  tierId: TierId
): Promise<Record<string, TierId>> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("fighter_tiers")
    .upsert(
      {
        fighter_name: name,
        tier_id: tierId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "fighter_name" }
    );

  if (error) {
    console.error("[setTierForFighter] upsert error:", error);
    throw error;
  }

  return getTierAssignments();
}

export async function removeTierForFighter(
  name: string
): Promise<Record<string, TierId>> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("fighter_tiers")
    .delete()
    .eq("fighter_name", name);

  if (error) {
    console.error("[removeTierForFighter] delete error:", error);
    throw error;
  }

  return getTierAssignments();
}

// --- 나머지 순수 유틸은 그대로 ---

export function getTierById(id: TierId): Tier {
  const t = KOREAN_TIERS.find((t) => t.id === id);
  if (!t) {
    return KOREAN_TIERS[KOREAN_TIERS.length - 1]; // fallback 신예
  }
  return t;
}

export function resolveTierForName(
  name: string,
  assignments: Record<string, TierId>
): Tier {
  const id = assignments[name];
  if (id) return getTierById(id);
  // 지정 안 된 파이터는 기본적으로 '신예'
  return KOREAN_TIERS[KOREAN_TIERS.length - 1];
}
