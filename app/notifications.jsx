import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';
import { useNotifications } from './context/NotificationContext';
import { useTheme } from './context/ThemeContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { 
    notificationsEnabled, toggleNotifications,
    promoEnabled, togglePromos,
    alertEnabled, toggleAlerts,
    orderEnabled, toggleOrders
  } = useNotifications();

  const n = t('notifications') || {};
  const fs = (size) => Math.round(language === 'ta' ? size * 0.8 : size);

  const SettingRow = ({ title, value, onToggle, icon }) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: theme.itemBg }]}>
          <Ionicons name={icon} size={20} color={theme.primary} />
        </View>
        <Text style={[styles.settingTitle, { fontSize: fs(15), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
      </View>
      <Switch
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.border}
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fs(24), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
            {n.title || 'Notifications'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerAction} activeOpacity={0.7}>
          <Text style={[styles.headerActionText, { fontSize: fs(13), color: theme.primary }]}>
            {n.markRead || 'Mark all read'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: fs(12), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{n.settings || 'NOTIFICATION SETTINGS'}</Text>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <SettingRow 
              title={n.promo || 'Promotions & Offers'} 
              value={promoEnabled} 
              onToggle={togglePromos}
              icon="gift-outline"
            />
            <SettingRow 
              title={n.alert || 'Price Alerts'} 
              value={alertEnabled} 
              onToggle={toggleAlerts}
              icon="trending-up-outline"
            />
            <SettingRow 
              title={n.order || 'Order Updates'} 
              value={orderEnabled} 
              onToggle={toggleOrders}
              icon="cart-outline"
            />
          </View>
        </View>

        {!notificationsEnabled || (!promoEnabled && !alertEnabled && !orderEnabled) ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
              <Ionicons name="notifications-off-outline" size={48} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { fontSize: fs(18), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{n.empty || 'No Notifications Yet'}</Text>
            <Text style={[styles.emptySub, { fontSize: fs(14), color: theme.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
              {n.emptySub || 'Stay tuned for updates about your vault and gold prices.'}
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
              <Ionicons name="notifications-outline" size={48} color={theme.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { fontSize: fs(18), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{n.empty || 'No Notifications Yet'}</Text>
            <Text style={[styles.emptySub, { fontSize: fs(14), color: theme.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
              {n.emptySub || 'Stay tuned for updates about your vault and gold prices.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  headerTitle: {
    fontWeight: '700',
    marginLeft: 5,
    flex: 1,
  },
  headerAction: {
    alignSelf: 'flex-end',
    paddingHorizontal: 4,
  },
  headerActionText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingTitle: {
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySub: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
