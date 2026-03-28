import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from './context/ThemeContext';

const { width } = Dimensions.get('window');

export default function PriceAlertsScreen() {
  const router = useRouter();
  const { theme, isDarkMode, isGold } = useTheme();

  // Dynamic per metal
  const metalLabel    = isGold ? 'GOLD (24K)' : 'SILVER (999)';
  const otherLabel    = isGold ? 'SILVER (999)' : 'GOLD (24K)';
  const primaryColor  = isGold ? '#EAB308' : '#94A3B8';
  const accentBg      = isGold ? (isDarkMode ? '#2D2000' : '#FFF9E5') : (isDarkMode ? '#1E293B' : '#F1F5F9');
  const accentColor   = isGold ? '#B45309' : '#475569';
  const gradColors    = isGold ? ['#EAB308', '#D97706'] : ['#94A3B8', '#64748B'];

  const [liveRate]    = useState(isGold ? '₹14,239' : '₹88.41');
  const [otherRate]   = useState(isGold ? '₹88.41'  : '₹14,239');

  const [alerts, setAlerts] = useState([
    { id: 1, type: isGold ? 'gold' : 'silver', label: `${isGold ? 'Gold' : 'Silver'} drops below`, price: isGold ? '₹6,000' : '₹70', enabled: true },
    { id: 2, type: isGold ? 'silver' : 'gold', label: `${isGold ? 'Silver' : 'Gold'} hits`,         price: isGold ? '₹95'   : '₹15,000', enabled: true },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newType,      setNewType]      = useState(isGold ? 'gold' : 'silver');
  const [newCondition, setNewCondition] = useState('below');
  const [newPrice,     setNewPrice]     = useState('');

  const toggleAlert = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlert = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Alert', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setAlerts(prev => prev.filter(a => a.id !== id)) },
    ]);
  };

  const addAlert = () => {
    if (!newPrice) return;
    setAlerts(prev => [...prev, {
      id: Date.now(),
      type: newType,
      label: `${newType === 'gold' ? 'Gold' : 'Silver'} ${newCondition === 'below' ? 'drops below' : 'hits'}`,
      price: `₹${newPrice}`,
      enabled: true,
    }]);
    setNewPrice('');
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const alertIconColor = (type) => type === 'gold' ? '#EAB308' : '#94A3B8';
  const alertIconBg    = (type) => type === 'gold'
    ? (isDarkMode ? '#2D2000' : '#FFF9E5')
    : (isDarkMode ? '#1E293B' : '#F1F5F9');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Price Alerts</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Never miss a market movement</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Rate Cards — active metal is highlighted */}
        <View style={styles.rateRow}>
          <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rateCard}>
            <Text style={styles.rateCardLabelWhite}>{metalLabel}</Text>
            <Text style={styles.rateCardValueWhite}>{liveRate}</Text>
          </LinearGradient>

          <View style={[styles.rateCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.rateCardLabel, { color: theme.textSecondary }]}>{otherLabel}</Text>
            <Text style={[styles.rateCardValue, { color: theme.textPrimary }]}>{otherRate}</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.triggersHeader}>
          <Text style={[styles.triggersTitle, { color: theme.textPrimary }]}>Active Triggers</Text>
          <TouchableOpacity style={[styles.newAlertBtn, { backgroundColor: primaryColor }]} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={16} color="#FFF" />
            <Text style={styles.newAlertText}>New Alert</Text>
          </TouchableOpacity>
        </View>

        {/* Alert List */}
        {alerts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
            <Ionicons name="notifications-off-outline" size={40} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No active alerts yet</Text>
            <Text style={[styles.emptySub,  { color: theme.textSecondary }]}>Tap "+ New Alert" to create one</Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={[styles.alertCard, { backgroundColor: theme.card }]}>
              <View style={[styles.alertIconBg, { backgroundColor: alertIconBg(alert.type) }]}>
                <Ionicons name="notifications-outline" size={22} color={alertIconColor(alert.type)} />
              </View>
              <View style={styles.alertMeta}>
                <Text style={[styles.alertLabel, { color: theme.textPrimary }]}>{alert.label}</Text>
                <Text style={[styles.alertPrice, { color: alertIconColor(alert.type) }]}>{alert.price}</Text>
              </View>
              <Switch
                value={alert.enabled}
                onValueChange={() => toggleAlert(alert.id)}
                trackColor={{ false: isDarkMode ? '#334155' : '#E2E8F0', true: '#22C55E' }}
                thumbColor="#FFF"
                style={{ marginRight: 8 }}
              />
              <TouchableOpacity onPress={() => deleteAlert(alert.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: isDarkMode ? '#334155' : '#DBEAFE' }]}>
          <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
          <Text style={[styles.infoText, { color: isDarkMode ? '#93C5FD' : '#1D4ED8' }]}>
            You'll receive a push notification instantly when your trigger price is reached.
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* New Alert Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Create New Alert</Text>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>METAL</Text>
            <View style={styles.segmentRow}>
              {['gold', 'silver'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.segBtn, newType === t && { backgroundColor: primaryColor }, { borderColor: theme.border }]}
                  onPress={() => setNewType(t)}
                >
                  <Text style={[styles.segBtnText, { color: newType === t ? '#FFF' : theme.textSecondary }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>CONDITION</Text>
            <View style={styles.segmentRow}>
              {[{ val: 'below', label: 'Drops Below' }, { val: 'above', label: 'Hits Above' }].map(c => (
                <TouchableOpacity
                  key={c.val}
                  style={[styles.segBtn, newCondition === c.val && { backgroundColor: primaryColor }, { borderColor: theme.border }]}
                  onPress={() => setNewCondition(c.val)}
                >
                  <Text style={[styles.segBtnText, { color: newCondition === c.val ? '#FFF' : theme.textSecondary }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>TARGET PRICE (₹)</Text>
            <View style={[styles.priceInput, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.pricePrefix, { color: theme.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.priceField, { color: theme.textPrimary }]}
                placeholder="Enter price"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={newPrice}
                onChangeText={setNewPrice}
              />
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={addAlert}>
              <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGrad}>
                <Text style={styles.createBtnText}>Create Alert</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, paddingTop: Platform.OS === 'android' ? 40 : 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerMid: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  rateRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  rateCard: { flex: 1, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  rateCardLabelWhite: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 0.5, marginBottom: 6 },
  rateCardValueWhite: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  rateCardLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  rateCardValue: { fontSize: 22, fontWeight: '900' },
  triggersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  triggersTitle: { fontSize: 18, fontWeight: '800' },
  newAlertBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4 },
  newAlertText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  alertCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  alertIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  alertMeta: { flex: 1 },
  alertLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  alertPrice: { fontSize: 16, fontWeight: '900' },
  emptyState: { alignItems: 'center', padding: 40, borderRadius: 24, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, fontWeight: '500' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 14, borderWidth: 1, gap: 10, marginTop: 8 },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  segBtnText: { fontSize: 13, fontWeight: '700' },
  priceInput: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 52, marginTop: 8 },
  pricePrefix: { fontSize: 18, fontWeight: '700', marginRight: 4 },
  priceField: { flex: 1, fontSize: 18, fontWeight: '700' },
  createBtn: { marginTop: 24, borderRadius: 16, overflow: 'hidden', height: 56 },
  createBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
