import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { getLiveRates } from '../services/augmontApi';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { sendLocalNotification, saveNotificationToFirestore } from '../services/notificationService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function PriceAlertsScreen() {
  const router = useRouter();
  const { theme, isDarkMode, isGold } = useTheme();
  const { user } = useAuth();

  // Live Rates
  const [goldRate, setGoldRate] = useState(0);
  const [silverRate, setSilverRate] = useState(0);
  const [goldDisplay, setGoldDisplay] = useState('₹0.00');
  const [silverDisplay, setSilverDisplay] = useState('₹0.00');
  const [ratesLoading, setRatesLoading] = useState(true);

  // Alerts
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newType, setNewType] = useState('gold');
  const [newCondition, setNewCondition] = useState('below');
  const [newPrice, setNewPrice] = useState('');
  const [saving, setSaving] = useState(false);

  // ─── 0. IRON-CLAD PERSISTENCE logic ──────────────────────────
  const LOCAL_ALERTS_KEY = `@price_alerts_${user?.uid}`;

  const saveToLocal = async (data) => {
    try {
      if (!user?.uid) return;
      await AsyncStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(data));
      console.log(`[STORAGE_DEBUG] Saved ${data.length} alerts to Phone Disk`);
    } catch (e) {
      console.error("Local save error:", e);
    }
  };

  const loadFromLocal = async () => {
    try {
      if (!user?.uid) return;
      const json = await AsyncStorage.getItem(LOCAL_ALERTS_KEY);
      if (json) {
        const localData = JSON.parse(json);
        if (localData.length > 0 && alerts.length === 0) {
          console.log("[ALERTS] Initial Load from Local DISK.");
          setAlerts(localData);
          setAlertsLoading(false);
        }
      }
    } catch (e) {
      console.error("Local load error:", e);
    }
  };

  // Initial load from disk
  useEffect(() => {
    loadFromLocal();
  }, [user?.uid]);

  // Refs for polling
  const goldRateRef = useRef(0);
  const silverRateRef = useRef(0);
  const firedAlerts = useRef(new Set()); // Track already-fired alerts to avoid repeat

  // Failsafe: Reset saving state when modal closes
  useEffect(() => {
    if (!modalVisible) {
      setSaving(false);
    }
  }, [modalVisible]);

  const primaryColor = isGold ? '#EAB308' : '#94A3B8';
  const gradColors = isGold ? ['#EAB308', '#D97706'] : ['#94A3B8', '#64748B'];
  const liveDisplay = isGold ? goldDisplay : silverDisplay;
  const otherDisplay = isGold ? silverDisplay : goldDisplay;
  const metalLabel = isGold ? 'GOLD (24K)' : 'SILVER (999)';
  const otherLabel = isGold ? 'SILVER (999)' : 'GOLD (24K)';

  // ─── 1. Real-time Firestore alerts listener ────────────────────
  useEffect(() => {
    if (!user?.uid) {
      setAlertsLoading(false);
      return;
    }

    setAlertsLoading(true);
    const alertsRef = collection(db, 'users', user.uid, 'alerts');
    const q = query(alertsRef, orderBy('createdAt', 'desc'));
    
    const unsub = onSnapshot(q, (snap) => {
      const cloudData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`[ALERTS] Firestore Sync: ${cloudData.length} items (Total Alerts)`);
      
      setAlerts(currentAlerts => {
        // --- IRON-CLAD LOCK + SMART DEDUPLICATION ---
        const merged = [...cloudData];
        
        // Match by content: if cloud has it, we DON'T need the local version
        currentAlerts.forEach(localAlert => {
           const existsInCloud = merged.some(c => 
             c.id === localAlert.id || 
             (c.targetPrice === localAlert.targetPrice && 
              c.type === localAlert.type && 
              c.condition === localAlert.condition)
           );
           
           if (!existsInCloud) {
             console.log(`[ALERTS] Keeping Local Item (Handshake Pending): ${localAlert.id}`);
             merged.push(localAlert);
           }
        });

        saveToLocal(merged); 
        return merged;
      });
      
      setAlertsLoading(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      setAlertsLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  // ─── 2. Live rate polling every 15s + alert check ─────────────
  useEffect(() => {
    let isMounted = true;
    const fetchAndCheck = async () => {
      try {
        const data = await getLiveRates();
        const rates = data?.result?.data?.rates;
        if (!rates || !isMounted) return;

        const gRate = parseFloat(rates.gBuy);
        const sRate = parseFloat(rates.sBuy);

        goldRateRef.current = gRate;
        silverRateRef.current = sRate;

        setGoldRate(gRate);
        setSilverRate(sRate);
        setGoldDisplay(`₹${gRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setSilverDisplay(`₹${sRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setRatesLoading(false);

        if (!user) return;
        setAlerts(currentAlerts => {
          currentAlerts.forEach(async (alert) => {
            if (!alert.enabled || firedAlerts.current.has(alert.id)) return;

            const currentRate = alert.type === 'gold' ? gRate : sRate;
            const targetPrice = parseFloat(alert.targetPrice);
            let triggered = false;
            let notifBody = '';
            const metalName = alert.type === 'gold' ? 'Gold (24K)' : 'Silver (999)';
            const formattedRate = `₹${currentRate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
            const formattedTarget = `₹${targetPrice.toLocaleString('en-IN')}`;

            // STRICTER TRIGGER LOGIC: Must be strictly CROSSING the price
            if (alert.condition === 'below' && currentRate < targetPrice) {
              triggered = true;
              notifBody = `${metalName} dropped below ${formattedRate} (target: ${formattedTarget})`;
            } else if (alert.condition === 'above' && currentRate > targetPrice) {
              triggered = true;
              notifBody = `${metalName} rose above ${formattedRate} (target: ${formattedTarget})`;
            }

            if (triggered) {
              firedAlerts.current.add(alert.id);
              const notifTitle = `🔔 Price Alert: ${metalName}`;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await sendLocalNotification(notifTitle, notifBody, { alertId: alert.id });

              const alertRef = doc(db, 'users', user.uid, 'alerts', alert.id);
              if (alert.id && !alert.id.startsWith('temp_')) {
                await updateDoc(alertRef, { 
                    enabled: false,
                    triggered: true,
                    triggeredAt: serverTimestamp(),
                    lastTriggeredPrice: currentRate
                });
              }

              await saveNotificationToFirestore(user.uid, {
                title: notifTitle,
                message: notifBody,
                icon: alert.type === 'gold' ? 'trending-up' : 'trending-down',
                color: alert.type === 'gold' ? '#EAB308' : '#94A3B8',
              });
            }
          });
          return currentAlerts;
        });
      } catch (err) { }
    };

    const initialTimer = setTimeout(() => { if (isMounted) fetchAndCheck(); }, 1000);
    const interval = setInterval(() => { if (isMounted) fetchAndCheck(); }, 15000);
    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user]);

  // ─── 3. Toggle alert ──────────────────────────────────────────
  const toggleAlert = async (id, current) => {
    if (id.startsWith('temp_')) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const alertRef = doc(db, 'users', user.uid, 'alerts', id);
    await updateDoc(alertRef, { enabled: !current });
    firedAlerts.current.delete(id);
  };

  // ─── 4. Delete alert ──────────────────────────────────────────
  const deleteAlert = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Alert', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          // 🔥 OPTIMISTIC DELETE: Remove from screen and disk IMMEDIATELY
          const updatedList = alerts.filter(a => a.id !== id);
          setAlerts(updatedList);
          await saveToLocal(updatedList);

          // Then remove from cloud in the background
          if (!id.startsWith('temp_')) {
            try {
               await deleteDoc(doc(db, 'users', user.uid, 'alerts', id));
               console.log("[ALERTS] Cloud Delete Success.");
            } catch (err) {
               console.error("[ALERTS] Cloud delete pending:", err);
            }
          }
        }
      },
    ]);
  };

  // ─── 5. CREATE ALERT (Optimistic UI + Handshake) ─────────────
  const addAlert = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) return;
    const targetVal = parseFloat(newPrice);
    setSaving(true);

    const newAlertData = {
      type: newType,
      condition: newCondition,
      targetPrice: targetVal,
      label: `${newType === 'gold' ? 'Gold' : 'Silver'} ${newCondition === 'below' ? 'drops below' : 'hits above'} ₹${targetVal.toLocaleString('en-IN')}`,
      enabled: true,
      createdAt: new Date().toISOString(),
      triggered: false
    };

    const tempId = `temp_${Date.now()}`;
    const optimisticAlert = { id: tempId, ...newAlertData };
    const updatedList = [optimisticAlert, ...alerts];
    setAlerts(updatedList);
    saveToLocal(updatedList); 
    
    setModalVisible(false);
    setSaving(false);
    setNewPrice('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'alerts'), {
        ...newAlertData,
        createdAt: serverTimestamp() 
      });
      console.log(`[ALERTS] Cloud-Handshake Success: ${docRef.id} !!`);
    } catch (err) {
      console.error("[ALERTS] Cloud sync pending:", err);
    }
  };

  const alertIconColor = (type) => type === 'gold' ? '#EAB308' : '#94A3B8';
  const alertIconBg = (type) => type === 'gold'
    ? (isDarkMode ? '#2D2000' : '#FFF9E5')
    : (isDarkMode ? '#1E293B' : '#F1F5F9');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerMid}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Price Alerts</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Real-time market triggers</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.rateRow}>
          {ratesLoading ? (
            <View style={[styles.rateCard, { backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center' }]}>
              <ActivityIndicator color={primaryColor} />
            </View>
          ) : (
            <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rateCard}>
              <Text style={styles.rateCardLabelWhite}>{metalLabel}</Text>
              <Text style={styles.rateCardValueWhite}>{liveDisplay}</Text>
              <View style={styles.liveDot}><View style={styles.liveDotInner} /><Text style={styles.liveText}>LIVE</Text></View>
            </LinearGradient>
          )}
          <View style={[styles.rateCard, { backgroundColor: theme.card }]}>
            {ratesLoading ? <ActivityIndicator color={theme.textSecondary} /> : (
              <><Text style={[styles.rateCardLabel, { color: theme.textSecondary }]}>{otherLabel}</Text><Text style={[styles.rateCardValue, { color: theme.textPrimary }]}>{otherDisplay}</Text></>
            )}
          </View>
        </View>

        <View style={styles.triggersHeader}>
          <Text style={[styles.triggersTitle, { color: theme.textPrimary }]}>Active Triggers</Text>
          <TouchableOpacity style={[styles.newAlertBtn, { backgroundColor: primaryColor }]} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={16} color="#FFF" />
            <Text style={styles.newAlertText}>New Alert</Text>
          </TouchableOpacity>
        </View>

        {alertsLoading && alerts.length === 0 ? (
          <ActivityIndicator color={primaryColor} style={{ marginTop: 40 }} />
        ) : (
          alerts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <Ionicons name="notifications-off-outline" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No active alerts yet</Text>
            </View>
          ) : (
            alerts.map((alert) => (
              <View key={alert.id} style={[styles.alertCard, { backgroundColor: theme.card }]}>
                <View style={[styles.alertIconBg, { backgroundColor: alertIconBg(alert.type) }]}>
                  <Ionicons name={alert.condition === 'below' ? 'trending-down' : 'trending-up'} size={22} color={alertIconColor(alert.type)} />
                </View>
                <View style={styles.alertMeta}>
                  <Text style={[styles.alertLabel, { color: theme.textPrimary }]}>{alert.type === 'gold' ? 'Gold' : 'Silver'} {alert.condition === 'below' ? 'drops below' : 'hits above'}</Text>
                  <Text style={[styles.alertPrice, { color: alertIconColor(alert.type) }]}>₹{parseFloat(alert.targetPrice).toLocaleString('en-IN')}</Text>
                </View>
                <Switch value={alert.enabled} onValueChange={() => toggleAlert(alert.id, alert.enabled)} trackColor={{ false: '#334155', true: '#22C55E' }} />
                <TouchableOpacity onPress={() => deleteAlert(alert.id)} style={{ marginLeft: 15 }}><Ionicons name="trash-outline" size={20} color="#EF4444" /></TouchableOpacity>
              </View>
            ))
          )
        )}
        <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: isDarkMode ? '#334155' : '#DBEAFE' }]}>
          <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
          <Text style={[styles.infoText, { color: isDarkMode ? '#93C5FD' : '#1D4ED8' }]}>Alerts are checked 24/7. You will receive a push notification the moment your target is reached.</Text>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Create New Alert</Text>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>METAL</Text>
            <View style={styles.segmentRow}>
              {['gold', 'silver'].map(t => (
                <TouchableOpacity key={t} style={[styles.segBtn, newType === t && { backgroundColor: primaryColor }]} onPress={() => setNewType(t)}>
                  <Text style={[styles.segBtnText, { color: newType === t ? '#FFF' : theme.textSecondary }]}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>CONDITION</Text>
            <View style={styles.segmentRow}>
              {['below', 'above'].map(c => (
                <TouchableOpacity key={c} style={[styles.segBtn, newCondition === c && { backgroundColor: primaryColor }]} onPress={() => setNewCondition(c)}>
                  <Text style={[styles.segBtnText, { color: newCondition === c ? '#FFF' : theme.textSecondary }]}>{c === 'below' ? 'DROPS BELOW' : 'HITS ABOVE'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>TARGET PRICE (₹)</Text>
            <View style={[styles.priceInput, { backgroundColor: theme.background, borderColor: theme.border }]}>
               <TextInput style={[styles.priceField, { color: theme.textPrimary }]} placeholder="Enter price" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={newPrice} onChangeText={setNewPrice} />
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={addAlert} disabled={saving}>
              <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGrad}>
                <Text style={styles.createBtnText}>{saving ? 'Saving...' : 'Create Alert'}</Text>
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
  rateRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  rateCard: { flex: 1, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, minHeight: 90, justifyContent: 'center' },
  rateCardLabelWhite: { fontSize: 11, fontWeight: '800', color: '#FFF', letterSpacing: 0.5, marginBottom: 4 },
  rateCardValueWhite: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  rateCardLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  rateCardValue: { fontSize: 20, fontWeight: '900' },
  liveDot: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  liveDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  triggersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  triggersTitle: { fontSize: 18, fontWeight: '800' },
  newAlertBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4 },
  newAlertText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  alertCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  alertIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  alertMeta: { flex: 1 },
  alertLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  alertPrice: { fontSize: 17, fontWeight: '900' },
  emptyState: { alignItems: 'center', padding: 40, borderRadius: 24, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 14, borderWidth: 1, gap: 10, marginTop: 8 },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  segBtnText: { fontSize: 12, fontWeight: '800' },
  priceInput: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 52, marginTop: 8 },
  priceField: { flex: 1, fontSize: 18, fontWeight: '800' },
  createBtn: { marginTop: 24, borderRadius: 16, overflow: 'hidden', height: 56 },
  createBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
