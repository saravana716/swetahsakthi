import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Animated, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Vibration, StatusBar } from 'react-native';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast from 'react-native-toast-message';

// ------------------------------------------------------------------
// Responsive Scaling Utilities for 100% Device Adaptability
// ------------------------------------------------------------------
const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 750;
const baseWidth = 390; 
const scale = width / baseWidth;
// Clamp scale to prevent oversized UI on tablets
const clampScale = Math.min(scale, 1.2); 
const rs = (size) => Math.round(size * clampScale);

export default function VerifyMpinScreen() {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Biometric States
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState(0); // 1 = Fingerprint, 2 = FaceID, 3 = Iris
  
  const { verifyMpin, userProfile, logout, setIsMpinVerified } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize Native Hardware & UI
  useEffect(() => {
    // 1. Fade UI In smoothly
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 2. Check Device for Native Biometrics
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (compatible && enrolled) {
        setIsBiometricSupported(true);
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        // Prioritize FaceID if available, else standard TouchID
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
           setBiometricType(2);
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
           setBiometricType(1);
        } else {
           setBiometricType(1); // Fallback generic biometric
        }

        // Auto-prompt instantly to bypass manual typing!
        handleBiometricAuth();
      }
    })();
  }, []);

  // Native Biometric Trigger
  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock your portfolio',
        fallbackLabel: 'Use MPIN',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel'
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Toast and Delay
        Toast.show({ type: 'success', text1: 'Unlocked!', text2: 'Entering Dashboard...', position: 'top', visibilityTime: 2000 });
        setTimeout(() => setIsMpinVerified(true), 1200); 
      }
    } catch (e) {
      console.log('Biometric failed or cancelled:', e);
    }
  };

  // Trigger MPIN evaluation automatically when 4 digits are reached
  useEffect(() => {
    if (pin.length === 4) {
      handleManualVerify(pin);
    }
  }, [pin]);

  const handleManualVerify = (enteredPin) => {
    // Slight delay for premium UX pause
    setTimeout(() => {
      const isValid = verifyMpin(enteredPin);
      if (isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: 'success', text1: 'Unlocked!', text2: 'Entering Dashboard...', position: 'top', visibilityTime: 2000 });
        setTimeout(() => setIsMpinVerified(true), 1000); 
      } else {
        triggerError();
      }
    }, 150);
  };

  const triggerError = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (Platform.OS === 'android') Vibration.vibrate(100); 

    // Visual Shake
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true })
    ]).start();

    setPin(''); 
    setErrorMsg('Incorrect Passcode');
  };

  const handleKeyPress = (num) => {
    setErrorMsg('');
    if (pin.length < 4) {
      if (pin.length > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setErrorMsg('');
    if (pin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin(prev => prev.slice(0, -1));
    }
  };

  // Get dynamic icon based on hardware
  const getBiometricIcon = () => {
    if (biometricType === 2) return 'scan-outline'; // FaceID
    return 'finger-print'; // TouchID
  };

  // Theming definitions mapping to glassmorphism
  const gradientTheme = isDarkMode 
    ? ['#0F172A', '#1E293B', '#020617'] 
    : [theme.background, '#F8FAFC', '#E2E8F0'];

  const keypadGlassTheme = isDarkMode 
    ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.01)'] 
    : ['#FFFFFF', '#F8FAFC'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* 
        Premium Background: Dynamic Theme
        Uses Swarna Sakthi gold hints blended into the active theme.
      */}
      <LinearGradient
        colors={gradientTheme}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          
          {/* Header & Avatar Info */}
          <View style={styles.headerContainer}>
            <View style={styles.avatarGlassRing}>
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.4)', 'rgba(212, 175, 55, 0.05)']}
                style={styles.avatarCircle}
              >
                 <Text style={styles.avatarInitials}>
                   {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                 </Text>
              </LinearGradient>
            </View>
            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>Welcome Back</Text>
            <Text style={[styles.userName, { color: theme.textPrimary }]}>{userProfile?.displayName || 'User'}</Text>
          </View>

          {/* Secure PIN Indicators w/ Shake Animation */}
          <Animated.View style={[styles.pinDotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
            {[0, 1, 2, 3].map((index) => {
              const filled = pin.length > index;
              return (
                <View 
                  key={index} 
                  style={[
                    styles.pinDot,
                    filled ? styles.pinDotFilled : (isDarkMode ? styles.pinDotEmpty : styles.pinDotEmptyLight),
                    errorMsg ? styles.pinDotError : null
                  ]} 
                >
                  {/* Inner glow if filled */}
                  {filled && <View style={styles.pinDotInner} />}
                </View>
              );
            })}
          </Animated.View>

          {/* Minimal Error Messaging */}
          <View style={styles.errorContainer}>
            <Text style={styles.errorText} numberOfLines={1}>{errorMsg}</Text>
          </View>

          {/* Premium Glassmorphic Keypad */}
          <View style={styles.keypadContainer}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
            ].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map((num) => (
                  <TouchableOpacity 
                    key={num} 
                    style={styles.keypadBtn} 
                    activeOpacity={0.4}
                    onPress={() => handleKeyPress(num)}
                  >
                    <LinearGradient
                      colors={keypadGlassTheme}
                      style={[styles.keypadBtnGlass, !isDarkMode && styles.keypadBtnGlassLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={[styles.keypadNum, { color: theme.textPrimary }]}>{num}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            
            <View style={styles.keypadRow}>
              {/* Dynamic Biometric Anchor Button */}
              {isBiometricSupported ? (
                <TouchableOpacity 
                  style={[styles.keypadBtn]} 
                  activeOpacity={0.6}
                  onPress={handleBiometricAuth}
                >
                  <View style={[styles.keypadBtnGlass, styles.actionBtnGlass]}>
                    <Ionicons name={getBiometricIcon()} size={rs(32)} color="#D4AF37" />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={[styles.keypadBtn, { opacity: 0 }]} />
              )}
              
              <TouchableOpacity 
                style={styles.keypadBtn} 
                activeOpacity={0.4}
                onPress={() => handleKeyPress('0')}
              >
                <LinearGradient
                  colors={keypadGlassTheme}
                  style={[styles.keypadBtnGlass, !isDarkMode && styles.keypadBtnGlassLight]}
                >
                  <Text style={[styles.keypadNum, { color: theme.textPrimary }]}>0</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.keypadBtn} 
                activeOpacity={0.6}
                onPress={handleDelete}
              >
                <View style={[styles.keypadBtnGlass, styles.actionBtnGlass]}>
                  <Ionicons name="backspace-outline" size={rs(28)} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Secure Fallback */}
          <TouchableOpacity style={styles.forgotBtn} onPress={logout} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot Passcode?</Text>
          </TouchableOpacity>

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Fallback
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? rs(26) : rs(44),
    marginTop: isSmallScreen ? 0 : rs(20),
  },
  avatarGlassRing: {
    width: rs(80),
    height: rs(80),
    borderRadius: rs(40),
    padding: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.2)', // Thin gold border effect
    marginBottom: rs(20),
  },
  avatarCircle: {
    flex: 1,
    borderRadius: rs(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: rs(32),
    fontWeight: '800',
    color: '#FDE047',
    textShadowColor: 'rgba(212, 175, 55, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  welcomeText: {
    fontSize: rs(13),
    fontWeight: '500',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: rs(6),
  },
  userName: {
    fontSize: rs(26),
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: rs(24),
    marginBottom: rs(12),
  },
  pinDot: {
    width: rs(18),
    height: rs(18),
    borderRadius: rs(9),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDotEmpty: {
    borderColor: '#334155',
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
  },
  pinDotEmptyLight: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  pinDotFilled: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  pinDotInner: {
    width: rs(10),
    height: rs(10),
    borderRadius: rs(5),
    backgroundColor: '#FDE047',
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  pinDotError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorContainer: {
    height: rs(30),
    marginBottom: isSmallScreen ? rs(22) : rs(44),
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: rs(14),
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: rs(320),
    paddingHorizontal: rs(10),
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: isSmallScreen ? rs(18) : rs(24),
  },
  keypadBtn: {
    width: rs(76),
    height: rs(76),
    borderRadius: rs(38),
    overflow: 'hidden',
  },
  keypadBtnGlass: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: rs(38),
  },
  keypadBtnGlassLight: {
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  actionBtnGlass: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keypadNum: {
    fontSize: rs(30),
    fontWeight: '400',
    color: '#F8FAFC',
  },
  forgotBtn: {
    marginTop: isSmallScreen ? rs(30) : rs(45),
    padding: rs(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotText: {
    color: '#94A3B8',
    fontSize: rs(14),
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
