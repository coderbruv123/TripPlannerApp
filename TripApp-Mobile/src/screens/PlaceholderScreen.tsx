import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radii, shadows, spacing, typography, useAppTheme, type ThemeColors } from '../theme';

type PlaceholderScreenProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function PlaceholderScreen({
  title,
  description,
  eyebrow = 'COMING NEXT',
}: PlaceholderScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.eyebrowBadge}>
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.screenX,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.xxl,
      borderWidth: 1,
      borderColor: colors.lineSoft,
      ...shadows.card,
    },
    eyebrowBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.brand50,
      borderColor: colors.brand100,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radii.pill,
      marginBottom: spacing.lg,
    },
    eyebrowText: {
      ...typography.overline,
      color: colors.brandStrong,
    },
    title: {
      ...typography.title,
      color: colors.ink,
      marginBottom: spacing.sm,
    },
    description: {
      ...typography.body,
      color: colors.body,
    },
  });
}
