import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

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
  const { isGold, setIsGold, theme } = useTheme();
  const { notificationsEnabled } = useNotifications();
  const toggleAnim = useRef(new Animated.Value(isGold ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: isGold ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [isGold]);

  const isEn = language === 'en';
  const scale = 1; 
  const fs = (size) => Math.round((language === 'ta' ? size * 0.8 : size) * scale);

  // Mock Data
  const portfolioText = isGold ? t('dashboard')?.totalGold || 'Total Digital Gold' : t('dashboard')?.totalSilver || 'Total Digital Silver';
  const balanceInt = isGold ? '₹3,989' : '₹1,580';
  const balanceDec = isGold ? '.82' : '.88';
  const profitPercent = isGold ? '↗ +171.60%' : '↗ +1.99%';
  const investedInt = isGold ? '₹1,469' : '₹1,550';
  const investedDec = '.00';
  const profitValInt = isGold ? '+ ₹2520' : '+ ₹30';
  const profitValDec = isGold ? '.82' : '.88';
  const liveRateInt = isGold ? '₹16,285' : '₹86';
  const liveRateDec = isGold ? '.00' : '.62';
  const rateLabel = isGold ? `24K ${t('dashboard')?.rateLive || 'LIVE RATES'}` : `999 ${t('dashboard')?.rateLive || 'LIVE RATES'}`;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { fontSize: fs(12), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{`${t('dashboard')?.hello || 'HELLO'}, JXJF`}</Text>
            <Text style={[styles.headerTitle, { fontSize: fs(language === 'ta' ? 26 : 22), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{`${t('dashboard')?.portfolio || 'Your Portfolio'}`}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.iconCircle, { backgroundColor: theme.card }]} onPress={() => setLangModalVisible(true)}>
              <Ionicons name="globe-outline" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconCircle, { backgroundColor: theme.card }]} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={theme.textPrimary} />
              {notificationsEnabled && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Animated Tab Toggle (Gold / Silver) */}
        <View style={[styles.toggleContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Animated.View 
            style={[
              styles.slidingBackground, 
              { 
                backgroundColor: isGold ? '#EAB308' : '#94A3B8',
                transform: [{
                  translateX: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2, (width - 40 - 4) / 2], // 40 is total horizontal padding, 4 is inner padding correction
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
        <View style={[styles.portfolioCard, { backgroundColor: theme.card, shadowColor: theme.isDarkMode ? '#000' : '#000', elevation: theme.isDarkMode ? 0 : 5 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={[styles.portfolioLabel, { fontSize: fs(language === 'ta' ? 16 : 14), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{portfolioText}</Text>
            </View>
            <View style={[styles.profitBadge, { backgroundColor: theme.isDarkMode ? '#064E3B' : '#F0FDF4' }]}>
              <Text style={[styles.profitBadgeText, { color: '#22C55E' }]} numberOfLines={1}>{profitPercent}</Text>
            </View>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceText, { color: theme.textPrimary }]}>{balanceInt}</Text>
            <Text style={[styles.balanceDec, { color: theme.textPrimary }]}>{balanceDec}</Text>
          </View>

          {/* Bar Chart Mockup */}
          <View style={styles.chartArea}>
            {[2, 3, 1, 2, 3, 2, 4, 3, 5, 2].map((h, i) => (
              <LinearGradient
                key={i}
                colors={isGold ? (theme.isDarkMode ? ['#EAB308', '#713F12'] : ['#E3B745', '#FDF8EA']) : (theme.isDarkMode ? ['#94A3B8', '#334155'] : ['#8A9CAE', '#F6F8FA'])}
                style={[styles.barItem, { height: h * 10 }]}
                start={{x:0, y:0}} end={{x:0, y:1}}
              />
            ))}
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statsRow}>
            <View style={styles.statSide}>
              <Text style={[styles.statLabel, { fontSize: fs(12), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{t('dashboard')?.invested?.toUpperCase() || 'INVESTED'}</Text>
              <View style={styles.statValRow}>
                <Text style={[styles.statValueBase, { color: theme.textPrimary }]}>{investedInt}</Text>
                <Text style={[styles.statValDec, { color: theme.textPrimary }]}>{investedDec}</Text>
              </View>
            </View>
            <View style={[styles.statSide, { alignItems: 'flex-end' }]}>
              <Text style={[styles.statLabel, { fontSize: fs(12), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{t('dashboard')?.profit?.toUpperCase() || 'PROFIT'}</Text>
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
          <View style={[styles.liveRatesCard, { backgroundColor: theme.card, shadowColor: theme.isDarkMode ? '#000' : '#000', elevation: theme.isDarkMode ? 0 : 5 }]}>
            <View style={styles.liveRateHeader}>
              <View style={[styles.dot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.rateHeaderLabel, { fontSize: fs(language === 'ta' ? 15 : 12), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{rateLabel}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={[styles.liveRateValue, { color: theme.primary }]}>{`${liveRateInt}`}</Text>
              <Text style={[styles.liveRateDec, { color: theme.primary }]}>{`${liveRateDec}`}</Text>
            </View>
            <TouchableOpacity style={{ marginTop: 'auto' }}>
              <Text style={[styles.viewAllText, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{`${t('dashboard')?.viewAll || 'View all'} →`}</Text>
            </TouchableOpacity>
          </View>

          {/* Buy/Sell Buttons */}
          <View style={styles.buySellCol}>
            <TouchableOpacity style={styles.actionBtn}>
              <LinearGradient
                colors={isGold ? ['#EAB308', '#713F12'] : ['#94A3B8', '#1E293B']}
                style={styles.actionBtnGradient}
                start={{x:0,y:0}} end={{x:1,y:1}}
              />
              <View style={styles.actionBtnContent}>
                <View style={[styles.actionBtnIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name="cart" size={18} color="#FFF" />
                </View>
                <Text style={[styles.actionBtnText, { fontSize: fs(14), color: '#FFF' }]} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit>
                  {`${t('dashboard')?.buy || 'Buy'} ${isGold ? 'Gold' : 'Silver'}`}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtnSecondary, { backgroundColor: theme.isDarkMode ? '#1E293B' : '#FFFBF0', borderColor: theme.isDarkMode ? '#334155' : '#FEF9C3' }]}>
              <View style={[styles.actionBtnIcon, { backgroundColor: theme.isDarkMode ? '#0F172A' : '#FFF' }]}>
                <Ionicons name="cash" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.actionBtnSecondaryText, { color: theme.textPrimary, flex: 1, fontSize: fs(14) }]} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit>
                {`${t('dashboard')?.sell || 'Sell'} ${isGold ? 'Gold' : 'Silver'}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Access */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]} adjustsFontSizeToFit numberOfLines={1}>{t('dashboard')?.qa?.toUpperCase() || 'QUICK ACCESS'}</Text>
        </View>
        <View style={styles.quickAccessGrid}>
          {[
            { icon: 'trending-up', label: isGold ? (t('dashboard')?.latestGold || 'Latest Gold') : (t('dashboard')?.latestSilver || 'Latest Silver') },
            { icon: 'people', label: t('dashboard')?.referEarn || 'Refer & Earn' },
            { icon: 'receipt', label: t('dashboard')?.transaction || 'Transaction' },
            { icon: 'wallet', label: t('dashboard')?.vaultpay || 'VaultPay' }
          ].map((item, i) => (
            <View key={i} style={styles.qaItem}>
              <TouchableOpacity style={[styles.qaCircle, { backgroundColor: theme.card }]}>
                 <Ionicons name={item.icon} size={26} color={theme.primary} />
              </TouchableOpacity>
              <Text style={[styles.qaText, { fontSize: fs(10), color: theme.textPrimary }]} numberOfLines={2} ellipsizeMode="tail">{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Market Insights */}
        <View style={styles.insightsHeader}>
          <Text style={[styles.insightsTitle, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{t('dashboard')?.insights || "Market Insights"}</Text>
          <TouchableOpacity style={styles.viewAllBtn}><Text style={[styles.viewAllLink, { color: theme.primary }]} numberOfLines={1}>{t('dashboard')?.viewAll || "View all"}</Text></TouchableOpacity>
        </View>

        <View style={[styles.insightCard, { backgroundColor: theme.card }]}>
          <View style={[styles.qaCircleSmall, { backgroundColor: theme.itemBg }]}>
            <Ionicons name="trending-up" size={20} color={theme.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.insightCardTitle, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{isGold ? (t('dashboard')?.latestGold || 'Latest Gold') : (t('dashboard')?.latestSilver || 'Latest Silver')}</Text>
            <Text style={[styles.insightCardTime, { color: theme.textSecondary }]}>10:50 AM</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.insightCardPrice, { color: '#EF4444' }]}>-₹2,500</Text>
            <Text style={[styles.insightCardWeight, { color: theme.textSecondary }]}>0.37 G</Text>
          </View>
        </View>

        {/* News Carousel */}
        <View style={[styles.insightsHeader, { marginTop: 20 }]}>
          <Text style={[styles.insightsTitle, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{t('dashboard')?.insights || "Market Insights"}</Text>
          <TouchableOpacity style={styles.viewAllBtn}><Text style={[styles.viewAllLink, { color: theme.primary }]} numberOfLines={1}>{t('dashboard')?.viewAll || "View all"}</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.newsCarouselScroll}>
          {[
            { tag: 'Market Alert', img: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=400', meta: '2h ago • Source: Mint', headline: 'Gold prices drop 9% after hitting record highs' },
            { tag: 'Expert Tips', img: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=400', meta: '4h ago • Source: CNBC', headline: 'Why digital gold is the safest hedge against inflation' },
            { tag: 'Global News', img: 'https://images.unsplash.com/photo-1599050751717-380ebfac0549?q=80&w=400', meta: '8h ago • Source: Reuters', headline: 'Central banks increase reserves by highest margin in 2 years' },
          ].map((news, i) => (
            <View key={i} style={[styles.newsCard, { backgroundColor: theme.card }]}>
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

      {/* Language Modal */}
      <Modal visible={langModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary, fontSize: fs(20), flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{t('dashboard')?.selectLanguage || "Select Language"}</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={[styles.modalCloseText, { color: theme.primary, fontSize: fs(14) }]}>{t('dashboard')?.close || "Close"}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.langGrid}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity 
                  key={lang.id} 
                  style={[styles.langGridItem, language === lang.id && styles.langGridItemActive]}
                  onPress={() => {
                    setLanguage(lang.id);
                    setLangModalVisible(false);
                  }}
                >
                  <Text style={[styles.langItemName, { fontSize: fs(15) }, language === lang.id && {color: '#1A1A1A'}]} numberOfLines={1} ellipsizeMode="tail">{lang.name}</Text>
                  <Text style={[styles.langItemNative, { fontSize: fs(13) }]} numberOfLines={1} ellipsizeMode="tail">{lang.nativeName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16, // Increased margin to prevent icon overlap
  },
  greeting: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 2,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    height: 52,
    alignItems: 'center',
  },
  slidingBackground: {
    position: 'absolute',
    width: '49%',
    height: '84%',
    borderRadius: 16,
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
    fontSize: 16,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  portfolioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  portfolioLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  profitBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  profitBadgeText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 28,
  },
  balanceText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -1.5,
  },
  balanceDec: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 2,
  },
  chartArea: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  barItem: {
    width: 20,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
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
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 0.5,
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
    color: '#1A1A1A',
  },
  statValDec: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 2,
  },
  statValueProfit: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  statValProfitDec: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  liveRatesCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F8F9FA'
  },
  liveRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  rateHeaderLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  liveRateValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  liveRateDec: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    marginLeft: 2,
  },
  viewAllText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  buySellCol: {
    flex: 1,
    gap: 12,
  },
  actionBtn: {
    height: 72,
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
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  actionBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  actionBtnSecondary: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 2,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    width: '100%',
  },
  qaItem: {
    alignItems: 'center',
    width: '23%',
    minHeight: 100,
  },
  qaCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
    height: 38, // Increased height to comfortably allow 2 lines of Tamil
    paddingHorizontal: 2,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  viewAllBtn: {
    flexShrink: 0,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  qaCircleSmall: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  insightCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  insightCardTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  insightCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  insightCardWeight: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  newsCarouselScroll: {
    marginLeft: -20, // Negative margin to allow full-width scroll past padding
    paddingLeft: 20, // Real padding for the first item
    overflow: 'visible',
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    width: 280, // Fixed width for horizontal scroll
    marginRight: 16,
    marginBottom: 10,
  },
  newsImg: {
    width: '100%',
    height: 160,
  },
  newsTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newsTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  newsBody: {
    padding: 16,
  },
  newsMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  newsHeadline: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 24,
  },
  newsReadMore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'android' ? 32 : 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#C69320',
    fontWeight: '700',
  },
  modalCloseBtn: {
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  langGridItem: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
  },
  langGridItemActive: {
    borderColor: '#C69320',
    backgroundColor: '#FFFAED',
  },
  langItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  langItemNative: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
