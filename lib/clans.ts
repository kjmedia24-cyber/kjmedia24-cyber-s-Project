import { createSupabaseServerClient } from "./supabaseServer";

export type ClanFileData = {
  clans: string[]; // 등록된 클랜 이름 목록
  fighters: Record<string, string>; // fighterName -> clanName
};

async function readClansFromDb(): Promise<ClanFileData> {
  const supabase = createSupabaseServerClient();

  const [{ data: clanRows, error: clansError }, { data: fighterRows, error: fightersError }] =
    await Promise.all([
      supabase.from("clans").select("name").order("name"),
      supabase.from("fighter_clans").select("fighter_name, clan_name"),
    ]);

  if (clansError) {
    console.error("[readClansFromDb] clans error:", clansError);
    throw clansError;
  }
  if (fightersError) {
    console.error("[readClansFromDb] fighter_clans error:", fightersError);
    throw fightersError;
  }

  const clans = (clanRows ?? []).map((c) => c.name as string);
  const fighters: Record<string, string> = {};

  for (const row of fighterRows ?? []) {
    fighters[row.fighter_name as string] = row.clan_name as string;
  }

  return { clans, fighters };
}

export async function getClanData(): Promise<ClanFileData> {
  return readClansFromDb();
}

export async function addClan(name: string): Promise<ClanFileData> {
  const supabase = createSupabaseServerClient();

  // 이미 있으면 무시, 없으면 추가
  const { error } = await supabase
    .from("clans")
    .upsert({ name }, { onConflict: "name" });

  if (error) {
    console.error("[addClan] upsert error:", error);
    throw error;
  }

  return readClansFromDb();
}

export async function removeClan(name: string): Promise<ClanFileData> {
  const supabase = createSupabaseServerClient();

  // fighter_clans는 FK CASCADE라 자동 삭제되지만, 명시적으로 삭제해도 됨
  const { error: fighterError } = await supabase
    .from("fighter_clans")
    .delete()
    .eq("clan_name", name);

  if (fighterError) {
    console.error("[removeClan] fighter_clans delete error:", fighterError);
    throw fighterError;
  }

  const { error: clanError } = await supabase
    .from("clans")
    .delete()
    .eq("name", name);

  if (clanError) {
    console.error("[removeClan] clans delete error:", clanError);
    throw clanError;
  }

  return readClansFromDb();
}

export async function setFighterClan(
  fighterName: string,
  clanName: string | null
): Promise<ClanFileData> {
  const supabase = createSupabaseServerClient();

  if (!clanName) {
    // 무소속 처리
    const { error } = await supabase
      .from("fighter_clans")
      .delete()
      .eq("fighter_name", fighterName);

    if (error) {
      console.error("[setFighterClan] delete error:", error);
      throw error;
    }

    return readClansFromDb();
  }

  // 클랜 없으면 먼저 생성
  const { error: clanError } = await supabase
    .from("clans")
    .upsert({ name: clanName }, { onConflict: "name" });

  if (clanError) {
    console.error("[setFighterClan] clan upsert error:", clanError);
    throw clanError;
  }

  // 파이터-클랜 매핑 upsert
  const { error: fighterClanError } = await supabase
    .from("fighter_clans")
    .upsert(
      { fighter_name: fighterName, clan_name: clanName },
      { onConflict: "fighter_name" }
    );

  if (fighterClanError) {
    console.error("[setFighterClan] fighter_clans upsert error:", fighterClanError);
    throw fighterClanError;
  }

  return readClansFromDb();
}
