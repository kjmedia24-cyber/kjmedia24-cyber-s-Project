"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

type SortOption = "Wins" | "Kills" | "Name";

export default function HomePage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("Wins");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/fighters");
        const data = await res.json();
        setFighters(data.fighters);
        setTiers(data.tiers);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...fighters];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((f) => {
        const nameMatch = f.name.toLowerCase().includes(q);
        const clanMatch = f.clanName
          ? f.clanName.toLowerCase().includes(q)
          : false;
        return nameMatch || clanMatch;
      });
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "Wins":
          return b.wins - a.wins;
        case "Kills":
          return b.kills - a.kills;
        case "Name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [fighters, search, sortBy]);

  return (
    <div className="min-h-screen bg-[#05060b] text-gray-100 flex">
      <Sidebar active="fighters" />

      <main className="flex-1 px-10 py-8">
        <header className="mb-6">
          <p className="text-xs text-amber-400 tracking-[0.25em] mb-1">
            KOREAN RANKING LEAGUE
          </p>
          <h1 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-[0_0_18px_rgba(255,0,0,0.45)]">
            파이터 랭킹
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            드렁큰 레슬러 2 한국 랭킹전 – 전적이 기록되는 순간, 티어와 클랜이
            정해집니다.
          </p>
        </header>

        <section className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="파이터 이름 또는 클랜명 검색..."
                className="w-full bg-[#11131c] border border-white/5 rounded-md pl-9 pr-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="uppercase tracking-wide">정렬</span>
              <Select<SortOption>
                value={sortBy}
                onChange={(v) => setSortBy(v)}
                options={["Wins", "Kills", "Name"]}
              />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="text-gray-500 text-sm">랭킹 불러오는 중...</div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((fighter) => (
              <FighterCard key={fighter.name} fighter={fighter} />
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full text-center text-gray-500 text-sm py-10">
                아직 기록된 전적이 없거나, 조건에 맞는 파이터가 없습니다.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

/* ====== 공통 컴포넌트 ====== */

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

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-[#11131c] border border-white/10 rounded-md px-3 py-2 pr-7 text-xs text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-transparent"
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-[10px] text-gray-400">
        ▼
      </span>
    </div>
  );
}

function FighterCard({ fighter }: { fighter: Fighter }) {
  const tier = fighter.tier;

  return (
    <article className="bg-[#10121a] border border-white/10 rounded-2xl p-4 flex gap-4 hover:border-red-500/80 transition shadow-[0_0_20px_rgba(0,0,0,0.7)]">
      {/* 프로필 */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-16 w-16 rounded-xl bg-[#181b27] overflow-hidden flex items-center justify-center ring-2 ring-white/10">
          <span className="text-3xl">🧑‍🎤</span>
        </div>
        <div
          className={`px-3 py-1 rounded-full bg-gradient-to-r ${tier.badgeClass} text-[10px] font-bold tracking-wide text-black shadow-sm whitespace-nowrap`}
        >
          {tier.emojiLabel}
        </div>
      </div>

      {/* 정보 */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-semibold tracking-wide text-white">
              {fighter.name}
            </h2>
            {fighter.clanName && (
              <span className="text-xs text-gray-400 italic tracking-wide">
                {fighter.clanName}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            한국 랭킹전 등록 파이터
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-y-1 text-xs text-gray-300">
          <span className="text-gray-500">Wins</span>
          <span className="font-semibold">{fighter.wins}</span>

          <span className="text-gray-500">Losses</span>
          <span className="font-semibold">{fighter.losses}</span>

          <span className="text-gray-500">Kills</span>
          <span className="font-semibold">{fighter.kills}</span>

          <span className="text-gray-500">Deaths</span>
          <span className="font-semibold">{fighter.deaths}</span>
        </div>
      </div>
    </article>
  );
}
