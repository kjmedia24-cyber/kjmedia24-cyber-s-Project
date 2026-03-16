import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { useGameStore } from "../store/gameStore";
import { COLORS, STARTING_POINTS } from "../constants/game";

const PRESET_COLORS = [
  "#ef4444", // 빨강
  "#f97316", // 주황
  "#eab308", // 노랑
  "#22c55e", // 초록
  "#06b6d4", // 하늘
  "#3b82f6", // 파랑
  "#8b5cf6", // 보라
  "#ec4899", // 핑크
  "#14b8a6", // 민트
  "#f43f5e", // 로즈
  "#a855f7", // 라벤더
  "#84cc16", // 라임
];

const VIRUS_EMOJIS = ["🦠", "👾", "☣️", "🔮", "💜", "🌀", "⚡", "🌸"];

export default function OnboardingScreen() {
  const [username, setUsername] = useState("");
  const [virusName, setVirusName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState(VIRUS_EMOJIS[0]);
  const [loading, setLoading] = useState(false);
  const setProfile = useGameStore((s) => s.setProfile);

  async function handleCreate() {
    if (!username.trim() || !virusName.trim()) {
      Alert.alert("잠깐!", "닉네임과 바이러스 이름을 입력해줘요 🦠");
      return;
    }
    if (username.trim().length < 2) {
      Alert.alert("잠깐!", "닉네임은 2자 이상이어야 해요");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: username.trim(),
        virus_name: virusName.trim(),
        virus_color: selectedColor,
        points: STARTING_POINTS,
        total_cells: 0,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        Alert.alert("이미 사용 중인 닉네임이에요 😢");
      } else {
        Alert.alert("오류", error.message);
      }
      return;
    }

    setProfile(data);
    router.replace("/(tabs)/map");
  }

  return (
    <LinearGradient colors={["#0a0a1a", "#1a0a2e"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>🦠 바이러스 만들기</Text>
          <Text style={styles.desc}>
            나만의 바이러스로 전세계를 감염시켜봐!
          </Text>
        </View>

        {/* 미리보기 */}
        <View style={[styles.preview, { borderColor: selectedColor }]}>
          <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
          <Text style={[styles.previewName, { color: selectedColor }]}>
            {virusName || "내 바이러스"}
          </Text>
          <Text style={styles.previewUsername}>@{username || "닉네임"}</Text>
        </View>

        {/* 닉네임 */}
        <View style={styles.section}>
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            style={styles.input}
            placeholder="전세계에 표시될 이름"
            placeholderTextColor={COLORS.textMuted}
            value={username}
            onChangeText={setUsername}
            maxLength={20}
            autoCapitalize="none"
          />
        </View>

        {/* 바이러스 이름 */}
        <View style={styles.section}>
          <Text style={styles.label}>바이러스 이름</Text>
          <TextInput
            style={styles.input}
            placeholder="ex) 핑크독감, ZeroX, 무적균"
            placeholderTextColor={COLORS.textMuted}
            value={virusName}
            onChangeText={setVirusName}
            maxLength={20}
          />
        </View>

        {/* 색상 선택 */}
        <View style={styles.section}>
          <Text style={styles.label}>바이러스 색상</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorDotSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        </View>

        {/* 이모지 선택 */}
        <View style={styles.section}>
          <Text style={styles.label}>바이러스 이모지</Text>
          <View style={styles.emojiRow}>
            {VIRUS_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={[
                  styles.emojiBtn,
                  selectedEmoji === emoji && {
                    borderColor: selectedColor,
                    backgroundColor: selectedColor + "22",
                  },
                ]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.createBtn,
            { backgroundColor: selectedColor },
            loading && styles.btnDisabled,
          ]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createBtnText}>
            {loading ? "생성 중..." : "🦠 바이러스 탄생!"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 24,
  },
  header: { alignItems: "center", gap: 8 },
  welcomeText: { fontSize: 28, fontWeight: "800", color: COLORS.text },
  desc: { fontSize: 15, color: COLORS.textMuted, textAlign: "center" },
  preview: {
    alignItems: "center",
    gap: 6,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
  },
  previewEmoji: { fontSize: 48 },
  previewName: { fontSize: 22, fontWeight: "700" },
  previewUsername: { fontSize: 14, color: COLORS.textMuted },
  section: { gap: 10 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.textMuted },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotSelected: {
    borderColor: "#fff",
    transform: [{ scale: 1.2 }],
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emojiBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 28 },
  createBtn: {
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  createBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
