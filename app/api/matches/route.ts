import { NextRequest, NextResponse } from "next/server";
import { addMatch, getAllMatches } from "../../../lib/matches";

export async function GET() {
  const matches = await getAllMatches();
  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const player1 = body.player1Name?.trim();
  const player2 = body.player2Name?.trim();
  const winner = body.winner as "player1" | "player2";
  const kills1 = Number(body.kills1 ?? 0);
  const kills2 = Number(body.kills2 ?? 0);

  if (!player1 || !player2 || (winner !== "player1" && winner !== "player2")) {
    return NextResponse.json({ error: "필수 값이 누락되었습니다." }, { status: 400 });
  }

  const match = await addMatch({
    player1,
    player2,
    winner,
    kills1,
    kills2,
  });

  return NextResponse.json(match);
}
