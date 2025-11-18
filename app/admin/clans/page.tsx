"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Tier = {
  id: string;
  emojiLabel: string;
  badgeClass: string;
};

type Fighter = {
  name: string;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  tier: Tier;
  clanName: string | null;
};

type ClanData = {
  clans: string[];
  fighters: Record<string, string>; // fighterName -> clanName
};

export default function ClanAdminPage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [clanData, setClanData] = useState<ClanData>({
    clans: [],
    fighters: {},
  });

  const [newClanName, setNewClanName] = useState("");
  const [selectedFighter, setSelectedFighter] = useState("");
  const [selectedClan, setSelectedClan] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [clanRes, fighterRes] = await Promise.all([
          fetch("/api/clans"),
          fetch("/api/fighters"),
        ]);

        const clanJson = await clanRes.json();
        const fighterJson = await fighterRes.json();

        setClanData(clanJson);
        setFighters(fighterJson.fighters || []);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const clanCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const name of Object.values(clanData.fighters)) {
      counts[name] = (counts[name] || 0) + 1;
    }
    return counts;
  }, [clanData]);

  async function handleAddClan(e: FormEvent) {
    e.preventDefault();
    if (!newClanName.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClanName.trim() }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "클랜 추가 중 오류가 발생했습니다.");
      }

      const d = await res.json();
      setClanData(d);
      setStatus("success");
      setMessage("클랜이 추가되었습니다.");
      setNewClanName("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "알 수 없는 오류가 발생했습니다.");
    }
  }

  async function handleDeleteClan(name: string) {
    if (!confirm(`"${name}" 클랜을 삭제할까요? (소속 파이터는 무소속 처리)`))
      return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/clans?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "클랜 삭제 중 오류가 발생했습니다.");
      }

      const d = await res.json();
      setClanData(d);
      setStatus("success");
      setMessage("클랜이 삭제되었습니다.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "알 수 없는 오류가 발생했습니다.");
    }
  }

  async function handleAssignClan(e: FormEvent) {
    e.preventDefault();
    if (!selectedFighter) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/clans/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fighterName: selectedFighter,
          clanName: selectedClan || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "클랜 지정 중 오류가 발생했습니다.");
      }

      const d = await res.json();
      setClanData(d);
      setStatus("success");
      setMessage("클랜이 지정되었습니다.");

      setSelectedFighter("");
      setSelectedClan("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "알 수 없는 오류가 발생했습니다.");
    }
  }

  return (
    <div className="min-h-screen bg-[#05060b] text-gray-100 flex">
      <Sidebar active="clans" />

      <main className="flex-1 px-10 py-8">
        <header className="mb-6">
          <p className="text-xs text-amber-400 tracking-[0.25em] mb-1">
            ADMIN PANEL
          </p>
          <h1 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-[0_0_18px_rgba(255,0,0,0.45)]">
            클랜 관리
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            구사회 / WG / 딕어덜트 등을 등록하고, 파이터에게 소속 클랜을
            지정할 수 있습니다.
          </p>
        </header>

        <section className="space-y-6 max-w-4xl">
          {/* 신규 클랜 추가 */}
          <form
            onSubmit={handleAddClan}
            className="bg-[#10121a] border border-white/10 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold mb-1">신규 클랜 추가</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newClanName}
                onChange={(e) => setNewClanName(e.target.value)}
                placeholder="예: 구사회, WG, 딕어덜트"
                className="flex-1 bg-[#11131c] border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-5 py-2 rounded-md bg-red-600 hover:bg-red-500 text-sm font-semibold disabled:opacity-60"
              >
                클랜 추가
              </button>
            </div>
          </form>

          {/* 파이터 클랜 지정 */}
          <form
            onSubmit={handleAssignClan}
            className="bg-[#10121a] border border-white/10 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold mb-1">파이터 클랜 지정</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1 text-gray-400">
                  파이터
                </label>
                <select
                  value={selectedFighter}
                  onChange={(e) => setSelectedFighter(e.target.value)}
                  className="w-full bg-[#11131c] border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70"
                >
                  <option value="">파이터 선택...</option>
                  {fighters.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs mb-1 text-gray-400">
                  소속 클랜
                </label>
                <select
                  value={selectedClan}
                  onChange={(e) => setSelectedClan(e.target.value)}
                  className="w-full bg-[#11131c] border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70"
                >
                  <option value="">무소속</option>
                  {clanData.clans.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full md:w-auto px-6 py-2.5 rounded-md bg-red-600 hover:bg-red-500 text-sm font-semibold disabled:opacity-60"
              >
                클랜 지정
              </button>
            </div>
          </form>

          {/* 등록된 클랜 & 소속 */}
          <div className="bg-[#10121a] border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-semibold mb-1">등록된 클랜 & 소속</h2>

            {clanData.clans.length === 0 ? (
              <p className="text-sm text-gray-500">
                아직 등록된 클랜이 없습니다.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {clanData.clans.map((clan) => (
                  <div
                    key={clan}
                    className="flex items-center justify-between bg-black/10 rounded-md px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-gray-100">{clan}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {clanCounts[clan] || 0}명 소속
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteClan(clan)}
                      className="px-3 py-1 rounded bg-red-600/80 hover:bg-red-500 text-xs"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {status !== "idle" && message && (
            <p
              className={`text-xs ${
                status === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {status === "success" ? "✅" : "❌"} {message}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

/* ====== 사이드바 ====== */

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
          : "text-gray-400 hover:bg-white/5 hover:text-white"
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
