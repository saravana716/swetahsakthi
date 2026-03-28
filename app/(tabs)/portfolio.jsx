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
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

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
  const [activePeriod, setActivePeriod] = useState('6M');
  
  const chartData = {
    '1M': [50, 60, 55, 65, 70, 62, 75, 80, 72, 85, 90, 88, 95],
    '6M': [40, 45, 42, 55, 60, 65, 58, 70, 68, 75, 80, 85, 95],
    '1Y': [30, 40, 35, 50, 45, 60, 55, 65, 70, 68, 78, 85, 95],
    'All': [20, 30, 25, 40, 35, 50, 48, 60, 65, 72, 80, 88, 95],
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: theme.card }]}>
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Assets</Text>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: theme.card }]}>
            <Ionicons name="share-social-outline" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Portfolio Value Card */}
        <View style={[styles.portfolioCard, { backgroundColor: theme.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>CURRENT VALUE</Text>
            <View style={[styles.profitBadge, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5' }]}>
              <Ionicons name="trending-up" size={12} color="#10B981" />
              <Text style={styles.profitText}>+12.5%</Text>
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={[styles.currency, { color: theme.textPrimary }]}>₹</Text>
            <Text style={[styles.mainValue, { color: theme.textPrimary }]}>1,59,385</Text>
            <Text style={[styles.decimals, { color: theme.textSecondary }]}>.40</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Invested</Text>
              <Text style={[styles.statValue, { color: theme.textPrimary }]}>₹1,43,000</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Returns</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>+ ₹16,385</Text>
            </View>
          </View>
        </View>

        {/* Performance Chart Card */}
        <View style={[styles.performanceCard, { backgroundColor: theme.card }]}>
          <View style={styles.perfHeader}>
            <Text style={[styles.perfTitle, { color: theme.textPrimary }]}>Performance</Text>
            <View style={[styles.periodTabs, { backgroundColor: theme.background }]}>
              {['1M', '6M', '1Y', 'All'].map(p => (
                <TouchableOpacity 
                  key={p} 
                  style={[styles.periodBtn, activePeriod === p && styles.periodBtnActive, activePeriod === p && { backgroundColor: theme.card }]}
                  onPress={() => setActivePeriod(p)}
                >
                  <Text style={[styles.periodText, { color: theme.textSecondary }, activePeriod === p && { color: theme.textPrimary }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <PerformanceChart data={chartData[activePeriod]} themeColor={theme.primary} isDarkMode={isDarkMode} />
        </View>

        {/* Real Gold Jewellery Banner */}
        <View style={styles.banner}>
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
        </View>

        {/* Your Vault Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your Vault</Text>
        </View>

        {/* Asset Items */}
        <View style={styles.vaultList}>
          {/* Gold */}
          <View style={[styles.assetItem, { backgroundColor: theme.card }]}>
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
              <Text style={[styles.assetWeight, { color: theme.textPrimary }]}>24.50 gm</Text>
              <Text style={[styles.assetValue, { color: theme.textSecondary }]}>₹1,52,000</Text>
            </View>
          </View>

          {/* Silver */}
          <View style={[styles.assetItem, { backgroundColor: theme.card }]}>
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
              <Text style={[styles.assetWeight, { color: theme.textPrimary }]}>100.25 gm</Text>
              <Text style={[styles.assetValue, { color: theme.textSecondary }]}>₹7,385</Text>
            </View>
          </View>
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
