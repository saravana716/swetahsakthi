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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { 
  getLiveRates, 
  getUserPassbook, 
  getUserBanks, 
  addUserBank, 
  sellGoldSilver 
} from '../services/augmontApi';
import { Modal } from 'react-native';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';

export default function SellScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user, userProfile } = useAuth();
  const { type } = useLocalSearchParams();
  const isGold = type === 'gold';
  
  const [mode, setMode] = useState('rupees'); 
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rate, setRate] = useState(0);
  const [vaultBalance, setVaultBalance] = useState(0);
  
  // Bank States
  const [userBanks, setUserBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [showAddBank, setShowAddBank] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [lastTxId, setLastTxId] = useState('');
  const [blockId, setBlockId] = useState(null);
  
  const [bankForm, setBankForm] = useState({
    accountNumber: '',
    ifscCode: '',
    accountName: userProfile?.displayName || '',
    bankName: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const token = await user.getIdToken();
        const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;

        if (uniqueId) {
          // 1. Fetch Rates
          const ratesData = await getLiveRates();
          if (ratesData?.result?.data?.rates) {
            const r = isGold ? ratesData.result.data.rates.gSell : ratesData.result.data.rates.sSell;
            setRate(parseFloat(r));
            setBlockId(ratesData.result.data.blockId);
          }

          // 2. Fetch Vault Balance
          const passbook = await getUserPassbook(uniqueId, token);
          if (passbook?.result?.data) {
            const grams = isGold ? passbook.result.data.goldGrms : passbook.result.data.silverGrms;
            setVaultBalance(parseFloat(grams || 0));
          }

          // 3. Fetch Saved Banks
          const banksResponse = await getUserBanks(uniqueId, token);
          const banks = banksResponse?.result?.data || (Array.isArray(banksResponse?.result) ? banksResponse.result : []);
          
          if (banks && banks.length > 0) {
            setUserBanks(banks);
            setSelectedBank(banks[0]);
          }
        }
      } catch (error) {
        console.error('Fetch initial data error:', error);
        Toast.show({ type: 'error', text1: 'Failed to sync data' });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [isGold, userProfile]);

  const calculatedValue = mode === 'rupees' 
    ? (amount ? (parseFloat(amount) / rate).toFixed(4) : '0.0000')
    : (amount ? (parseFloat(amount) * rate).toFixed(2) : '0.00');

  const handleSellAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === 'grams') {
      setAmount(vaultBalance.toFixed(4));
    } else {
      setAmount((vaultBalance * rate).toFixed(2));
    }
  };

  const handleAddBank = async () => {
    if (!bankForm.accountNumber || !bankForm.ifscCode || !bankForm.bankName) {
      Toast.show({ type: 'error', text1: 'All bank fields are required' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
      
      // Ensure IFSC is uppercase and fields match API
      const payload = {
        ...bankForm,
        ifscCode: bankForm.ifscCode.toUpperCase()
      };
      
      const response = await addUserBank(uniqueId, payload, token);
      
      if (response?.result?.data) {
        const newBank = response.result.data;
        setUserBanks(prev => [newBank, ...prev]);
        setSelectedBank(newBank);
        setShowAddBank(false);
        Toast.show({ type: 'success', text1: 'Bank Account Saved!' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: error.message || 'Failed to add bank' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToSell = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter a valid amount' });
      return;
    }

    if (!selectedBank) {
      Toast.show({ type: 'error', text1: 'Please add/select a payout bank' });
      return;
    }

    const gramsToSell = mode === 'rupees' ? (parseFloat(amount) / rate) : parseFloat(amount);
    if (gramsToSell > vaultBalance) {
      Toast.show({ type: 'error', text1: 'Insufficient balance in vault' });
      return;
    }

    if (!blockId) {
      Toast.show({ type: 'error', text1: 'Live rate sync error, please wait' });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
      const txId = `SELL_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const payload = {
        uniqueId: uniqueId,
        [mode === 'rupees' ? 'amount' : 'quantity']: amount,
        lockPrice: rate,
        blockId: blockId,
        merchantTransactionId: txId,
        metalType: isGold ? 'gold' : 'silver',
        userBank: {
          userBankId: selectedBank.userBankId,
          // Only include these if they are not null, or if userBankId is somehow missing
          ...(selectedBank.accountName && { accountName: selectedBank.accountName }),
          ...(selectedBank.accountNumber && { accountNumber: selectedBank.accountNumber }),
          ...(selectedBank.ifscCode && { ifscCode: selectedBank.ifscCode.toUpperCase() })
        }
      };

      console.log("FINAL SELL API PAYLOAD:", JSON.stringify(payload, null, 2));
      const sellRes = await sellGoldSilver(payload, token);
      console.log("AUGMONT SELL RESPONSE:", JSON.stringify(sellRes, null, 2));

      const augmontTxId = sellRes?.result?.data?.transactionId || txId;

      // Calculate final values
      const finalAmount = mode === 'rupees' ? parseFloat(amount) : (parseFloat(amount) * rate);
      const finalQuantity = mode === 'rupees' ? (parseFloat(amount) / rate) : parseFloat(amount);

      // STEP 2: SAVE SELL RECEIPT TO MONGODB
      const mongoPayload = {
        orderType: "sell",
        merchantTransactionId: augmontTxId,
        augmontUniqueId: uniqueId,
        userId: userProfile.mongoId || userProfile._id,
        status: "completed",
        metalType: isGold ? 'gold' : 'silver',
        amount: parseFloat(finalAmount.toFixed(2)),
        quantity: parseFloat(finalQuantity.toFixed(4)),
        lockPrice: parseFloat(rate),
        blockId: blockId,
        metadata: {
          paymentMethod: "BankTransfer",
          platform: "mobile_app",
          device: Platform.OS,
          bankName: selectedBank.accountName || selectedBank.bankName || 'N/A',
          bankAccountNumber: selectedBank.accountNumber || 'N/A',
          ifscCode: selectedBank.ifscCode || 'N/A',
          userBankId: selectedBank.userBankId
        }
      };

      try {
        const mongoRes = await fetch('http://13.63.202.142:5001/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(mongoPayload)
        });
        console.log("MongoDB Sell Receipt Saved!", await mongoRes.json());
      } catch (dbErr) {
        console.log("Alert: MongoDB sell receipt save failed.", dbErr);
      }
      
      setLastTxId(augmontTxId);
      setSuccessModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Toast.show({ type: 'error', text1: error.message || 'Transaction failed' });
    } finally {
      setIsSubmitting(false);
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
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={[styles.rateCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#FFF9E5' }]}>
            <View style={styles.rateHeader}>
              <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.rateTag, { color: theme.textSecondary }]}>LIVE {isGold ? 'GOLD' : 'SILVER'} SELL RATE</Text>
            </View>
            {loading ? (
              <ShimmerPlaceholder width={160} height={36} borderRadius={10} isDarkMode={isDarkMode} />
            ) : (
              <Text style={[styles.rateValue, { color: theme.textPrimary }]}>₹{rate.toLocaleString('en-IN')}<Text style={styles.perGm}>/gm</Text></Text>
            )}
            <View style={[styles.vaultBadge, { backgroundColor: theme.itemBg }]}>
              <Text style={[styles.vaultText, { color: theme.textSecondary }]}>Available in Vault: <Text style={{fontWeight:'900', color: theme.textPrimary}}>{vaultBalance} gm</Text></Text>
            </View>
          </Animated.View>

          {/* Input Section */}
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[styles.inputContainer, { backgroundColor: theme.card }]}>
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
          </Animated.View>

          {/* Payout Bank Selection Section */}
          <Animated.View entering={FadeInDown.duration(500).delay(300)} style={[styles.inputContainer, { backgroundColor: theme.card, marginTop: 24 }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business-outline" size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Payout Destination</Text>
            </View>

            {selectedBank ? (
              <View style={[styles.bankCard, { borderColor: theme.border }]}>
                <View style={[styles.bankIconWrap, { backgroundColor: theme.itemBg }]}>
                  <Ionicons name="card" size={24} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bankName, { color: theme.textPrimary }]}>{selectedBank.bankName || 'Linked Bank'}</Text>
                  <Text style={[styles.bankDetails, { color: theme.textSecondary }]}>
                    {selectedBank.accountName || selectedBank.accountHolderName} • {selectedBank.accountNumber ? `**** ${selectedBank.accountNumber.slice(-4)}` : 'Verified Account'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddBank(true)}>
                  <Text style={[styles.changeText, { color: theme.primary }]}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.addBankBtn, { borderColor: theme.primary }]}
                onPress={() => setShowAddBank(true)}
              >
                <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                <Text style={[styles.addBankText, { color: theme.primary }]}>Add Payout Bank Account</Text>
              </TouchableOpacity>
            )}
            
            <Text style={[styles.bankHint, { color: theme.textSecondary }]}>
              Funds will be transferred to this account within 24-48 business hours.
            </Text>
          </Animated.View>

          {/* Summary Info Box */}
          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={18} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>Secure payout via <Text style={{fontWeight:'800', color: theme.textPrimary}}>Augmont Trust</Text></Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>100% Tax Compliant Liquidation</Text>
            </View>
          </Animated.View>

          {/* Add Bank Modal */}
          <Modal visible={showAddBank} transparent animationType="slide" onRequestClose={() => setShowAddBank(false)}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Link Payout Bank</Text>
                  <TouchableOpacity onPress={() => setShowAddBank(false)}>
                    <Ionicons name="close" size={24} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>

                {userBanks.length > 0 && (
                  <ScrollView style={styles.bankList} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 12 }]}>SELECT EXISTING</Text>
                    {userBanks.map((bank, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={[styles.bankListItem, { backgroundColor: theme.card, borderColor: selectedBank?.userBankId === bank.userBankId ? theme.primary : theme.border }]}
                        onPress={() => { setSelectedBank(bank); setShowAddBank(false); }}
                      >
                        <Ionicons name="business" size={20} color={theme.textSecondary} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[styles.bankName, { color: theme.textPrimary }]}>{bank.bankName || 'Payout Account'}</Text>
                          <Text style={[styles.bankDetails, { color: theme.textSecondary }]}>
                            {bank.accountNumber ? `**** ${bank.accountNumber.slice(-4)}` : 'Verified'}
                          </Text>
                        </View>
                        {selectedBank?.userBankId === bank.userBankId && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                      </TouchableOpacity>
                    ))}
                    <View style={[styles.divider, { marginVertical: 20 }]} />
                  </ScrollView>
                )}

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>ADD NEW ACCOUNT</Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Bank Name</Text>
                    <TextInput 
                      style={[styles.modalInput, { backgroundColor: theme.card, color: theme.textPrimary, borderColor: theme.border }]}
                      placeholder="e.g. HDFC Bank"
                      placeholderTextColor={theme.textSecondary}
                      value={bankForm.bankName}
                      onChangeText={(t) => setBankForm(p => ({...p, bankName: t}))}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Account Holder Name</Text>
                    <TextInput 
                      style={[styles.modalInput, { backgroundColor: theme.card, color: theme.textPrimary, borderColor: theme.border }]}
                      placeholder="Name as per Passbook"
                      placeholderTextColor={theme.textSecondary}
                      value={bankForm.accountName}
                      onChangeText={(t) => setBankForm(p => ({...p, accountName: t}))}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Account Number</Text>
                    <TextInput 
                      style={[styles.modalInput, { backgroundColor: theme.card, color: theme.textPrimary, borderColor: theme.border }]}
                      placeholder="12 to 16 Digits"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      value={bankForm.accountNumber}
                      onChangeText={(t) => setBankForm(p => ({...p, accountNumber: t}))}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>IFSC Code</Text>
                    <TextInput 
                      style={[styles.modalInput, { backgroundColor: theme.card, color: theme.textPrimary, borderColor: theme.border }]}
                      placeholder="HDFC0001234"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="characters"
                      value={bankForm.ifscCode}
                      onChangeText={(t) => setBankForm(p => ({...p, ifscCode: t}))}
                    />
                  </View>

                  <TouchableOpacity style={[styles.saveBankBtn, isSubmitting && { opacity: 0.7 }]} onPress={handleAddBank} disabled={isSubmitting}>
                    <LinearGradient colors={['#EAB308', '#D97706']} style={styles.saveBankBtnGrad}>
                      {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBankBtnText}>Link & Save Account</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Success Summary Modal */}
          <Modal visible={successModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={[styles.successContent, { backgroundColor: theme.background }]}>
                <View style={styles.successIconWrap}>
                  <Ionicons name="checkmark-done" size={64} color="#10B981" />
                </View>
                <Text style={[styles.successTitle, { color: theme.textPrimary }]}>Sale Successful!</Text>
                <Text style={[styles.successSub, { color: theme.textSecondary }]}>
                  Your {isGold ? 'Gold' : 'Silver'} has been liquidated. ₹{mode === 'rupees' ? amount : calculatedValue} will be credited to {selectedBank?.bankName || 'your bank account'} shortly.
                </Text>
                
                <View style={[styles.txDetails, { backgroundColor: theme.card }]}>
                  <View style={styles.txRow}>
                    <Text style={[styles.txLabel, { color: theme.textSecondary }]}>Transaction ID</Text>
                    <Text style={[styles.txValue, { color: theme.textPrimary }]}>{lastTxId.split('_')[1]}</Text>
                  </View>
                  <View style={styles.txRow}>
                    <Text style={[styles.txLabel, { color: theme.textSecondary }]}>Asset Quantity</Text>
                    <Text style={[styles.txValue, { color: theme.textPrimary }]}>{mode === 'grams' ? amount : calculatedValue} g</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.closeSuccessBtn} onPress={() => { setSuccessModal(false); router.replace('/(tabs)/portfolio'); }}>
                  <Text style={styles.closeSuccessText}>Go to Portfolio</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </ScrollView>
        
        {/* Fixed Footer */}
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total to Receive</Text>
            <Text style={[styles.totalValue, { color: theme.textPrimary }]}>₹{mode === 'rupees' ? (amount || '0') : calculatedValue}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.buyBtn, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleProceedToSell}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#EF4444', '#991B1B']}
              style={styles.buyBtnGrad}
              start={{x:0, y:0}} end={{x:1, y:1}}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buyBtnText}>PROCEED TO SELL</Text>
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
  
  // New Dynamic Styles
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginLeft: 10 },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  bankIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bankName: { fontSize: 15, fontWeight: '800' },
  bankDetails: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  changeText: { fontSize: 13, fontWeight: '800' },
  addBankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addBankText: { fontSize: 14, fontWeight: '800', marginLeft: 10 },
  bankHint: { fontSize: 11, fontWeight: '500', marginTop: 12, textAlign: 'center', opacity: 0.7 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  formGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  modalInput: { height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, fontWeight: '600' },
  saveBankBtn: { height: 56, borderRadius: 16, overflow: 'hidden', marginTop: 24 },
  saveBankBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveBankBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  
  bankList: { maxHeight: 200 },
  bankListItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  
  successContent: { padding: 32, alignItems: 'center', borderRadius: 35, marginHorizontal: 20 },
  successIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#10B98115', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12 },
  successSub: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  txDetails: { width: '100%', borderRadius: 20, padding: 20, marginBottom: 32 },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  txLabel: { fontSize: 13, fontWeight: '600' },
  txValue: { fontSize: 13, fontWeight: '800' },
  closeSuccessBtn: { width: '100%', height: 56, borderRadius: 16, backgroundColor: '#EAB308', alignItems: 'center', justifyContent: 'center' },
  closeSuccessText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
