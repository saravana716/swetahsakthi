import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from './context/ThemeContext';

const { width } = Dimensions.get('window');

const BANKS = [
  { id: 1, name: 'HDFC Bank',  accountLast: 'XXXX 1234', icon: 'business-outline' },
  { id: 2, name: 'ICICI Bank', accountLast: 'XXXX 5678', icon: 'business-outline' },
];

export default function WithdrawScreen() {
  const router = useRouter();
  const { theme, isDarkMode, isGold } = useTheme();
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState(1);

  // Dynamic per metal
  const metalName          = isGold ? 'Gold'    : 'Silver';
  const primaryColor       = isGold ? '#EAB308' : '#94A3B8';
  const gradColors         = isGold ? ['#EAB308', '#D97706'] : ['#94A3B8', '#64748B'];
  const withdrawableBalance = isGold ? 15420 : 6840;

  const handleAmountChange = (text) => setAmount(text.replace(/[^0-9.]/g, ''));

  const handleMaxWithdraw = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(withdrawableBalance.toString());
  };

  const handleConfirm = () => {
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) { Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.'); return; }
    if (amountNum > withdrawableBalance) { Alert.alert('Insufficient Balance', 'Amount exceeds your withdrawable balance.'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Withdrawal Initiated',
      `₹${parseFloat(amount).toLocaleString('en-IN')} from your ${metalName} vault will be credited within 24 hours.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Withdraw to Bank</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Balance Card */}
        <LinearGradient
          colors={gradColors}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>{metalName} Withdrawable Balance</Text>
          <Text style={styles.balanceValue}>₹{withdrawableBalance.toLocaleString('en-IN')}</Text>
          <View style={styles.balanceSub}>
            <Text style={styles.balanceSubText}>Includes sales from last 24h</Text>
            <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.8)" />
          </View>
        </LinearGradient>

        {/* Amount Input */}
        <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Amount to Withdraw</Text>
        <View style={[styles.amountContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.rupeeSign, { color: theme.textSecondary }]}>₹</Text>
          <TextInput
            style={[styles.amountInput, { color: theme.textPrimary }]}
            placeholder="0.00"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            value={amount}
            onChangeText={handleAmountChange}
          />
          <TouchableOpacity style={[styles.maxBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FFF9E5' }]} onPress={handleMaxWithdraw}>
            <Text style={[styles.maxBtnText, { color: primaryColor }]}>MAX</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Selection */}
        <Text style={[styles.sectionLabel, { color: theme.textPrimary }]}>Select Bank Account</Text>
        {BANKS.map((bank) => (
          <TouchableOpacity
            key={bank.id}
            style={[
              styles.bankCard,
              {
                backgroundColor: theme.card,
                borderColor: selectedBank === bank.id ? primaryColor : theme.border,
                borderWidth: selectedBank === bank.id ? 2 : 1,
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedBank(bank.id);
            }}
          >
            <View style={[styles.bankIconBg, { backgroundColor: isDarkMode ? '#1E293B' : '#F8F9FA' }]}>
              <Ionicons name={bank.icon} size={22} color={theme.textSecondary} />
            </View>
            <View style={styles.bankInfo}>
              <Text style={[styles.bankName, { color: theme.textPrimary }]}>{bank.name}</Text>
              <Text style={[styles.bankAccount, { color: theme.textSecondary }]}>{bank.accountLast}</Text>
            </View>
            <View style={[styles.radioOuter, { borderColor: selectedBank === bank.id ? primaryColor : theme.border }]}>
              {selectedBank === bank.id && <View style={[styles.radioInner, { backgroundColor: primaryColor }]} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Add New Bank */}
        <TouchableOpacity style={styles.addBankBtn}>
          <Text style={[styles.addBankText, { color: primaryColor }]}>+ Add New Bank Account</Text>
        </TouchableOpacity>

        {/* Transfer Details */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Transfer Fee</Text>
            <Text style={[styles.detailValue, { color: '#22C55E' }]}>Free</Text>
          </View>
          <View style={[styles.detailRow, { marginTop: 12 }]}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Estimated Arrival</Text>
            <Text style={[styles.detailValue, { color: theme.textPrimary }]}>Within 24 Hours</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm Button */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <LinearGradient
            colors={gradColors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.confirmBtnGrad}
          >
            <Text style={styles.confirmBtnText}>Confirm {metalName} Withdrawal</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  balanceCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  balanceValue: { color: '#FFF', fontSize: 36, fontWeight: '900', marginBottom: 10 },
  balanceSub: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceSubText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' },

  sectionLabel: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 28,
  },
  rupeeSign: { fontSize: 22, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700' },
  maxBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  maxBtnText: { fontSize: 12, fontWeight: '900' },

  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bankIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bankInfo: { flex: 1 },
  bankName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  bankAccount: { fontSize: 13, fontWeight: '500' },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EAB308' },

  addBankBtn: { paddingVertical: 4, marginBottom: 24 },
  addBankText: { fontSize: 14, fontWeight: '700' },

  detailsCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '800' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
  },
  confirmBtn: { borderRadius: 16, overflow: 'hidden', height: 56 },
  confirmBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
