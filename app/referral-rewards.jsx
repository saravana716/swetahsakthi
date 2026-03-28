import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './context/ThemeContext';

export default function ReferralRewardsScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const referralCode = "SWS2026GOLD";

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join Swarna Sakthi and start your gold savings journey! Use my code ${referralCode} to get 50mg extra gold on your first purchase.`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const RewardStep = ({ number, title, desc, isLast }) => (
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <View style={[styles.stepCircle, { backgroundColor: theme.primary }]}>
          <Text style={styles.stepNumber}>{number}</Text>
        </View>
        {!isLast && <View style={[styles.stepLine, { backgroundColor: theme.border }]} />}
      </View>
      <View style={styles.stepRight}>
        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{desc}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Refer & Earn</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Hero Card */}
        <LinearGradient
          colors={isDarkMode ? ['#1E1B4B', '#312E81'] : ['#EEF2FF', '#E0E7FF']}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroInfo}>
            <Text style={[styles.heroTitle, { color: isDarkMode ? '#C7D2FE' : '#4338CA' }]}>Invite Friends &{"\n"}Get Free Gold</Text>
            <Text style={[styles.heroSub, { color: isDarkMode ? '#A5B4FC' : '#6366F1' }]}>Earn 50mg gold for every coworker who joins and saves.</Text>
          </View>
          <View style={styles.heroImageWrap}>
            <Ionicons name="gift" size={80} color={isDarkMode ? '#818CF8' : '#4F46E5'} opacity={0.2} />
          </View>
        </LinearGradient>

        {/* Rewards Stats */}
        <View style={[styles.statsRow, { backgroundColor: theme.card }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>12</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>TOTAL REFERS</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.primary }]}>600mg</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>GOLD EARNED</Text>
          </View>
        </View>

        {/* Referral Code Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>YOUR REFERRAL CODE</Text>
        </View>
        
        <View style={[styles.codeCard, { backgroundColor: theme.card, borderColor: theme.primary }]}>
          <Text style={[styles.codeText, { color: theme.textPrimary }]}>{referralCode}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={onShare}>
            <Ionicons name="copy-outline" size={20} color={theme.primary} />
            <Text style={[styles.copyText, { color: theme.primary }]}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>HOW IT WORKS</Text>
        </View>

        <View style={[styles.stepsCard, { backgroundColor: theme.card }]}>
          <RewardStep 
            number="1" 
            title="Share your code" 
            desc="Invite your friends to Swarna Sakthi using your unique link or code."
          />
          <RewardStep 
            number="2" 
            title="Friend saves gold" 
            desc="Your friend makes their first gold purchase of at least ₹500."
          />
          <RewardStep 
            number="3" 
            title="Get rewarded" 
            desc="Both you and your friend get 50mg 24K gold credited to your vaults."
            isLast={true}
          />
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
          <LinearGradient
            colors={[theme.primary, '#B45309']}
            style={styles.shareBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="share-social" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.shareBtnText}>SHARE LINK WITH FRIENDS</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 30,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    overflow: 'hidden',
  },
  heroInfo: {
    flex: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  heroImageWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  codeCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  copyText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  stepsCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 70,
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
  stepLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  stepRight: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  shareBtn: {
    marginTop: 40,
    height: 60,
    borderRadius: 24,
    overflow: 'hidden',
  },
  shareBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
