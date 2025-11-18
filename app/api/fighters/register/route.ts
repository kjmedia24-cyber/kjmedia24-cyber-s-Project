// app/api/matches/route.ts
import { NextResponse } from "next/server";
import { addMatch } from "@/lib/matches";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "잘못된 요청입니다." },
        { status: 400 },
      );
    }

    let { player1, player2, winner, kills1, kills2 } = body;

    // 문자열/공백 체크
    if (typeof player1 !== "string") player1 = "";
    if (typeof player2 !== "string") player2 = "";

    player1 = player1.trim();
    player2 = player2.trim();

    if (!player1 || !player2) {
      return NextResponse.json(
        { message: "플레이어 이름을 모두 입력해 주세요." },
        { status: 400 },
      );
    }

    if (winner !== "player1" && winner !== "player2") {
      return NextResponse.json(
        { message: "승자 선택이 잘못되었습니다." },
        { status: 400 },
      );
    }

    const k1 = Number(kills1);
    const k2 = Number(kills2);

    if (!Number.isFinite(k1) || !Number.isFinite(k2)) {
      return NextResponse.json(
        { message: "킬 수는 숫자로 입력해 주세요." },
        { status: 400 },
      );
    }

    const match = await addMatch({
      player1,
      player2,
      winner,
      kills1: k1,
      kills2: k2,
    });

    return NextResponse.json(match, { status: 201 });
  } catch (e) {
    console.error("POST /api/matches error:", e);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
