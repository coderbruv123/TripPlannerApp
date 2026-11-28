import { useMemo, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HummingbirdLoader from '../components/HummingbirdLoader';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { radii, shadows, spacing, typography, useAppTheme, type ThemeColors } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
const HERO_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80';

export function RegisterScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register(trimmedName, trimmedEmail, password);
      // Auth state change switches navigation to Main.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account. Please try again.');
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
              <View style={styles.brandBadge}><Text style={styles.brandBadgeText}>GET STARTED</Text></View>
              <Text style={styles.heroTitle}>Create your travel profile</Text>
              <Text style={styles.heroSubtitle}>Save trips, compare stays, and plan with confidence.</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formWrap}>
          <View style={styles.card}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>A few details to get you started.</Text>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <View style={styles.field}><Text style={styles.label}>Full name</Text><TextInput value={name} onChangeText={setName} placeholder="Alex Traveler" placeholderTextColor={colors.faint} textContentType="name" style={styles.input} editable={!loading} /></View>
            <View style={styles.field}><Text style={styles.label}>Email</Text><TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.faint} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" autoComplete="email" style={styles.input} editable={!loading} /></View>
            <View style={styles.field}><Text style={styles.label}>Password</Text><TextInput value={password} onChangeText={setPassword} placeholder="Create a password" placeholderTextColor={colors.faint} secureTextEntry textContentType="newPassword" style={styles.input} editable={!loading} /></View>
            <View style={styles.fieldLast}><Text style={styles.label}>Confirm password</Text><TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter your password" placeholderTextColor={colors.faint} secureTextEntry textContentType="newPassword" style={styles.input} editable={!loading} onSubmitEditing={handleRegister} returnKeyType="go" /></View>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && !loading && styles.primaryButtonPressed, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
              {loading ? <HummingbirdLoader size={26} color={colors.onBrand} /> : <Text style={styles.primaryButtonText}>Create account</Text>}
            </Pressable>
            <Text style={styles.termsText}>By creating an account, you can save trips and preferences across devices.</Text>
          </View>

          <Pressable style={styles.secondaryAction} onPress={() => navigation.navigate('Login')} disabled={loading}>
            <Text style={styles.secondaryActionText}>Already have an account? <Text style={styles.secondaryActionLink}>Sign in</Text></Text>
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
    heroImage: { minHeight: 240, justifyContent: 'flex-end' },
    heroOverlay: { ...{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, backgroundColor: 'rgba(11, 20, 25, 0.45)' },
    heroSafeArea: { flex: 1, justifyContent: 'flex-end' },
    heroContent: { paddingHorizontal: spacing.screenX, paddingBottom: spacing.xxxl },
    brandBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, marginBottom: spacing.lg },
    brandBadgeText: { ...typography.overline, color: '#FFFFFF' },
    heroTitle: { ...typography.display, fontSize: 32, lineHeight: 38, color: '#FFFFFF', marginBottom: spacing.sm },
    heroSubtitle: { ...typography.body, color: 'rgba(255,255,255,0.88)' },
    formWrap: { paddingHorizontal: spacing.screenX, marginTop: -24, paddingBottom: spacing.xxxl },
    card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.lineSoft, ...shadows.card },
    title: { ...typography.title, fontSize: 24, lineHeight: 30, color: colors.ink, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.body, marginBottom: spacing.xl },
    errorBox: { backgroundColor: 'rgba(249, 112, 102, 0.12)', borderColor: 'rgba(249, 112, 102, 0.35)', borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg },
    errorText: { ...typography.caption, color: colors.danger, lineHeight: 20 },
    field: { marginBottom: spacing.lg },
    fieldLast: { marginBottom: spacing.xl },
    label: { ...typography.label, color: colors.ink, marginBottom: spacing.sm },
    input: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: colors.ink },
    primaryButton: { backgroundColor: colors.brand, borderRadius: radii.md, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
    primaryButtonPressed: { backgroundColor: colors.brandStrong },
    buttonDisabled: { opacity: 0.7 },
    primaryButtonText: { ...typography.bodyStrong, color: colors.onBrand },
    termsText: { ...typography.caption, color: colors.muted, textAlign: 'center', marginTop: spacing.lg },
    secondaryAction: { marginTop: spacing.xl, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
    secondaryActionText: { ...typography.body, color: colors.body, fontSize: 15 },
    secondaryActionLink: { color: colors.brandStrong, fontWeight: '600' },
  });
}
