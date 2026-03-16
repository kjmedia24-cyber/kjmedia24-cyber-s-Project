import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { useMapCells } from "../../hooks/useMapCells";
import { COLORS } from "../../constants/game";
import { LinearGradient } from "expo-linear-gradient";

export default function MapScreenWeb() {
  useMapCells();
  const { cells, profile } = useGameStore();
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const cellList = Array.from(cells.values());

  useEffect(() => {
    // 웹에서는 Leaflet 지도 사용
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // 지도 초기화
    const map = L.map(mapRef.current).setView([37.5665, 126.978], 4);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "©Carto",
      subdomains: "abcd",
    }).addTo(map);

    // H3 셀 렌더링 (간단 버전 - 중심점만 표시)
    cellList.forEach((cell) => {
      const [lat, lng] = (window as any).h3?.cellToLatLng?.(cell.h3_index) ?? [0, 0];
      if (lat && lng) {
        L.circleMarker([lat, lng], {
          radius: 20,
          fillColor: cell.virus_color,
          color: cell.virus_color,
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.5,
        })
          .addTo(map)
          .bindPopup(`🦠 ${cell.virus_name}`);
      }
    });

    return () => map.remove();
  }, [mapLoaded, cellList.length]);

  return (
    <View style={styles.container}>
      {/* 지도 */}
      <div
        ref={mapRef as any}
        style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
      />

      {/* 상단 HUD */}
      <SafeAreaView style={styles.hud} edges={["top"]}>
        <View style={styles.hudInner}>
          <View style={styles.hudLeft}>
            <Text style={styles.hudEmoji}>🦠</Text>
            <View>
              <Text style={styles.hudVirusName}>{profile?.virus_name ?? "바이러스"}</Text>
              <Text style={styles.hudCells}>{profile?.total_cells ?? 0} 구역 점령</Text>
            </View>
          </View>
          <Text style={styles.hudPoints}>⚡ {profile?.points ?? 0}p</Text>
        </View>
      </SafeAreaView>

      {/* 웹 안내 */}
      <View style={styles.webBanner}>
        <Text style={styles.webBannerText}>
          📱 GPS 전파는 모바일 앱에서만 가능해요
        </Text>
      </View>

      {/* 셀 카운트 */}
      <View style={styles.statsBox}>
        <Text style={styles.statsText}>🌍 전세계 감염 구역: {cellList.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.mapBackground },
  hud: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  hudInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(10,10,26,0.85)",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hudLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  hudEmoji: { fontSize: 28 },
  hudVirusName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  hudCells: { fontSize: 12, color: COLORS.textMuted },
  hudPoints: { fontSize: 15, fontWeight: "700", color: COLORS.accent },
  webBanner: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: "rgba(10,10,26,0.9)",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
  },
  webBannerText: { color: COLORS.textMuted, fontSize: 14 },
  statsBox: {
    position: "absolute",
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: "rgba(124,58,237,0.2)",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
    zIndex: 10,
  },
  statsText: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
});
