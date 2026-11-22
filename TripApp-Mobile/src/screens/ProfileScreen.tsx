import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as authApi from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { radii, shadows, spacing, typography, useAppTheme, type ThemeColors } from '../theme';

const COVER_IMAGE = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

type ProfileForm = { fullName: string; nickname: string; email: string; phone: string; address: string; occupation: string; location: string };
const EMPTY_FORM: ProfileForm = { fullName: '', nickname: '', email: '', phone: '', address: '', occupation: '', location: '' };

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function mapUserToForm(user: authApi.AuthUser | { username: string; email: string; nickname?: string | null; phone?: string | null; address?: string | null; occupation?: string | null; location?: string | null }): ProfileForm {
  return {
    fullName: user.username || '',
    nickname: user.nickname || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    occupation: user.occupation || '',
    location: user.location || '',
  };
}

export function ProfileScreen() {
  const { colors, mode, setMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, logout, refreshUser } = useAuth();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailUpdatesEnabled, setEmailUpdatesEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingProfile(true);
      setProfileMsg(null);
      try {
        const me = await authApi.getMe();
        if (cancelled) return;
        setForm(mapUserToForm(me));
        await refreshUser();
      } catch {
        if (cancelled) return;
        if (user) setForm(mapUserToForm(user));
        setProfileMsg({ kind: 'error', text: 'Could not load your latest profile. Showing saved account info.' });
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => { cancelled = true; };
    // Load once on mount; refreshUser/user are intentionally not dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setProfileMsg(null);
  };

  const handleSaveProfile = async () => {
    const username = form.fullName.trim();
    const email = form.email.trim();
    if (!username) { setProfileMsg({ kind: 'error', text: 'Full name is required.' }); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setProfileMsg({ kind: 'error', text: 'Enter a valid email address.' }); return; }

    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const result = await authApi.updateProfile({
        username,
        email,
        nickname: form.nickname.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        occupation: form.occupation.trim(),
        location: form.location.trim(),
      });
      if (!result.success) {
        setProfileMsg({ kind: 'error', text: result.message || 'Could not save profile.' });
        return;
      }
      if (result.data) setForm(mapUserToForm(result.data));
      await refreshUser();
      setProfileMsg({ kind: 'success', text: result.message || 'Profile saved.' });
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setProfileMsg({ kind: 'error', text: msg || 'Could not save profile. Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) { setPasswordMsg({ kind: 'error', text: 'Fill in all password fields.' }); return; }
    if (newPassword.length < 8) { setPasswordMsg({ kind: 'error', text: 'New password must be at least 8 characters.' }); return; }
    if (newPassword !== confirmNewPassword) { setPasswordMsg({ kind: 'error', text: 'New passwords do not match.' }); return; }

    setChangingPassword(true);
    setPasswordMsg(null);
    try {
      const result = await authApi.changePassword({ currentPassword, newPassword, confirmNewPassword });
      if (!result.success) {
        setPasswordMsg({ kind: 'error', text: result.message || 'Could not change password.' });
        return;
      }
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
      setPasswordMsg({ kind: 'success', text: result.message || 'Password updated.' });
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPasswordMsg({ kind: 'error', text: msg || 'Could not change password. Please try again.' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } finally { setLoggingOut(false); }
  };

  const displayName = form.fullName || user?.username || 'Traveler';
  const email = form.email || user?.email || 'No email';

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ImageBackground source={{ uri: COVER_IMAGE }} style={styles.coverImage} imageStyle={styles.coverRadius} resizeMode="cover">
          <View style={styles.coverOverlay} />
          <SafeAreaView edges={['top']} style={styles.coverSafe}>
            <View style={styles.header}>
              <View style={styles.eyebrowBadge}><Text style={styles.eyebrowText}>ACCOUNT</Text></View>
              <Text style={styles.title}>Profile & settings</Text>
              <Text style={styles.subtitle}>Manage your account details, preferences, and security.</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(displayName)}</Text></View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <View style={styles.profileBadge}><Text style={styles.profileBadgeText}>{user?.role || 'Member'}</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal info</Text>
          <View style={styles.card}>
            {loadingProfile ? <ActivityIndicator color={colors.brand} style={{ marginBottom: spacing.md }} /> : null}
            {profileMsg ? <View style={[styles.msgBox, profileMsg.kind === 'error' ? styles.msgError : styles.msgSuccess]}><Text style={[styles.msgText, profileMsg.kind === 'error' ? styles.msgTextError : styles.msgTextSuccess]}>{profileMsg.text}</Text></View> : null}
            <Field label="Full name" value={form.fullName} onChangeText={(v) => updateField('fullName', v)} colors={colors} styles={styles} />
            <Field label="Email" value={form.email} onChangeText={(v) => updateField('email', v)} colors={colors} styles={styles} keyboardType="email-address" autoCapitalize="none" />
            <Field label="Nickname" value={form.nickname} onChangeText={(v) => updateField('nickname', v)} colors={colors} styles={styles} placeholder="Optional nickname" />
            <Field label="Phone" value={form.phone} onChangeText={(v) => updateField('phone', v)} colors={colors} styles={styles} placeholder="Optional phone" keyboardType="phone-pad" />
            <Field label="Address" value={form.address} onChangeText={(v) => updateField('address', v)} colors={colors} styles={styles} placeholder="Optional address" />
            <Field label="Occupation" value={form.occupation} onChangeText={(v) => updateField('occupation', v)} colors={colors} styles={styles} placeholder="Optional occupation" />
            <Field label="Location" value={form.location} onChangeText={(v) => updateField('location', v)} colors={colors} styles={styles} placeholder="Optional location" />
            <Pressable style={({ pressed }) => [styles.inlineAction, pressed && !savingProfile && styles.inlineActionPressed, savingProfile && styles.disabled]} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color={colors.brandStrong} /> : <Text style={styles.inlineActionText}>Save profile</Text>}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}><Text style={styles.toggleLabel}>Dark mode</Text><Text style={styles.toggleDescription}>Switch between light and dark appearance.</Text></View>
              <Switch value={mode === 'dark'} onValueChange={(value) => setMode(value ? 'dark' : 'light')} trackColor={{ false: colors.line, true: colors.brand100 }} thumbColor={mode === 'dark' ? colors.brand : colors.faint} />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}><Text style={styles.toggleLabel}>Trip notifications</Text><Text style={styles.toggleDescription}>Get reminders and trip updates.</Text></View>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: colors.line, true: colors.brand100 }} thumbColor={notificationsEnabled ? colors.brand : colors.faint} />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}><Text style={styles.toggleLabel}>Email updates</Text><Text style={styles.toggleDescription}>Receive product and travel inspiration emails.</Text></View>
              <Switch value={emailUpdatesEnabled} onValueChange={setEmailUpdatesEnabled} trackColor={{ false: colors.line, true: colors.brand100 }} thumbColor={emailUpdatesEnabled ? colors.brand : colors.faint} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            {passwordMsg ? <View style={[styles.msgBox, passwordMsg.kind === 'error' ? styles.msgError : styles.msgSuccess]}><Text style={[styles.msgText, passwordMsg.kind === 'error' ? styles.msgTextError : styles.msgTextSuccess]}>{passwordMsg.text}</Text></View> : null}
            <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} colors={colors} styles={styles} secureTextEntry placeholder="Enter current password" />
            <Field label="New password" value={newPassword} onChangeText={setNewPassword} colors={colors} styles={styles} secureTextEntry placeholder="At least 8 characters" />
            <Field label="Confirm new password" value={confirmNewPassword} onChangeText={setConfirmNewPassword} colors={colors} styles={styles} secureTextEntry placeholder="Re-enter new password" />
            <Pressable style={({ pressed }) => [styles.inlineAction, pressed && !changingPassword && styles.inlineActionPressed, changingPassword && styles.disabled]} onPress={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <ActivityIndicator color={colors.brandStrong} /> : <Text style={styles.inlineActionText}>Change password</Text>}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <View style={styles.card}>
            <Text style={styles.logoutText}>Sign out of this device. You’ll need to sign in again to access your trips.</Text>
            <Pressable style={({ pressed }) => [styles.logoutButton, pressed && !loggingOut && styles.logoutButtonPressed, loggingOut && styles.disabled]} onPress={handleLogout} disabled={loggingOut}>
              {loggingOut ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.logoutButtonText}>Log out</Text>}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChangeText, colors, styles, placeholder, secureTextEntry, keyboardType, autoCapitalize }: { label: string; value: string; onChangeText: (v: string) => void; colors: ThemeColors; styles: ReturnType<typeof createStyles>; placeholder?: string; secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' | 'phone-pad'; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.faint} style={styles.input} secureTextEntry={secureTextEntry} keyboardType={keyboardType ?? 'default'} autoCapitalize={autoCapitalize ?? 'sentences'} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.canvas },
    container: { flex: 1, backgroundColor: colors.canvas },
    content: { paddingBottom: spacing.xxxl },
    coverImage: { minHeight: 240, justifyContent: 'flex-end' },
    coverRadius: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    coverOverlay: { ...{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, backgroundColor: 'rgba(11,20,25,0.42)', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    coverSafe: { flex: 1, justifyContent: 'flex-end' },
    header: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
    eyebrowBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radii.pill, marginBottom: spacing.lg },
    eyebrowText: { ...typography.overline, color: '#FFFFFF' },
    title: { ...typography.title, color: '#FFFFFF', marginBottom: spacing.sm },
    subtitle: { ...typography.body, color: 'rgba(255,255,255,0.88)' },
    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.lineSoft, marginHorizontal: spacing.screenX, marginTop: -20, marginBottom: spacing.xxl, ...shadows.soft },
    avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.brand50, borderWidth: 1, borderColor: colors.brand100, alignItems: 'center', justifyContent: 'center', marginRight: spacing.lg },
    avatarText: { fontSize: 22, fontWeight: '800', color: colors.brandStrong },
    profileInfo: { flex: 1 },
    profileName: { ...typography.heading, fontSize: 20, color: colors.ink, marginBottom: 2 },
    profileEmail: { ...typography.caption, color: colors.body, marginBottom: spacing.sm },
    profileBadge: { alignSelf: 'flex-start', backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: radii.pill },
    profileBadgeText: { fontSize: 11, fontWeight: '700', color: colors.muted },
    section: { marginBottom: spacing.xl, paddingHorizontal: spacing.screenX },
    sectionTitle: { ...typography.label, color: colors.muted, marginBottom: spacing.sm, paddingHorizontal: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.8 },
    card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.lineSoft, ...shadows.soft },
    msgBox: { borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
    msgError: { backgroundColor: 'rgba(249,112,102,0.12)', borderColor: 'rgba(249,112,102,0.35)' },
    msgSuccess: { backgroundColor: colors.brand50, borderColor: colors.brand100 },
    msgText: { ...typography.caption, lineHeight: 20 },
    msgTextError: { color: colors.danger },
    msgTextSuccess: { color: colors.brandStrong },
    field: { marginBottom: spacing.md },
    fieldLabel: { ...typography.label, color: colors.ink, marginBottom: spacing.xs },
    input: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.ink },
    inlineAction: { marginTop: spacing.sm, minHeight: 46, borderRadius: radii.md, borderWidth: 1, borderColor: colors.brand100, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center' },
    inlineActionPressed: { opacity: 0.9 },
    inlineActionText: { ...typography.label, color: colors.brandStrong },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
    toggleCopy: { flex: 1 },
    toggleLabel: { ...typography.bodyStrong, color: colors.ink, marginBottom: 2 },
    toggleDescription: { ...typography.caption, color: colors.body, lineHeight: 20 },
    divider: { height: 1, backgroundColor: colors.lineSoft, marginVertical: spacing.md },
    logoutText: { ...typography.body, color: colors.body, marginBottom: spacing.lg },
    logoutButton: { minHeight: 48, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(249, 112, 102, 0.35)', backgroundColor: 'rgba(249, 112, 102, 0.1)', alignItems: 'center', justifyContent: 'center' },
    logoutButtonPressed: { opacity: 0.9 },
    disabled: { opacity: 0.7 },
    logoutButtonText: { ...typography.bodyStrong, color: colors.danger },
  });
}
