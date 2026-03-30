import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getLiveRates, getUserByMongoId, getUserPassbook, getAugmontBuyList, getNews } from '../../services/augmontApi';

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
  const [showCalcInfo, setShowCalcInfo] = useState(false); // Modal state for calculation
  const { language, setLanguage, t } = useLanguage();
  const { isGold, setIsGold, theme, isDarkMode } = useTheme();
  const { user, userProfile } = useAuth();
  const { notificationsEnabled } = useNotifications();
  const [liveRatesData, setLiveRatesData] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const [passbookData, setPassbookData] = useState(null);
  const [buyList, setBuyList] = useState([]);
  const [goldHistory, setGoldHistory] = useState([7285, 7292, 7288, 7301, 7295, 7308, 7302, 7315, 7310, 7322]);
  const [silverHistory, setSilverHistory] = useState([86.2, 86.5, 86.1, 86.8, 86.4, 87.1, 86.9, 87.5, 87.2, 87.8]);
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
          const rates = data.result.data.rates;
          setLiveRatesData(rates);
          
          // Append to history for Live Chart
          setGoldHistory(prev => {
            const newHist = [...prev, parseFloat(rates.gBuy)];
            return newHist.slice(-20); // Keep last 20 points
          });
          setSilverHistory(prev => {
            const newHist = [...prev, parseFloat(rates.sBuy)];
            return newHist.slice(-20); // Keep last 20 points
          });
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

  // Fetch Augmont Passbook (Weights in Grams)
  useEffect(() => {
    const fetchPassbook = async () => {
      const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
      if (user && uniqueId) {
        try {
          const token = await user.getIdToken();
          const response = await getUserPassbook(uniqueId, token);
          if (response && response.result && response.result.data) {
            setPassbookData(response.result.data);
          }
        } catch (error) {
          console.error("Failed to sync Augmont Passbook:", error);
        }
      }
    };
    
    fetchPassbook();
  }, [user, userProfile]);

  // Fetch Augmont Buy List (Investment History)
  useEffect(() => {
    const fetchBuyList = async () => {
      const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
      if (user && uniqueId) {
        try {
          const token = await user.getIdToken();
          const response = await getAugmontBuyList(uniqueId, token);
          if (response && response.result && response.result.data) {
            setBuyList(response.result.data);
          }
        } catch (error) {
          console.error("Failed to sync Augmont Buy List:", error);
        }
      }
    };
    
    fetchBuyList();
  }, [user, userProfile]);

  const scale = 1; 
  const fs = (size) => Math.round((language === 'ta' ? size * 0.8 : size) * scale);

  // Dynamic MongoDB Balances (Fallbacks to 0 if loading)
  const portfolioText = isGold ? t('dashboard')?.totalGold || 'Total Digital Gold' : t('dashboard')?.totalSilver || 'Total Wallet Cash';
  
  // Dynamic Augmont Passbook Balances (Headline as GRAMS)
  const rawWeight = isGold ? (passbookData?.goldGrms || 0) : (passbookData?.silverGrms || 0);
  
  const balanceInt = `${parseFloat(rawWeight).toFixed(4)}`;
  const balanceDec = `g`;
  
  const NEWS_FALLBACK = 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=600';

  const [newsList, setNewsList] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [newsModalVisible, setNewsModalVisible] = useState(false);

  // Fetch Market News
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews(true);
        // Sort by Latest Published Date
        const sorted = data.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        setNewsList(sorted);
      } catch (error) {
        console.error("Failed to fetch dashboard news:", error);
      }
    };
    fetchNews();
  }, []);

  // Live Chart Normalization Logic
  const activeHistory = isGold ? goldHistory : silverHistory;
  const minPrice = Math.min(...activeHistory);
  const maxPrice = Math.max(...activeHistory);
  const priceRange = maxPrice - minPrice || 1;

  // Chart Dimensions
  const chartWidth = width - 88;
  const chartHeight = 84;
  
  // Custom SVG Path Calculation
  const getPaths = () => {
    if (activeHistory.length < 2) return { line: '', area: '' };
    
    const points = activeHistory.map((val, i) => {
      const x = (i / (activeHistory.length - 1)) * chartWidth;
      const y = chartHeight - (((val - minPrice) / priceRange) * (chartHeight * 0.6) + (chartHeight * 0.2));
      return { x, y };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
    }
    d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;

    const linePath = d;
    const areaPath = `${d} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
    
    return { line: linePath, area: areaPath };
  };

  const { line: linePath, area: areaPath } = getPaths();
  
  const currentRate = isGold ? (liveRatesData?.gBuy || 0) : (liveRatesData?.sBuy || 0);
  const calculatedValue = parseFloat(rawWeight) * parseFloat(currentRate);

  // Dynamic Investment & Profit Calculation (Using Cost-Basis)
  const filteredPurchases = buyList.filter(item => item.type === (isGold ? 'gold' : 'silver'));
  const totalBoughtAmt = filteredPurchases.reduce((acc, curr) => acc + parseFloat(curr.exclTaxAmt || curr.inclTaxAmt || 0), 0);
  const totalBoughtQty = filteredPurchases.reduce((acc, curr) => acc + parseFloat(curr.qty || 0), 0);
  
  // Calculate average buy price per gram
  const avgBuyPrice = totalBoughtQty > 0 ? (totalBoughtAmt / totalBoughtQty) : 0;
  
  // True active investment is the CURRENT balance multiplied by the historical average buy price
  const activeBalance = parseFloat(rawWeight) || 0;
  const totalInvested = activeBalance * avgBuyPrice;
  
  const netProfit = totalInvested > 0 ? calculatedValue - totalInvested : 0;
  const pPercentage = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

  const isProfit = netProfit >= 0;
  const profitPercent = `${isProfit ? '↗' : '↘'} ${isProfit ? '+' : ''}${pPercentage.toFixed(2)}%`;
  
  const investedInt = `₹${Math.floor(totalInvested).toLocaleString('en-IN')}`;
  const investedDec = `.${(totalInvested % 1).toFixed(2).split('.')[1] || '00'}`;
  
  const profitValInt = `${isProfit ? '+' : '-'} ₹${Math.floor(Math.abs(netProfit)).toLocaleString('en-IN')}`;
  const profitValDec = `.${(Math.abs(netProfit) % 1).toFixed(2).split('.')[1] || '00'}`;
  
  // Dynamic Live Rates
  const liveRateInt = isGold 
    ? (liveRatesData ? `₹${Math.floor(parseFloat(liveRatesData.gBuy)).toLocaleString('en-IN')}` : '₹16,285')
    : (liveRatesData ? `₹${Math.floor(parseFloat(liveRatesData.sBuy)).toLocaleString('en-IN')}` : '₹86');
  
  const liveRateDec = isGold
    ? (liveRatesData ? `.${liveRatesData.gBuy.split('.')[1] || '00'}` : '.00')
    : (liveRatesData ? `.${liveRatesData.sBuy.split('.')[1] || '00'}` : '.62');

  const rateLabel = isGold ? `24K ${t('dashboard')?.rateLive || 'LIVE RATES'}` : `999 ${t('dashboard')?.rateLive || 'LIVE RATES'}`;

  const displayNameRaw = userProfile?.displayName || 'User';
  const displayGreetingName = displayNameRaw.length > 12 ? `${displayNameRaw.substring(0, 12)}...` : displayNameRaw;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{`${t('dashboard')?.hello || 'HELLO'}, ${displayGreetingName}`}</Text>
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
            <Text style={[styles.portfolioLabel, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{isGold ? "Digital Gold Balance" : "Digital Silver Balance"}</Text>
            <View style={[styles.profitBadge, { backgroundColor: isProfit ? (isDarkMode ? '#064E3B' : '#F0FDF4') : (isDarkMode ? '#450a0a' : '#FEF2F2') }]}>
              <Text style={[styles.profitBadgeText, { color: isProfit ? '#22C55E' : '#EF4444' }]} numberOfLines={1}>{profitPercent}</Text>
            </View>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceText, { color: theme.textPrimary }]}>{balanceInt}</Text>
            <Text style={[styles.balanceDec, { color: theme.textPrimary }]}>{balanceDec}</Text>
          </View>

          {/* Premium SVG Area Chart Trend */}
          <View style={styles.chartArea}>
             <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <Defs>
                  <SvgGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={isGold ? '#EAB308' : '#94A3B8'} stopOpacity="0.4" />
                    <Stop offset="100%" stopColor={isGold ? '#EAB308' : '#94A3B8'} stopOpacity="0" />
                  </SvgGradient>
                </Defs>
                
                {/* Area Fill */}
                <Path d={areaPath} fill="url(#chartGradient)" />
                
                {/* Smooth Line */}
                <Path 
                  d={linePath} 
                  fill="none" 
                  stroke={isGold ? '#EAB308' : '#64748B'} 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
             </Svg>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statsRow}>
            <View style={styles.statSide}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">TOTAL INVESTED</Text>
              <View style={styles.statValRow}>
                <Text style={[styles.statValueBase, { color: theme.textPrimary }]}>{investedInt}</Text>
                <Text style={[styles.statValDec, { color: theme.textPrimary }]}>{investedDec}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.statSide, { alignItems: 'flex-end' }]} 
              onPress={() => setShowCalcInfo(true)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.statLabel, { color: theme.textSecondary, marginRight: 4 }]} numberOfLines={1} ellipsizeMode="tail">NET PROFIT</Text>
                <Ionicons name="information-circle-outline" size={12} color={theme.textSecondary} />
              </View>
              <View style={styles.statValRow}>
                <Text style={[styles.statValueProfit, { color: isProfit ? '#22C55E' : '#EF4444' }]}>{profitValInt}</Text>
                <Text style={[styles.statValProfitDec, { color: isProfit ? '#22C55E' : '#EF4444' }]}>{profitValDec}</Text>
              </View>
            </TouchableOpacity>
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

        {buyList && buyList.length > 0 ? (
          <View style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F8F9FA' }]}>
            <View style={[styles.txIconContainer, { backgroundColor: isDarkMode ? '#064E3B' : '#E8F5E9' }]}>
              <Ionicons name="trending-up" size={20} color="#22C55E" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.txTitle, { color: theme.textPrimary }]}>Bought {buyList[0].type.charAt(0).toUpperCase() + buyList[0].type.slice(1)}</Text>
              <Text style={[styles.txTime, { color: theme.textSecondary }]}>{new Date(buyList[0].createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.txPrice}>-₹{parseFloat(buyList[0].inclTaxAmt).toLocaleString('en-IN')}</Text>
              <Text style={[styles.txWeight, { color: theme.textSecondary }]}>{parseFloat(buyList[0].qty).toFixed(4)}g</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.transactionCard, { backgroundColor: theme.card, justifyContent: 'center', opacity: 0.6 }]}>
            <Text style={{ color: theme.textSecondary }}>No recent transactions</Text>
          </View>
        )}

        {/* Market Insights Content */}
        <View style={styles.insightsHeader}>
          <Text style={[styles.insightsTitle, { color: theme.textPrimary }]}>{t('dashboard')?.insights || "Market Insights"}</Text>
          <TouchableOpacity 
            style={styles.viewAllBtn}
            onPress={() => router.push('/news')}
          >
            <Text style={[styles.viewAllLink, { color: theme.primary }]}>{t('dashboard')?.viewAll || "View all"}</Text>
          </TouchableOpacity>
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
          {newsList.slice(0, 3).map((news, index) => (
              <TouchableOpacity 
                key={news._id || `news-${index}`}
                style={[styles.newsCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F8F9FA' }]}
                onPress={() => {
                  setSelectedNews(news);
                  setNewsModalVisible(true);
                }}
              >
                <Image 
                  source={{ uri: (news.imageUrl && !news.imageUrl.includes('example.com')) ? news.imageUrl : NEWS_FALLBACK }} 
                  style={styles.newsImg} 
                />
                <View style={[styles.newsTag, { backgroundColor: theme.primary }]}>
                  <Text style={styles.newsTagText}>LIVE NEWS</Text>
                </View>
                <View style={styles.newsBody}>
                  <Text style={[styles.newsMeta, { color: theme.textSecondary }]}>
                    {new Date(news.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • Insights
                  </Text>
                  <Text style={[styles.newsHeadline, { color: theme.textPrimary }]} numberOfLines={2}>{news.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.newsReadMore, { color: theme.primary }]}>Read Full Story</Text>
                    <Ionicons name="arrow-forward-outline" size={12} color={theme.primary} style={{ marginLeft: 4 }} />
                  </View>
                </View>
              </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Full News Reader Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={newsModalVisible}
        onRequestClose={() => setNewsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { backgroundColor: theme.background, height: '90%', borderTopLeftRadius: 35, borderTopRightRadius: 35, overflow: 'hidden' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image 
                source={{ uri: selectedNews?.imageUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=800' }} 
                style={{ width: '100%', height: 300 }} 
              />
              
              <TouchableOpacity 
                style={[styles.sheetCloseBtn, { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }]} 
                onPress={() => setNewsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={{ padding: 25 }}>
                <View style={[styles.newsTag, { backgroundColor: theme.primary, alignSelf: 'flex-start', position: 'relative', top: 0, left: 0, marginBottom: 16 }]}>
                  <Text style={styles.newsTagText}>MARKET INSIGHT</Text>
                </View>
                <Text style={[styles.newsHeadline, { color: theme.textPrimary, fontSize: 26, lineHeight: 34, marginBottom: 10 }]}>{selectedNews?.title}</Text>
                <Text style={[styles.newsMeta, { color: theme.textSecondary, marginBottom: 20 }]}>
                  {new Date(selectedNews?.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} • Global Trading Desk
                </Text>
                
                <View style={{ height: 1.5, backgroundColor: theme.border, marginBottom: 25 }} />
                
                <Text style={{ fontSize: 16, lineHeight: 26, color: theme.textPrimary, fontWeight: '500', opacity: 0.9 }}>
                  {selectedNews?.content}
                </Text>
              </View>
              
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

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

      {/* Dynamic Calculation Info Modal */}
      <Modal visible={showCalcInfo} transparent animationType="slide" onRequestClose={() => setShowCalcInfo(false)}>
        <View style={styles.langModalContainer}>
          <TouchableOpacity style={styles.langModalOverlay} activeOpacity={1} onPress={() => setShowCalcInfo(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: theme.card, paddingBottom: 40 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>How it Works</Text>
              <TouchableOpacity onPress={() => setShowCalcInfo(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
                Your dashboard calculates your personal wealth in real-time based on live market pricing.
              </Text>

              {/* Step 1 */}
              <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', padding: 16, borderRadius: 16, marginBottom: 16 }}>
                <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700', marginBottom: 12, letterSpacing: 0.5 }}>STEP 1: LIVE VAULT VALUATION</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Your {isGold ? 'Gold' : 'Silver'} Balance</Text>
                  <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>{balanceInt}g</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 14 }}>× Live Market Price (1g)</Text>
                  <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '600' }}>{liveRateInt}{liveRateDec}</Text>
                </View>

                <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 12 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '700' }}>= Current Portfolio Value</Text>
                  <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: '700' }}>₹{calculatedValue ? calculatedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}</Text>
                </View>
              </View>

              {/* Step 2 */}
              <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', padding: 16, borderRadius: 16, marginBottom: 24 }}>
                <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700', marginBottom: 12, letterSpacing: 0.5 }}>STEP 2: RETURN ON INVESTMENT</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Current Portfolio Value</Text>
                  <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>₹{calculatedValue ? calculatedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 14 }}>- Total Original Investment</Text>
                  <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '600' }}>{investedInt}{investedDec}</Text>
                </View>

                <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 12 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: isProfit ? '#22C55E' : '#EF4444', fontSize: 15, fontWeight: '700' }}>= Dynamic Net Profit</Text>
                  <Text style={{ color: isProfit ? '#22C55E' : '#EF4444', fontSize: 15, fontWeight: '700' }}>{profitValInt}{profitValDec} ({profitPercent})</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={{ backgroundColor: theme.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
                onPress={() => setShowCalcInfo(false)}
              >
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>GOT IT</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
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
    height: 90,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 0,
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
    width: 230,
    marginRight: 16,
    borderWidth: 1,
  },
  newsImg: {
    width: '100%',
    height: 110,
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
    padding: 12,
  },
  newsMeta: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  newsHeadline: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 18,
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
