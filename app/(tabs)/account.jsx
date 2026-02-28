import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

export default function AccountScreen() {
  const { language, t } = useLanguage();
  const { theme, toggleDarkMode } = useTheme();
  const { notificationsEnabled, toggleNotifications } = useNotifications();

  const a = t('account') || {};
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const scale = 1; // 1:1 scaling
  const fs = (size) => {
    // Dynamically reduce font size for Tamil to prevent layout collapse
    // Tamil characters are wider and often taller, so 20% reduction fits better
    const adjustedSize = language === 'ta' ? size * 0.8 : size;
    return Math.round(adjustedSize * scale);
  };

  const SettingItem = ({ icon, title, subtitle, showChevron = true, isLast = false, onPress }) => (
    <TouchableOpacity 
      style={[styles.settingItem, isLast && styles.noBorder, { borderBottomColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIconContainer, { backgroundColor: theme.itemBg }]}>
        <Ionicons name={icon} size={22} color={theme.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { fontSize: fs(15), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        <Text style={[styles.settingSubtitle, { fontSize: fs(12), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{subtitle}</Text>
      </View>
      {showChevron && <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />}
    </TouchableOpacity>
  );

  return (
    <RNSafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontSize: fs(24), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{a.title || 'Account'}</Text>
          <Text style={[styles.headerSubtitle, { fontSize: fs(14), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{a.subtitle || 'Manage your profile & preferences'}</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, shadowColor: theme.isDarkMode ? '#000' : '#000' }]}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.isDarkMode ? '#334155' : '#FEF9C3', borderColor: theme.isDarkMode ? '#475569' : '#FEF08A' }]}>
              <Text style={[styles.avatarText, { fontSize: fs(32), color: theme.primary }]}>J</Text>
            </View>
            <TouchableOpacity style={[styles.cameraBadge, { backgroundColor: theme.card }]}>
              <Ionicons name="camera" size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.userName, { fontSize: fs(20), color: theme.textPrimary }]}>Jxjf ✨</Text>
          <Text style={[styles.userPhone, { fontSize: fs(14), color: theme.textSecondary }]}>+91 9999999999</Text>

          <View style={[styles.kycBadge, { backgroundColor: theme.isDarkMode ? '#064E3B' : '#F0FDF4' }]}>
            <View style={[styles.kycDot, { backgroundColor: '#22C55E' }]} />
            <Text style={[styles.kycText, { fontSize: fs(12), color: '#4ADE80' }]}>{a.kycVerified || 'KYC Verified'}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontSize: fs(18), color: theme.textPrimary }]}>54</Text>
              <Text style={[styles.statLabel, { fontSize: fs(10), color: theme.textSecondary }]}>{a.history || 'HISTORY'}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontSize: fs(18), color: theme.primary }]}>7.93g</Text>
              <Text style={[styles.statLabel, { fontSize: fs(10), color: theme.textSecondary }]}>{a.wealth || 'WEALTH'}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontSize: fs(18), color: theme.textPrimary }]}>6M</Text>
              <Text style={[styles.statLabel, { fontSize: fs(10), color: theme.textSecondary }]}>{a.tenure || 'TENURE'}</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <Text style={[styles.sectionLabel, { fontSize: fs(12), color: theme.textSecondary }]}>{a.settings || 'SETTINGS'}</Text>
        
        <View style={[styles.settingsCard, { backgroundColor: theme.card }]}>
          <SettingItem 
            icon="person-outline" 
            title={a.personalInfo || 'Personal Information'} 
            subtitle={a.personalInfoSub || 'Name, Email, Phone'} 
            onPress={() => setIsEditModalVisible(true)}
          />
          <SettingItem 
            icon="notifications-outline" 
            title={a.notifications || 'Notifications'} 
            subtitle={notificationsEnabled ? (t('notifications')?.active || 'Active') : (t('notifications')?.inactive || 'Inactive')} 
            onPress={toggleNotifications}
          />
          <SettingItem 
            icon="shield-checkmark-outline" 
            title={a.security || 'Security & Privacy'} 
            subtitle={a.securitySub || 'Password, Biometric'} 
          />
          <SettingItem 
            icon={theme.isDarkMode ? "sunny-outline" : "moon-outline"} 
            title={a.appearance || 'Appearance'} 
            subtitle={theme.isDarkMode ? (a.darkMode || 'Dark Mode') : (a.lightMode || 'Light Mode')} 
            onPress={toggleDarkMode}
          />
          <SettingItem 
            icon="help-circle-outline" 
            title={a.help || 'Help & Support'} 
            subtitle={a.helpSub || 'FAQs, Chat'} 
            isLast={true}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.isDarkMode ? '#450A0A' : '#FEF2F2', borderColor: theme.isDarkMode ? '#7F1D1D' : '#FEE2E2' }]}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" style={styles.logoutIcon} />
          <Text style={[styles.logoutText, { fontSize: fs(16), color: '#EF4444' }]}>{a.logout || 'Log Out'}</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: fs(20), color: theme.textPrimary }]}>{a.editProfile || 'Edit Profile'}</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { fontSize: fs(14), color: theme.textSecondary }]}>{a.fullName || 'Full Name'}</Text>
              <View style={[styles.inputWrapper, { borderBottomColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { fontSize: fs(16), color: theme.textPrimary }]}
                  value={name}
                  onChangeText={setName}
                  placeholder={a.fullName || "Full Name"}
                  placeholderTextColor={theme.textSecondary}
                  selectTextOnFocus={true}
                />
                {name.length > 0 && (
                  <TouchableOpacity onPress={() => setName('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { fontSize: fs(14), color: theme.textSecondary }]}>{a.email || 'Email'}</Text>
              <View style={[styles.inputWrapper, { borderBottomColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { fontSize: fs(16), color: theme.textPrimary }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={a.email || "Email"}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectTextOnFocus={true}
                />
                {email.length > 0 && (
                  <TouchableOpacity onPress={() => setEmail('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]} 
              onPress={() => setIsEditModalVisible(false)}
            >
              <Text style={[styles.saveButtonText, { fontSize: fs(16), color: '#FFF' }]}>{a.saveChanges || 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </RNSafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAF4', // Very light tint as seen in screenshot
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Increased to account for floating tab bar
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 24,
  },
  headerTitle: {
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  profileCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 32,
    paddingVertical: 32,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF9C3', // Light yellow
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  avatarText: {
    fontWeight: '600',
    color: '#EAB308',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userName: {
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userPhone: {
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 16,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4', // Light green
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 32,
  },
  kycDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  kycText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F3F4F6',
  },
  sectionLabel: {
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 12,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  settingsCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFBF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  settingSubtitle: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 40,
    marginTop: 40,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutIcon: {
    marginRight: 8,
    transform: [{ rotate: '180deg' }], // Match the screenshot icon orientation
  },
  logoutText: {
    fontWeight: '800',
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontWeight: '800',
    color: '#1A1A1A',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  clearButton: {
    padding: 8,
  },
  saveButton: {
    marginTop: 12,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#E07A07',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '800',
  },
});
