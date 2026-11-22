import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { deleteSavedTrip, fetchSavedTrips, type SavedTrip } from '../api/savedTrips';
import { radii, shadows, spacing, typography, useAppTheme, type ThemeColors } from '../theme';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<BottomTabNavigationProp<MainTabParamList, 'SavedTrips'>, NativeStackNavigationProp<RootStackParamList>>;

const COVERS = [
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80',
];

function coverFor(key: string): string {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return COVERS[sum % COVERS.length];
}

function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRange(from?: string, to?: string): string {
  if (!from && !to) return 'Dates not set';
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  return formatDate(from || to);
}

export function SavedTripsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await fetchSavedTrips();
      setTrips(data);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Could not load saved trips.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(false); };

  const openTrip = (trip: SavedTrip) => {
    navigation.navigate('TripResults', {
      savedTripId: trip.id,
      url: trip.url,
      title: trip.title,
      country: trip.country,
      from: trip.from,
      to: trip.to,
      travelers: trip.travelers,
      budget: trip.budget,
      originLabel: trip.originLabel,
      destinationName: trip.destinationName,
      destinationCountry: trip.destinationCountry,
      originLat: trip.originLat,
      originLng: trip.originLng,
      destinationLat: trip.destinationLat,
      destinationLng: trip.destinationLng,
    });
  };

  const confirmDelete = (trip: SavedTrip) => {
    Alert.alert('Remove saved trip', `Remove "${trip.title}" from your saved trips?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavedTrip(trip.id);
            setTrips((prev) => prev.filter((t) => t.id !== trip.id));
          } catch {
            Alert.alert('Could not remove trip', 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Saved trips</Text>
            <Text style={styles.subtitle}>Your planned adventures, ready when you are.</Text>
          </View>
          <View style={styles.countBadge}><Text style={styles.countBadgeText}>{trips.length} saved</Text></View>
        </View>

        {loading ? <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} /> : null}
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => load()} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></Pressable></View> : null}

        {!loading && !error && trips.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}><Text style={styles.emptyIcon}>✈</Text></View>
            <Text style={styles.emptyTitle}>No saved trips yet</Text>
            <Text style={styles.emptyText}>When you save a trip, it will show up here with its dates, travelers, and planning details.</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {trips.map((trip) => (
            <View key={trip.id} style={styles.card}>
              <ImageBackground source={{ uri: coverFor(trip.id + trip.title) }} style={styles.coverImage} imageStyle={styles.coverImageRadius} resizeMode="cover">
                <View style={styles.coverOverlay} />
                <View style={styles.coverTop}>
                  <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>Saved</Text></View>
                </View>
                <View style={styles.coverBottom}>
                  <Text style={styles.cardTitle}>{trip.title}</Text>
                  <Text style={styles.cardCountry}>{trip.country || trip.destinationCountry || ''}</Text>
                </View>
              </ImageBackground>
              <View style={styles.cardBody}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaText}>{formatRange(trip.from, trip.to)}</Text>
                  <Text style={styles.metaText}>{trip.travelers} traveler{trip.travelers === 1 ? '' : 's'}{trip.budget ? ` · ${trip.budget}` : ''}</Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]} onPress={() => openTrip(trip)}><Text style={styles.primaryActionText}>Open trip</Text></Pressable>
                  <Pressable style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]} onPress={() => confirmDelete(trip)}><Text style={styles.secondaryActionText}>Remove</Text></Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.canvas },
    container: { flex: 1, backgroundColor: colors.canvas },
    content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
    title: { ...typography.title, color: colors.ink, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.body, maxWidth: 260 },
    countBadge: { backgroundColor: colors.brand50, borderColor: colors.brand100, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill },
    countBadgeText: { ...typography.caption, color: colors.brandStrong, fontWeight: '700' },
    errorBox: { backgroundColor: 'rgba(249,112,102,0.12)', borderColor: 'rgba(249,112,102,0.35)', borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg },
    errorText: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
    retryBtn: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm, backgroundColor: colors.brand50 },
    retryText: { ...typography.caption, color: colors.brandStrong, fontWeight: '700' },
    list: { gap: spacing.lg },
    card: { backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.lineSoft, ...shadows.soft },
    coverImage: { height: 170, justifyContent: 'space-between' },
    coverImageRadius: { borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg },
    coverOverlay: { ...{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, backgroundColor: 'rgba(11,20,25,0.3)' },
    coverTop: { alignItems: 'flex-end', padding: spacing.md },
    coverBottom: { padding: spacing.lg },
    statusBadge: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: radii.pill },
    statusBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
    cardTitle: { ...typography.heading, fontSize: 22, color: '#FFFFFF', marginBottom: 2 },
    cardCountry: { ...typography.body, color: 'rgba(255,255,255,0.88)' },
    cardBody: { padding: spacing.lg },
    metaBlock: { gap: 4, marginBottom: spacing.lg },
    metaText: { ...typography.caption, color: colors.body, lineHeight: 20 },
    cardActions: { flexDirection: 'row', gap: spacing.sm },
    primaryAction: { flex: 1, minHeight: 44, borderRadius: radii.md, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    primaryActionPressed: { backgroundColor: colors.brandStrong },
    primaryActionText: { ...typography.label, color: colors.onBrand },
    secondaryAction: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
    secondaryActionPressed: { opacity: 0.85 },
    secondaryActionText: { ...typography.label, color: colors.body },
    emptyCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xxl, borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center', ...shadows.soft },
    emptyIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.brand50, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    emptyIcon: { fontSize: 24, color: colors.brandStrong },
    emptyTitle: { ...typography.heading, color: colors.ink, marginBottom: spacing.sm, textAlign: 'center' },
    emptyText: { ...typography.body, color: colors.body, textAlign: 'center' },
  });
}
