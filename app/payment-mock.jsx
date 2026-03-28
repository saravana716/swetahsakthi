import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import Toast from 'react-native-toast-message';

export default function PaymentMockScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user, userProfile } = useAuth();
  
  // Params from BuyScreen
  const params = useLocalSearchParams();
  const { 
    finalRsAmount, 
    finalGmQuantity, 
    rate, 
    blockId, 
    metalType, 
    mode 
  } = params;

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSettlePayment = async () => {
    setIsProcessing(true);
    let augmontTxId = null;

    try {
      const token = await user.getIdToken();
      const uniqueUserId = userProfile?.augmontUniqueId || userProfile?.uniqueId; 
      
      if (!uniqueUserId) throw new Error("Crucial Profile ID missing. Please refresh profile.");

      // STEP 1: AUGMONT PURCHASE EXECUTION
      const augmontPayload = {
        lockPrice: rate.toString(),
        metalType: metalType,
        merchantTransactionId: `MTX-${Date.now()}`,
        uniqueId: uniqueUserId,
        blockId: blockId
      };

      if (mode === 'rupees') {
        augmontPayload.amount = parseFloat(finalRsAmount).toFixed(2).toString();
      } else {
        augmontPayload.quantity = parseFloat(finalGmQuantity).toFixed(4).toString();
      }

      console.log("-----------------------------------------");
      console.log("SETTLING PAYMENT WITH AUGMONT (puynow)...", augmontPayload);
      
      const augReq = await fetch('http://13.63.202.142:5001/api/augmont/v1/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(augmontPayload)
      });
      const augRes = await augReq.json();

      // LOG FULL SETTLEMENT RESPONSE AS REQUESTED
      console.log("AUGMONT SETTLEMENT RESPONSE (puynow):", JSON.stringify(augRes, null, 2));

      if (!augReq.ok) {
        let specificError = augRes.message || "Augmont execution failed";
        if (augRes.errors) {
          const errorKeys = Object.keys(augRes.errors);
          if (errorKeys.length > 0) {
            specificError = augRes.errors[errorKeys[0]][0]?.message || specificError;
          }
        }
        throw new Error(specificError);
      }

      augmontTxId = augRes?.result?.data?.transactionId || augmontPayload.merchantTransactionId;

      // STEP 2: MONGODB LOCAL TRANSACTION RECEIPT
      const mongoPayload = {
        orderType: "buy",
        merchantTransactionId: augmontTxId,
        augmontUniqueId: uniqueUserId,
        userId: userProfile.mongoId,
        status: "completed",
        metalType: metalType,
        amount: parseFloat(finalRsAmount),
        quantity: parseFloat(finalGmQuantity),
        lockPrice: parseFloat(rate),
        blockId: blockId,
        metadata: {
          paymentMethod: "MockGateWay",
          platform: "mobile_app",
          device: Platform.OS
        }
      };

      try {
        await fetch('http://13.63.202.142:5001/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(mongoPayload)
        });
        console.log("MongoDB Receipt Saved!");
      } catch (dbErr) {
        console.log("Alert: MongoDB save failed.", dbErr);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ 
        type: 'success', 
        text1: 'Payment Successful!', 
        text2: `Purchased ${finalGmQuantity}g ${metalType}`, 
        visibilityTime: 3000 
      });
      
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);

    } catch (err) {
      console.error("Payment Settlement Error:", err);
      Toast.show({ type: 'error', text1: 'Payment Failed', text2: err.message });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Choose Payment Mode</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.amountCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>TOTAL AMOUNT PAYABLE</Text>
          <Text style={[styles.amountValue, { color: theme.textPrimary }]}>₹{parseFloat(finalRsAmount).toLocaleString('en-IN')}</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>{metalType.toUpperCase()} QUANTITY</Text>
            <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{parseFloat(finalGmQuantity).toFixed(4)}g</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SECURE PAYMENT GATEWAY (MOCK)</Text>
        
        <TouchableOpacity 
          style={[styles.payMethod, { backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 1 }]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        >
          <View style={styles.methodInfo}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#451a03' : '#FEF08A' }]}>
              <Ionicons name="card" size={22} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.methodName, { color: theme.textPrimary }]}>PayU (Mock Mode)</Text>
              <Text style={[styles.methodSub, { color: theme.textSecondary }]}>UPI, Cards, NetBanking</Text>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
        </TouchableOpacity>

        <View style={styles.spacer} />

        <View style={[styles.secureBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={[styles.secureText, { color: theme.textSecondary }]}>SSL Encrypted Secure Transaction</Text>
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.payBtn, isProcessing && { opacity: 0.7 }]}
          disabled={isProcessing}
          onPress={handleSettlePayment}
        >
          <LinearGradient
            colors={['#EAB308', '#B45309']}
            style={styles.payBtnGrad}
            start={{x:0, y:0}} end={{x:1, y:1}}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.payBtnText}>PAY ₹{parseFloat(finalRsAmount).toLocaleString('en-IN')} SUCCESSFULLY</Text>
            )}
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
    padding: 20,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 20, flex: 1 },
  amountCard: {
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  amountLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  amountValue: { fontSize: 42, fontWeight: '900', marginBottom: 20 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  detailText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontWeight: '800' },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 16, paddingLeft: 4 },
  payMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
  },
  methodInfo: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  methodSub: { fontSize: 12, fontWeight: '600' },
  spacer: { flex: 1 },
  secureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 20,
  },
  secureText: { fontSize: 12, fontWeight: '700' },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
  },
  payBtn: { height: 60, borderRadius: 20, overflow: 'hidden' },
  payBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  payBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});
