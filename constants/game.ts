// H3 해상도 (5 = 약 250km² 크기, MVP용)
export const H3_RESOLUTION = 5;

// 전파 설정
export const GPS_SPREAD_COOLDOWN_MS = 30_000; // 30초
export const REMOTE_SPREAD_COST = 20; // 포인트
export const DISINFECT_COST = 0; // 현장 방역 무료
export const REMOTE_DISINFECT_COST = 30; // 원거리 방역 비용

// 초기 포인트
export const STARTING_POINTS = 100;

// 자동 확산 확률 (백엔드 크론용)
export const NATURAL_SPREAD_CHANCE = 0.1; // 10%

// 지도 설정
export const MAX_VISIBLE_CELLS = 500;
export const DEFAULT_ZOOM = 4;

// 색상 테마
export const COLORS = {
  background: "#0a0a1a",
  surface: "#12122a",
  surfaceLight: "#1e1e3a",
  primary: "#7c3aed",
  primaryLight: "#a78bfa",
  accent: "#06b6d4",
  danger: "#ef4444",
  success: "#10b981",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  border: "#2d2d5e",
  mapBackground: "#0d0d1f",
} as const;
