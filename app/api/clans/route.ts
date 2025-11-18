import { NextRequest, NextResponse } from "next/server";
import { addClan, getClanData, removeClan } from "../../../lib/clans";

// GET -> 전체 클랜 데이터
export async function GET() {
  const data = await getClanData();
  return NextResponse.json(data);
}

// POST -> { name } 로 클랜 추가
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "클랜 이름은 필수입니다." },
      { status: 400 }
    );
  }

  const data = await addClan(name);
  return NextResponse.json(data);
}

// DELETE -> ?name=구사회  로 클랜 삭제
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "name 쿼리 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const data = await removeClan(name);
  return NextResponse.json(data);
}
