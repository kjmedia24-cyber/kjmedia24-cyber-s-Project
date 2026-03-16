import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import MapView, { Polygon, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useRef, useState, useCallback, useEffect } from "react";
import { useGameStore } from "../../store/gameStore";
import { useLocation } from "../../hooks/useLocation";
import { useMapCells } from "../../hooks/useMapCells";
import { h3ToBoundary, gpsToH3 } from "../../lib/h3";
import {
  spreadAtLocation,
  disinfectAtLocation,
  spreadRemote,
} from "../../services/spreadService";
import { COLORS, GPS_SPREAD_COOLDOWN_MS, REMOTE_SPREAD_COST } from "../../constants/game";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function MapScreen() {
  const { permissionGranted, error: locationError } = useLocation();
  useMapCells();

  const { location, cells, profile, lastSpreadAt, setLastSpreadAt } =
    useGameStore();

  const [mode, setMode] = useState<"spread" | "disinfect" | "remote">("spread");
  const [remoteMode, setRemoteMode] = useState(false);
  const [remoteTap, setRemoteTap] = useState<{ lat: number; lng: number } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  const mapRef = useRef<MapView>(null);

  // 피드백 메시지 표시
  function showFeedback(msg: string) {
    setFeedback(msg);
    feedbackOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(1200),
      Animated.timing(feedbackOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setFeedback(null));
  }

  // 쿨다운 체크
  function isCoolingDown() {
    if (!lastSpreadAt) return false;
    return Date.now() - lastSpreadAt < GPS_SPREAD_COOLDOWN_MS;
  }

  // GPS 전파 / 방역
  async function handleAction() {
    if (!location) {
      Alert.alert("위치 필요", "GPS 위치를 가져오는 중이에요...");
      return;
    }

    if (mode === "spread") {
      if (isCoolingDown()) {
        const remaining = Math.ceil(
          (GPS_SPREAD_COOLDOWN_MS - (Date.now() - lastSpreadAt!)) / 1000
        );
        showFeedback(`⏳ ${remaining}초 후 다시 가능해요`);
        return;
      }
      const result = await spreadAtLocation(location.lat, location.lng);
      showFeedback(result.message);
      if (result.success) setLastSpreadAt(Date.now());
    } else if (mode === "disinfect") {
      const result = await disinfectAtLocation(location.lat, location.lng);
      showFeedback(result.message);
    }
  }

  // 원거리 전파 - 지도 탭
  async function handleMapPress(e: any) {
    if (!remoteMode) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const result = await spreadRemote(latitude, longitude, REMOTE_SPREAD_COST);
    showFeedback(result.message);
    setRemoteMode(false);
  }

  const cellList = Array.from(cells.values());

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: location?.lat ?? 37.5665,
          longitude: location?.lng ?? 126.978,
          latitudeDelta: 30,
          longitudeDelta: 60,
        }}
        mapType="mutedStandard"
        onPress={handleMapPress}
        showsUserLocation={permissionGranted === true}
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      >
        {/* 감염된 헥사곤들 렌더링 */}
        {cellList.map((cell) => {
          const boundary = h3ToBoundary(cell.h3_index);
          const isMyCell = cell.owner_id === profile?.id;
          return (
            <Polygon
              key={cell.h3_index}
              coordinates={boundary}
              fillColor={cell.virus_color + (isMyCell ? "88" : "55")}
              strokeColor={cell.virus_color + "cc"}
              strokeWidth={isMyCell ? 2 : 1}
            />
          );
        })}

        {/* 원거리 타겟 마커 */}
        {remoteTap && (
          <Marker coordinate={{ latitude: remoteTap.lat, longitude: remoteTap.lng }}>
            <Text style={{ fontSize: 28 }}>🎯</Text>
          </Marker>
        )}
      </MapView>

      {/* 상단 HUD */}
      <SafeAreaView style={styles.hud} edges={["top"]}>
        <View style={styles.hudInner}>
          <View style={styles.hudLeft}>
            <Text style={styles.hudEmoji}>🦠</Text>
            <View>
              <Text style={styles.hudVirusName}>
                {profile?.virus_name ?? "바이러스"}
              </Text>
              <Text style={styles.hudCells}>
                {profile?.total_cells ?? 0} 구역 점령
              </Text>
            </View>
          </View>
          <View style={styles.hudRight}>
            <Text style={styles.hudPoints}>⚡ {profile?.points ?? 0}p</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* 피드백 토스트 */}
      {feedback && (
        <Animated.View style={[styles.toast, { opacity: feedbackOpacity }]}>
          <Text style={styles.toastText}>{feedback}</Text>
        </Animated.View>
      )}

      {/* 원거리 모드 안내 */}
      {remoteMode && (
        <View style={styles.remoteBanner}>
          <Text style={styles.remoteBannerText}>
            🎯 지도를 터치해서 원거리 전파! ({REMOTE_SPREAD_COST}p 소모)
          </Text>
          <TouchableOpacity onPress={() => setRemoteMode(false)}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 하단 액션 버튼 */}
      {!remoteMode && (
        <View style={styles.bottomArea}>
          {/* 모드 선택 */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "spread" && styles.modeBtnActive]}
              onPress={() => setMode("spread")}
            >
              <Text style={styles.modeBtnText}>🦠 전파</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "disinfect" && styles.modeBtnActiveRed]}
              onPress={() => setMode("disinfect")}
            >
              <Text style={styles.modeBtnText}>🧹 방역</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, styles.modeBtnRemote]}
              onPress={() => setRemoteMode(true)}
            >
              <Text style={styles.modeBtnText}>🎯 원거리</Text>
            </TouchableOpacity>
          </View>

          {/* 메인 액션 버튼 */}
          <TouchableOpacity
            style={[
              styles.mainBtn,
              mode === "disinfect" ? styles.mainBtnRed : { backgroundColor: profile?.virus_color ?? COLORS.primary },
              isCoolingDown() && mode === "spread" && styles.btnCooldown,
            ]}
            onPress={handleAction}
            activeOpacity={0.8}
          >
            <Text style={styles.mainBtnText}>
              {mode === "spread" ? "🦠 지금 여기 전파!" : "🧹 지금 여기 방역!"}
            </Text>
            {isCoolingDown() && mode === "spread" && (
              <Text style={styles.cooldownText}>쿨다운 중...</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.mapBackground },
  hud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
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
  hudRight: {},
  hudPoints: { fontSize: 15, fontWeight: "700", color: COLORS.accent },
  toast: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  toastText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  remoteBanner: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  remoteBannerText: { color: COLORS.text, fontSize: 14, flex: 1 },
  cancelText: { color: COLORS.danger, fontWeight: "700", marginLeft: 12 },
  bottomArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  modeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(30,30,58,0.9)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  modeBtnActiveRed: {
    backgroundColor: COLORS.danger,
    borderColor: "#fca5a5",
  },
  modeBtnRemote: {
    backgroundColor: "rgba(6,182,212,0.2)",
    borderColor: COLORS.accent,
  },
  modeBtnText: { color: COLORS.text, fontWeight: "600", fontSize: 14 },
  mainBtn: {
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  mainBtnRed: { backgroundColor: COLORS.danger },
  btnCooldown: { opacity: 0.6 },
  mainBtnText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  cooldownText: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
});

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0d0d1f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#050a18" }] },
  { featureType: "road", stylers: [{ visibility: "simplified" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2d2d5e" }, { weight: 1 }],
  },
];
