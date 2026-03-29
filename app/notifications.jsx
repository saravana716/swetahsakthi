import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './context/ThemeContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Gift from Swarna Sakthi!', message: 'You just received 10mg free gold for your daily login.', time: '2 mins ago', unread: true, icon: 'gift', color: '#EAB308' },
    { id: '2', title: 'Price Alert: Gold is up!', message: 'Gold price increased by 1.2% in the last 2 hours.', time: '1 hour ago', unread: true, icon: 'trending-up', color: '#10B981' },
    { id: '3', title: 'Withdrawal Successful', message: '₹5,000 has been credited to your bank account.', time: 'Yesterday', unread: false, icon: 'checkmark-circle', color: '#3B82F6' },
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInRight.duration(400).delay(index * 100)} layout={Layout.springify()}>
      <TouchableOpacity style={[styles.notificationCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.itemBg }]}>
          <Ionicons name={item.icon} size={22} color={item.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>{item.title}</Text>
            {item.unread && <View style={styles.unreadDot} />}
          </View>
          <Text style={[styles.message, { color: theme.textSecondary }]} numberOfLines={2}>{item.message}</Text>
          <Text style={[styles.time, { color: theme.textSecondary }]}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Notifications</Text>
          <TouchableOpacity onPress={clearAll}>
            <Text style={[styles.clearBtn, { color: theme.primary }]}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.card }]}>
                <Ionicons name="notifications-off-outline" size={48} color={theme.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Notifications</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>We'll notify you when something important happens.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  clearBtn: {
    fontSize: 13,
    fontWeight: '800',
  },
  list: {
    padding: 20,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    maxWidth: '90%',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 8,
  },
  time: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
