import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Vibration
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from './context/ThemeContext';
import { getLiveRates } from '../services/augmontApi';

export default function SellScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { type } = useLocalSearchParams();
  const isGold = type === 'gold';
  
  const [mode, setMode] = useState('rupees'); 
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(0);
  const [vaultBalance, setVaultBalance] = useState(isGold ? 2.4500 : 10.2500); // Mock balance

  useEffect(() => {
    let interval;
    const fetchRate = async () => {
      try {
        const data = await getLiveRates();
        if (data?.result?.data?.rates) {
          const r = isGold ? data.result.data.rates.gSell : data.result.data.rates.sSell;
          setRate(parseFloat(r));
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

  const handleSellAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === 'grams') {
      setAmount(vaultBalance.toString());
    } else {
      setAmount((vaultBalance * rate).toFixed(2));
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
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Sell {isGold ? 'Gold' : 'Silver'}</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Asset Live Rate Card */}
          <View style={[styles.rateCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#FFF9E5' }]}>
            <View style={styles.rateHeader}>
              <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.rateTag, { color: theme.textSecondary }]}>LIVE {isGold ? 'GOLD' : 'SILVER'} SELL RATE</Text>
            </View>
            {loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <Text style={[styles.rateValue, { color: theme.textPrimary }]}>₹{rate.toLocaleString('en-IN')}<Text style={styles.perGm}>/gm</Text></Text>
            )}
            <View style={[styles.vaultBadge, { backgroundColor: theme.itemBg }]}>
              <Text style={[styles.vaultText, { color: theme.textSecondary }]}>Available in Vault: <Text style={{fontWeight:'900', color: theme.textPrimary}}>{vaultBalance} gm</Text></Text>
            </View>
          </View>

          {/* Input Section */}
          <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <View style={[styles.modeTabs, { backgroundColor: theme.background }]}>
              <TouchableOpacity 
                style={[styles.modeBtn, mode === 'rupees' && { backgroundColor: theme.card }]} 
                onPress={() => { setMode('rupees'); setAmount(''); }}
              >
                <Text style={[styles.modeText, { color: theme.textSecondary }, mode === 'rupees' && { color: theme.textPrimary }]}>In Rupees</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeBtn, mode === 'grams' && { backgroundColor: theme.card }]} 
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

            <TouchableOpacity style={styles.sellAllBtn} onPress={handleSellAll}>
              <Text style={[styles.sellAllText, { color: theme.primary }]}>SELL ALL AVAILABLE</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>You will receive</Text>
              <Text style={[styles.resultValue, { color: theme.textPrimary }]}>
                {mode === 'rupees' ? `${calculatedValue} gm` : `₹${calculatedValue}`}
              </Text>
            </View>
          </View>

          {/* Summary Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={18} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>Amount will be credited to <Text style={{fontWeight:'800', color: theme.textPrimary}}>Primary Bank Account</Text></Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>Processing time: <Text style={{fontWeight:'800', color: theme.textPrimary}}>24-48 Hours</Text></Text>
            </View>
          </View>

        </ScrollView>
        
        {/* Fixed Footer */}
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total to Receive</Text>
            <Text style={[styles.totalValue, { color: theme.textPrimary }]}>₹{mode === 'rupees' ? (amount || '0') : calculatedValue}</Text>
          </View>
          <TouchableOpacity style={styles.buyBtn}>
            <LinearGradient
              colors={['#EF4444', '#991B1B']}
              style={styles.buyBtnGrad}
              start={{x:0, y:0}} end={{x:1, y:1}}
            >
              <Text style={styles.buyBtnText}>PROCEED TO SELL</Text>
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
  vaultBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  vaultText: {
    fontSize: 12,
    fontWeight: '500',
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
  sellAllBtn: {
    alignSelf: 'center',
    marginTop: 10,
    padding: 10,
  },
  sellAllText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 16,
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
  infoBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '500',
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
