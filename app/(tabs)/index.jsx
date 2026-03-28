import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getLiveRates, getUserByMongoId } from '../../services/augmontApi';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { id: 'en', name: 'English', nativeName: 'Default', flag: '🇬🇧' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [langModalVisible, setLangModalVisible] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { isGold, setIsGold, theme, isDarkMode } = useTheme();
  const { user, userProfile } = useAuth();
  const { notificationsEnabled } = useNotifications();
  const [liveRatesData, setLiveRatesData] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const toggleAnim = useRef(new Animated.Value(isGold ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: isGold ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [isGold]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const data = await getLiveRates();
        if (data && data.result && data.result.data) {
          setLiveRatesData(data.result.data.rates);
        }
      } catch (error) {
        console.error('Failed to fetch rates:', error);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch MongoDB User Data via actual _id
  useEffect(() => {
    const fetchMongoUser = async () => {
      if (user && userProfile?.mongoId) {
        try {
          const token = await user.getIdToken();
          const response = await getUserByMongoId(userProfile.mongoId, token);
          if (response && response.data) setMongoUser(response.data);
          else if (response && response._id) setMongoUser(response);
          console.log("Dashboard user synced via MongoDB ID!");
        } catch (error) {
          console.error("Failed to sync MongoDB user via ID:", error);
        }
      }
    };
    
    fetchMongoUser();
  }, [user, userProfile?.mongoId]);

  const scale = 1; 
  const fs = (size) => Math.round((language === 'ta' ? size * 0.8 : size) * scale);

  // Dynamic MongoDB Balances (Fallbacks to 0 if loading)
  const portfolioText = isGold ? t('dashboard')?.totalGold || 'Total Digital Gold' : t('dashboard')?.totalSilver || 'Total Wallet Cash';
  
  // Example display logic: if checking Gold, we could show goldBalance in grams. If Silver/Wallet, show walletBalance. 
  // Customizing just to prove the DB hookup works:
  const rawBalance = isGold ? (mongoUser?.goldBalance || 0) : (mongoUser?.walletBalance || 0);
  
  const balanceInt = `₹${Math.floor(rawBalance).toLocaleString('en-IN')}`;
  const balanceDec = `.${(rawBalance % 1).toFixed(2).split('.')[1] || '00'}`;
  
  const profitPercent = isGold ? '↗ +0.00%' : '↗ +0.00%';
  const investedInt = isGold ? '₹0' : '₹0';
  const investedDec = '.00';
  const profitValInt = isGold ? '+ ₹0' : '+ ₹0';
  const profitValDec = '.00';
  
  // Dynamic Live Rates
  const liveRateInt = isGold 
    ? (liveRatesData ? `₹${Math.floor(parseFloat(liveRatesData.gBuy)).toLocaleString('en-IN')}` : '₹16,285')
    : (liveRatesData ? `₹${Math.floor(parseFloat(liveRatesData.sBuy)).toLocaleString('en-IN')}` : '₹86');
  
  const liveRateDec = isGold
    ? (liveRatesData ? `.${liveRatesData.gBuy.split('.')[1] || '00'}` : '.00')
    : (liveRatesData ? `.${liveRatesData.sBuy.split('.')[1] || '00'}` : '.62');

  const rateLabel = isGold ? `24K ${t('dashboard')?.rateLive || 'LIVE RATES'}` : `999 ${t('dashboard')?.rateLive || 'LIVE RATES'}`;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{`${t('dashboard')?.hello || 'HELLO'}, JXJF`}</Text>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{`${t('dashboard')?.portfolio || 'Your Portfolio'}`}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.iconCircle, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setLangModalVisible(true)}>
              <Ionicons name="globe-outline" size={22} color={theme.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconCircle, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={theme.textPrimary} />
              {notificationsEnabled && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Animated Tab Toggle (Gold / Silver) */}
        <View style={[styles.toggleContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Animated.View 
            style={[
              styles.slidingBackground, 
              { 
                backgroundColor: isGold ? '#EAB308' : (isDarkMode ? '#475569' : '#94A3B8'),
                transform: [{
                  translateX: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2, (width - 40 - 4) / 2],
                  })
                }]
              }
            ]} 
          />
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setIsGold(true)}
            activeOpacity={1}
          >
            <Text style={[styles.toggleText, isGold ? styles.toggleTextActive : { color: theme.textSecondary }]}>Gold</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setIsGold(false)}
            activeOpacity={1}
          >
            <Text style={[styles.toggleText, !isGold ? styles.toggleTextActive : { color: theme.textSecondary }]}>Silver</Text>
          </TouchableOpacity>
        </View>

        {/* Main Portfolio Card */}
        <View style={[styles.portfolioCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F8F9FA' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.portfolioLabel, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{portfolioText}</Text>
            <View style={[styles.profitBadge, { backgroundColor: isDarkMode ? '#064E3B' : '#F0FDF4' }]}>
              <Text style={styles.profitBadgeText} numberOfLines={1}>{profitPercent}</Text>
            </View>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceText, { color: theme.textPrimary }]}>{balanceInt}</Text>
            <Text style={[styles.balanceDec, { color: theme.textPrimary }]}>{balanceDec}</Text>
          </View>

          {/* Bar Chart Mockup */}
          <View style={styles.chartArea}>
            {[2, 3.5, 1.5, 2.5, 3.5, 2.2, 4.5, 3.2, 5.5, 2.5].map((h, i) => (
              <LinearGradient
                key={i}
                colors={isGold ? ['#FDE047', '#EAB308'] : (isDarkMode ? ['#475569', '#1E293B'] : ['#E2E8F0', '#94A3B8'])}
                style={[styles.barItem, { height: h * 8 }]}
                start={{x:0, y:0}} end={{x:0, y:1}}
              />
            ))}
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statsRow}>
            <View style={styles.statSide}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{t('dashboard')?.invested || 'INVESTED'}</Text>
              <View style={styles.statValRow}>
                <Text style={[styles.statValueBase, { color: theme.textPrimary }]}>{investedInt}</Text>
                <Text style={[styles.statValDec, { color: theme.textPrimary }]}>{investedDec}</Text>
              </View>
            </View>
            <View style={[styles.statSide, { alignItems: 'flex-end' }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{t('dashboard')?.profit || 'PROFIT'}</Text>
              <View style={styles.statValRow}>
                <Text style={styles.statValueProfit}>{profitValInt}</Text>
                <Text style={styles.statValProfitDec}>{profitValDec}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions Grid */}
        <View style={styles.actionsGrid}>
          {/* Live Rates Card */}
          <View style={[styles.liveRatesCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F8F9FA' }]}>
            <View style={styles.liveRateHeader}>
              <View style={[styles.dot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.rateHeaderLabel, { color: theme.textSecondary }]}>{rateLabel}</Text>
            </View>
            <View style={styles.statValRow}>
              <Text style={[styles.liveRateValue, { color: theme.primary }]}>{liveRateInt}</Text>
              <Text style={[styles.liveRateDec, { color: theme.primary }]}>{liveRateDec}</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewAllTextContainer}
              onPress={() => router.push({ pathname: '/live-rates', params: { type: isGold ? 'gold' : 'silver' } })}
            >
              <Text style={[styles.viewAllText, { color: theme.primary }]}>{`${t('dashboard')?.viewAll || 'View all'} →`}</Text>
            </TouchableOpacity>
          </View>

          {/* Buy/Sell Buttons */}
          <View style={styles.buySellCol}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => router.push({ pathname: '/buy', params: { type: isGold ? 'gold' : 'silver' } })}
            >
              <LinearGradient 
                colors={isGold ? ['#D4AF37', '#8A6D3B'] : ['#94A3B8', '#475569']} 
                start={{x:0, y:0}} 
                end={{x:1, y:1}} 
                style={styles.actionBtnGradient} 
              />
              <View style={styles.actionBtnContent}>
                <View style={[styles.actionBtnIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="cart-outline" size={20} color="#FFF" />
                </View>
                <Text style={styles.actionBtnText}>Buy {isGold ? 'Gold' : 'Silver'}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtnSecondary, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push({ pathname: '/sell', params: { type: isGold ? 'gold' : 'silver' } })}
            >
              <View style={[styles.actionBtnIcon, { backgroundColor: isDarkMode ? '#334155' : (isGold ? '#FFFBEB' : '#F1F5F9') }]}>
                <Ionicons name="cash-outline" size={20} color={theme.primary} />
              </View>
              <Text style={[styles.actionBtnSecondaryText, { color: theme.textPrimary }]}>Sell {isGold ? 'Gold' : 'Silver'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Access Grid (2 Rows of 4) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]} adjustsFontSizeToFit numberOfLines={1}>{t('dashboard')?.qa?.toUpperCase() || 'QUICK ACCESS'}</Text>
        </View>
        <View style={styles.quickAccessGrid}>
          {[
            { icon: 'trending-up', label: `LATEST ${isGold ? 'GOLD' : 'SILVER'}`, route: '/buy', params: { type: isGold ? 'gold' : 'silver' } },
            { icon: 'people', label: 'REFER & EARN', route: '/referral-rewards' },
            { icon: 'document-text', label: 'TRANSACTION', route: '/(tabs)/orders' },
            { icon: 'wallet', label: 'VAULTPAY', route: '/vault-pay' },
            { icon: 'notifications', label: 'PRICE ALERTS', route: '/price-alerts' },
            { icon: 'shield-checkmark', label: 'KYC STATUS', route: '/kyc' },
            { icon: 'business', label: 'WITHDRAW', route: '/withdraw' },
            { icon: 'bus', label: 'TRACKING', route: '/tracking' }
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.qaItem}
              onPress={() => item.route && router.push({ pathname: item.route, params: item.params || {} })}
            >
              <View style={[styles.qaIconCircle, { backgroundColor: isDarkMode ? '#1E293B' : '#F5F5F5' }]}>
                <Ionicons name={item.icon} size={26} color={theme.primary} />
              </View>
              <Text style={[styles.qaText, { color: theme.textPrimary }]} numberOfLines={2} adjustsFontSizeToFit>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.insightsHeader}>
          <Text style={[styles.insightsTitle, { color: theme.textPrimary }]}>Recent Transactions</Text>
          <TouchableOpacity 
            style={styles.viewAllBtn} 
            onPress={() => router.push('/orders')}
          >
            <Text style={[styles.viewAllLink, { color: theme.primary }]}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F8F9FA' }]}>
          <View style={[styles.txIconContainer, { backgroundColor: isDarkMode ? '#064E3B' : '#E8F5E9' }]}>
            <Ionicons name="trending-up" size={20} color="#22C55E" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.txTitle, { color: theme.textPrimary }]}>Bought Gold</Text>
            <Text style={[styles.txTime, { color: theme.textSecondary }]}>Today</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.txPrice}>+₹2,500</Text>
            <Text style={[styles.txWeight, { color: theme.textSecondary }]}>0.45g</Text>
          </View>
        </View>

        {/* Market Insights Content */}
        <View style={styles.insightsHeader}>
          <Text style={[styles.insightsTitle, { color: theme.textPrimary }]}>{t('dashboard')?.insights || "Market Insights"}</Text>
          <TouchableOpacity style={styles.viewAllBtn}><Text style={[styles.viewAllLink, { color: theme.primary }]}>{t('dashboard')?.viewAll || "View all"}</Text></TouchableOpacity>
        </View>

        <View style={[styles.insightCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F8F9FA' }]}>
          <View style={[styles.qaCircleSmall, { backgroundColor: theme.background }]}>
            <Ionicons name="trending-up" size={18} color={isGold ? '#EAB308' : (isDarkMode ? '#94A3B8' : '#334155')} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.insightCardTitle, { color: theme.textPrimary }]} numberOfLines={1}>{isGold ? (t('dashboard')?.latestGold || 'Latest Gold') : (t('dashboard')?.latestSilver || 'Latest Silver')}</Text>
            <Text style={[styles.insightCardTime, { color: theme.textSecondary }]}>10:50 AM</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.insightCardPrice}>-₹2,500</Text>
            <Text style={[styles.insightCardWeight, { color: theme.textSecondary }]}>0.37 G</Text>
          </View>
        </View>

        {/* News Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.newsCarouselScroll}>
          {[
            { tag: 'Market Alert', img: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=400', meta: '2h ago • Source: Mint', headline: 'Gold prices drop 9% after hitting record highs' },
            { tag: 'Expert Tips', img: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=400', meta: '4h ago • Source: CNBC', headline: 'Why digital gold is the safest hedge against inflation' },
            { tag: 'Global News', img: 'https://images.unsplash.com/photo-1599050751717-380ebfac0549?q=80&w=400', meta: '8h ago • Source: Reuters', headline: 'Central banks increase reserves by highest margin in 2 years' },
          ].map((news, i) => (
            <View key={i} style={[styles.newsCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F8F9FA' }]}>
              <Image source={{uri: news.img}} style={styles.newsImg} />
              <View style={[styles.newsTag, { backgroundColor: theme.primary }]}>
                <Text style={styles.newsTagText}>{news.tag}</Text>
              </View>
              <View style={styles.newsBody}>
                <Text style={[styles.newsMeta, { color: theme.textSecondary }]}>{news.meta}</Text>
                <Text style={[styles.newsHeadline, { color: theme.textPrimary }]}>{news.headline}</Text>
                <TouchableOpacity><Text style={[styles.newsReadMore, { color: theme.primary }]}>Read More</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Premium Language Selection Bottom Sheet */}
      <Modal 
        visible={langModalVisible} 
        transparent 
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setLangModalVisible(false)}
        >
          <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>{t('dashboard')?.selectLanguage || "Select Language"}</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.langList}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity 
                  key={lang.id} 
                  style={[
                    styles.langItem, 
                    { backgroundColor: theme.background, borderColor: theme.border },
                    language === lang.id && { borderColor: theme.primary, borderWidth: 2, backgroundColor: isDarkMode ? 'rgba(234, 179, 8, 0.05)' : '#FFFAEF' }
                  ]}
                  onPress={() => {
                    setLanguage(lang.id);
                    setLangModalVisible(false);
                  }}
                >
                  <View style={[styles.langFlagCircle, { backgroundColor: theme.card }]}>
                    <Text style={styles.langFlagEmoji}>{lang.flag}</Text>
                  </View>
                  <View style={styles.langItemContent}>
                    <Text style={[styles.langItemName, { color: theme.textPrimary }]}>{lang.name}</Text>
                    <Text style={[styles.langItemNative, { color: theme.textSecondary }]}>{lang.nativeName}</Text>
                  </View>
                  {language === lang.id && (
                    <View style={[styles.langCheck, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 30,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    position: 'relative',
    height: 48,
    alignItems: 'center',
  },
  slidingBackground: {
    position: 'absolute',
    width: '49%',
    height: '84%',
    borderRadius: 24,
    zIndex: 0,
  },
  toggleBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  toggleText: {
    fontWeight: '700',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  portfolioCard: {
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  portfolioLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  profitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profitBadgeText: {
    color: '#22C55E',
    fontWeight: '800',
    fontSize: 11,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  balanceText: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  balanceDec: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 2,
  },
  chartArea: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  barItem: {
    width: 24,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statSide: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValueBase: {
    fontSize: 18,
    fontWeight: '800',
  },
  statValDec: {
    fontSize: 12,
    fontWeight: '700',
  },
  statValueProfit: {
    fontSize: 18,
    fontWeight: '800',
    color: '#22C55E',
  },
  statValProfitDec: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    height: 140,
  },
  liveRatesCard: {
    flex: 1,
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
  },
  liveRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  rateHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveRateValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  liveRateDec: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewAllTextContainer: {
    marginTop: 'auto',
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
  },
  buySellCol: {
    flex: 1,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  actionBtnContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  actionBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    width: '100%',
    rowGap: 20,
  },
  qaItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '25%', // 4 columns → 2 rows
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  qaIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  qaIconWrapper: {
    marginBottom: 8,
  },
  qaText: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 13,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  viewAllBtn: {
    flexShrink: 0,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  txIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  txTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  txPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#22C55E',
    marginBottom: 2,
  },
  txWeight: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  newsCarouselScroll: {
    marginLeft: -20,
    paddingLeft: 20,
    overflow: 'visible',
  },
  newsCard: {
    borderRadius: 24,
    overflow: 'hidden',
    width: 260,
    marginRight: 16,
    borderWidth: 1,
  },
  newsImg: {
    width: '100%',
    height: 140,
  },
  newsTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newsTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  newsBody: {
    padding: 14,
  },
  newsMeta: {
    fontSize: 10,
    marginBottom: 4,
  },
  newsHeadline: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    lineHeight: 20,
  },
  newsReadMore: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.5,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sheetCloseBtn: {
    padding: 2,
  },
  langList: {
    gap: 12,
    paddingBottom: 10,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  langFlagCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  langFlagEmoji: {
    fontSize: 22,
  },
  langItemContent: {
    flex: 1,
  },
  langItemName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  langItemNative: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
  },
  langCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
