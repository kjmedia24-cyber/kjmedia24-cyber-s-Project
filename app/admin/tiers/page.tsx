"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Tier = {
  id: string;
  emojiLabel: string;
  badgeClass: string;
};

type Assignments = Record<string, string>; // fighterName -> tierId

export default function TierAdminPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [fighterName, setFighterName] = useState("");
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tiers");
        const data = await res.json();
        setTiers(data.tiers || []);
        setAssignments(data.assignments || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!fighterName.trim() || !selectedTierId) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fighterName: fighterName.trim(),
          tierId: selectedTierId,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "티어 저장 중 오류가 발생했습니다.");
      }

      const d = await res.json();
      setAssignments(d.assignments || {});
      setStatus("success");
      setMessage("티어가 저장되었습니다.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "알 수 없는 오류가 발생했습니다.");
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`"${name}"의 티어를 해제할까요?`)) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/tiers?fighter=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "티어 삭제 중 오류가 발생했습니다.");
      }

      const d = await res.json();
      setAssignments(d.assignments || {});
      setStatus("success");
      setMessage("티어가 해제되었습니다.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "알 수 없는 오류가 발생했습니다.");
    }
  }

  function tierLabelOf(name: string) {
    const id = assignments[name];
    const t = tiers.find((x) => x.id === id);
    return t || null;
  }

  const assignedList = Object.keys(assignments).sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <div className="min-h-screen bg-[#05060b] text-gray-100 flex">
      <Sidebar active="tiers" />

      <main className="flex-1 px-10 py-8">
        <header className="mb-6">
          <p className="text-xs text-amber-400 tracking-[0.25em] mb-1">
            ADMIN PANEL
          </p>
          <h1 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-[0_0_18px_rgba(255,0,0,0.45)]">
            티어 관리
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            파이터의 실력 등급(절대 / 화경 / 패왕 / 투신 / 극전 / 강자 / 신예)을
            여기서 직접 지정할 수 있습니다. 지정되지 않은 파이터는 기본적으로
            신예 티어입니다.
          </p>
        </header>

        <section className="max-w-2xl space-y-6">
          {/* 티어 지정 폼 */}
          <form
            onSubmit={handleSave}
            className="bg-[#10121a] border border-white/10 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold mb-1">티어 지정 / 수정</h2>

            <div>
              <label className="block text-xs mb-1 text-gray-400">
                파이터 이름
              </label>
              <input
                type="text"
                value={fighterName}
                onChange={(e) => setFighterName(e.target.value)}
                placeholder="예: 짱가"
                className="w-full bg-[#11131c] border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70"
                required
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-400">
                티어 선택
              </label>
              <select
                value={selectedTierId}
                onChange={(e) => setSelectedTierId(e.target.value)}
                className="w-full bg-[#11131c] border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70"
                required
              >
                <option value="">티어 선택...</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.emojiLabel}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md text-sm shadow-[0_0_14px_rgba(248,113,113,0.6)]"
              >
                {status === "loading" ? "저장 중..." : "티어 저장"}
              </button>

              {status === "success" && (
                <p className="text-xs text-green-400">✅ {message}</p>
              )}
              {status === "error" && (
                <p className="text-xs text-red-400">❌ {message}</p>
              )}
            </div>
          </form>

          {/* 등록된 티어 목록 */}
          <div className="bg-[#10121a] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">등록된 티어 목록</h2>
            {loading ? (
              <p className="text-sm text-gray-500">불러오는 중...</p>
            ) : assignedList.length === 0 ? (
              <p className="text-sm text-gray-500">
                아직 티어가 지정된 파이터가 없습니다.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {assignedList.map((name) => {
                  const t = tierLabelOf(name);
                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between bg-black/10 rounded-md px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-white">{name}</p>
                        {t && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {t.emojiLabel}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setFighterName(name);
                            if (t) setSelectedTierId(t.id);
                          }}
                          className="px-3 py-1 rounded bg-white/10 hover:bg-white/15"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(name)}
                          className="px-3 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ====== 사이드바 (동일 디자인) ====== */

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
