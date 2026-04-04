import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
  Modal
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { getAugmontProfile, getUserByMongoId, getUserPassbook } from '../services/augmontApi';
import { LinearGradient } from 'expo-linear-gradient';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user, userProfile, updateProfile } = useAuth();

  
  const [loading, setLoading] = useState(true);
  const [augmontData, setAugmontData] = useState(null);
  const [mongoData, setMongoData] = useState(null);
  const [passbookData, setPassbookData] = useState(null);
  const [error, setError] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState(null);
  const [showPickerModal, setShowPickerModal] = useState(false);

  const displayPhotoUrl = localPhotoUri || userProfile?.photoURL;

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        setLoading(true);
        const token = await user.getIdToken();
        const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
        const mongoId = userProfile?.mongoId || userProfile?._id;

        console.log("Syncing Profile Data: (Augmont + MongoDB)");

        // Parallel Fetch: (Official Augmont + Official Passbook + Official MongoDB)
        const [augmontRes, passbookRes, mongoRes] = await Promise.all([
          uniqueId ? getAugmontProfile(uniqueId, token) : Promise.resolve(null),
          uniqueId ? getUserPassbook(uniqueId, token) : Promise.resolve(null),
          mongoId ? getUserByMongoId(mongoId, token) : Promise.resolve(null)
        ]);

        // DETAILED LOGGING FOR VERIFICATION:
        console.log("-----------------------------------------");
        console.log("OFFICIAL AUGMONT API RESPONSE:", JSON.stringify(augmontRes, null, 2));
        console.log("LOCAL MONGODB USER RESPONSE:", JSON.stringify(mongoRes, null, 2));
        console.log("-----------------------------------------");

        if (augmontRes?.result?.data) setAugmontData(augmontRes.result.data);
        if (passbookRes?.result?.data) setPassbookData(passbookRes.result.data);
        if (mongoRes) setMongoData(mongoRes);

      } catch (err) {
        console.error("Profile Fetch Error:", err);
        setError("Failed to load your full profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFullProfile();
  }, []);

  const handlePhotoUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPickerModal(true);
  };

  const pickFromSource = async (source) => {
    setShowPickerModal(false);
    await new Promise(r => setTimeout(r, 300));

    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow camera access in Settings.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, aspect: [1, 1], quality: 0.6,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow gallery access in Settings.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6,
      });
    }

    if (result.canceled) return;
    
    const uri = result.assets[0].uri;
    setPhotoUploading(true);
    setLocalPhotoUri(uri);

    try {
      // 🏗️ NATIVE-FRIENDLY BLOB CONVERSION (1000% Reliable for Android/iOS)
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () { resolve(xhr.response); };
        xhr.onerror = function (e) { reject(new TypeError("Network request failed")); };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });
      
      const storageRef = ref(storage, `profile_photos/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // 🔥 DYNAMIC PERSISTENCE: Save to official Firestore User Document
      await updateProfile({ photoURL: downloadURL });
      
      // Update local state and finish
      setLocalPhotoUri(downloadURL);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ 
        type: 'success', 
        text1: '📸 Photo Updated!', 
        text2: 'Your profile photo is now synced with the Cloud.' 
      });

    } catch (err) {
      console.error('Photo upload error:', err);
      setLocalPhotoUri(null);
      Toast.show({ 
        type: 'error', 
        text1: 'Upload Failed', 
        text2: 'Could not sync with Cloud. Try again later.' 
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Animated.View entering={FadeIn.duration(400)} style={{ width: '100%', paddingHorizontal: 20, gap: 16 }}>
          <ShimmerPlaceholder width={'100%'} height={200} borderRadius={30} isDarkMode={isDarkMode} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ShimmerPlaceholder width={'48%'} height={70} borderRadius={20} isDarkMode={isDarkMode} />
            <ShimmerPlaceholder width={'48%'} height={70} borderRadius={20} isDarkMode={isDarkMode} />
          </View>
          <ShimmerPlaceholder width={'100%'} height={180} borderRadius={24} isDarkMode={isDarkMode} />
          <ShimmerPlaceholder width={'100%'} height={180} borderRadius={24} isDarkMode={isDarkMode} />
        </Animated.View>
      </View>
    );
  }

  const InfoRow = ({ label, value, icon }) => (
    <View style={[styles.infoRow, { borderColor: theme.border }]}>
      <View style={styles.infoLabelGroup}>
        <Ionicons name={icon} size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{value || 'Not Provided'}</Text>
    </View>
  );

  const Section = ({ title, children, icon }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={theme.primary} style={{ marginRight: 8 }} />
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title.toUpperCase()}</Text>
      </View>
      <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: theme.card }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* User Hero section */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={[styles.heroCard, { backgroundColor: theme.card }]}>
           <LinearGradient
            colors={isDarkMode ? ['#451a03', '#1e1b4b'] : ['#FFF9E5', '#F5F3FF']}
            style={styles.heroGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity onPress={handlePhotoUpload} activeOpacity={0.85} style={styles.avatarWrapper}>
              {displayPhotoUrl ? (
                <Image source={{ uri: displayPhotoUrl }} style={styles.avatarPhoto} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.itemBg, borderColor: theme.border }]}>
                  <Text style={[styles.avatarText, { color: theme.primary }]}>
                    {augmontData?.userName?.charAt(0).toUpperCase() || userProfile?.displayName?.charAt(0).toUpperCase() || 'S'}
                  </Text>
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: theme.primary }]}>
                {photoUploading
                  ? <ActivityIndicator size={12} color="#FFF" />
                  : <Ionicons name="camera" size={14} color="#FFF" />
                }
              </View>
            </TouchableOpacity>
            <Text style={[styles.topName, { color: theme.textPrimary }]}>{augmontData?.userName || userProfile?.displayName || 'User'}</Text>
            <Text style={[styles.topSub, { color: theme.textSecondary }]}>{augmontData?.mobileNumber || user?.phoneNumber}</Text>
            
            <View style={[styles.kycBadge, { backgroundColor: (augmontData?.kycStatus === 'Approved') ? '#10B981' : '#F59E0B' }]}>
               <Ionicons name={augmontData?.kycStatus === 'Approved' ? "checkmark-circle" : "time"} size={14} color="#FFF" />
               <Text style={styles.kycText}>{augmontData?.kycStatus || 'Pending'}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Balance Row */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.balanceRow}>
          <View style={[styles.balanceBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Gold Balance</Text>
            <Text style={[styles.balanceValue, { color: theme.primary }]}>
              {parseFloat(passbookData?.goldGrms || 0).toFixed(4)}g
            </Text>
          </View>
          <View style={[styles.balanceBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Silver Balance</Text>
            <Text style={[styles.balanceValue, { color: theme.textPrimary }]}>
              {parseFloat(passbookData?.silverGrms || 0).toFixed(4)}g
            </Text>
          </View>
        </Animated.View>

        {/* Identity & Personal Info */}
        <Section title="Identity Details" icon="person-outline">
          <InfoRow label="Full Name" value={augmontData?.userName} icon="create-outline" />
          <InfoRow label="Email Address" value={augmontData?.userEmail || userProfile?.email} icon="mail-outline" />
          <InfoRow label="Mobile" value={augmontData?.mobileNumber || user?.phoneNumber} icon="call-outline" />
          <InfoRow label="Date of Birth" value={augmontData?.dateOfBirth} icon="calendar-outline" />
          <InfoRow label="Gender" value={augmontData?.gender} icon="transgender-outline" />
        </Section>

        {/* Address & Pincode */}
        <Section title="Address Details" icon="location-outline">
          <InfoRow label="Primary Address" value={augmontData?.userAddress} icon="map-outline" />
          <InfoRow label="City" value={augmontData?.userCity} icon="business-outline" />
          <InfoRow label="State" value={augmontData?.userState} icon="flag-outline" />
          <InfoRow label="Pincode" value={augmontData?.userPincode} icon="attach-outline" />
        </Section>

        {/* Nominee details */}
        <Section title="Nominee Information" icon="people-outline">
          <InfoRow label="Nominee Name" value={augmontData?.nomineeName} icon="person-add-outline" />
          <InfoRow label="Relation" value={augmontData?.nomineeRelation} icon="heart-outline" />
          <InfoRow label="Nominee DOB" value={augmontData?.nomineeDateOfBirth} icon="calendar-outline" />
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Photo Source Picker Bottom Sheet */}
      <Modal visible={showPickerModal} transparent animationType="slide" onRequestClose={() => setShowPickerModal(false)}>
        <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={() => setShowPickerModal(false)}>
          <View style={[pickerStyles.sheet, { backgroundColor: theme.card }]}>
            <View style={[pickerStyles.handle, { backgroundColor: theme.border }]} />
            <Text style={[pickerStyles.title, { color: theme.textPrimary }]}>Update Profile Photo</Text>

            <TouchableOpacity style={[pickerStyles.option, { backgroundColor: theme.background }]} onPress={() => pickFromSource('camera')}>
              <View style={[pickerStyles.iconBg, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF' }]}>
                <Ionicons name="camera" size={24} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[pickerStyles.optTitle, { color: theme.textPrimary }]}>Take Photo</Text>
                <Text style={[pickerStyles.optSub, { color: theme.textSecondary }]}>Use your camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[pickerStyles.option, { backgroundColor: theme.background }]} onPress={() => pickFromSource('gallery')}>
              <View style={[pickerStyles.iconBg, { backgroundColor: isDarkMode ? '#1E293B' : '#F0FDF4' }]}>
                <Ionicons name="images" size={24} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[pickerStyles.optTitle, { color: theme.textPrimary }]}>Choose from Gallery</Text>
                <Text style={[pickerStyles.optSub, { color: theme.textSecondary }]}>Pick an existing photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[pickerStyles.cancel, { borderColor: theme.border }]} onPress={() => setShowPickerModal(false)}>
              <Text style={[pickerStyles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, marginBottom: 12 },
  iconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  optTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  optSub: { fontSize: 12, fontWeight: '500' },
  cancel: { marginTop: 8, paddingVertical: 16, borderRadius: 18, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontWeight: '600' },
  
  heroCard: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
  },
  heroGrad: {
    paddingVertical: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#EAB308',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800' },
  topName: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  topSub: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  kycText: { color: '#FFF', fontSize: 11, fontWeight: '900', marginLeft: 4, letterSpacing: 0.5 },
  
  balanceRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  balanceBox: { 
    flex: 1, 
    borderRadius: 20, 
    padding: 16,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  balanceLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  balanceValue: { fontSize: 18, fontWeight: '900' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingLeft: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sectionCard: {
    borderRadius: 24,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabelGroup: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 13, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '800' },
});
