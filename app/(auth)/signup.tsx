import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants/game";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password) return;
    if (password !== confirm) {
      Alert.alert("오류", "비밀번호가 일치하지 않아요");
      return;
    }
    if (password.length < 6) {
      Alert.alert("오류", "비밀번호는 6자 이상이어야 해요");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert("회원가입 실패", error.message);
    }
    // 성공 시 _layout.tsx에서 onboarding으로 자동 라우팅
  }

  return (
    <LinearGradient colors={["#0a0a1a", "#12062e"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoArea}>
            <Text style={styles.emoji}>🦠</Text>
            <Text style={styles.title}>Spreado</Text>
            <Text style={styles.subtitle}>바이러스 제국을 세워봐</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호 (6자 이상)"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호 확인"
              placeholderTextColor={COLORS.textMuted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? "가입 중..." : "회원가입"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.link}
            >
              <Text style={styles.linkText}>이미 계정이 있어요</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    gap: 40,
    paddingVertical: 60,
  },
  logoArea: { alignItems: "center", gap: 8 },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 38,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 2,
  },
  subtitle: { fontSize: 15, color: COLORS.textMuted },
  form: { gap: 14 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: COLORS.text,
    fontSize: 16,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  link: { alignItems: "center", paddingTop: 8 },
  linkText: { color: COLORS.primaryLight, fontSize: 15 },
});
