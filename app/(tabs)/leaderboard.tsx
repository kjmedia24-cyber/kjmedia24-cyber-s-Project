import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useGameStore } from "../../store/gameStore";
import { LeaderboardEntry } from "../../types";
import { COLORS } from "../../constants/game";
import { LinearGradient } from "expo-linear-gradient";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const profile = useGameStore((s) => s.profile);

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from("leaderboard_view")
      .select("*")
      .order("cell_count", { ascending: false })
      .limit(50);
    if (data) setEntries(data as LeaderboardEntry[]);
  }

  useEffect(() => {
    fetchLeaderboard().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  }, []);

  const myRank = entries.findIndex((e) => e.id === profile?.id) + 1;

  return (
    <LinearGradient colors={["#0a0a1a", "#12062e"]} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 글로벌 랭킹</Text>
          {myRank > 0 && (
            <Text style={styles.myRank}>내 순위: #{myRank}</Text>
          )}
        </View>

        {loading ? (
          <ActivityIndicator
            color={COLORS.primaryLight}
            size="large"
            style={{ marginTop: 60 }}
          />
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primaryLight}
              />
            }
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => {
              const isMe = item.id === profile?.id;
              return (
                <View
                  style={[
                    styles.row,
                    isMe && { borderColor: item.virus_color, borderWidth: 1.5 },
                  ]}
                >
                  {/* 순위 */}
                  <View style={styles.rankArea}>
                    {index < 3 ? (
                      <Text style={styles.medal}>{MEDALS[index]}</Text>
                    ) : (
                      <Text style={styles.rank}>#{index + 1}</Text>
                    )}
                  </View>

                  {/* 바이러스 색 점 */}
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: item.virus_color },
                    ]}
                  />

                  {/* 이름 */}
                  <View style={styles.nameArea}>
                    <Text style={[styles.virusName, { color: item.virus_color }]}>
                      {item.virus_name}
                    </Text>
                    <Text style={styles.username}>@{item.username}</Text>
                  </View>

                  {/* 셀 수 */}
                  <View style={styles.cellArea}>
                    <Text style={styles.cellCount}>{item.cell_count}</Text>
                    <Text style={styles.cellLabel}>구역</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🌍</Text>
                <Text style={styles.emptyText}>아직 아무도 없어요!</Text>
                <Text style={styles.emptySubtext}>첫 번째로 전파를 시작해봐요</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.text },
  myRank: { fontSize: 14, color: COLORS.primaryLight, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  rankArea: { width: 36, alignItems: "center" },
  medal: { fontSize: 22 },
  rank: { fontSize: 14, fontWeight: "700", color: COLORS.textMuted },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  nameArea: { flex: 1 },
  virusName: { fontSize: 16, fontWeight: "700" },
  username: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  cellArea: { alignItems: "flex-end" },
  cellCount: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  cellLabel: { fontSize: 11, color: COLORS.textMuted },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyText: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  emptySubtext: { fontSize: 14, color: COLORS.textMuted },
});
