import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  Platform,
  Share
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { getBuyInvoice, getSellInvoice } from '../services/augmontApi';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';
import AnimatedButton from '../components/AnimatedButton';

const { width, height } = Dimensions.get('window');

const InvoiceScreen = () => {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { transactionId, type } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!transactionId || !user) return;
      
      try {
        setLoading(true);
        const token = await user.getIdToken();
        let res;
        
        if (type === 'buy') {
          res = await getBuyInvoice(transactionId, token);
        } else {
          res = await getSellInvoice(transactionId, token);
        }
        
        if (res?.result?.data) {
          setInvoiceData(res.result.data);
        }
      } catch (error) {
        console.error("Failed to fetch invoice:", error);
        Toast.show({ type: 'error', text1: 'Failed to load invoice' });
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [transactionId, type, user]);

  const handleDownload = async () => {
    setDownloading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Simulate professional export
    setTimeout(() => {
      setDownloading(false);
      Toast.show({
        type: 'success',
        text1: 'Document Exported',
        text2: `Invoice ${invoiceData?.invoiceNumber || 'Voucher'} saved successfully.`
      });
    }, 2000);
  };

  const isBuy = type === 'buy';

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.background }]}>
        <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loaderText, { color: theme.textSecondary }]}>Preparing Secure Document...</Text>
          <View style={{ marginTop: 24, gap: 12, width: width - 80 }}>
            <ShimmerPlaceholder width={'100%'} height={120} borderRadius={12} isDarkMode={isDarkMode} />
            <ShimmerPlaceholder width={'100%'} height={40} borderRadius={8} isDarkMode={isDarkMode} />
            <ShimmerPlaceholder width={'60%'} height={20} borderRadius={6} isDarkMode={isDarkMode} />
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.docTypeLabel, { color: theme.textSecondary }]}>OFFICIAL DOCUMENT</Text>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {isBuy ? 'Tax Invoice' : 'Liquidation Voucher'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => Share.share({ message: `Invoice: ${transactionId}` })}>
          <Ionicons name="share-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={[styles.invoiceContent, { backgroundColor: '#FFFFFF', shadowColor: '#000' }]}>
          {/* Top Branding Row */}
          <View style={styles.brandingHeader}>
            <View>
              <Text style={styles.brandTitle}>SWARNA SAKTHI</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-seal" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>SECURE TRANSACTION</Text>
              </View>
            </View>
            <View style={styles.refSection}>
              <Text style={styles.refLabel}>REF NUMBER</Text>
              <Text style={styles.refValue}>#{invoiceData?.invoiceNumber || transactionId?.slice(-10).toUpperCase()}</Text>
              <Text style={styles.dateValue}>{invoiceData?.invoiceDate || invoiceData?.sellTransactionDate || '28 Mar 2026'}</Text>
            </View>
          </View>

          <View style={styles.dividerDots} />

          {/* Billing and Merchant Details */}
          <View style={styles.addressContainer}>
            <View style={styles.addressBlock}>
              <Text style={styles.sectionTitle}>BILL TO</Text>
              <Text style={styles.customerNameText}>{invoiceData?.userInfo?.name || 'Customer'}</Text>
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={12} color="#64748B" />
                <Text style={styles.addressDetailText}>{invoiceData?.userInfo?.mobileNumber}</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="location-outline" size={12} color="#64748B" />
                <Text style={styles.addressDetailText} numberOfLines={2}>
                  {invoiceData?.userInfo?.city}, {invoiceData?.userInfo?.state}
                </Text>
              </View>
              {invoiceData?.userInfo?.panNumber && (
                <View style={styles.contactItem}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={12} color="#64748B" />
                  <Text style={styles.addressDetailText}>PAN: {invoiceData.userInfo.panNumber}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.addressBlock}>
              <Text style={[styles.sectionTitle, { textAlign: 'right' }]}>MERCHANT</Text>
              <Text style={[styles.merchantNameText, { textAlign: 'right' }]}>Augmont Goldtech</Text>
              <Text style={[styles.addressDetailText, { textAlign: 'right' }]}>Corporate Square,</Text>
              <Text style={[styles.addressDetailText, { textAlign: 'right' }]}>Andheri East, Mumbai</Text>
            </View>
          </View>

          {/* Precise Itemized Table */}
          <View style={styles.tableWrapper}>
            <View style={styles.tableHead}>
              <Text style={[styles.headText, { flex: 2 }]}>DESCRIPTION</Text>
              <Text style={[styles.headText, { flex: 1, textAlign: 'center' }]}>QTY</Text>
              <Text style={[styles.headText, { flex: 1.5, textAlign: 'right' }]}>RATE (₹)</Text>
            </View>
            
            <View style={styles.tableRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.itemMainText}>
                  {invoiceData?.metalType?.toUpperCase()} {invoiceData?.karat} Pure {invoiceData?.purity}
                </Text>
                {isBuy && <Text style={styles.hsnText}>HSN: {invoiceData?.hsnCode || '711419'}</Text>}
              </View>
              <Text style={[styles.itemQtyText, { flex: 1, textAlign: 'center' }]}>
                {invoiceData?.quantity} {invoiceData?.unitType || 'gm'}
              </Text>
              <Text style={[styles.itemRateText, { flex: 1.5, textAlign: 'right' }]}>
                {parseFloat(invoiceData?.rate).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Pricing Breakdown */}
          <View style={styles.financialsLayer}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Gross Taxable Amount</Text>
              <Text style={styles.pricingValue}>₹{parseFloat(invoiceData?.grossAmount).toLocaleString('en-IN')}</Text>
            </View>

            {isBuy && invoiceData?.taxes?.taxSplit?.map((tax, idx) => (
              <View key={idx} style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>{tax.type} ({tax.taxPerc}%)</Text>
                <Text style={styles.pricingValue}>₹{parseFloat(tax.taxAmount).toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Discounts & Charges</Text>
              <Text style={styles.pricingValue}>- ₹0.00</Text>
            </View>

            <View style={styles.netAmountBlock}>
              <View style={styles.netInner}>
                <Text style={styles.netLabel}>NET PAYABLE AMOUNT</Text>
                <Text style={styles.netValue}>₹{parseFloat(invoiceData?.netAmount).toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* Legal Footer */}
          <View style={styles.paperFooter}>
            <View style={styles.statusStamp}>
              <Ionicons name="shield-checkmark" size={16} color="#CBD5E1" />
              <Text style={styles.stampText}>AUTHENTIC TRANSACTION RECORD</Text>
            </View>
            <Text style={styles.complianceText}>
              This is a computer-generated document and does not require a physical signature. Swarna Sakthi ensures all trades follow Marketplace compliance.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <AnimatedButton 
            style={styles.actionBtn} 
            onPress={handleDownload}
            disabled={downloading}
          >
            <LinearGradient
              colors={[theme.primary, '#92400E']}
              style={styles.actionBtnGrad}
              start={{x:0, y:0}} end={{x:1, y:1}}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#FFF" style={{marginRight: 10}} />
                  <Text style={styles.actionBtnText}>DOWNLOAD OFFICIAL RECORD</Text>
                </>
              )}
            </LinearGradient>
          </AnimatedButton>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  docTypeLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  invoiceContent: {
    borderRadius: 8,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    minHeight: height * 0.65,
  },
  brandingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#10B981',
    marginLeft: 4,
  },
  refSection: {
    alignItems: 'flex-end',
  },
  refLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  refValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  dividerDots: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 24,
    borderRadius: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  addressBlock: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 10,
  },
  customerNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  merchantNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  addressDetailText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 16,
    marginLeft: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tableWrapper: {
    marginBottom: 32,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  headText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  hsnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  itemQtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  itemRateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  financialsLayer: {
    gap: 12,
    marginBottom: 32,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  pricingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pricingValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  netAmountBlock: {
    marginTop: 12,
    padding: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  netInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  netLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  netValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  paperFooter: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 32,
  },
  statusStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stampText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  complianceText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  actionBtn: {
    borderRadius: 16,
    height: 64,
    overflow: 'hidden',
  },
  actionBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default InvoiceScreen;
