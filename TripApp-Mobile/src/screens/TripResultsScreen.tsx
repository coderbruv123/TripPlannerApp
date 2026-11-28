import { useEffect, useMemo, useState } from 'react';
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { searchTrips } from '../api/trips';
import { saveTrip } from '../api/savedTrips';
import HummingbirdLoader from '../components/HummingbirdLoader';
import { RouteMap } from '../components/RouteMap';
import { radii, shadows, spacing, typography, useAppTheme, type ThemeColors } from '../theme';
import type { FlightOption, RouteOption, TripSearchResult } from '../types/trip';
import type { RootStackParamList } from '../navigation/types';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80';
type Props = NativeStackScreenProps<RootStackParamList, 'TripResults'>;

function fmtDate(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function fmtDuration(minutes?: number | null) {
  if (!minutes || minutes <= 0) return 'N/A';
  const h = Math.floor(minutes / 60); const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtKm(km?: number | null) { return km && km > 0 ? `${Math.round(km)} km` : 'N/A'; }
function fmtPrice(price?: number | null) { return price && price > 0 ? `~€${Math.round(price)}` : 'Indicative N/A'; }

export function TripResultsScreen({ route }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const p = route.params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TripSearchResult | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [searchNonce, setSearchNonce] = useState(0);

  const hasCoords = typeof p?.originLat === 'number' && typeof p?.originLng === 'number' && typeof p?.destinationLat === 'number' && typeof p?.destinationLng === 'number';
  const title = p?.title || (p?.destinationName ? `${p.originLabel || 'Origin'} → ${p.destinationName}` : 'Trip results');
  const dates = p?.from || p?.to ? `${fmtDate(p.from)}${p.from && p.to ? ' – ' : ''}${fmtDate(p.to)}` : 'Dates not set';
  const travelers = p?.travelers ? `${p.travelers} traveler${p.travelers === 1 ? '' : 's'}` : 'Travelers not set';
  const budget = p?.budget || 'No budget';

  useEffect(() => {
    let cancelled = false;
    if (!hasCoords) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchTrips(
          { latitude: p!.originLat!, longitude: p!.originLng!, label: p!.originLabel },
          { latitude: p!.destinationLat!, longitude: p!.destinationLng!, name: p!.destinationName },
        );
        if (!cancelled) {
          setResult(data);
          setSelectedRoute(0);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load trip results.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasCoords, p?.originLat, p?.originLng, p?.destinationLat, p?.destinationLng, p?.originLabel, p?.destinationName, searchNonce]);

  const routes = result?.routes ?? [];
  const flight = result?.flight ?? null;

  const onSave = async () => {
    if (!p?.destinationName) { Alert.alert('Cannot save trip', 'Missing trip details.'); return; }
    setSaving(true);
    try {
      const url = `trip://saved?dest=${encodeURIComponent(p.destinationName)}&olat=${p.originLat ?? ''}&olng=${p.originLng ?? ''}&dlat=${p.destinationLat ?? ''}&dlng=${p.destinationLng ?? ''}`;
      await saveTrip({
        title: p.title || `${p.originLabel || 'Origin'} → ${p.destinationName}`,
        country: p.destinationCountry || p.country || '',
        from: p.from, to: p.to, travelers: p.travelers || 1, budget: p.budget,
        url,
        originLabel: p.originLabel, destinationName: p.destinationName, destinationCountry: p.destinationCountry,
        originLat: p.originLat, originLng: p.originLng, destinationLat: p.destinationLat, destinationLng: p.destinationLng,
      });
      Alert.alert('Trip saved', 'Your trip was saved successfully.');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert('Could not save trip', msg || 'Please try again.');
    } finally { setSaving(false); }
  };

  const renderRoute = (r: RouteOption, idx: number) => {
    const selected = idx === selectedRoute;
    return (
      <Pressable key={`${r.type}-${idx}`} style={[styles.optionCard, selected && styles.optionCardSelected]} onPress={() => setSelectedRoute(idx)}>
        <View style={styles.optionTop}>
          <View style={styles.optionMeta}><Text style={styles.optionMode}>{r.type || 'Route'}</Text><Text style={styles.optionTitle}>{r.name || 'Route option'}</Text></View>
          <View style={[styles.badge, selected && styles.badgeSelected]}><Text style={styles.badgeText}>{selected ? 'Selected' : r.available ? 'Available' : 'Unavailable'}</Text></View>
        </View>
        <View style={styles.optionDetails}>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>Duration</Text><Text style={styles.detailValue}>{fmtDuration(r.durationMinutes)}</Text></View>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>Distance</Text><Text style={styles.detailValue}>{fmtKm(r.distanceKm)}</Text></View>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>Indicative price</Text><Text style={styles.detailValue}>{fmtPrice(r.estimatedPrice)}</Text></View>
        </View>
        {r.message ? <Text style={styles.optionNote}>{r.message}</Text> : null}
        {Array.isArray(r.segments) && r.segments.length > 0 ? (
          <View style={styles.segmentsBox}>
            <Text style={styles.segmentsTitle}>Segments</Text>
            {r.segments.slice(0, 5).map((s, i) => (
              <Text key={i} style={styles.segmentText}>• {s.type || 'Segment'} {s.from || s.to ? `(${s.from || '?'} → ${s.to || '?'})` : ''} {s.durationMinutes ? `· ${fmtDuration(s.durationMinutes)}` : ''}</Text>
            ))}
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.heroImage} imageStyle={styles.heroRadius} resizeMode="cover">
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.eyebrowBadge}><Text style={styles.eyebrowText}>{p?.savedTripId ? 'SAVED TRIP' : 'TRIP RESULTS'}</Text></View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{p?.savedTripId ? 'Saved trip details and route preview' : 'Live route search results'}</Text>
        </View>
      </ImageBackground>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}><Text style={styles.summaryPillLabel}>Dates</Text><Text style={styles.summaryPillValue}>{dates}</Text></View>
          <View style={styles.summaryPill}><Text style={styles.summaryPillLabel}>Travelers</Text><Text style={styles.summaryPillValue}>{travelers}</Text></View>
          <View style={styles.summaryPill}><Text style={styles.summaryPillLabel}>Budget</Text><Text style={styles.summaryPillValue}>{budget}</Text></View>
        </View>
        <Pressable style={({ pressed }) => [styles.saveButton, pressed && !saving && styles.saveButtonPressed, saving && styles.disabled]} onPress={onSave} disabled={saving}>
          {saving ? <HummingbirdLoader size={26} color={colors.onBrand} /> : <Text style={styles.saveButtonText}>Save trip</Text>}
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Route map</Text>
        <Text style={styles.sectionCaption}>{routes.length > 0 ? 'Tap a line to select' : 'Preview'}</Text>
      </View>
      {hasCoords ? (
        <RouteMap
          routes={routes}
          selectedIndex={selectedRoute}
          onSelect={setSelectedRoute}
          origin={{ latitude: p!.originLat!, longitude: p!.originLng!, label: p?.originLabel || 'Origin' }}
          destination={{ latitude: p!.destinationLat!, longitude: p!.destinationLng!, label: p?.destinationName || 'Destination' }}
        />
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Routes</Text>
        <Text style={styles.sectionCaption}>{loading ? 'Searching...' : `${routes.length} option(s)`}</Text>
      </View>
      {loading ? <View style={{ marginVertical: spacing.lg, alignItems: 'center' }}><HummingbirdLoader size={38} color={colors.brand} /></View> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Could not load routes</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            onPress={() => setSearchNonce((n) => n + 1)}
            disabled={loading}
          >
            <Text style={styles.retryButtonText}>Retry search</Text>
          </Pressable>
        </View>
      ) : null}
      {!loading && !error && hasCoords && routes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No routes found</Text>
          <Text style={styles.emptyText}>Try different origin/destination or check back later.</Text>
        </View>
      ) : null}
      {!hasCoords ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Search details missing</Text>
          <Text style={styles.emptyText}>Start a trip search from Home to fetch live routes.</Text>
        </View>
      ) : null}
      {routes.map(renderRoute)}

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Flight</Text><Text style={styles.sectionCaption}>Indicative</Text></View>
      <View style={styles.card}>
        {loading && !result ? (
          <Text style={styles.flightNote}>Flight information will appear after route search completes.</Text>
        ) : flight?.available ? (
          <>
            <Text style={styles.flightTitle}>{flight.airline || 'Flight option'}</Text>
            <Text style={styles.flightMeta}>Duration: {fmtDuration(flight.durationMinutes ?? flight.duration)} · {fmtPrice(flight.estimatedPrice)}</Text>
            {flight.estimated ? <Text style={styles.flightNote}>Estimated values, not live fare/schedule.</Text> : null}
            {flight.message ? <Text style={styles.flightNote}>{flight.message}</Text> : null}
          </>
        ) : (
          <Text style={styles.flightNote}>
            {error
              ? 'Flight information is unavailable because the route search did not complete.'
              : flight?.message || 'Flight information unavailable for this search.'}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    content: { paddingBottom: spacing.xxxl },
    heroImage: { height: 240, justifyContent: 'flex-end' },
    heroRadius: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    heroOverlay: { ...{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, backgroundColor: 'rgba(11,20,25,0.38)', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    heroContent: { padding: spacing.screenX, paddingBottom: spacing.xxl },
    eyebrowBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radii.pill, marginBottom: spacing.md },
    eyebrowText: { ...typography.overline, color: '#FFFFFF' },
    title: { ...typography.title, color: '#FFFFFF', marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: 'rgba(255,255,255,0.88)' },
    summaryCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.lineSoft, marginHorizontal: spacing.screenX, marginTop: -20, marginBottom: spacing.xxl, ...shadows.card },
    summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    summaryPill: { flex: 1, backgroundColor: colors.canvas, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.line },
    summaryPillLabel: { ...typography.caption, color: colors.muted, marginBottom: 2 },
    summaryPillValue: { fontSize: 13, fontWeight: '700', color: colors.ink },
    saveButton: { minHeight: 46, borderRadius: radii.md, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    saveButtonPressed: { backgroundColor: colors.brandStrong },
    saveButtonText: { ...typography.bodyStrong, color: colors.onBrand },
    disabled: { opacity: 0.7 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md, gap: spacing.sm, paddingHorizontal: spacing.screenX },
    sectionTitle: { ...typography.heading, color: colors.ink },
    sectionCaption: { ...typography.caption, color: colors.muted },
    errorBox: { marginHorizontal: spacing.screenX, backgroundColor: 'rgba(249,112,102,0.12)', borderColor: 'rgba(249,112,102,0.35)', borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md },
    errorTitle: { ...typography.bodyStrong, color: colors.ink, marginBottom: 4 },
    errorText: { ...typography.caption, color: colors.danger, lineHeight: 20 },
    retryButton: { marginTop: spacing.md, alignSelf: 'flex-start', backgroundColor: colors.brand, borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
    retryButtonPressed: { backgroundColor: colors.brandStrong },
    retryButtonText: { ...typography.label, color: colors.onBrand },    emptyCard: { marginHorizontal: spacing.screenX, backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.lineSoft, marginBottom: spacing.md },
    emptyTitle: { ...typography.bodyStrong, color: colors.ink, marginBottom: 4 },
    emptyText: { ...typography.caption, color: colors.body },
    optionCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.lineSoft, marginBottom: spacing.md, marginHorizontal: spacing.screenX, ...shadows.soft },
    optionCardSelected: { borderColor: colors.brand, backgroundColor: colors.brand50 },
    optionTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.md },
    optionMeta: { flex: 1 },
    optionMode: { ...typography.caption, color: colors.brandStrong, fontWeight: '700', marginBottom: 2 },
    optionTitle: { ...typography.bodyStrong, color: colors.ink },
    badge: { alignSelf: 'flex-start', backgroundColor: colors.canvas, borderRadius: radii.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.line },
    badgeSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
    badgeText: { fontSize: 11, fontWeight: '700', color: colors.brandStrong },
    optionDetails: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    detailItem: { flex: 1, backgroundColor: colors.canvas, borderRadius: radii.sm, padding: spacing.sm + 2 },
    detailLabel: { fontSize: 11, color: colors.muted, marginBottom: 2 },
    detailValue: { fontSize: 13, fontWeight: '700', color: colors.ink },
    optionNote: { ...typography.caption, color: colors.body, lineHeight: 20 },
    segmentsBox: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.lineSoft },
    segmentsTitle: { ...typography.label, color: colors.ink, marginBottom: spacing.xs },
    segmentText: { ...typography.caption, color: colors.body, marginBottom: 2 },
    card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.lineSoft, marginBottom: spacing.xxl, marginHorizontal: spacing.screenX, ...shadows.soft },
    flightTitle: { ...typography.bodyStrong, color: colors.ink, marginBottom: 4 },
    flightMeta: { ...typography.caption, color: colors.body, marginBottom: 4 },
    flightNote: { ...typography.caption, color: colors.body, lineHeight: 20 },
  });
}
