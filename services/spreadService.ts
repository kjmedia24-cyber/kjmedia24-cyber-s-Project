import { supabase } from "../lib/supabase";
import { gpsToH3, areNeighbors, getNeighbors } from "../lib/h3";
import { useGameStore } from "../store/gameStore";

export interface SpreadResult {
  success: boolean;
  message: string;
  pointsSpent?: number;
}

/** GPS 위치 기반 전파 (무료) */
export async function spreadAtLocation(
  lat: number,
  lng: number
): Promise<SpreadResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요해요" };

  const h3Index = gpsToH3(lat, lng);

  // 프로필 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("virus_color, virus_name")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, message: "프로필을 찾을 수 없어요" };

  // 이미 내 셀인지 확인
  const { data: existing } = await supabase
    .from("cells")
    .select("owner_id")
    .eq("h3_index", h3Index)
    .single();

  if (existing?.owner_id === user.id) {
    return { success: false, message: "이미 내 영역이에요! 🦠" };
  }

  // 셀 감염 (upsert)
  const { error } = await supabase.from("cells").upsert({
    h3_index: h3Index,
    owner_id: user.id,
    virus_color: profile.virus_color,
    virus_name: profile.virus_name,
    infected_at: new Date().toISOString(),
    strength: 1,
  });

  if (error) return { success: false, message: error.message };

  // 이벤트 로그
  await supabase.from("spread_events").insert({
    actor_id: user.id,
    h3_index: h3Index,
    event_type: "gps_spread",
    lat,
    lng,
    points_spent: 0,
  });

  // total_cells 업데이트
  await supabase.rpc("increment_cell_count", { user_id: user.id });

  return { success: true, message: "🦠 전파 성공!" };
}

/** 원거리 전파 (포인트 소모) */
export async function spreadRemote(
  lat: number,
  lng: number,
  cost: number
): Promise<SpreadResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요해요" };

  const h3Index = gpsToH3(lat, lng);

  // 포인트 확인 및 차감
  const { data: profile } = await supabase
    .from("profiles")
    .select("points, virus_color, virus_name")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, message: "프로필을 찾을 수 없어요" };
  if (profile.points < cost) {
    return { success: false, message: `포인트가 부족해요 (필요: ${cost}p)` };
  }

  // 포인트 차감
  await supabase
    .from("profiles")
    .update({ points: profile.points - cost })
    .eq("id", user.id);

  // 셀 감염
  const { error } = await supabase.from("cells").upsert({
    h3_index: h3Index,
    owner_id: user.id,
    virus_color: profile.virus_color,
    virus_name: profile.virus_name,
    infected_at: new Date().toISOString(),
    strength: 1,
  });

  if (error) return { success: false, message: error.message };

  await supabase.from("spread_events").insert({
    actor_id: user.id,
    h3_index: h3Index,
    event_type: "remote_spread",
    lat,
    lng,
    points_spent: cost,
  });

  await supabase.rpc("increment_cell_count", { user_id: user.id });

  return { success: true, message: `🎯 원거리 전파 성공! (${cost}p 소모)`, pointsSpent: cost };
}

/** 방역 (현장 방역 무료) */
export async function disinfectAtLocation(
  lat: number,
  lng: number
): Promise<SpreadResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "로그인이 필요해요" };

  const h3Index = gpsToH3(lat, lng);

  const { data: cell } = await supabase
    .from("cells")
    .select("owner_id")
    .eq("h3_index", h3Index)
    .single();

  if (!cell) return { success: false, message: "여긴 감염된 곳이 없어요" };
  if (cell.owner_id === user.id) {
    return { success: false, message: "내 영역은 방역 못 해요 😅" };
  }

  const { error } = await supabase
    .from("cells")
    .delete()
    .eq("h3_index", h3Index);

  if (error) return { success: false, message: error.message };

  await supabase.from("spread_events").insert({
    actor_id: user.id,
    h3_index: h3Index,
    event_type: "disinfect",
    lat,
    lng,
    points_spent: 0,
  });

  // 원래 주인 셀 카운트 감소
  await supabase.rpc("decrement_cell_count", { owner_id: cell.owner_id });

  return { success: true, message: "🧹 방역 완료!" };
}
