import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { searchDestinations } from '../api/destinations';
import { radii, shadows, spacing, typography, useAppTheme, type ThemeColors } from '../theme';
import type { Destination } from '../types/trip';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Home'>, NativeStackScreenProps<RootStackParamList>>;
const HERO_IMAGE = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80';

function destinationLabel(d: Destination) {
  const code = d.code || d.iata || d.iataCode;
  const kind = (d.type || d.kind || '').toLowerCase();
  return kind === 'airport' && code ? `${d.name} (${String(code).toUpperCase()}), ${d.country}` : `${d.name}, ${d.country}`;
}

function useDestinationSearch(query: string) {
  const [results, setResults] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setLoading(false); setError(null); return; }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const data = await searchDestinations(q, controller.signal);
        if (!controller.signal.aborted) setResults(data.slice(0, 6));
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not search places.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query]);

  return { results, loading, error, clear: () => setResults([]) };
}

export function HomeScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [origin, setOrigin] = useState<Destination | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [travelers, setTravelers] = useState('2');
  const [budget, setBudget] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const originSearch = useDestinationSearch(activeField === 'origin' ? originQuery : '');
  const destSearch = useDestinationSearch(activeField === 'destination' ? destinationQuery : '');

  const pickOrigin = (d: Destination) => { setOrigin(d); setOriginQuery(destinationLabel(d)); setActiveField(null); originSearch.clear(); };
  const pickDestination = (d: Destination) => { setDestination(d); setDestinationQuery(destinationLabel(d)); setActiveField(null); destSearch.clear(); };

  const onSubmit = () => {
    setFormError(null);
    if (!origin) { setFormError('Select an origin from suggestions.'); return; }
    if (!destination) { setFormError('Select a destination from suggestions.'); return; }
    const t = Math.max(1, Number(travelers) || 1);
    navigation.navigate('TripResults', {
      originLabel: destinationLabel(origin),
      originLat: origin.latitude,
      originLng: origin.longitude,
      destinationName: destination.name,
      destinationCountry: destination.country,
      destinationLat: destination.latitude,
      destinationLng: destination.longitude,
      from: fromDate.trim() || undefined,
      to: toDate.trim() || undefined,
      travelers: t,
      budget: budget.trim() || undefined,
      title: `${origin.name} → ${destination.name}`,
      country: destination.country,
    });
  };

  const renderSuggestions = (items: Destination[], loading: boolean, err: string | null, onPick: (d: Destination) => void) => {
    if (loading) return <View style={styles.suggestBox}><ActivityIndicator color={colors.brand} /></View>;
    if (err) return <View style={styles.suggestBox}><Text style={styles.suggestError}>{err}</Text></View>;
    if (items.length === 0) return null;
    return (
      <View style={styles.suggestBox}>
        {items.map((d, i) => (
          <Pressable key={`${d.name}-${d.country}-${d.latitude}-${i}`} style={styles.suggestItem} onPress={() => onPick(d)}>
            <Text style={styles.suggestName}>{d.name}</Text>
            <Text style={styles.suggestMeta}>{destinationLabel(d)}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.heroImage} imageStyle={styles.heroImageRadius} resizeMode="cover">
            <View style={styles.heroOverlay} />
            <SafeAreaView edges={['top']} style={styles.heroSafe}>
              <View style={styles.hero}>
                <View style={styles.eyebrowBadge}><Text style={styles.eyebrowText}>TRIP PLANNER</Text></View>
                <Text style={styles.title}>Where to next?</Text>
                <Text style={styles.subtitle}>Search real destinations, then compare routes and save your trip.</Text>
              </View>
            </SafeAreaView>
          </ImageBackground>

          <View style={styles.card}>
            {formError ? <View style={styles.errorBox}><Text style={styles.errorText}>{formError}</Text></View> : null}

            <View style={styles.field}>
              <Text style={styles.label}>From</Text>
              <TextInput value={originQuery} onChangeText={(v) => { setOriginQuery(v); setOrigin(null); setActiveField('origin'); }} onFocus={() => setActiveField('origin')} placeholder="Search city or airport" placeholderTextColor={colors.faint} style={styles.input} />
              {activeField === 'origin' ? renderSuggestions(originSearch.results, originSearch.loading, originSearch.error, pickOrigin) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Destination</Text>
              <TextInput value={destinationQuery} onChangeText={(v) => { setDestinationQuery(v); setDestination(null); setActiveField('destination'); }} onFocus={() => setActiveField('destination')} placeholder="Where do you want to go?" placeholderTextColor={colors.faint} style={styles.input} />
              {activeField === 'destination' ? renderSuggestions(destSearch.results, destSearch.loading, destSearch.error, pickDestination) : null}
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}><Text style={styles.label}>From date</Text><TextInput value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.faint} style={styles.input} autoCapitalize="none" /></View>
              <View style={[styles.field, styles.halfField]}><Text style={styles.label}>To date</Text><TextInput value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.faint} style={styles.input} autoCapitalize="none" /></View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}><Text style={styles.label}>Travelers</Text><TextInput value={travelers} onChangeText={setTravelers} placeholder="2" placeholderTextColor={colors.faint} style={styles.input} keyboardType="number-pad" /></View>
              <View style={[styles.field, styles.halfField]}><Text style={styles.label}>Budget</Text><TextInput value={budget} onChangeText={setBudget} placeholder="e.g. 2000" placeholderTextColor={colors.faint} style={styles.input} /></View>
            </View>

            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]} onPress={onSubmit}>
              <Text style={styles.primaryButtonText}>Search routes</Text>
            </Pressable>
            <Text style={styles.disclaimer}>Destination search uses live API. Route results are fetched on the next screen.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.canvas },
    flex: { flex: 1, backgroundColor: colors.canvas },
    container: { flex: 1 },
    content: { paddingBottom: spacing.xxxl },
    heroImage: { minHeight: 280, justifyContent: 'flex-end' },
    heroImageRadius: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    heroOverlay: { ...{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, backgroundColor: 'rgba(11,20,25,0.42)', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    heroSafe: { flex: 1, justifyContent: 'flex-end' },
    hero: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
    eyebrowBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radii.pill, marginBottom: spacing.lg },
    eyebrowText: { ...typography.overline, color: '#FFFFFF' },
    title: { ...typography.display, color: '#FFFFFF', marginBottom: spacing.sm },
    subtitle: { ...typography.body, color: 'rgba(255,255,255,0.88)' },
    card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.lineSoft, marginHorizontal: spacing.screenX, marginTop: -20, ...shadows.card },
    errorBox: { backgroundColor: 'rgba(249,112,102,0.12)', borderColor: 'rgba(249,112,102,0.35)', borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg },
    errorText: { ...typography.caption, color: colors.danger },
    field: { marginBottom: spacing.lg },
    row: { flexDirection: 'row', gap: spacing.md },
    halfField: { flex: 1 },
    label: { ...typography.label, color: colors.ink, marginBottom: spacing.sm },
    input: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: colors.ink },
    suggestBox: { marginTop: spacing.xs, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, overflow: 'hidden' },
    suggestItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
    suggestName: { ...typography.label, color: colors.ink },
    suggestMeta: { ...typography.caption, color: colors.muted, marginTop: 2 },
    suggestError: { ...typography.caption, color: colors.danger, padding: spacing.md },
    primaryButton: { backgroundColor: colors.brand, borderRadius: radii.md, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
    primaryButtonPressed: { backgroundColor: colors.brandStrong },
    primaryButtonText: { ...typography.bodyStrong, color: colors.onBrand },
    disclaimer: { ...typography.caption, color: colors.muted, textAlign: 'center', marginTop: spacing.lg },
  });
}
