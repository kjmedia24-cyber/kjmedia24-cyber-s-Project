// app/api/fighters/route.ts
import { NextResponse } from "next/server";
import { getFighterStats } from "../../../lib/matches";
import {
  getTierAssignments,
  resolveTierForName,
  KOREAN_TIERS,
} from "../../../lib/tiers";
import { getClanData } from "../../../lib/clans";

export async function GET() {
  try {
    // 1) 전적 기반 스탯 + 티어/클랜 정보 한 번에 가져오기
    const [stats, tierAssignments, clanData] = await Promise.all([
      getFighterStats(),
      getTierAssignments(),
      getClanData(),
    ]);

    // 2) 각 파이터에 티어/클랜 이름 붙이기
    const fighters = stats.map((f) => {
      const tier = resolveTierForName(f.name, tierAssignments);
      const clanName = clanData.fighters[f.name];

      return {
        ...f,
        tier,
        clanName: clanName ?? null,
      };
    });

    // 3) 항상 JSON으로 응답
    return NextResponse.json(
      {
        fighters,
        tiers: KOREAN_TIERS,
      },
      { status: 200 }
    );
  } catch (err: any) {
    // 에러 나면 여기로 들어옴
    console.error("GET /api/fighters error:", err);

    // 여기도 무조건 JSON으로 응답 (그래야 .json() 호출 시 안 터짐)
    return NextResponse.json(
      {
        error: true,
        message: err?.message ?? "Unknown server error",
      },
      { status: 500 }
    );
  }
}
