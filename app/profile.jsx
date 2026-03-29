import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Platform
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { getAugmontProfile, getUserByMongoId, getUserPassbook } from '../services/augmontApi';
import { LinearGradient } from 'expo-linear-gradient';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user, userProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [augmontData, setAugmontData] = useState(null);
  const [mongoData, setMongoData] = useState(null);
  const [passbookData, setPassbookData] = useState(null);
  const [error, setError] = useState(null);

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
            <View style={[styles.avatar, { backgroundColor: theme.itemBg, borderColor: theme.border }]}>
               <Text style={[styles.avatarText, { color: theme.primary }]}>
                {augmontData?.userName?.charAt(0).toUpperCase() || userProfile?.displayName?.charAt(0).toUpperCase() || 'S'}
               </Text>
            </View>
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
    </SafeAreaView>
  );
}

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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
