import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getLiveRates, getUserPassbook, getAugmontBuyList } from '../../services/augmontApi';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64; // 32 horizontal padding
const CHART_HEIGHT = 120;

const AnimatedPath = Animated.createAnimatedComponent(Path);

function PerformanceChart({ data, themeColor, isDarkMode }) {
  const progress = useSharedValue(0);
  const drawingProgress = useSharedValue(0);
  const prevData = useSharedValue(data);
  const nextData = useSharedValue(data);

  useEffect(() => {
    prevData.value = nextData.value;
    nextData.value = data;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  }, [data]);

  useEffect(() => {
    drawingProgress.value = 0;
    drawingProgress.value = withDelay(400, withTiming(1, { duration: 1500, easing: Easing.out(Easing.exp) }));
  }, []);

  const animatedPaths = useDerivedValue(() => {
    const interpolatedData = nextData.value.map((v, i) => {
      const p = prevData.value[i] || v;
      return p + (v - p) * progress.value;
    });

    const max = Math.max(...interpolatedData);
    const min = Math.min(...interpolatedData);
    const range = max - min || 1;

    const points = interpolatedData.map((v, i) => {
      const x = (i / (interpolatedData.length - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - ((v - min) / range) * (CHART_HEIGHT - 30) - 15;
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const fillD = `M ${points[0]} L ${points.join(' L ')} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;

    return { pathD, fillD };
  });

  const lineLength = CHART_WIDTH * 2;

  const animatedLineProps = useAnimatedProps(() => ({
    d: animatedPaths.value.pathD,
    strokeDashoffset: lineLength * (1 - drawingProgress.value),
  }));

  const animatedFillProps = useAnimatedProps(() => ({
    d: animatedPaths.value.fillD,
  }));

  return (
    <View style={styles.chartContainer}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={themeColor} stopOpacity={isDarkMode ? "0.4" : "0.3"} />
            <Stop offset="1" stopColor={themeColor} stopOpacity="0" />
          </SvgGradient>
        </Defs>
        <AnimatedPath animatedProps={animatedFillProps} fill="url(#areaGrad)" />
        <AnimatedPath
          animatedProps={animatedLineProps}
          fill="none"
          stroke={themeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={lineLength}
        />
      </Svg>
    </View>
  );
}

export default function PortfolioScreen() {
  const { theme, isDarkMode } = useTheme();
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState('6M');
  const [liveRatesData, setLiveRatesData] = useState(null);
  const [passbookData, setPassbookData] = useState(null);
  const [buyList, setBuyList] = useState([]);
  const [portfolioHistory, setPortfolioHistory] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  // Fetch Live Rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const data = await getLiveRates();
        if (data && data.result && data.result.data) {
          const rates = data.result.data.rates;
          setLiveRatesData(rates);
          
          // Live Session Accumulation
          setPortfolioHistory(prev => {
             const gW = parseFloat(passbookData?.goldGrms || 0);
             const sW = parseFloat(passbookData?.silverGrms || 0);
             const currentTotal = (gW * parseFloat(rates.gBuy)) + (sW * parseFloat(rates.sBuy));
             if (currentTotal > 0) {
               const newHist = [...prev, currentTotal];
               return newHist.slice(-20);
             }
             return prev;
          });
        }
      } catch (error) {
        console.error('Failed to fetch rates:', error);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync Augmont Portfolio
  useEffect(() => {
    const syncPortfolio = async () => {
      const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
      if (user && uniqueId) {
        try {
          const token = await user.getIdToken();
          const [pbResponse, blResponse] = await Promise.all([
            getUserPassbook(uniqueId, token),
            getAugmontBuyList(uniqueId, token)
          ]);
          if (pbResponse && pbResponse.result) setPassbookData(pbResponse.result.data);
          if (blResponse && blResponse.result) {
            const list = blResponse.result.data;
            setBuyList(list);
            
            // Initialization: Start from Investment Cost and trend towards current value
            const invested = list.reduce((acc, curr) => acc + parseFloat(curr.exclTaxAmt || curr.inclTaxAmt || 0), 0);
            const gW = parseFloat(pbResponse.result.data?.goldGrms || 0);
            const sW = parseFloat(pbResponse.result.data?.silverGrms || 0);
            const currentVal = (gW * parseFloat(liveRatesData?.gBuy || 0)) + (sW * parseFloat(liveRatesData?.sBuy || 0));
            
            if (invested > 0) {
              const initialTrend = [];
              const steps = 10;
              for(let i=0; i<steps; i++) {
                initialTrend.push(invested + ((currentVal - invested) * (i/steps) * (0.9 + Math.random()*0.2)));
              }
              setPortfolioHistory(initialTrend);
            }
          }
        } catch (error) {
          console.error("Failed to sync Portfolio:", error);
        }
      }
    };
    syncPortfolio();
  }, [user, userProfile]);

  // Dynamic Portfolio Calculations
  const goldWeight = parseFloat(passbookData?.goldGrms || 0);
  const silverWeight = parseFloat(passbookData?.silverGrms || 0);
  
  const goldRate = parseFloat(liveRatesData?.gBuy || 0);
  const silverRate = parseFloat(liveRatesData?.sBuy || 0);

  const goldValue = goldWeight * goldRate;
  const silverValue = silverWeight * silverRate;
  const totalValue = goldValue + silverValue;

  // Investment Cost (Exclusive of Tax)
  const totalInvested = buyList.reduce((acc, curr) => acc + parseFloat(curr.exclTaxAmt || curr.inclTaxAmt || 0), 0);
  const totalReturns = totalInvested > 0 ? totalValue - totalInvested : 0;
  const returnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
  
  const isProfit = totalReturns >= 0;

  // Formatter helpers
  const fmtInt = (val) => Math.floor(val).toLocaleString('en-IN');
  const fmtDec = (val) => (val % 1).toFixed(2).split('.')[1] || '00';
  
  // Generating Dynamic Historical Chart Data
  // This simulates the user's historical portfolio performance
  // It anchors the earliest points around the 'totalInvested' cost,
  // and the final point strictly on the 'totalValue' (Live Vault Value).
  const generateDynamicPoints = (startVal, endVal, count, volatility) => {
    if (startVal === 0 && endVal === 0) return Array(count).fill(0);
    const result = [];
    for (let i = 0; i < count; i++) {
        const progress = i / (count - 1);
        // Base interpolation
        const base = startVal + (endVal - startVal) * progress;
        // Add random market volatility
        const variance = (Math.random() - 0.5) * volatility * endVal;
        result.push(i === count - 1 ? endVal : base + variance);
    }
    return result;
  };

  const dynamicChartData = {
    '1M': generateDynamicPoints(totalInvested, totalValue, 13, 0.02),
    '6M': generateDynamicPoints(totalInvested * 0.9, totalValue, 13, 0.05),
    '1Y': generateDynamicPoints(totalInvested * 0.8, totalValue, 13, 0.08),
    'All': generateDynamicPoints(totalInvested * 0.5, totalValue, 13, 0.12),
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.headerBtn, { backgroundColor: theme.card }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Assets</Text>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: theme.card }]}>
            <Ionicons name="share-social-outline" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Portfolio Value Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={[styles.portfolioCard, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>CURRENT VALUE</Text>
            <View style={[styles.profitBadge, { backgroundColor: isProfit ? (isDarkMode ? '#064E3B' : '#ECFDF5') : (isDarkMode ? '#450a0a' : '#FEF2F2') }]}>
              <Ionicons name={isProfit ? "trending-up" : "trending-down"} size={12} color={isProfit ? "#10B981" : "#EF4444"} />
              <Text style={[styles.profitText, { color: isProfit ? "#10B981" : "#EF4444" }]}>{isProfit ? '+' : ''}{returnsPercent.toFixed(1)}%</Text>
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.currency, { color: theme.textPrimary }]}>₹</Text>
            <Text style={[styles.mainValue, { color: theme.textPrimary }]}>{fmtInt(totalValue)}</Text>
            <Text style={[styles.decimals, { color: theme.textSecondary }]}>.{fmtDec(totalValue)}</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Invested</Text>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>₹{Math.floor(totalInvested).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Returns</Text>
              <Text style={[styles.statValue, { color: isProfit ? '#10B981' : '#EF4444' }]}>
                {isProfit ? '+' : '-'} ₹{Math.floor(Math.abs(totalReturns)).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Performance Chart Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={[styles.performanceCard, { backgroundColor: theme.card }]}>
          <View style={styles.perfHeader}>
            <Text style={[styles.perfTitle, { color: theme.textPrimary }]}>Performance</Text>
            <View style={[styles.periodTabs, { backgroundColor: theme.background }]}>
              {['Live'].map(p => (
                <TouchableOpacity 
                  key={p} 
                  style={[styles.periodBtn, styles.periodBtnActive, { backgroundColor: theme.card }]}
                >
                  <Text style={[styles.periodText, { color: theme.textPrimary }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <PerformanceChart data={dynamicChartData[activePeriod]} themeColor={theme.primary} isDarkMode={isDarkMode} />
        </Animated.View>

        {/* Real Gold Jewellery Banner */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.banner}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=800' }}
            style={styles.bannerImg}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.bannerOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}
          >
            <Text style={styles.bannerTitle}>Real Gold Jewellery</Text>
            <Text style={styles.bannerSub}>Exchange digital gold for physical art.</Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>View Collection</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Your Vault Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your Vault</Text>
        </View>

        {/* Asset Items */}
        <View style={styles.vaultList}>
          {/* Gold */}
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={[styles.assetItem, { backgroundColor: theme.card }]}>
            <View style={[styles.assetIconContainer, { backgroundColor: theme.background }]}>
              <LinearGradient colors={['#FDE047', '#D97706']} style={styles.assetIcon}>
                <Ionicons name="sparkles" size={16} color="#FFF" />
              </LinearGradient>
            </View>
            <View style={styles.assetInfo}>
              <Text style={[styles.assetName, { color: theme.textPrimary }]}>24K Pure Gold</Text>
              <Text style={[styles.assetMeta, { color: theme.textSecondary }]}>99.9% Purity • Augmont Secured</Text>
            </View>
            <View style={styles.assetValues}>
              <Text style={[styles.assetWeight, { color: theme.textPrimary }]}>{goldWeight.toFixed(4)} gm</Text>
              <Text style={[styles.assetValue, { color: theme.textSecondary }]}>₹{goldValue.toLocaleString('en-IN')}</Text>
            </View>
          </Animated.View>

          {/* Silver */}
          <Animated.View entering={FadeInDown.duration(500).delay(500)} style={[styles.assetItem, { backgroundColor: theme.card }]}>
            <View style={[styles.assetIconContainer, { backgroundColor: theme.background }]}>
              <LinearGradient colors={['#D1D5DB', '#4B5563']} style={styles.assetIcon}>
                <Ionicons name="sunny" size={16} color="#FFF" />
              </LinearGradient>
            </View>
            <View style={styles.assetInfo}>
              <Text style={[styles.assetName, { color: theme.textPrimary }]}>999 Pure Silver</Text>
              <Text style={[styles.assetMeta, { color: theme.textSecondary }]}>99.9% Purity • Insured Vault</Text>
            </View>
            <View style={styles.assetValues}>
              <Text style={[styles.assetWeight, { color: theme.textPrimary }]}>{silverWeight.toFixed(4)} gm</Text>
              <Text style={[styles.assetValue, { color: theme.textSecondary }]}>₹{silverValue.toLocaleString('en-IN')}</Text>
            </View>
          </Animated.View>
        </View>

        {/* Padding for Floating Tab Bar */}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  headerBtn: {
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
  portfolioCard: {
    borderRadius: 30,
    padding: 24,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  profitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 4,
  },
  mainValue: {
    fontSize: 44,
    fontWeight: '900',
  },
  decimals: {
    fontSize: 24,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  performanceCard: {
    borderRadius: 30,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  perfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  perfTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  periodTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  periodBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chartContainer: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    height: 150,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 20,
  },
  bannerImg: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '500',
    marginBottom: 16,
    opacity: 0.9,
    maxWidth: '70%',
  },
  bannerBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  vaultList: {
    gap: 12,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  assetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  assetIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  assetMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  assetValues: {
    alignItems: 'flex-end',
  },
  assetWeight: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  assetValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
