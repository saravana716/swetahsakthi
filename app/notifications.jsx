import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, StatusBar } from 'react-native';
import Animated, { FadeInRight, FadeIn, Layout, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import {
  collection, onSnapshot, query, orderBy,
  writeBatch, getDocs, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import * as Haptics from 'expo-haptics';

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── Real-time Firestore listener ─────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const notifRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const docData = d.data();
        const rawDate = docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date();
        return {
          id: d.id,
          ...docData,
          _rawDate: rawDate,
          time: formatRelativeTime(rawDate),
        };
      });
      setNotifications(data);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  // Auto-refresh relative timestamps every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          time: n._rawDate ? formatRelativeTime(n._rawDate) : n.time,
        }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Actions ───────────────────────────────────────────────────
  const markAllRead = async () => {
    if (!user || notifications.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const batch = writeBatch(db);
    const unreadNotifs = notifications.filter(n => n.unread);
    if (unreadNotifs.length === 0) return;
    
    unreadNotifs.forEach(n => {
      const ref = doc(db, 'users', user.uid, 'notifications', n.id);
      batch.update(ref, { unread: false });
    });
    await batch.commit();
  };

  const clearAll = async () => {
    if (!user || notifications.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const batch = writeBatch(db);
    const snap = await getDocs(collection(db, 'users', user.uid, 'notifications'));
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  };

  const markRead = async (id) => {
    if (!user) return;
    const item = notifications.find(n => n.id === id);
    if (item && item.unread) {
      Haptics.selectionAsync();
      await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { unread: false });
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const renderItem = ({ item, index }) => (
    <Animated.View
      entering={FadeInRight.duration(400).delay(index * 50)}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { backgroundColor: theme.card, borderColor: theme.border },
          item.unread && { shadowOpacity: 0.1, shadowColor: item.color || theme.primary }
        ]}
        onPress={() => markRead(item.id)}
        activeOpacity={0.7}
      >
        {/* Unread Indicator */}
        {item.unread && (
          <View style={[styles.unreadLine, { backgroundColor: item.color || theme.primary }]} />
        )}

        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
          <Ionicons name={item.icon || 'notifications'} size={24} color={item.color || theme.primary} />
          {item.unread && <View style={[styles.unreadDotInner, { backgroundColor: item.color || theme.primary }]} />}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.cardTime, { color: theme.textSecondary }]}>
              {item.time}
            </Text>
          </View>
          
          <Text style={[styles.cardMessage, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.message}
          </Text>

          {item.unread && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        
        {/* Modern Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.headerBtn, { backgroundColor: theme.card }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Notifications</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
              {unreadCount > 0 ? `${unreadCount} unread messages` : 'Up to date'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllRead} style={[styles.actionBtn, { backgroundColor: theme.card }]}>
                <Ionicons name="checkmark-done" size={20} color={theme.primary} />
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity onPress={clearAll} style={[styles.actionBtn, { backgroundColor: theme.card }]}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Syncing inbox...</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Animated.View entering={FadeIn.duration(800)} style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
                  <Ionicons name="notifications-off-outline" size={60} color={theme.textSecondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Notifications</Text>
                <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                  Your inbox is currently empty. Set price alerts to get real-time updates.
                </Text>
                <TouchableOpacity 
                  style={[styles.exploreBtn, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/price-alerts')}
                >
                  <Text style={styles.exploreBtnText}>Go to Price Alerts</Text>
                </TouchableOpacity>
              </Animated.View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function formatRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
    marginBottom: 8
  },
  headerBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  headerInfo: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 13, fontWeight: '600', opacity: 0.7 },
  headerActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  listContainer: { padding: 20, paddingBottom: 40 },
  
  notificationCard: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  unreadLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: { 
    width: 52, 
    height: 52, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  unreadDotInner: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cardContent: { flex: 1, marginLeft: 16 },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 6
  },
  cardTitle: { fontSize: 15, fontWeight: '800', flex: 1, marginRight: 8 },
  cardTime: { fontSize: 11, fontWeight: '700', opacity: 0.5 },
  cardMessage: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  
  newBadge: {
    position: 'absolute',
    bottom: -10,
    right: -5,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

  loadingText: { fontSize: 15, fontWeight: '700', marginTop: 16 },
  
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIconCircle: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 24 
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', marginBottom: 12 },
  emptySub: { 
    fontSize: 14, 
    fontWeight: '500', 
    textAlign: 'center', 
    paddingHorizontal: 50, 
    lineHeight: 22,
    marginBottom: 32
  },
  exploreBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  exploreBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
