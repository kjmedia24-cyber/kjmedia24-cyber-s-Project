// lib/fighters.ts
import { createSupabaseServerClient } from "./supabaseServer";

// 파이터 타입
export type Fighter = {
  id: number;
  name: string;
  createdAt: string;
};

// 전체 파이터 불러오기 (등록만 된 애들)
export async function getAllFighters(): Promise<Fighter[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("fighters")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getAllFighters error:", error);
    throw new Error(error.message);
  }

  return (data ?? []).map((row: any) => ({
    id: row.id as number,
    name: row.name as string,
    createdAt: row.created_at as string,
  }));
}

// 파이터 한 명 등록하기 (이름 중복 체크 포함)
export async function createFighter(name: string): Promise<Fighter> {
  const supabase = createSupabaseServerClient();

  // 이미 있는지 확인
  const { data: existing, error: selectError } = await supabase
    .from("fighters")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (selectError) {
    console.error("createFighter select error:", selectError);
    throw new Error(selectError.message);
  }

  if (existing) {
    // 이 메시지는 API 라우트에서 400으로 바꿔서 내려줄 거라 그대로 둬도 됨
    throw new Error(`이미 등록됨: ${name}`);
  }

  // 실제로 등록
  const { data, error } = await supabase
    .from("fighters")
    .insert([{ name }])
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("createFighter insert error:", error);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("파이터를 생성하지 못했습니다.");
  }

  return {
    id: data.id as number,
    name: data.name as string,
    createdAt: data.created_at as string,
  };
}
