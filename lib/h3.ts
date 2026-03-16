import {
  latLngToCell,
  cellToBoundary,
  gridDisk,
  cellToLatLng,
  getResolution,
} from "h3-js";
import { H3_RESOLUTION } from "../constants/game";

/** GPS 좌표 → H3 셀 인덱스 */
export function gpsToH3(lat: number, lng: number): string {
  return latLngToCell(lat, lng, H3_RESOLUTION);
}

/** H3 셀 → 지도에 그릴 폴리곤 꼭짓점 배열 */
export function h3ToBoundary(
  h3Index: string
): { latitude: number; longitude: number }[] {
  const boundary = cellToBoundary(h3Index);
  return boundary.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
}

/** H3 셀 주변 N칸 내의 모든 셀 인덱스 */
export function getNeighbors(h3Index: string, radius = 1): string[] {
  return gridDisk(h3Index, radius).filter((idx) => idx !== h3Index);
}

/** H3 셀 중심 좌표 */
export function h3ToCenter(h3Index: string): { lat: number; lng: number } {
  const [lat, lng] = cellToLatLng(h3Index);
  return { lat, lng };
}

/** 두 H3 셀이 인접한지 확인 */
export function areNeighbors(a: string, b: string): boolean {
  return gridDisk(a, 1).includes(b);
}

/** 뷰포트(bounding box) 안에 있는 H3 셀들 반환 */
export function getCellsInBoundingBox(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): string[] {
  // 뷰포트 4개 꼭짓점 + 중앙의 H3 셀들 커버
  const step = 5; // 도 단위 샘플링 간격
  const cells = new Set<string>();

  for (let lat = minLat; lat <= maxLat; lat += step) {
    for (let lng = minLng; lng <= maxLng; lng += step) {
      cells.add(latLngToCell(lat, lng, H3_RESOLUTION));
    }
  }

  // 경계도 포함
  cells.add(latLngToCell(minLat, minLng, H3_RESOLUTION));
  cells.add(latLngToCell(minLat, maxLng, H3_RESOLUTION));
  cells.add(latLngToCell(maxLat, minLng, H3_RESOLUTION));
  cells.add(latLngToCell(maxLat, maxLng, H3_RESOLUTION));
  cells.add(
    latLngToCell(
      (minLat + maxLat) / 2,
      (minLng + maxLng) / 2,
      H3_RESOLUTION
    )
  );

  return Array.from(cells);
}
