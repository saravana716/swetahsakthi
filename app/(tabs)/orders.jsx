import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function OrdersScreen() {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const o = t('orders') || {};
  const scale = 1; 
  const fs = (size) => Math.round((language === 'ta' ? size * 0.8 : size) * scale);

  const filters = [
    { id: 'all', label: o.all || 'all' },
    { id: 'buy', label: o.buy || 'Buy' },
    { id: 'sell', label: o.sell || 'Sell' },
    { id: 'sip', label: o.sip || 'SIP' },
    { id: 'failed', label: o.failed || 'failed' },
  ];

  const orderData = [
    {
      id: '1',
      type: 'buy',
      title: o.boughtGold || 'Bought Gold',
      date: 'Today, 10:23 AM',
      amount: '-₹2,500',
      weight: '0.45g',
      status: 'success',
      asset: 'gold'
    },
    {
      id: '2',
      type: 'sell',
      title: o.soldGold || 'Sold Gold',
      date: 'Yesterday, 4:15 PM',
      amount: '+₹12,400',
      weight: '2.00g',
      status: 'success',
      asset: 'gold'
    },
    {
      id: '3',
      type: 'sip',
      title: o.monthlySIP || 'Monthly SIP',
      date: '28 Jan 2026',
      amount: '-₹5,000',
      weight: '0.81g',
      status: 'success',
      asset: 'gold'
    },
    {
      id: '4',
      type: 'buy',
      title: o.boughtSilver || 'Bought Silver',
      date: '25 Jan 2026',
      amount: '-₹1,200',
      weight: '15g',
      status: 'success',
      asset: 'silver'
    },
    {
      id: '5',
      type: 'bonus',
      title: o.referralBonus || 'Referral Bonus',
      date: '20 Jan 2026',
      amount: '+₹500',
      weight: '0.08g',
      status: 'success',
      asset: 'gold'
    },
    {
      id: '6',
      type: 'failed',
      title: o.paymentFailed || 'Payment Failed',
      date: '15 Jan 2026',
      amount: '+₹1,000',
      weight: '0.00g',
      status: 'failed',
      asset: 'gold'
    },
  ];

  const filteredOrders = orderData.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderOrderItem = ({ item }) => {
    const isFailed = item.status === 'failed';
    const isIncome = item.amount.startsWith('+');
    
    let amountColor = theme.textPrimary;
    if (isFailed) amountColor = '#EF4444';
    else if (isIncome) amountColor = '#22C55E';
    else if (item.type === 'buy' || item.type === 'sip') amountColor = theme.textPrimary;

    return (
      <View style={[styles.orderCard, { backgroundColor: theme.card }]}>
        <View style={[
          styles.iconContainer, 
          { backgroundColor: theme.isDarkMode ? theme.itemBg : (isFailed ? '#FEF2F2' : (isIncome ? '#F0FDF4' : '#F8FAFC')) }
        ]}>
          {isFailed ? (
            <Ionicons name="alert-circle-outline" size={fs(22)} color="#EF4444" />
          ) : (
            <Ionicons 
              name={isIncome ? "arrow-up-outline" : "arrow-down-outline"} 
              size={fs(20)} 
              color={theme.primary} 
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          )}
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={[styles.orderTitle, { fontSize: fs(15), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          <Text style={[styles.orderDate, { fontSize: fs(12), color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
            {item.date}
          </Text>
        </View>
        
        <View style={styles.orderValue}>
          <Text style={[styles.amountText, { color: amountColor, fontSize: fs(15) }]} numberOfLines={1}>
            {item.amount}
          </Text>
          <Text style={[styles.weightText, { fontSize: fs(11), color: theme.textSecondary }]} numberOfLines={1}>
            {item.weight}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {isSearching ? (
            <View style={[styles.searchBarContainer, { backgroundColor: theme.card }]}>
              <Ionicons name="search-outline" size={20} color={theme.textSecondary} style={styles.searchIconInside} />
              <TextInput
                style={[styles.searchInput, { fontSize: fs(16), color: theme.textPrimary }]}
                placeholder={o.searchPlaceholder || "Search orders..."}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                placeholderTextColor={theme.textSecondary}
              />
              <TouchableOpacity 
                onPress={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
                style={styles.closeSearchButton}
              >
                <Ionicons name="close-circle" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.headerTitle, { fontSize: fs(24), color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{o.title || 'Orders'}</Text>
              <TouchableOpacity 
                style={[styles.searchButton, { backgroundColor: theme.card }]}
                onPress={() => setIsSearching(true)}
              >
                <Ionicons name="search-outline" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Filters */}
        <View style={[styles.filtersWrapper, { backgroundColor: theme.background }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={[
                  styles.filterTab,
                  { backgroundColor: theme.card },
                  activeFilter === filter.id && { backgroundColor: theme.primary }
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { fontSize: fs(14), color: activeFilter === filter.id ? '#FFF' : theme.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Orders List */}
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { fontSize: fs(14) }]}>No orders found</Text>
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
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 15 : 10, // Explicit boost for Android
    paddingBottom: 15,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  searchIconInside: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1A1A1A',
    fontWeight: '600',
    paddingVertical: 8,
  },
  closeSearchButton: {
    padding: 4,
  },
  headerTitle: {
    fontWeight: '800',
    color: '#1A1A1A',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  filtersWrapper: {
    marginBottom: 10,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  filterText: {
    fontWeight: '600',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#FFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  failedIconBg: {
    backgroundColor: '#FEF2F2',
  },
  incomeIconBg: {
    backgroundColor: '#F3F4F6',
  },
  expenseIconBg: {
    backgroundColor: '#FFF8E7',
  },
  orderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  orderTitle: {
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  orderDate: {
    color: '#6B7280',
    fontWeight: '500',
  },
  orderValue: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontWeight: '800',
    marginBottom: 2,
  },
  weightText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontWeight: '500',
  }
});
