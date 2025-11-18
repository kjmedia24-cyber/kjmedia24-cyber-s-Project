import { NextRequest, NextResponse } from "next/server";
import { setFighterClan } from "../../../../lib/clans";

// POST /api/clans/assign  ->  { fighterName, clanName }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const fighterName = body?.fighterName?.trim();
  const clanName = body?.clanName?.trim() || null;

  if (!fighterName) {
    return NextResponse.json(
      { error: "fighterName 필드는 필수입니다." },
      { status: 400 }
    );
  }

  const data = await setFighterClan(fighterName, clanName);
  return NextResponse.json(data);
}
