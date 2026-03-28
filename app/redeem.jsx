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
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from './context/ThemeContext';

const { width } = Dimensions.get('window');

// Products per metal
const GOLD_PRODUCTS = [
  { id: 1, emoji: '🪙', name: '1 gm 24K Gold Coin',     sub: '99.9% Purity • BIS Hallmarked', price: 7200  },
  { id: 2, emoji: '🌸', name: '2 gm Ganesh Gold Coin',  sub: '99.9% Purity • BIS Hallmarked', price: 14400 },
  { id: 3, emoji: '👑', name: '5 gm Lakshmi Gold Bar',  sub: '99.9% Purity • BIS Hallmarked', price: 36000 },
  { id: 4, emoji: '🌹', name: '10 gm Rose Gold Bar',    sub: '99.9% Purity • BIS Hallmarked', price: 72000 },
  { id: 5, emoji: '🏅', name: '20 gm Gold Bar',         sub: '99.9% Purity • BIS Hallmarked', price: 144000},
];

const SILVER_PRODUCTS = [
  { id: 1, emoji: '🥈', name: '10 gm 999 Silver Coin',    sub: '99.9% Purity • BIS Hallmarked', price: 880  },
  { id: 2, emoji: '💿', name: '50 gm Silver Coin',        sub: '99.9% Purity • BIS Hallmarked', price: 4400 },
  { id: 3, emoji: '🪙', name: '100 gm Silver Bar',        sub: '99.9% Purity • BIS Hallmarked', price: 8800 },
  { id: 4, emoji: '🔷', name: '500 gm Silver Bar',        sub: '99.9% Purity • BIS Hallmarked', price: 44000},
  { id: 5, emoji: '🏆', name: '1 kg Silver Bar',          sub: '99.9% Purity • BIS Hallmarked', price: 88000},
];

export default function RedeemScreen() {
  const router = useRouter();
  const { theme, isDarkMode, isGold } = useTheme();

  const metalName    = isGold ? 'Gold'   : 'Silver';
  const primaryColor = isGold ? '#EAB308' : '#94A3B8';
  const gradColors   = isGold ? ['#1C1600', '#2D2200'] : ['#1E293B', '#334155'];
  const PRODUCTS     = isGold ? GOLD_PRODUCTS : SILVER_PRODUCTS;

  const [cart, setCart] = useState({});

  const addToCart    = (id) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCart(p => ({ ...p, [id]: (p[id] || 0) + 1 })); };
  const removeFromCart = (id) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCart(p => { const u = { ...p }; if (u[id] > 1) u[id] -= 1; else delete u[id]; return u; }); };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const prod = PRODUCTS.find(p => p.id === parseInt(id));
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  const handleProceed = () => {
    if (totalItems === 0) { Alert.alert('No Items', 'Please add at least one product to redeem.'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Redemption Initiated! 📦',
      `${totalItems} item(s) worth ₹${totalPrice.toLocaleString('en-IN')} will be dispatched within 3-5 business days.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Redeem {metalName}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hero Banner — changes for gold/silver */}
        <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBanner}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Get Real {metalName} Delivered</Text>
            <Text style={styles.heroSub}>
              Convert your digital {metalName.toLowerCase()} into BIS Hallmarked {isGold ? 'coins & bars' : 'coins'}. Insured delivery.
            </Text>
          </View>
          <View style={styles.heroIconCol}>
            <Ionicons name="phone-portrait-outline" size={52} color={isGold ? 'rgba(234,179,8,0.3)' : 'rgba(148,163,184,0.3)'} />
          </View>
        </LinearGradient>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Select Product</Text>

        {PRODUCTS.map((product) => (
          <View key={product.id} style={[styles.productCard, { backgroundColor: theme.card, borderColor: isDarkMode ? 'transparent' : '#F0EDE8' }]}>
            <Text style={styles.productEmoji}>{product.emoji}</Text>
            <View style={styles.productMeta}>
              <Text style={[styles.productName, { color: theme.textPrimary }]}>{product.name}</Text>
              <Text style={[styles.productSub,  { color: theme.textSecondary }]}>{product.sub}</Text>
            </View>
            <View style={styles.productRight}>
              <Text style={[styles.productPrice, { color: theme.textPrimary }]}>₹{product.price.toLocaleString('en-IN')}</Text>
              {cart[product.id] ? (
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: theme.border }]} onPress={() => removeFromCart(product.id)}>
                    <Ionicons name="remove" size={16} color={theme.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyCount, { color: theme.textPrimary }]}>{cart[product.id]}</Text>
                  <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: primaryColor }]} onPress={() => addToCart(product.id)}>
                    <Ionicons name="add" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[styles.addBtn, { borderColor: primaryColor }]} onPress={() => addToCart(product.id)}>
                  <Text style={[styles.addBtnText, { color: primaryColor }]}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Cart Footer */}
      {totalItems > 0 && (
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={styles.footerLeft}>
            <Text style={[styles.footerQty,   { color: theme.textSecondary }]}>{totalItems} item{totalItems > 1 ? 's' : ''} selected</Text>
            <Text style={[styles.footerTotal, { color: theme.textPrimary }]}>₹{totalPrice.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
            <LinearGradient
              colors={isGold ? ['#EAB308', '#D97706'] : ['#94A3B8', '#64748B']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.proceedGrad}
            >
              <Text style={styles.proceedText}>Proceed</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, paddingTop: Platform.OS === 'android' ? 44 : 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  heroBanner: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 28, minHeight: 100 },
  heroTextCol: { flex: 1, paddingRight: 10 },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 20, fontWeight: '500' },
  heroIconCol: { alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  productCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  productEmoji: { fontSize: 32, marginRight: 14 },
  productMeta: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', marginBottom: 4, lineHeight: 20 },
  productSub: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
  productRight: { alignItems: 'flex-end', gap: 8 },
  productPrice: { fontSize: 15, fontWeight: '800' },
  addBtn: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5 },
  addBtnText: { fontSize: 13, fontWeight: '800' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  qtyCount: { fontSize: 15, fontWeight: '900', minWidth: 20, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1 },
  footerLeft: { flex: 1 },
  footerQty: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  footerTotal: { fontSize: 20, fontWeight: '900' },
  proceedBtn: { borderRadius: 14, overflow: 'hidden', height: 50, width: 140 },
  proceedGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  proceedText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
