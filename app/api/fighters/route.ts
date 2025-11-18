import { NextResponse } from "next/server";
import { getFighterStats } from "../../../lib/matches";
import {
  getTierAssignments,
  resolveTierForName,
  KOREAN_TIERS,
} from "../../../lib/tiers";
import { getClanData } from "../../../lib/clans";

export async function GET() {
  const [stats, tierAssignments, clanData] = await Promise.all([
    getFighterStats(),
    getTierAssignments(),
    getClanData(),
  ]);

  const fighters = stats.map((f) => {
    const tier = resolveTierForName(f.name, tierAssignments);
    const clanName = clanData.fighters[f.name];

    return {
      ...f,
      tier,
      clanName: clanName ?? null,
    };
  });

  return NextResponse.json({
    fighters,
    tiers: KOREAN_TIERS,
  });
}
