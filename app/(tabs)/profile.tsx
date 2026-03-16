import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { useGameStore } from "../../store/gameStore";
import { SpreadEvent } from "../../types";
import { COLORS } from "../../constants/game";
import { router } from "expo-router";

const EVENT_LABELS: Record<string, string> = {
  gps_spread: "🦠 GPS 전파",
  remote_spread: "🎯 원거리 전파",
  disinfect: "🧹 방역",
  natural: "🌱 자동 확산",
};

export default function ProfileScreen() {
  const profile = useGameStore((s) => s.profile);
  const setProfile = useGameStore((s) => s.setProfile);
  const [events, setEvents] = useState<SpreadEvent[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("spread_events")
      .select("*")
      .eq("actor_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setEvents(data as SpreadEvent[]);
      });
  }, [profile]);

  async function handleLogout() {
    Alert.alert("로그아웃", "정말 로그아웃 할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          setProfile(null);
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  if (!profile) return null;

  return (
    <LinearGradient colors={["#0a0a1a", "#12062e"]} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.inner}>
          {/* 바이러스 카드 */}
          <View style={[styles.virusCard, { borderColor: profile.virus_color }]}>
            <Text style={styles.virusEmoji}>🦠</Text>
            <Text style={[styles.virusName, { color: profile.virus_color }]}>
              {profile.virus_name}
            </Text>
            <Text style={styles.username}>@{profile.username}</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{profile.total_cells}</Text>
                <Text style={styles.statLabel}>점령 구역</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: COLORS.accent }]}>
                  {profile.points}
                </Text>
                <Text style={styles.statLabel}>포인트</Text>
              </View>
            </View>
          </View>

          {/* 색상 표시 */}
          <View style={styles.colorRow}>
            <Text style={styles.sectionTitle}>바이러스 색상</Text>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: profile.virus_color },
              ]}
            />
          </View>

          {/* 최근 활동 */}
          <Text style={styles.sectionTitle}>최근 활동</Text>
          {events.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyText}>아직 활동 내역이 없어요</Text>
              <Text style={styles.emptySubtext}>지도에서 전파를 시작해봐요! 🦠</Text>
            </View>
          ) : (
            events.map((e) => (
              <View key={e.id} style={styles.eventRow}>
                <Text style={styles.eventLabel}>
                  {EVENT_LABELS[e.event_type] ?? e.event_type}
                </Text>
                <View style={styles.eventRight}>
                  {e.points_spent > 0 && (
                    <Text style={styles.eventPoints}>-{e.points_spent}p</Text>
                  )}
                  <Text style={styles.eventTime}>
                    {new Date(e.created_at).toLocaleDateString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* 로그아웃 */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  virusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  virusEmoji: { fontSize: 56 },
  virusName: { fontSize: 28, fontWeight: "800" },
  username: { fontSize: 15, color: COLORS.textMuted },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 24,
  },
  stat: { alignItems: "center", gap: 4 },
  statNum: { fontSize: 28, fontWeight: "800", color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textMuted },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: -8,
  },
  emptyActivity: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { fontSize: 16, color: COLORS.text, fontWeight: "600" },
  emptySubtext: { fontSize: 13, color: COLORS.textMuted },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  eventRight: { alignItems: "flex-end", gap: 2 },
  eventPoints: { fontSize: 13, color: COLORS.danger, fontWeight: "600" },
  eventTime: { fontSize: 12, color: COLORS.textMuted },
  logoutBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.danger,
    marginTop: 8,
  },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: "700" },
});
