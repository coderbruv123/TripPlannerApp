import { useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, shadows, spacing, typography, useAppTheme, type ThemeColors } from '../theme';

type StayCardData = { id: string; name: string; location: string; rating: string; reviews: string; price: string; distance: string; tag: string; image: string };
const FILTERS = ['All', 'Hotels', 'Apartments', 'Budget', 'Top rated'];
const STAYS: StayCardData[] = [
  { id: '1', name: 'Riverview Boutique Hotel', location: 'Trastevere, Rome', rating: '4.8', reviews: '214 reviews', price: '€142 / night', distance: '0.8 km from center', tag: 'Popular', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80' },
  { id: '2', name: 'Casa Luna Apartments', location: 'Monti, Rome', rating: '4.6', reviews: '128 reviews', price: '€118 / night', distance: '1.2 km from center', tag: 'Great value', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80' },
  { id: '3', name: 'The Piazza Stay', location: 'Centro Storico, Rome', rating: '4.9', reviews: '342 reviews', price: '€189 / night', distance: '0.3 km from center', tag: 'Top rated', image: 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=80' },
];

export function StaysScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.eyebrowBadge}><Text style={styles.eyebrowText}>STAYS</Text></View>
          <Text style={styles.title}>Find your stay</Text>
          <Text style={styles.subtitle}>Browse accommodations near your destination. Search and booking will be connected later.</Text>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.label}>Search stays</Text>
          <TextInput value={query} onChangeText={setQuery} placeholder="Try Rome, city center, or hotel name" placeholderTextColor={colors.faint} style={styles.searchInput} />
          <View style={styles.controlsRow}>
            <Pressable style={({ pressed }) => [styles.controlChip, pressed && styles.controlPressed]} onPress={() => {}}><Text style={styles.controlChipText}>Sort: Recommended</Text></Pressable>
            <Pressable style={({ pressed }) => [styles.controlChip, pressed && styles.controlPressed]} onPress={() => {}}><Text style={styles.controlChipText}>Filters</Text></Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((filter) => { const selected = filter === activeFilter; return (
            <Pressable key={filter} style={[styles.filterChip, selected && styles.filterChipSelected]} onPress={() => setActiveFilter(filter)}>
              <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{filter}</Text>
            </Pressable>
          ); })}
        </ScrollView>

        <View style={styles.list}>
          {STAYS.map((stay) => (
            <View key={stay.id} style={styles.card}>
              <ImageBackground source={{ uri: stay.image }} style={styles.image} imageStyle={styles.imageRadius} resizeMode="cover">
                <View style={styles.imageOverlay} />
                <View style={styles.imageBadge}><Text style={styles.imageBadgeText}>{stay.tag}</Text></View>
              </ImageBackground>
              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle}>{stay.name}</Text>
                    <Text style={styles.cardLocation}>{stay.location}</Text>
                  </View>
                  <View style={styles.ratingBadge}><Text style={styles.ratingText}>★ {stay.rating}</Text></View>
                </View>
                <Text style={styles.reviews}>{stay.reviews} · {stay.distance}</Text>
                <View style={styles.cardFooter}>
                  <View><Text style={styles.price}>{stay.price}</Text><Text style={styles.priceCaption}>Indicative price</Text></View>
                  <Pressable style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]} onPress={() => {}}><Text style={styles.detailsButtonText}>View details</Text></Pressable>
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
    header: { marginBottom: spacing.xl },
    eyebrowBadge: { alignSelf: 'flex-start', backgroundColor: colors.brand50, borderColor: colors.brand100, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radii.pill, marginBottom: spacing.lg },
    eyebrowText: { ...typography.overline, color: colors.brandStrong },
    title: { ...typography.title, color: colors.ink, marginBottom: spacing.sm },
    subtitle: { ...typography.body, color: colors.body },
    searchCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.lineSoft, marginBottom: spacing.lg, ...shadows.soft },
    label: { ...typography.label, color: colors.ink, marginBottom: spacing.sm },
    searchInput: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16, color: colors.ink, marginBottom: spacing.md },
    controlsRow: { flexDirection: 'row', gap: spacing.sm },
    controlChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line },
    controlPressed: { opacity: 0.85 },
    controlChipText: { ...typography.caption, color: colors.body, fontWeight: '600' },
    filterRow: { gap: spacing.sm, paddingBottom: spacing.xl },
    filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
    filterChipSelected: { backgroundColor: colors.brand50, borderColor: colors.brand100 },
    filterChipText: { ...typography.caption, color: colors.body, fontWeight: '600' },
    filterChipTextSelected: { color: colors.brandStrong },
    list: { gap: spacing.md },
    card: { backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.lineSoft, ...shadows.soft },
    image: { height: 180, padding: spacing.md },
    imageRadius: { borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg },
    imageOverlay: { ...{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, backgroundColor: 'rgba(11,20,25,0.12)' },
    imageBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.25)', borderWidth: 1, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: radii.pill },
    imageBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
    cardBody: { padding: spacing.lg },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.xs },
    cardTitleWrap: { flex: 1 },
    cardTitle: { ...typography.bodyStrong, fontSize: 17, color: colors.ink, marginBottom: 2 },
    cardLocation: { ...typography.caption, color: colors.muted },
    ratingBadge: { alignSelf: 'flex-start', backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: radii.pill },
    ratingText: { fontSize: 12, fontWeight: '700', color: colors.ink },
    reviews: { ...typography.caption, color: colors.body, marginBottom: spacing.lg },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
    price: { ...typography.bodyStrong, color: colors.ink },
    priceCaption: { ...typography.caption, color: colors.muted },
    detailsButton: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: radii.md, backgroundColor: colors.brand50, borderWidth: 1, borderColor: colors.brand100, alignItems: 'center', justifyContent: 'center' },
    detailsButtonPressed: { opacity: 0.9 },
    detailsButtonText: { ...typography.label, color: colors.brandStrong },
  });
}
