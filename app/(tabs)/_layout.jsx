import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useLanguage } from '@/app/context/LanguageContext';
import { useTheme } from '@/app/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

// A custom bottom tab bar that implements the floating center button layout
function CustomTabBar({ state, descriptors, navigation }) {
  const { theme } = useTheme();
  const { themeColor } = useTheme(); // Keeping themeColor if needed for specific logic, but preferring theme object
  const { language, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const scale = 1; 
  const fs = (size) => Math.round((language === 'ta' ? size * 0.8 : size) * scale);

  return (
    <>
      {/* Scanner Options Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <LinearGradient
            colors={theme.isDarkMode ? ['rgba(15, 23, 42, 0.98)', 'rgba(30, 41, 59, 0.95)'] : ['rgba(255, 255, 255, 0.99)', 'rgba(248, 250, 252, 0.95)']}
            style={StyleSheet.absoluteFill}
          />
          <Pressable style={[styles.modalCloseBtn, { backgroundColor: theme.card }]} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </Pressable>
          <View style={styles.modalGrid}>
            {[
              { id: 'scan', title: t('scanner')?.scanPay || 'Scan & Pay', sub: 'QR Payments', icon: 'scan-outline' },
              { id: 'buy', title: t('scanner')?.buySell || 'Buy & Sell', sub: 'Live Rates', icon: 'trending-up-outline' },
              { id: 'save', title: t('scanner')?.autoSave || 'Auto Save', sub: 'Setup SIP', icon: 'gift-outline' },
              { id: 'redeem', title: t('scanner')?.redeem || 'Redeem', sub: 'Physical Gold', icon: 'phone-portrait-outline' },
            ].map((item) => (
              <TouchableOpacity key={item.id} style={[styles.modalCard, { backgroundColor: theme.card }]} onPress={() => setModalVisible(false)}>
                <View style={[styles.modalIconContainer, { backgroundColor: theme.isDarkMode ? '#334155' : '#F8FAFC' }]}>
                  <Ionicons name={item.icon} size={28} color={theme.primary} />
                </View>
                <Text style={[styles.modalCardTitle, { color: theme.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{item.title}</Text>
                <Text style={[styles.modalCardSub, { color: theme.textSecondary }]}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <View style={[styles.tabBarContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        let label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        // Apply translations based on route name
        if (route.name === 'index') label = t('tabs')?.home || label;
        if (route.name === 'portfolio') label = t('tabs')?.portfolio || label;
        if (route.name === 'orders') label = t('tabs')?.orders || label;
        if (route.name === 'account') label = t('tabs')?.account || label;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Determine which icon to show
        let iconName = '';
        if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
        else if (route.name === 'portfolio') iconName = isFocused ? 'pie-chart' : 'pie-chart-outline';
        else if (route.name === 'orders') iconName = isFocused ? 'bag-handle' : 'bag-handle-outline';
        else if (route.name === 'account') iconName = isFocused ? 'person' : 'person-outline';

        // The center scanner acts as a modal or a special action route.
        const isCenterButton = route.name === 'scanner';

        if (isCenterButton) {
          return (
            <TouchableOpacity 
              key={route.key}
              onPress={() => setModalVisible(true)}
              style={styles.centerButtonWrapper}
              activeOpacity={0.8}
            >
              <View style={[styles.centerButtonGlow, { backgroundColor: theme.isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }]}>
                <View style={[styles.centerButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
                  <Ionicons name="scan-outline" size={28} color="#FFF" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <Ionicons name={iconName} size={22} color={isFocused ? theme.primary : theme.textSecondary} style={{ marginBottom: 4 }} />
              <Text 
                style={{ 
                  color: isFocused ? theme.primary : theme.textSecondary, 
                  fontSize: fs(11),
                  fontWeight: isFocused ? '700' : '500',
                  textAlign: 'center',
                  lineHeight: fs(14),
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Your Portfolio',
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scan',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 76, 
    backgroundColor: '#FFFFFF',
    borderRadius: 38,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 64,
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -15 }], // Adjusted lift for the floating pill
  },
  centerButtonGlow: {
    padding: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 40,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCard: {
    width: '47%',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F8FAFC', // very light gray blue
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalCardSub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
