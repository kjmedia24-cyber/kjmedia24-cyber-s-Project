// app/api/matches/route.ts

import { NextResponse } from "next/server";
import { addMatch } from "../../../lib/matches";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    console.log("▶▶ POST /api/matches body:", body);

    // 프런트에서 오는 실제 필드 이름에 맞춰서 매핑
    const player1Name = body?.player1 ?? body?.player1Name;
    const player2Name = body?.player2 ?? body?.player2Name;
    const winner = body?.winner;
    const kills1 = Number(body?.kills1) || 0;
    const kills2 = Number(body?.kills2) || 0;

    // 유효성 검사
    if (
      !player1Name ||
      !player2Name ||
      typeof player1Name !== "string" ||
      typeof player2Name !== "string" ||
      (winner !== "player1" && winner !== "player2")
    ) {
      console.log("❌ 잘못된 요청 형식:", body);
      return NextResponse.json(
        { message: "요청 형식이 잘못되었습니다." },
        { status: 400 }
      );
    }

    // lib/matches.ts 의 addMatch 형식에 맞춰 전달
    const match = await addMatch({
      player1: player1Name,
      player2: player2Name,
      winner,
      kills1,
      kills2,
    });

    console.log("✅ match 저장 완료:", match);

    return NextResponse.json(match, { status: 201 });
  } catch (err: any) {
    console.error("🔥 POST /api/matches 에러:", err);
    return NextResponse.json(
      { message: err?.message ?? "서버 에러" },
      { status: 500 }
    );
  }
}
