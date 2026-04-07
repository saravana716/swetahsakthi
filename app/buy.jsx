import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { getLiveRates } from '../services/augmontApi';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';
import AnimatedButton from '../components/AnimatedButton';
import PayUService from '../services/payuService';

export default function BuyScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user, userProfile } = useAuth();
  const { type } = useLocalSearchParams();
  const isGold = type === 'gold';
  
  const [mode, setMode] = useState('rupees'); // 'rupees' or 'grams'
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rate, setRate] = useState(0);
  const [blockId, setBlockId] = useState(null);

  useEffect(() => {
    let interval;
    const fetchRate = async () => {
      try {
        const data = await getLiveRates();
        if (data?.result?.data?.rates) {
          const r = isGold ? data.result.data.rates.gBuy : data.result.data.rates.sBuy;
          setRate(parseFloat(r));
          setBlockId(data.result.data.blockId); // Capture active lock block
        }
      } catch (error) {
        console.error('Fetch rate error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRate(); // Initial fetch
    interval = setInterval(fetchRate, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [isGold]);

  const calculatedValue = mode === 'rupees' 
    ? (amount ? (parseFloat(amount) / rate).toFixed(4) : '0.0000')
    : (amount ? (parseFloat(amount) * rate).toFixed(2) : '0.00');

  // Exact quantities for API
  const finalRsAmount = mode === 'rupees' ? parseFloat(amount || 0) : parseFloat(calculatedValue || 0);
  const finalGmQuantity = mode === 'grams' ? parseFloat(amount || 0) : parseFloat(calculatedValue || 0);

  const handleBuy = async () => {
    if (!finalRsAmount || finalRsAmount <= 0) {
       Toast.show({ type: 'error', text1: 'Enter a valid amount' });
       return;
    }
    if (!blockId) {
       Toast.show({ type: 'error', text1: 'Live rates sync error. Please wait.' });
       return;
    }

    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const txnid = 'SSK' + Date.now(); // Unique Transaction ID

      console.log('[BUY] Initiating PayU Payment for amount:', finalRsAmount);

      const paymentResult = await PayUService.launchPayment({
        amount: finalRsAmount,
        productInfo: `Purchase ${finalGmQuantity}g ${isGold ? 'Gold' : 'Silver'}`,
        firstName: userProfile?.firstName || 'User',
        email: user?.email || 'user@example.com',
        phone: userProfile?.phoneNumber || '9999999999',
        txnid: txnid
      });

      if (paymentResult.status === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // After success, you can call your API to update user balance
        Toast.show({
          type: 'success',
          text1: 'Payment Successful!',
          text2: `You bought ${finalGmQuantity}g of ${isGold ? 'gold' : 'silver'}.`
        });
        router.replace('/(tabs)/orders');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorDetail = paymentResult.data?.errorMsg || paymentResult.data?.error_Message || 'Please try again.';
        Toast.show({ 
          type: 'error', 
          text1: 'Payment Failed', 
          text2: errorDetail
        });
      }

    } catch (err) {
      console.error('[BUY] Payment Error:', err);
      // Detailed error reporting for the user
      const errMsg = err.message || 'Failed to initialize payment.';
      Toast.show({ type: 'error', text1: 'Initialization Error', text2: errMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Buy {isGold ? 'Gold' : 'Silver'}</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Asset Live Rate Card */}
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={[styles.rateCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#FFF9E5' }]}>
            <View style={styles.rateHeader}>
              <View style={[styles.dot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.rateTag, { color: theme.textSecondary }]}>LIVE {isGold ? 'GOLD' : 'SILVER'} RATE</Text>
            </View>
            {loading ? (
              <ShimmerPlaceholder width={160} height={36} borderRadius={10} isDarkMode={isDarkMode} />
            ) : (
              <Text style={[styles.rateValue, { color: theme.primary }]}>₹{rate.toLocaleString('en-IN')}<Text style={styles.perGm}>/gm</Text></Text>
            )}
          </Animated.View>

          {/* Input Section */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <View style={[styles.modeTabs, { backgroundColor: theme.background }]}>
              <TouchableOpacity 
                style={[styles.modeBtn, mode === 'rupees' && { backgroundColor: theme.card, shadowColor: '#000' }]} 
                onPress={() => { setMode('rupees'); setAmount(''); }}
              >
                <Text style={[styles.modeText, { color: theme.textSecondary }, mode === 'rupees' && { color: theme.textPrimary }]}>In Rupees</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeBtn, mode === 'grams' && { backgroundColor: theme.card, shadowColor: '#000' }]} 
                onPress={() => { setMode('grams'); setAmount(''); }}
              >
                <Text style={[styles.modeText, { color: theme.textSecondary }, mode === 'grams' && { color: theme.textPrimary }]}>In Grams</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountInputRow}>
              <Text style={[styles.currencyPrefix, { color: theme.textPrimary }]}>{mode === 'rupees' ? '₹' : 'g'}</Text>
              <TextInput
                style={[styles.mainInput, { color: theme.textPrimary }]}
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>You will get approx.</Text>
              <Text style={[styles.resultValue, { color: theme.textPrimary }]}>
                {mode === 'rupees' ? `${calculatedValue} gm` : `₹${calculatedValue}`}
              </Text>
            </View>
          </Animated.View>

          {/* Quick Amounts */}
          {mode === 'rupees' && (
            <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.quickAmounts}>
              {['500', '1000', '2500', '5000'].map(val => (
                <AnimatedButton 
                  key={val} 
                  style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => {
                    setAmount(val);
                  }}
                >
                  <Text style={[styles.quickText, { color: theme.textPrimary }]}>+₹{val}</Text>
                </AnimatedButton>
              ))}
            </Animated.View>
          )}

          {/* Benefit Banner */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={[styles.benefitCard, { backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF', borderColor: isDarkMode ? '#312E81' : '#E0E7FF' }]}>
            <Ionicons name="sparkles" size={20} color="#4F46E5" />
            <Text style={[styles.benefitText, { color: isDarkMode ? '#C7D2FE' : '#4338CA' }]}>Swarna Sakhi Benefit: <Text style={{fontWeight:'800'}}>+0.05% Extra Gold</Text></Text>
          </Animated.View>

        </ScrollView>
        
        {/* Fixed Footer */}
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total to Pay</Text>
            <Text style={[styles.totalValue, { color: theme.textPrimary }]}>₹{mode === 'rupees' ? (amount || '0') : calculatedValue}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.buyBtn, isProcessing && { opacity: 0.7 }]} 
            activeOpacity={0.8}
            onPress={handleBuy}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={isGold ? ['#EAB308', '#B45309'] : ['#94A3B8', '#334155']}
              style={styles.buyBtnGrad}
              start={{x:0, y:0}} end={{x:1, y:1}}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buyBtnText}>PROCEED TO BUY</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 120,
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
  rateCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  rateTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rateValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  perGm: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.6,
  },
  inputContainer: {
    borderRadius: 30,
    padding: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  modeTabs: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  currencyPrefix: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 8,
  },
  mainInput: {
    fontSize: 48,
    fontWeight: '900',
    minWidth: 100,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickText: {
    fontSize: 13,
    fontWeight: '800',
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 24,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  footerInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  buyBtn: {
    flex: 1.5,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  buyBtnGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
