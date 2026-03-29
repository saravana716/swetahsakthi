import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  Layout,
  SlideInRight
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from './context/ThemeContext';
import { useLanguage } from './context/LanguageContext';
import { getLiveRates } from '../services/augmontApi';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';
import AnimatedButton from '../components/AnimatedButton';

const { width } = Dimensions.get('window');

/**
 * Pixel-perfect Live Rates screen with Chart, Price History, and Calculator.
 */
export default function LiveRatesScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { type } = useLocalSearchParams();
  const isGold = type !== 'silver'; // Default to gold
  
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(0);
  const [quality, setQuality] = useState('24K');
  const [weight, setWeight] = useState(1);
  
  // Dynamic Chart Data generated based on live rate
  const [chartData, setChartData] = useState([]);
  const chartWidth = width - 40;
  const chartHeight = 180;

  useEffect(() => {
    let interval;
    const fetchRate = async () => {
      try {
        const data = await getLiveRates();
        if (data?.result?.data?.rates) {
          const r = isGold ? data.result.data.rates.gBuy : data.result.data.rates.sBuy;
          const currentRate = parseFloat(r);
          setRate(currentRate);
          
          // Dynamically calculate recent history curve based on the real-time API live rate
          // This generates 8 data points simulating minor market fluctuations preceding the live rate
          setChartData([
            currentRate * 0.992,
            currentRate * 0.998,
            currentRate * 0.995,
            currentRate * 1.005,
            currentRate * 1.001,
            currentRate * 0.996,
            currentRate * 1.003,
            currentRate 
          ]);
        }
      } catch (error) {
        console.error('Fetch rate error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
    interval = setInterval(fetchRate, 30000); // 30s refresh

    return () => clearInterval(interval);
  }, [isGold]);

  const purityFactor = quality === '24K' ? 1 : 0.916;
  const finalValuation = (rate * weight * purityFactor).toFixed(0);

  // SVG Path Generator for the Chart
  const linePath = useMemo(() => {
    if (chartData.length === 0) return '';
    const max = Math.max(...chartData);
    const min = Math.min(...chartData);
    const range = max - min || 1; // Prevent division by zero
    const step = chartWidth / (chartData.length - 1);
    
    return chartData.map((val, i) => {
      const x = i * step;
      const y = chartHeight - ((val - min) / range) * (chartHeight - 40) - 20;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [chartData, chartWidth]);

  const areaPath = useMemo(() => {
    return `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
  }, [linePath]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Live {isGold ? 'Gold' : 'Silver'} Rates</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Current Rate Section */}
        <Animated.View 
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.mainRateContainer}
        >
          <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Current Market Rate (Per Gram)</Text>
          {loading ? (
            <View style={{ marginVertical: 10 }}>
              <ShimmerPlaceholder width={180} height={48} borderRadius={12} isDarkMode={isDarkMode} />
            </View>
          ) : (
            <Text style={[styles.rateValue, { color: theme.primary }]}>₹{rate.toLocaleString('en-IN')}</Text>
          )}
          
          <View style={styles.badgeRow}>
            <View style={[styles.trendBadge, { backgroundColor: isDarkMode ? '#064E3B' : '#DCFCE7' }]}>
              <Text style={[styles.trendText, { color: '#22C55E' }]}>↗ +1.15% Today</Text>
            </View>
          </View>
          
          <View style={styles.apiInfo}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.apiText, { color: theme.textSecondary }]}>Live Global Market API</Text>
          </View>
        </Animated.View>

        {/* Chart Section */}
        <Animated.View 
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.chartContainer}
        >
          {loading ? (
            <ShimmerPlaceholder width={chartWidth} height={chartHeight} borderRadius={20} isDarkMode={isDarkMode} />
          ) : (
            <>
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={theme.primary} stopOpacity="0.15" />
                    <Stop offset="1" stopColor={theme.primary} stopOpacity="0" />
                  </SvgGradient>
                </Defs>
                <Path d={areaPath} fill="url(#grad)" />
                <Path d={linePath} fill="none" stroke={theme.primary} strokeWidth="3" strokeLinecap="round" />
                
                {/* Legend / Tooltip Dot */}
                <Circle cx={chartWidth * 0.65} cy={chartHeight * 0.4} r="4" fill={theme.primary} stroke="#FFF" strokeWidth="2" />
                <Path d={`M ${chartWidth * 0.65} ${chartHeight * 0.4} V ${chartHeight}`} stroke={theme.border} strokeWidth="1" strokeDasharray="4 4" />
              </Svg>
              
              {/* Mock Tooltip */}
              <View style={[styles.tooltip, { left: chartWidth * 0.45, backgroundColor: theme.card, shadowColor: '#000' }]}>
                 <Text style={[styles.tooltipVal, { color: theme.textPrimary }]}>4</Text>
                 <Text style={[styles.tooltipLabel, { color: theme.textSecondary }]}>value : 16180</Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* Price History & Forecast */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Price History & Forecast</Text>
        <View style={[styles.historyContainer, { backgroundColor: theme.card }]}>
          
          {/* Yesterday */}
          <Animated.View entering={FadeInRight.delay(300).duration(500)} style={styles.historyItem}>
            <View>
              <Text style={[styles.historyName, { color: theme.textPrimary }]}>Yesterday</Text>
              <Text style={[styles.historyDate, { color: theme.textSecondary }]}>Jan 31</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.historyPrice, { color: theme.textPrimary }]}>₹16240</Text>
              <Text style={[styles.historyChange, { color: '#22C55E' }]}>+ ₹80</Text>
            </View>
          </Animated.View>

          {/* Today */}
          <Animated.View entering={FadeInRight.delay(400).duration(500)} style={[styles.historyItem, { backgroundColor: isDarkMode ? '#1E1B4B' : '#FFFBEB' }]}>
            <View>
              <Text style={[styles.historyName, { color: theme.textPrimary }]}>Today</Text>
              <Text style={[styles.historyDate, { color: theme.textSecondary }]}>Feb 01</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {loading ? (
                <ShimmerPlaceholder width={80} height={20} borderRadius={4} isDarkMode={isDarkMode} />
              ) : (
                <Text style={[styles.historyPrice, { color: theme.textPrimary }]}>₹{rate.toLocaleString('en-IN') || '14250'}</Text>
              )}
              <Text style={[styles.historyChange, { color: '#22C55E' }]}>+ ₹115</Text>
            </View>
          </Animated.View>

          {/* Tomorrow */}
          <Animated.View entering={FadeInRight.delay(500).duration(500)} style={styles.historyItem}>
            <View>
              <Text style={[styles.historyName, { color: theme.textPrimary }]}>Tomorrow</Text>
              <Text style={[styles.historyDate, { color: theme.textSecondary }]}>Feb 02</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.historyPrice, { color: theme.textPrimary }]}>₹16275</Text>
              <Text style={[styles.historyChange, { color: theme.primary }]}>Forecast</Text>
            </View>
          </Animated.View>
        </View>

        {/* Live Quick Calculator */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Live Quick Calculator</Text>
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={[styles.calcContainer, { backgroundColor: theme.card }]}>
          
          <Text style={[styles.calcLabel, { color: theme.textSecondary }]}>SELECT QUALITY</Text>
          <View style={styles.btnRow}>
            {['24K (99.9%)', '22K (91.6%)'].map(q => (
              <AnimatedButton 
                key={q} 
                style={[styles.calcBtn, quality === q.substring(0,3) ? { backgroundColor: theme.primary } : { borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => {
                  setQuality(q.substring(0,3));
                }}
              >
                <Text style={[styles.calcBtnText, quality === q.substring(0,3) ? { color: '#FFF' } : { color: theme.textSecondary }]}>{q}</Text>
              </AnimatedButton>
            ))}
          </View>

          <Text style={[styles.calcLabel, { color: theme.textSecondary, marginTop: 20 }]}>SELECT WEIGHT</Text>
          <View style={styles.btnRow}>
            {[
              { label: '1 Gram', val: 1 },
              { label: '8 Grams (1 Pavan)', val: 8 }
            ].map(w => (
              <AnimatedButton 
                key={w.label} 
                style={[styles.calcBtn, weight === w.val ? { backgroundColor: theme.primary } : { borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => {
                  setWeight(w.val);
                }}
              >
                <Text style={[styles.calcBtnText, weight === w.val ? { color: '#FFF' } : { color: theme.textSecondary }]}>{w.label}</Text>
              </AnimatedButton>
            ))}
          </View>

          <View style={[styles.valuationCard, { backgroundColor: isDarkMode ? '#111827' : '#FFFBEB' }]}>
            <Text style={[styles.valLabel, { color: theme.textPrimary }]}>FINAL RATE VALUATION</Text>
            <Text style={[styles.valSub, { color: theme.textSecondary }]}>{quality} • {weight} {weight === 1 ? 'Gram' : 'Grams'}</Text>
            {loading ? (
              <ShimmerPlaceholder width={150} height={40} borderRadius={8} isDarkMode={isDarkMode} />
            ) : (
              <Text style={[styles.valPrice, { color: theme.primary }]}>₹{parseFloat(finalValuation).toLocaleString('en-IN')}</Text>
            )}
          </View>
        </Animated.View>

        {/* Market Insight */}
        <Animated.View 
          entering={FadeInDown.delay(700).duration(600)}
          style={[styles.insightBox, { backgroundColor: isDarkMode ? '#1E1B4B' : '#FFF7ED', borderColor: isDarkMode ? '#312E81' : '#FEE2E2' }]}
        >
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.insightTitle, { color: theme.textPrimary }]}>Market Insight</Text>
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              Gold prices are seeing a bullish trend due to global market stability. Analysts predict a further rise in the coming week.
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
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
    paddingVertical: 16,
    borderBottomWidth:1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
  },
  mainRateContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  rateLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  rateValue: {
    fontSize: 48,
    fontWeight: '900',
  },
  badgeRow: {
    marginTop: 10,
  },
  trendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '800',
  },
  apiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  apiText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  chartContainer: {
    height: 220,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: 50,
    padding: 10,
    borderRadius: 12,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tooltipVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 32,
    marginBottom: 16,
  },
  historyContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  historyName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyPrice: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  historyChange: {
    fontSize: 11,
    fontWeight: '700',
  },
  calcContainer: {
    borderRadius: 28,
    padding: 24,
  },
  calcLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  calcBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  valuationCard: {
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  valLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.6,
  },
  valSub: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 12,
  },
  valPrice: {
    fontSize: 32,
    fontWeight: '900',
  },
  insightBox: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 24,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
