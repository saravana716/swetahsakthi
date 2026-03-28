import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

export default function AccountScreen() {
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const { user, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      Toast.show({ type: 'success', text1: 'Signed Out' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Logout Failed' });
    }
  };

  const SettingItem = ({ icon, title, subtitle, value, onValueChange, isSwitch, isLast, onPress }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: theme.border }, isLast && { borderBottomWidth: 0 }]} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isSwitch}
    >
      <View style={[styles.settingIconWrap, { backgroundColor: theme.itemBg }]}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.settingSub, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      {isSwitch ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange} 
          trackColor={{ false: isDarkMode ? '#374151' : '#E5E7EB', true: isDarkMode ? '#451a03' : '#FEF08A' }}
          thumbColor={value ? theme.primary : (isDarkMode ? '#6B7280' : '#F9FAFB')}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Account</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Manage your profile & preferences</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: theme.itemBg, borderColor: theme.border }]}>
              <Text style={[styles.avatarLetter, { color: theme.primary }]}>
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'J'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.editBadge, { backgroundColor: theme.card }]}>
              <Ionicons name="camera" size={12} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: theme.textPrimary }]}>{userProfile?.displayName || 'Welcome! ✨'}</Text>
          <Text style={[styles.userPhone, { color: theme.textSecondary }]}>{user?.phoneNumber || '+91 9999999999'}</Text>
          
          <View style={[styles.kycBadge, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5' }]}>
            <View style={[styles.kycDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.kycText, { color: isDarkMode ? '#34D399' : '#059669' }]}>KYC Verified</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>54</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>HISTORY</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.primary }]}>7.93g</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>WEALTH</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>6M</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TENURE</Text>
            </View>
          </View>
        </View>

        {/* Settings Group */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SETTINGS</Text>
        </View>
        
        <View style={[styles.settingsGroup, { backgroundColor: theme.card }]}>
          <SettingItem 
            icon="person-outline" 
            title="Personal Information" 
            subtitle="Name, Email, Phone" 
          />
          <SettingItem 
            icon="notifications-outline" 
            title="Notifications" 
            subtitle="Alerts & Updates"
            isSwitch={true}
            value={true} // Placeholder for notifications state if not in context
            onValueChange={() => {}} 
          />
          <SettingItem 
            icon="shield-checkmark-outline" 
            title="Security & Privacy" 
            subtitle="Password, Biometric" 
          />
          <SettingItem 
            icon={isDarkMode ? "sunny-outline" : "moon-outline"} 
            title="Dark Mode" 
            subtitle={isDarkMode ? "Dark Theme Active" : "Light Theme Active"}
            isSwitch={true}
            value={isDarkMode}
            onValueChange={toggleDarkMode}
          />
          <SettingItem 
            icon="help-circle-outline" 
            title="Help & Support" 
            subtitle="FAQs, Contact Us"
            isLast={true}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity 
          style={[styles.logoutBtn, { backgroundColor: isDarkMode ? '#450a0a' : '#FEF2F2', borderColor: isDarkMode ? '#7f1d1d' : '#FEE2E2' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: theme.textSecondary }]}>Version 1.0.4 (2026)</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    paddingVertical: 16,
    marginTop: Platform.OS === 'android' ? 20 : 0,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  profileCard: {
    borderRadius: 30,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: '700',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 32,
  },
  kycDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  kycText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  settingsGroup: {
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  settingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 24,
  },
});
