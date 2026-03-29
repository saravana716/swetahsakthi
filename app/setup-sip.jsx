import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './context/ThemeContext';
import AnimatedButton from '../components/AnimatedButton';

const { width } = Dimensions.get('window');

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

export default function SetupSIPScreen() {
  const router = useRouter();
  const { theme, isDarkMode, isGold } = useTheme();

  // Dynamic based on selected metal
  const metalName    = isGold ? 'Gold'   : 'Silver';
  const metalPurity  = isGold ? '24K'    : '999';
  const primaryColor = isGold ? '#EAB308' : '#94A3B8';
  const gradColors   = isGold ? ['#EAB308', '#D97706'] : ['#94A3B8', '#64748B'];
  const promoBg      = isGold
    ? (isDarkMode ? '#1C1600' : '#FFFBEC')
    : (isDarkMode ? '#1E293B' : '#F8FAFC');
  const promoBorder  = isGold
    ? (isDarkMode ? '#3D2F00' : '#FDE68A')
    : (isDarkMode ? '#334155' : '#E2E8F0');
  const promoIconBg  = isGold
    ? (isDarkMode ? '#2D2000' : '#FFF9D6')
    : (isDarkMode ? '#334155' : '#EFF6FF');

  const [amount,    setAmount]    = useState('100');
  const [frequency, setFrequency] = useState('Monthly');

  const QUICK_AMOUNTS = [100, 250, 500, 1000];

  const yearlyAccumulation = () => {
    const amt = parseFloat(amount) || 0;
    const multiplier = frequency === 'Daily' ? 365 : frequency === 'Weekly' ? 52 : 12;
    return (amt * multiplier).toLocaleString('en-IN');
  };

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) < 100) {
      Alert.alert('Minimum Amount', 'Minimum SIP amount is ₹100.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'SIP Activated! 🎉',
      `Your ${frequency} ${metalName} SIP of ₹${amount} has been set up successfully.`,
      [{ text: 'Great!', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={primaryColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Setup SIP</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Promo Card — changes for gold/silver */}
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={[styles.promoCard, { backgroundColor: promoBg, borderColor: promoBorder }]}>
            <View style={[styles.promoIconBg, { backgroundColor: promoIconBg }]}>
              <Ionicons name="shield-checkmark-outline" size={26} color={primaryColor} />
            </View>
            <Text style={[styles.promoTitle, { color: theme.textPrimary }]}>Automated {metalName} Wealth</Text>
            <Text style={[styles.promoSub, { color: theme.textSecondary }]}>
              Consistent small investments build generational wealth. Start your automated {metalName.toLowerCase()} accumulation journey.
            </Text>
            <View style={styles.tagRow}>
              {['NO LOCK-IN', `${metalPurity} PURE`].map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                  <Text style={[styles.tagText, { color: theme.textSecondary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Installment Amount */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>INSTALLMENT AMOUNT</Text>

            <View style={styles.amountRow}>
              <Text style={[styles.rupeeSymbol, { color: theme.textPrimary }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.textPrimary }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Quick amounts */}
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((q) => (
                <AnimatedButton
                  key={q}
                  style={[styles.quickBtn, {
                    backgroundColor: amount === String(q) ? primaryColor : (isDarkMode ? '#1E293B' : '#F8F9FA'),
                    borderColor: amount === String(q) ? primaryColor : theme.border,
                  }]}
                  onPress={() => { setAmount(String(q)); }}
                >
                  <Text style={[styles.quickBtnText, { color: amount === String(q) ? '#FFF' : theme.textSecondary }]}>₹{q}</Text>
                </AnimatedButton>
              ))}
            </View>

            {/* Yearly accumulation */}
            <View style={[styles.accRow, { borderTopColor: theme.border }]}>
              <View>
                <Text style={[styles.accLabel, { color: theme.textSecondary }]}>YEARLY ACCUMULATION</Text>
                <Text style={[styles.accSub, { color: theme.textSecondary }]}>Approx. flat value</Text>
              </View>
              <Text style={[styles.accValue, { color: '#22C55E' }]}>₹{yearlyAccumulation()}</Text>
            </View>
          </Animated.View>

          {/* Deduction Frequency */}
          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <Text style={[styles.freqLabel, { color: theme.textSecondary }]}>DEDUCTION FREQUENCY</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.freqRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.freqBtn, {
                  backgroundColor: frequency === f ? theme.card : 'transparent',
                  borderColor: frequency === f ? primaryColor : theme.border,
                  borderWidth: frequency === f ? 1.5 : 1,
                }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFrequency(f); }}
              >
                <Text style={[styles.freqBtnText, { color: frequency === f ? primaryColor : theme.textSecondary }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Info */}
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={[styles.infoRow, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: isDarkMode ? '#334155' : '#DBEAFE' }]}>
            <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
            <Text style={[styles.infoText, { color: isDarkMode ? '#93C5FD' : '#1D4ED8' }]}>
              SIP can be paused or cancelled anytime. {metalName} is credited instantly after each deduction.
            </Text>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirm Button */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmGrad}>
            <Text style={styles.confirmText}>CONFIRM {metalName.toUpperCase()} SIP  →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, paddingTop: Platform.OS === 'android' ? 44 : 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  promoCard: { borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1 },
  promoIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  promoTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  promoSub: { fontSize: 14, lineHeight: 22, fontWeight: '500', marginBottom: 16 },
  tagRow: { flexDirection: 'row', gap: 10 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  section: { borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rupeeSymbol: { fontSize: 28, fontWeight: '700', marginRight: 4 },
  amountInput: { fontSize: 52, fontWeight: '900', flex: 1 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickBtn: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quickBtnText: { fontSize: 12, fontWeight: '800' },
  accRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1 },
  accLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  accSub: { fontSize: 12, fontWeight: '500' },
  accValue: { fontSize: 22, fontWeight: '900' },
  freqLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  freqRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  freqBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  freqBtnText: { fontSize: 14, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, borderTopWidth: 1 },
  confirmBtn: { borderRadius: 16, overflow: 'hidden', height: 58 },
  confirmGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
