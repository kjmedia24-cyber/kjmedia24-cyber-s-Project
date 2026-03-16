import { create } from "zustand";
import { Cell, Profile } from "../types";

interface GameState {
  // 유저 정보
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  // GPS 위치
  location: { lat: number; lng: number } | null;
  setLocation: (loc: { lat: number; lng: number } | null) => void;

  // 지도에 표시된 셀들 (캐시)
  cells: Map<string, Cell>;
  setCells: (cells: Cell[]) => void;
  updateCell: (cell: Cell) => void;
  removeCell: (h3Index: string) => void;

  // 마지막 전파 시각 (쿨다운용)
  lastSpreadAt: number | null;
  setLastSpreadAt: (ts: number) => void;

  // 로딩 상태
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  location: null,
  setLocation: (location) => set({ location }),

  cells: new Map(),
  setCells: (cells) =>
    set({
      cells: new Map(cells.map((c) => [c.h3_index, c])),
    }),
  updateCell: (cell) =>
    set((state) => {
      const next = new Map(state.cells);
      next.set(cell.h3_index, cell);
      return { cells: next };
    }),
  removeCell: (h3Index) =>
    set((state) => {
      const next = new Map(state.cells);
      next.delete(h3Index);
      return { cells: next };
    }),

  lastSpreadAt: null,
  setLastSpreadAt: (ts) => set({ lastSpreadAt: ts }),

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
