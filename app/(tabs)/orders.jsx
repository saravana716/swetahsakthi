import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function OrdersScreen() {
  const { theme, isDarkMode } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'buy', label: 'Buy' },
    { id: 'sell', label: 'Sell' },
    { id: 'sip', label: 'SIP' },
    { id: 'failed', label: 'Failed' },
  ];

  const orderData = [
    { id: '1', type: 'buy', title: 'Bought Gold', date: 'Today, 10:23 AM', amount: '-₹2,500.00', weight: '0.4500 gm', status: 'success', asset: 'gold' },
    { id: '2', type: 'sell', title: 'Sold Gold', date: 'Yesterday, 4:15 PM', amount: '+₹12,400.00', weight: '2.0000 gm', status: 'success', asset: 'gold' },
    { id: '3', type: 'sip', title: 'Monthly SIP', date: '28 Jan 2026', amount: '-₹5,000.00', weight: '0.8120 gm', status: 'success', asset: 'gold' },
    { id: '4', type: 'buy', title: 'Bought Silver', date: '25 Jan 2026', amount: '-₹1,200.00', weight: '15.0000 gm', status: 'success', asset: 'silver' },
    { id: '5', type: 'bonus', title: 'Referral Bonus', date: '20 Jan 2026', amount: '+₹500.00', weight: '0.0810 gm', status: 'success', asset: 'gold' },
    { id: '6', type: 'failed', title: 'Payment Failed', date: '15 Jan 2026', amount: '₹1,000.00', weight: '0.0000 gm', status: 'failed', asset: 'gold' },
  ];

  const filteredOrders = orderData.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderOrderItem = ({ item }) => {
    const isFailed = item.status === 'failed';
    const isIncome = item.amount.startsWith('+');
    
    return (
      <View style={[styles.orderCard, { backgroundColor: theme.card }]}>
        <View style={[
          styles.iconContainer, 
          isFailed ? { backgroundColor: isDarkMode ? '#450a0a' : '#FEF2F2' } : 
          (isIncome ? { backgroundColor: isDarkMode ? '#064e3b' : '#ECFDF5' } : { backgroundColor: theme.itemBg })
        ]}>
          <Ionicons 
            name={isFailed ? "alert-circle" : (isIncome ? "arrow-up" : "arrow-down")} 
            size={20} 
            color={isFailed ? "#EF4444" : (isIncome ? "#10B981" : theme.primary)} 
            style={!isFailed && { transform: [{ rotate: '45deg' }] }}
          />
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={[styles.orderTitle, { color: theme.textPrimary }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.orderDate, { color: theme.textSecondary }]}>{item.date}</Text>
        </View>
        
        <View style={styles.orderValue}>
          <Text style={[styles.amountText, { color: theme.textPrimary }, isFailed && { color: '#EF4444' }, isIncome && { color: '#10B981' }]}>
            {item.amount}
          </Text>
          <Text style={[styles.weightText, { color: theme.textSecondary }]}>{item.weight}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {isSearching ? (
            <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search transactions..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                placeholderTextColor={theme.textSecondary}
              />
              <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Orders</Text>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: theme.card }]} onPress={() => setIsSearching(true)}>
                <Ionicons name="search" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setActiveFilter(f.id)}
                style={[
                  styles.filterPill, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  activeFilter === f.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
              >
                <Text style={[
                  styles.filterLabel, 
                  { color: theme.textSecondary },
                  activeFilter === f.id && { color: '#FFFFFF' }
                ]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List */}
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No transactions found</Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  headerBtn: {
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
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  filtersWrapper: {
    marginBottom: 16,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderValue: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  weightText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyView: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
