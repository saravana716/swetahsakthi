import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from './context/ThemeContext';

const { width } = Dimensions.get('window');

const ACTIVE_SHIPMENTS = [
  {
    id: 'ORD_72635',
    title: '24K Gold Coin (1g)',
    date: 'Feb 24, 2026',
    status: 'In Transit',
    progress: 0.72,
    estDelivery: 'Feb 28, 2026',
  },
];

const PAST_DELIVERIES = [
  {
    id: 'ORD_61543',
    title: 'Gold Bar (10g)',
    date: 'Jan 15, 2026',
    status: 'Delivered',
  },
  {
    id: 'ORD_58291',
    title: '22K Gold Coin (2g)',
    date: 'Dec 10, 2025',
    status: 'Delivered',
  },
];

export default function TrackingScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Shipments</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── ACTIVE REDEMPTIONS ── */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          ACTIVE REDEMPTIONS
        </Text>

        {ACTIVE_SHIPMENTS.map((item) => (
          <View
            key={item.id}
            style={[styles.card, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F0EDE8' }]}
          >
            {/* Row: icon + info + badge */}
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#2D2000' : '#FFF8E7' }]}>
                <Ionicons name="cube-outline" size={28} color="#EAB308" />
              </View>
              <View style={styles.cardMeta}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                  {item.id} • {item.date}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: isDarkMode ? '#2D1F00' : '#FFF3CD' }]}>
                <Text style={[styles.badgeText, { color: '#B45309' }]}>{item.status}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressTrack, { backgroundColor: isDarkMode ? '#334155' : '#E5E7EB' }]}>
              <View style={[styles.progressFill, { width: `${item.progress * 100}%` }]} />
            </View>

            {/* Est. Delivery Row */}
            <TouchableOpacity style={styles.deliveryRow}>
              <Text style={[styles.deliveryText, { color: theme.textSecondary }]}>
                Est. Delivery:{' '}
                <Text style={[styles.deliveryDate, { color: theme.textPrimary }]}>
                  {item.estDelivery}
                </Text>
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}

        {/* ── PAST DELIVERIES ── */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 28 }]}>
          PAST DELIVERIES
        </Text>

        {PAST_DELIVERIES.map((item) => (
          <View
            key={item.id}
            style={[styles.card, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F0EDE8' }]}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#064E3B' : '#F0FDF4' }]}>
                <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
              </View>
              <View style={styles.cardMeta}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                  {item.id} • {item.date}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: isDarkMode ? '#064E3B' : '#DCFCE7' }]}>
                <Text style={[styles.badgeText, { color: '#15803D' }]}>{item.status}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardMeta: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#EAB308',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  deliveryDate: {
    fontWeight: '800',
    fontSize: 13,
  },
});
