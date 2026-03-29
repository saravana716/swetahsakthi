import { 
  getAugmontBuyList, 
  getAugmontSellList, 
  getBuyTransactionDetail, 
  getSellTransactionDetail 
} from '../../services/augmontApi';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ActivityIndicator, 
  FlatList, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Modal,
  Dimensions
} from 'react-native';
import Animated, { FadeInRight, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import ShimmerPlaceholder from '../../components/ShimmerPlaceholder';

const { width, height } = Dimensions.get('window');

export default function OrdersScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user, userProfile } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Detail Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
      if (user && uniqueId) {
        try {
          setLoading(true);
          const token = await user.getIdToken();
          
          // Fetch both Buy and Sell lists in parallel
          const [buyRes, sellRes] = await Promise.all([
            getAugmontBuyList(uniqueId, token),
            getAugmontSellList(uniqueId, token)
          ]);

          const buyOrders = (buyRes?.result?.data || []).map(item => ({
            id: item.transactionId,
            merchantTransactionId: item.merchantTransactionId,
            type: 'buy',
            title: `Bought ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`,
            date: new Date(item.createdAt).toLocaleDateString('en-IN', { 
              day: '2-digit', month: 'short', year: 'numeric', 
              hour: '2-digit', minute: '2-digit' 
            }),
            rawDate: new Date(item.createdAt),
            amount: `-₹${parseFloat(item.inclTaxAmt).toLocaleString('en-IN')}`,
            weight: `${parseFloat(item.qty).toFixed(4)} gm`,
            status: 'success',
            asset: item.type
          }));

          const sellOrders = (sellRes?.result?.data || []).map(item => ({
            id: item.transactionId,
            merchantTransactionId: item.merchantTransactionId,
            type: 'sell',
            title: `Sold ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`,
            date: new Date(item.createdAt).toLocaleDateString('en-IN', { 
              day: '2-digit', month: 'short', year: 'numeric', 
              hour: '2-digit', minute: '2-digit' 
            }),
            rawDate: new Date(item.createdAt),
            amount: `+₹${parseFloat(item.amount).toLocaleString('en-IN')}`,
            weight: `${parseFloat(item.qty).toFixed(4)} gm`,
            status: 'success',
            asset: item.type
          }));

          // Merge and sort by date (newest first)
          const merged = [...buyOrders, ...sellOrders].sort((a, b) => b.rawDate - a.rawDate);
          setOrders(merged);
        } catch (error) {
          console.error("Failed to fetch Augmont orders:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, userProfile]);

  const handleOrderPress = async (order) => {
    if (!order.merchantTransactionId) return;
    
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
      const token = await user.getIdToken();
      let res;
      if (order.type === 'buy') {
        res = await getBuyTransactionDetail(order.merchantTransactionId, uniqueId, token);
      } else {
        res = await getSellTransactionDetail(order.merchantTransactionId, uniqueId, token);
      }
      
      if (res?.result?.data) {
        setSelectedOrderDetail({
          ...res.result.data,
          _orderType: order.type,
          _displayTitle: order.title,
          _displayDate: order.date
        });
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      Toast.show({ type: 'error', text1: 'Failed to load details' });
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'buy', label: 'Buy' },
    { id: 'sell', label: 'Sell' },
    { id: 'sip', label: 'SIP' },
    { id: 'failed', label: 'Failed' },
  ];

  const filteredOrders = orders.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderOrderItem = ({ item, index }) => {
    const isFailed = item.status === 'failed';
    const isIncome = item.amount.startsWith('+');
    
    return (
      <Animated.View entering={FadeInRight.duration(400).delay(index * 80)}>
        <TouchableOpacity 
          style={[styles.orderCard, { backgroundColor: theme.card }]}
          onPress={() => handleOrderPress(item)}
        >
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
        </TouchableOpacity>
      </Animated.View>
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
        {loading ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.loaderContainer}>
            <View style={{ width: '100%', paddingHorizontal: 20, gap: 12 }}>
              {[1,2,3,4,5].map(i => (
                <ShimmerPlaceholder key={i} width={'100%'} height={80} borderRadius={24} isDarkMode={isDarkMode} />
              ))}
            </View>
          </Animated.View>
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyView}>
                <Ionicons name="receipt-outline" size={48} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No transactions found</Text>
              </View>
            }
          />
        )}

        {/* Dynamic Detail Modal */}
        <Modal
          visible={showDetailModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
            <TouchableOpacity 
              activeOpacity={1} 
              style={styles.modalDismiss} 
              onPress={() => setShowDetailModal(false)} 
            />
            
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <View style={styles.modalHandle} />
              
              {detailLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching Details...</Text>
                </View>
              ) : selectedOrderDetail ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <View style={[styles.assetIcon, { backgroundColor: theme.itemBg }]}>
                      <Ionicons 
                        name={selectedOrderDetail._orderType === 'buy' ? "arrow-down" : "arrow-up"} 
                        size={32} 
                        color={theme.primary} 
                      />
                    </View>
                    <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                      {selectedOrderDetail._orderType === 'buy' ? 'PURCHASE SUMMARY' : 'LIQUIDATION SUMMARY'}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <Text style={styles.statusText}>COMPLETED</Text>
                    </View>
                  </View>

                  <View style={[styles.mainAmountCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
                      {selectedOrderDetail._orderType === 'buy' ? 'Total Amount Paid' : 'Total Payout Value'}
                    </Text>
                    <Text style={[styles.mainAmountValue, { color: theme.textPrimary }]}>
                      ₹{parseFloat(selectedOrderDetail.totalAmount || selectedOrderDetail.amount || 0).toLocaleString('en-IN')}
                    </Text>
                    <View style={styles.amountBadgeRow}>
                      <View style={[styles.weightBadge, { backgroundColor: theme.itemBg }]}>
                        <Text style={[styles.weightBadgeText, { color: theme.textPrimary }]}>{selectedOrderDetail.quantity} gm</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TRANSACTION DETAILS</Text>
                    
                    {selectedOrderDetail._orderType === 'buy' ? (
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Invoice Number</Text>
                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedOrderDetail.invoiceNumber || 'N/A'}</Text>
                      </View>
                    ) : (
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Ref Transaction ID</Text>
                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedOrderDetail.merchantTransactionId || 'N/A'}</Text>
                      </View>
                    )}
                    
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Market Rate (per gm)</Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary }]}>₹{parseFloat(selectedOrderDetail.rate || 0).toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Transaction Date</Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedOrderDetail._displayDate}</Text>
                    </View>
                  </View>

                  {/* Sell Specific: Bank Info */}
                  {selectedOrderDetail._orderType === 'sell' && selectedOrderDetail.bankInfo && (
                    <View style={styles.detailSection}>
                      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PAYOUT DESTINATION</Text>
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Bank Name</Text>
                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedOrderDetail.bankInfo.bankName || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Account Number</Text>
                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedOrderDetail.bankInfo.accountNumber || 'N/A'}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                      {selectedOrderDetail._orderType === 'buy' ? 'TAX BREAKDOWN' : 'PRICING BREAKDOWN'}
                    </Text>
                    
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                        {selectedOrderDetail._orderType === 'buy' ? 'Taxable Amount' : 'Metal Value'}
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary }]}>₹{parseFloat(selectedOrderDetail.preTaxAmount || 0).toLocaleString('en-IN')}</Text>
                    </View>

                    {selectedOrderDetail._orderType === 'buy' && selectedOrderDetail.taxes?.taxSplit?.map((tax, idx) => (
                      <View key={idx} style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{tax.type} ({tax.taxPerc}%)</Text>
                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>₹{parseFloat(tax.taxAmount).toFixed(2)}</Text>
                      </View>
                    ))}

                    {selectedOrderDetail._orderType === 'buy' && (
                      <View style={[styles.totalTaxRow, { borderTopColor: theme.border }]}>
                        <Text style={[styles.totalTaxLabel, { color: theme.textPrimary }]}>Total GST</Text>
                        <Text style={[styles.totalTaxValue, { color: theme.textPrimary }]}>₹{parseFloat(selectedOrderDetail.taxes?.totalTaxAmount || 0).toFixed(2)}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>UPDATED VAULT BALANCES</Text>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Gold Balance</Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                        {(selectedOrderDetail.goldBalance || selectedOrderDetail.goldBalanceInGM || 0)} gm
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Silver Balance</Text>
                      <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                        {(selectedOrderDetail.silverBalance || selectedOrderDetail.silverBalanceInGM || 0)} gm
                      </Text>
                    </View>
                  </View>

                  {selectedOrderDetail && (
                    <TouchableOpacity 
                      style={styles.downloadBtn}
                      onPress={() => {
                        setShowDetailModal(false);
                        router.push({
                          pathname: '/invoice',
                          params: { 
                            transactionId: selectedOrderDetail.transactionId,
                            type: selectedOrderDetail._orderType 
                          }
                        });
                      }}
                    >
                      <LinearGradient
                        colors={[theme.primary, '#B45309']}
                        style={styles.downloadBtnGrad}
                        start={{x:0, y:0}} end={{x:1, y:1}}
                      >
                        <Ionicons name="document-text-outline" size={20} color="#FFF" style={{marginRight: 8}} />
                        <Text style={styles.downloadBtnText}>VIEW & DOWNLOAD INVOICE</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              ) : null}
            </View>
          </View>
        </Modal>
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
    marginTop: 12,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 24,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalLoading: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontWeight: '600',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  assetIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 6,
    letterSpacing: 1,
  },
  mainAmountCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainAmountValue: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
  },
  weightBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  weightBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  detailSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  totalTaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 4,
    borderTopWidth: 1,
  },
  totalTaxLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  totalTaxValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  downloadBtn: {
    borderRadius: 20,
    height: 60,
    overflow: 'hidden',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  downloadBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

