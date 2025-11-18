"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Winner = "player1" | "player2";

export default function MatchesPage() {
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [winner, setWinner] = useState<Winner>("player1");
  const [kills1, setKills1] = useState("0");
  const [kills2, setKills2] = useState("0");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1Name: player1Name.trim(),
          player2Name: player2Name.trim(),
          winner,
          kills1: Number(kills1) || 0,
          kills2: Number(kills2) || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "전적 저장 중 오류가 발생했습니다.");
      }

      setStatus("success");
      setMessage("전적이 저장되었습니다! / 파이터 랭킹을 새로고침하면 반영됩니다.");

      // 폼 초기화
      setPlayer1Name("");
      setPlayer2Name("");
      setWinner("player1");
      setKills1("0");
      setKills2("0");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "전적 저장 중 알 수 없는 오류가 발생했습니다.");
    }
  }

  return (
    <div className="min-h-screen bg-[#05060b] text-gray-100 flex">
      <Sidebar active="matches" />

      <main className="flex-1 px-10 py-8">
        <header className="mb-6">
          <p className="text-xs text-amber-400 tracking-[0.25em] mb-1">
            KOREAN RANKING LEAGUE
          </p>
          <h1 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-[0_0_18px_rgba(255,0,0,0.45)]">
            경기 전적 입력
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            드렁큰 레슬러 2에서 끝난 매치를 여기서 기록하면 한국 랭킹전 데이터에
            자동 반영됩니다.
          </p>
        </header>

        <section className="max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="bg-[#10121a] border border-white/10 rounded-2xl p-6 space-y-6"
          >
            {/* 플레이어 이름 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1 text-gray-400">
                  Player 1 이름
                </label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  className="w-full bg-[#11131c] border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70"
                  placeholder="예: 짱가"
                  required
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-400">
                  Player 2 이름
                </label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  className="w-full bg-[#11131c] border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70"
                  placeholder="예: 구상룡"
                  required
                />
              </div>
            </div>

            {/* 승자 선택 */}
            <div>
              <p className="block text-xs mb-2 text-gray-400">승자 선택</p>
              <div className="flex items-center gap-6 text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="winner"
                    value="player1"
                    checked={winner === "player1"}
                    onChange={() => setWinner("player1")}
                    className="accent-red-500"
                  />
                  <span>Player 1</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="winner"
                    value="player2"
                    checked={winner === "player2"}
                    onChange={() => setWinner("player2")}
                    className="accent-red-500"
                  />
                  <span>Player 2</span>
                </label>
              </div>
            </div>

            {/* Kills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1 text-gray-400">
                  Player 1 Kills
                </label>
                <input
                  type="number"
                  min={0}
                  value={kills1}
                  onChange={(e) => setKills1(e.target.value)}
                  className="w-full bg-[#11131c] border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-400">
                  Player 2 Kills
                </label>
                <input
                  type="number"
                  min={0}
                  value={kills2}
                  onChange={(e) => setKills2(e.target.value)}
                  className="w-full bg-[#11131c] border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70"
                />
              </div>
            </div>

            {/* 버튼 & 메시지 */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md text-sm shadow-[0_0_14px_rgba(248,113,113,0.6)]"
              >
                {status === "loading" ? "저장 중..." : "전적 저장"}
              </button>

              {status === "success" && (
                <p className="text-xs text-green-400">
                  ✅ {message || "전적 저장 완료! / 페이지(파이터 랭킹)를 새로고침하면 반영됩니다."}
                </p>
              )}
              {status === "error" && (
                <p className="text-xs text-red-400">❌ {message}</p>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

/* ====== 사이드바 (홈과 동일 디자인) ====== */

function Sidebar({
  active,
}: {
  active: "fighters" | "matches" | "tiers" | "clans";
}) {
  return (
    <aside className="w-64 border-r border-white/5 bg-gradient-to-b from-[#0b0d12] to-[#05060b] flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
        <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-xs font-extrabold tracking-[0.18em]">
          KR
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
            KOREAN RANKING
          </p>
          <p className="text-xs font-semibold text-gray-100">
            DRUNKEN WRESTLER 2
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 text-sm space-y-1">
        <SidebarLabel>MAIN</SidebarLabel>
        <NavLink
          href="/"
          icon="🥋"
          label="파이터 랭킹"
          active={active === "fighters"}
        />
        <NavLink
          href="/matches"
          icon="📜"
          label="전적 입력"
          active={active === "matches"}
        />

        <SidebarLabel className="mt-4">LEAGUES</SidebarLabel>
        <GhostItem icon="🌐" label="PL / HCL 해외 리그" />
        <GhostItem icon="🇰🇷" label="KR 랭킹전 (현재)" />

        <SidebarLabel className="mt-4">SYSTEM</SidebarLabel>
        <NavLink
          href="/admin/tiers"
          icon="🛠"
          label="티어 관리"
          active={active === "tiers"}
        />
        <NavLink
          href="/admin/clans"
          icon="👥"
          label="클랜 관리"
          active={active === "clans"}
        />
        <GhostItem icon="⚙️" label="설정 (추후 추가)" />
      </nav>

      <div className="px-4 py-3 border-t border-white/5 text-[11px] text-gray-500">
        한국 랭킹전 데이터는 로컬에서만 저장되는 테스트 버전입니다.
      </div>
    </aside>
  );
}

function SidebarLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={
        "text-[10px] uppercase tracking-[0.2em] text-gray-500 px-2 mb-1 " +
        className
      }
    >
      {children}
    </p>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition text-sm ${
        active
          ? "bg-red-600/90 text-white shadow-[0_0_18px_rgba(248,113,113,0.5)]"
          : "text-gray-400 hover:bg.white/5 hover:text-white".replace(
              ".",
              "/"
            )
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function GhostItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 text-xs bg-white/0 border border-white/0">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
