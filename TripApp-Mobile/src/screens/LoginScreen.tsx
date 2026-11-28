import { useMemo, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HummingbirdLoader from '../components/HummingbirdLoader';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { radii, shadows, spacing, typography, useAppTheme, type ThemeColors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
const HERO_IMAGE = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80';

export function LoginScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(trimmedEmail, password);
      // Auth state change switches navigation to Main.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" bounces={false}>
        <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover">
          <View style={styles.heroOverlay} />
          <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
            <View style={styles.heroContent}>
              <View style={styles.brandBadge}><Text style={styles.brandBadgeText}>TRIPPLANNER</Text></View>
              <Text style={styles.heroTitle}>Your next journey starts here</Text>
              <Text style={styles.heroSubtitle}>Discover places, plan smarter, and travel beautifully.</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formWrap}>
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to pick up where you left off.</Text>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.faint} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" autoComplete="email" style={styles.input} editable={!loading} />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={colors.faint} secureTextEntry textContentType="password" autoComplete="password" style={styles.input} editable={!loading} onSubmitEditing={handleLogin} returnKeyType="go" />
            </View>
            <Pressable style={styles.forgotAction} onPress={() => {}} disabled={loading}><Text style={styles.forgotText}>Forgot password?</Text></Pressable>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && !loading && styles.primaryButtonPressed, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
              {loading ? <HummingbirdLoader size={26} color={colors.onBrand} /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
            </Pressable>
          </View>

          <Pressable style={styles.secondaryAction} onPress={() => navigation.navigate('Register')} disabled={loading}>
            <Text style={styles.secondaryActionText}>New to TripPlanner? <Text style={styles.secondaryActionLink}>Create an account</Text></Text>
          </Pressable>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.canvas },
    scrollContent: { flexGrow: 1 },
    heroImage: { minHeight: 280, justifyContent: 'flex-end' },
    heroOverlay: { ...{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, backgroundColor: 'rgba(11, 20, 25, 0.45)' },
    heroSafeArea: { flex: 1, justifyContent: 'flex-end' },
    heroContent: { paddingHorizontal: spacing.screenX, paddingBottom: spacing.xxxl },
    brandBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, marginBottom: spacing.lg },
    brandBadgeText: { ...typography.overline, color: '#FFFFFF' },
    heroTitle: { ...typography.display, color: '#FFFFFF', marginBottom: spacing.sm },
    heroSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.88)', maxWidth: 320 },
    formWrap: { paddingHorizontal: spacing.screenX, marginTop: -24, paddingBottom: spacing.xxxl },
    card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.lineSoft, ...shadows.card },
    title: { ...typography.title, fontSize: 24, lineHeight: 30, color: colors.ink, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.body, marginBottom: spacing.xl },
    errorBox: { backgroundColor: 'rgba(249, 112, 102, 0.12)', borderColor: 'rgba(249, 112, 102, 0.35)', borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg },
    errorText: { ...typography.caption, color: colors.danger, lineHeight: 20 },
    field: { marginBottom: spacing.lg },
    label: { ...typography.label, color: colors.ink, marginBottom: spacing.sm },
    input: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: colors.ink },
    forgotAction: { alignSelf: 'flex-end', marginBottom: spacing.lg, minHeight: 44, justifyContent: 'center' },
    forgotText: { ...typography.label, color: colors.brandStrong },
    primaryButton: { backgroundColor: colors.brand, borderRadius: radii.md, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
    primaryButtonPressed: { backgroundColor: colors.brandStrong },
    buttonDisabled: { opacity: 0.7 },
    primaryButtonText: { ...typography.bodyStrong, color: colors.onBrand },
    secondaryAction: { marginTop: spacing.xl, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
    secondaryActionText: { ...typography.body, color: colors.body, fontSize: 15 },
    secondaryActionLink: { color: colors.brandStrong, fontWeight: '600' },
  });
}
