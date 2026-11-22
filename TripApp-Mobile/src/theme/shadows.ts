import { Platform } from 'react-native';
import { colors } from './colors';

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: colors.navy,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    android: {
      elevation: 3,
    },
    default: {
      shadowColor: colors.navy,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
  }),
  soft: Platform.select({
    ios: {
      shadowColor: colors.navy,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: colors.navy,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
  }),
} as const;
