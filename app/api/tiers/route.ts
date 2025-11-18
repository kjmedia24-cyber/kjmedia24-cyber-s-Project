import { NextRequest, NextResponse } from "next/server";
import {
  getTierAssignments,
  setTierForFighter,
  removeTierForFighter,
  KOREAN_TIERS,
  TierId,
} from "../../../lib/tiers";

// GET  -> 현재 티어 매핑 전체
export async function GET() {
  const assignments = await getTierAssignments();
  return NextResponse.json({
    tiers: KOREAN_TIERS,
    assignments,
  });
}

// POST -> { fighterName, tierId } 로 티어 지정
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const fighterName = body?.fighterName?.trim();
  const tierId = body?.tierId as TierId | undefined;

  if (!fighterName || !tierId) {
    return NextResponse.json(
      { error: "fighterName, tierId는 필수입니다." },
      { status: 400 }
    );
  }

  const assignments = await setTierForFighter(fighterName, tierId);
  return NextResponse.json({ assignments });
}

// DELETE -> ?fighter=짱가  로 티어 해제
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fighterName = searchParams.get("fighter");

  if (!fighterName) {
    return NextResponse.json(
      { error: "fighter 쿼리 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const assignments = await removeTierForFighter(fighterName);
  return NextResponse.json({ assignments });
}
