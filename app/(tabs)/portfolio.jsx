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
  View
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
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 110;

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Premium Animated SVG sparkline chart
function PerformanceChart({ data, themeColor, theme }) {
  const progress = useSharedValue(0);
  const drawingProgress = useSharedValue(0);
  const prevData = useSharedValue(data);
  const nextData = useSharedValue(data);

  // Trigger data morphing animation
  useEffect(() => {
    prevData.value = nextData.value;
    nextData.value = data;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  }, [data]);

  // Trigger initial drawing animation
  useEffect(() => {
    drawingProgress.value = 0;
    drawingProgress.value = withDelay(400, withTiming(1, { duration: 1500, easing: Easing.out(Easing.exp) }));
  }, []);

  // Compute animated path string
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

    return {
      pathD,
      fillD,
    };
  });

  // Calculate length for drawing animation (approximate)
  const lineLength = CHART_WIDTH * 1.5;

  const animatedLineProps = useAnimatedProps(() => {
    return {
      d: animatedPaths.value.pathD,
      strokeDashoffset: lineLength * (1 - drawingProgress.value),
    };
  });

  const animatedFillProps = useAnimatedProps(() => {
    return {
      d: animatedPaths.value.fillD,
    };
  });

  return (
    <View style={styles.chartContainer}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={themeColor} stopOpacity="0.4" />
            <Stop offset="1" stopColor={themeColor} stopOpacity="0" />
          </SvgGradient>
        </Defs>
        <AnimatedPath 
          animatedProps={animatedFillProps} 
          fill="url(#areaGrad)" 
        />
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
  const { language, t } = useLanguage();
  const { isGold, setIsGold, theme } = useTheme();
  const [activePeriod, setActivePeriod] = useState('6M');

  const isEn = language === 'en';
  const themeColor = isGold ? '#C89421' : '#708090';

  const scale = 1; 
  const fs = (size) => Math.round((language === 'ta' ? size * 0.8 : size) * scale);
  const p = t('portfolio') || {};

  // MOCK DATA STRUCTURE - Ready for API integration
  const chartData = {
    gold: {
      '1M': [50, 60, 55, 65, 70, 62, 75, 80, 72, 85, 90, 88, 95],
      '6M': [40, 45, 42, 55, 60, 65, 58, 70, 68, 75, 80, 85, 95],
      '1Y': [30, 40, 35, 50, 45, 60, 55, 65, 70, 68, 78, 85, 95],
      'All': [20, 30, 25, 40, 35, 50, 48, 60, 65, 72, 80, 88, 95],
    },
    silver: {
      '1M': [30, 35, 32, 40, 45, 42, 48, 50, 46, 55, 60, 58, 65],
      '6M': [25, 28, 26, 32, 35, 38, 34, 40, 38, 42, 45, 48, 55],
      '1Y': [20, 25, 22, 28, 26, 32, 30, 35, 38, 36, 40, 45, 50],
      'All': [15, 20, 18, 25, 22, 28, 26, 30, 32, 35, 38, 42, 48],
    }
  };

  const currentData = isGold ? chartData.gold[activePeriod] : chartData.silver[activePeriod];
  const periods = ['1M', '6M', '1Y', 'All'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fs(language === 'ta' ? 26 : 22), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
          {p.title || 'My Assets'}
        </Text>
        <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="share-social-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Portfolio Value Card */}
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.isDarkMode ? '#000' : '#000', elevation: theme.isDarkMode ? 0 : 5 }]}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardLabel, { fontSize: fs(language === 'ta' ? 15 : 13), color: theme.textSecondary, flex: 1, marginRight: 8 }]} numberOfLines={1} ellipsizeMode="tail">
              {p.currentValue || 'Current Portfolio Value'}
            </Text>
            <View style={[styles.gainBadge, { backgroundColor: theme.isDarkMode ? '#064E3B' : (isGold ? '#ECFDF5' : '#F1F5F9') }]}>
              <Ionicons name="trending-up" size={13} color={isGold ? '#10B981' : (theme.isDarkMode ? '#22C55E' : '#64748B')} />
              <Text style={[styles.gainText, { color: isGold ? '#10B981' : (theme.isDarkMode ? '#22C55E' : '#64748B'), fontSize: fs(13) }]}>{"+12.5%"}</Text>
            </View>
          </View>

          <Text style={[styles.portfolioValue, { color: theme.textPrimary }]}>₹1,59,385</Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statsRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statLabel, { fontSize: fs(13), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                {p.invested || 'Invested'}
              </Text>
              <Text style={[styles.statValue, { fontSize: 18, color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>₹1,43,000</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.statLabel, { fontSize: fs(13), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
                {p.totalReturns || 'Total Returns'}
              </Text>
              <Text style={[styles.statValue, { color: isGold ? '#10B981' : theme.primary, fontSize: 18 }]} numberOfLines={1} adjustsFontSizeToFit>{"+ ₹16,385"}</Text>
            </View>
          </View>
        </View>

        {/* Performance Card */}
        <View style={[styles.card, { paddingBottom: 20, backgroundColor: theme.card }]}>
          <View style={styles.performanceHeader}>
            <Text style={[styles.performanceTitle, { color: theme.textPrimary, flex: 1, marginRight: 8 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {p.performance || 'Performance'}
            </Text>
            <View style={styles.periodRow}>
              {periods.map(period => (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodBtn, activePeriod === period && { backgroundColor: theme.primary }]}
                  onPress={() => setActivePeriod(period)}
                >
                  <Text style={[styles.periodText, activePeriod === period ? { color: '#FFF' } : { color: theme.textSecondary }]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.chartWrapper}>
            <PerformanceChart period={activePeriod} data={currentData} themeColor={theme.primary} theme={theme} />
          </View>
        </View>

        {/* Real Gold Jewellery Banner */}
        <View style={styles.bannerCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=800' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
          <View style={styles.bannerContent}>
            <Text style={[styles.bannerTitle, { color: isGold ? '#F5CC50' : '#E5E7EB', fontSize: fs(20) }]} numberOfLines={1} ellipsizeMode="tail">
              {p.realGold || 'Real Gold Jewellery'}
            </Text>
            <Text style={[styles.bannerSub, { fontSize: fs(13) }]} numberOfLines={1} ellipsizeMode="tail">
              {p.realGoldSub || 'Exchange digital gold for physical art.'}
            </Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText} numberOfLines={1}>{p.viewAll || 'View all'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Vault Section */}
        <Text style={[styles.vaultTitle, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {p.yourVault || 'Your Vault'}
        </Text>

        {/* 24K Pure Gold */}
        <View style={[styles.vaultItem, { backgroundColor: theme.card }]}>
          <View style={styles.vaultIconWrap}>
            <LinearGradient
              colors={['#FFF8DC', '#F5CC50']}
              style={styles.vaultIconGrad}
              start={{ x: 0.2, y: 0.2 }} end={{ x: 0.8, y: 0.8 }}
            >
              <View style={[styles.vaultIconCircle, { backgroundColor: theme.isDarkMode ? '#422006' : '#FFF' }]}>
                <LinearGradient
                  colors={['#F5CC50', '#C89421']}
                  style={styles.vaultIconInner}
                  start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                />
              </View>
            </LinearGradient>
          </View>
          <View style={[styles.vaultInfo, { flex: 2 }]}>
            <Text style={[styles.vaultName, { fontSize: fs(15), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
              {p.pure24k || '24K Pure'}
            </Text>
            <Text style={[styles.vaultMeta, { fontSize: fs(12), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit>
              {p.purity || '99.9% Purity'} • {p.augmont || 'Augmont Secured'}
            </Text>
          </View>
          <View style={styles.vaultRight}>
            <Text style={[styles.vaultGrams, { color: theme.textPrimary }]}>24.50 gm</Text>
            <Text style={[styles.vaultRupee, { color: theme.textSecondary }]}>₹1,52,000</Text>
          </View>
        </View>

        {/* Silver */}
        <View style={[styles.vaultItem, { backgroundColor: theme.card }]}>
          <View style={styles.vaultIconWrap}>
            <LinearGradient
              colors={['#F3F4F6', '#E5E7EB']}
              style={styles.vaultIconGrad}
              start={{ x: 0.2, y: 0.2 }} end={{ x: 0.8, y: 0.8 }}
            >
              <View style={[styles.vaultIconCircle, { backgroundColor: theme.isDarkMode ? '#334155' : '#FFF' }]}>
                <LinearGradient
                  colors={['#D1D5DB', '#9CA3AF']}
                  style={styles.vaultIconInner}
                  start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                />
              </View>
            </LinearGradient>
          </View>
          <View style={[styles.vaultInfo, { flex: 2 }]}>
            <Text style={[styles.vaultName, { fontSize: fs(15), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
              {p.silver || 'Silver'}
            </Text>
            <Text style={[styles.vaultMeta, { fontSize: fs(12), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit>
              {p.purity || '99.9% Purity'} • {p.insuredVault || 'Insured Vault'}
            </Text>
          </View>
          <View style={styles.vaultRight}>
            <Text style={[styles.vaultGrams, { color: theme.textPrimary }]}>100.0 gm</Text>
            <Text style={[styles.vaultRupee, { color: theme.textSecondary }]}>₹7,385</Text>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontWeight: '600',
  },
  gainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  gainText: {
    fontWeight: '700',
    marginLeft: 4,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '700',
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartWrapper: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerCard: {
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerContent: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    height: '100%',
  },
  bannerTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSub: {
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 16,
    lineHeight: 18,
    maxWidth: '80%',
  },
  bannerBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },
  vaultTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  vaultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  vaultIconWrap: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  vaultIconGrad: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    padding: 2,
  },
  vaultIconCircle: {
    flex: 1,
    borderRadius: 10,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultIconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  vaultInfo: {
    flex: 1,
  },
  vaultName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  vaultMeta: {
    opacity: 0.8,
  },
  vaultRight: {
    alignItems: 'flex-end',
  },
  vaultGrams: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  vaultRupee: {
    fontSize: 13,
    fontWeight: '600',
  },
});


