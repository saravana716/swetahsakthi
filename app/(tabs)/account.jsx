import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, Switch, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getAugmontKYCStatus, getAugmontProfile, getUserPassbook, getAugmontBuyList } from '../../services/augmontApi';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AccountScreen() {
  const router = useRouter();
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const { user, userProfile, logout, updateProfile } = useAuth();
  const [kycStatus, setKycStatus] = useState(userProfile?.kycStatus || 'pending');
  const [passbookData, setPassbookData] = useState(null);
  const [buyList, setBuyList] = useState([]);
  const [tenure, setTenure] = useState('0M');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState(null);
  const [showPickerModal, setShowPickerModal] = useState(false);

  const displayPhotoUrl = localPhotoUri || userProfile?.photoURL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await user.getIdToken();
        const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
        
        if (uniqueId) {
          // 1. Fetch KYC Status
          const statusData = await getAugmontKYCStatus(uniqueId, token);
          if (statusData?.result?.data?.status) {
            setKycStatus(statusData.result.data.status);
          }
          
          // 2. Fetch Passbook for Wealth Calculation
          const passData = await getUserPassbook(uniqueId, token);
          if (passData?.result?.data) {
            setPassbookData(passData.result.data);
          }

          // 3. Fetch Buy List for Order Count
          const orders = await getAugmontBuyList(uniqueId, token);
          if (orders?.result?.data) {
            setBuyList(orders.result.data);
          }
        }

        // 4. Calculate Tenure
        if (userProfile?.createdAt) {
          const joinDate = new Date(userProfile.createdAt);
          const now = new Date();
          const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
          setTenure(`${months}M`);
        }
      } catch (error) {
        console.error("Failed to refresh account data:", error);
      }
    };
    fetchData();
  }, [userProfile]);

  const handlePhotoUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPickerModal(true);
  };

  const pickFromSource = async (source) => {
    setShowPickerModal(false);
    await new Promise(r => setTimeout(r, 300)); // Let modal close first

    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow camera access in Settings.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow gallery access in Settings.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
      });
    }

    if (result.canceled) {
      console.log("[PHOTO_DEBUG] Picker Cancelled.");
      return;
    }
    
    const uri = result.assets[0].uri;
    console.log("[PHOTO_DEBUG] Step 1: Image picked. URI:", uri);
    
    setPhotoUploading(true);
    setLocalPhotoUri(uri);

    try {
      console.log("[PHOTO_DEBUG] Step 2: Starting XHR Blob conversion...");
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () { 
          console.log("[PHOTO_DEBUG] Step 3: Blob created successfully.");
          resolve(xhr.response); 
        };
        xhr.onerror = function (e) { 
          console.error("[PHOTO_DEBUG] ERROR in Blob conversion.");
          reject(new TypeError("Network request failed")); 
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });
      
      const storageRef = ref(storage, `profile_photos/${user.uid}.jpg`);
      console.log("[PHOTO_DEBUG] Step 4: Starting Cloud Storage upload...");
      
      await uploadBytes(storageRef, blob);
      console.log("[PHOTO_DEBUG] Step 5: Upload finished. Fetching URL...");
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log("[PHOTO_DEBUG] Step 6: Received Download URL:", downloadURL);
      
      // 🔥 MANDATORY HANDSHAKE: Ensure database is updated BEFORE success
      console.log("[PHOTO_DEBUG] Step 7: Starting Mandatory Handshake...");
      await updateProfile({ photoURL: downloadURL });
      console.log("[PHOTO_DEBUG] Step 8: Database Handshake Success.");
      
      // Update local state to "Cement" the photo
      setLocalPhotoUri(downloadURL);
      
      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ 
        type: 'success', 
        text1: '📸 Photo Cemented!', 
        text2: 'Synced with Cloud Successfully.' 
      });

      console.log("[PHOTO_DEBUG] Step 9: Process 100% Complete.");

    } catch (err) {
      console.error('[PHOTO_DEBUG] FATAL UPLOAD ERROR:', err);
      setLocalPhotoUri(null);
      Toast.show({ 
        type: 'error', 
        text1: 'Upload Failed', 
        text2: 'Cloud sync failed. Check connection.' 
      });
    } finally {
      setPhotoUploading(false);
      console.log("[PHOTO_DEBUG] Final: Picker lifecycle complete.");
    }
  };

  useEffect(() => {
    if (userProfile?.photoURL) {
      console.log("[PHOTO_DEBUG] Account Startup: Photo URL found in Cloud:", userProfile.photoURL);
    }
  }, [userProfile?.photoURL]);

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
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <TouchableOpacity onPress={handlePhotoUpload} activeOpacity={0.85} style={styles.avatarWrap}>
            {displayPhotoUrl ? (
              <Image source={{ uri: displayPhotoUrl }} style={styles.avatarPhoto} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.itemBg, borderColor: theme.border }]}>
                <Text style={[styles.avatarLetter, { color: theme.primary }]}>
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'J'}
                </Text>
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
               <Ionicons name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.userName, { color: theme.textPrimary }]}>{userProfile?.displayName || 'Welcome! ✨'}</Text>
          <Text style={[styles.userPhone, { color: theme.textSecondary }]}>{user?.phoneNumber || '+91 9999999999'}</Text>
          
          <TouchableOpacity 
            style={[
              styles.kycBadge, 
              { backgroundColor: kycStatus === 'approved' ? (isDarkMode ? '#064E3B' : '#ECFDF5') : (isDarkMode ? '#451a03' : '#FFF7ED') }
            ]}
            onPress={() => router.push('/kyc')}
          >
            <View style={[styles.kycDot, { backgroundColor: kycStatus === 'approved' ? '#10B981' : '#F59E0B' }]} />
            <Text style={[
              styles.kycText, 
              { color: kycStatus === 'approved' ? (isDarkMode ? '#34D399' : '#059669') : (isDarkMode ? '#FBBF24' : '#D97706') }
            ]}>
              {kycStatus === 'approved' ? 'KYC Verified' : `KYC ${kycStatus.toUpperCase()}`}
            </Text>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>{buyList.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>HISTORY</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {(parseFloat(passbookData?.goldGrms || 0) + parseFloat(passbookData?.silverGrms || 0)).toFixed(4)}g
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>WEALTH</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>{tenure}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TENURE</Text>
            </View>
          </View>
        </Animated.View>

        {/* Settings Group */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SETTINGS</Text>
        </View>
        
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[styles.settingsGroup, { backgroundColor: theme.card }]}>
          <SettingItem 
            icon="person-outline" 
            title="Personal Information" 
            subtitle="Name, Email, Profile Details" 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile');
            }}
          />
          <SettingItem 
            icon="notifications-outline" 
            title="Notifications" 
            subtitle="Alerts & Updates"
            isSwitch={true}
            value={userProfile?.notificationsEnabled !== false} // Default to true if undefined
            onValueChange={(val) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              updateProfile({ notificationsEnabled: val });
              Toast.show({
                type: 'success',
                text1: val ? 'Notifications Enabled' : 'Notifications Silenced',
                text2: val ? 'You will receive price alerts.' : 'Price alerts will be local only.'
              });
            }} 
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
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <TouchableOpacity 
            style={[styles.logoutBtn, { backgroundColor: isDarkMode ? '#450a0a' : '#FEF2F2', borderColor: isDarkMode ? '#7f1d1d' : '#FEE2E2' }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.versionText, { color: theme.textSecondary }]}>Version 1.0.4 (2026)</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Photo Source Picker Bottom Sheet */}
      <Modal visible={showPickerModal} transparent animationType="slide" onRequestClose={() => setShowPickerModal(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowPickerModal(false)}>
          <View style={[styles.pickerSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.pickerHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.pickerTitle, { color: theme.textPrimary }]}>Update Profile Photo</Text>

            <TouchableOpacity style={[styles.pickerOption, { backgroundColor: theme.background }]} onPress={() => pickFromSource('camera')}>
              <View style={[styles.pickerIconBg, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF' }]}>
                <Ionicons name="camera" size={24} color="#3B82F6" />
              </View>
              <View style={styles.pickerText}>
                <Text style={[styles.pickerOptTitle, { color: theme.textPrimary }]}>Take Photo</Text>
                <Text style={[styles.pickerOptSub, { color: theme.textSecondary }]}>Use your camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.pickerOption, { backgroundColor: theme.background }]} onPress={() => pickFromSource('gallery')}>
              <View style={[styles.pickerIconBg, { backgroundColor: isDarkMode ? '#1E293B' : '#F0FDF4' }]}>
                <Ionicons name="images" size={24} color="#22C55E" />
              </View>
              <View style={styles.pickerText}>
                <Text style={[styles.pickerOptTitle, { color: theme.textPrimary }]}>Choose from Gallery</Text>
                <Text style={[styles.pickerOptSub, { color: theme.textSecondary }]}>Pick an existing photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.pickerCancel, { borderColor: theme.border }]} onPress={() => setShowPickerModal(false)}>
              <Text style={[styles.pickerCancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  avatarPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#EAB308',
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
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  pickerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pickerText: { flex: 1 },
  pickerOptTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  pickerOptSub: { fontSize: 12, fontWeight: '500' },
  pickerCancel: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  pickerCancelText: { fontSize: 15, fontWeight: '700' },
});
