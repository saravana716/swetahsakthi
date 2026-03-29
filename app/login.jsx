import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLanguage } from './context/LanguageContext';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { auth } from '../firebaseConfig';
import CustomRecaptchaVerifier from '../components/CustomRecaptchaVerifier';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';


export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { loginWithPhone, setIsMpinVerified } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isLoadingSkip, setIsLoadingSkip] = useState(false);
  const [timer, setTimer] = useState(0);
  const recaptchaVerifier = useRef(null);
  const otpInputRef = useRef(null);

  // Countdown timer effect
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-focus OTP input when switched to OTP step
  useEffect(() => {
    if (confirmationResult && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 500); // Small delay to ensure the UI has transitioned
    }
  }, [confirmationResult]);

  // Auto-verify when OTP reaches 6 digits
  useEffect(() => {
    if (otp.length === 6 && confirmationResult) {
      handleVerifyOtp();
    }
  }, [otp]);

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid 10-digit mobile number.',
      });
      return;
    }

    setIsLoadingOtp(true);
    try {
      const formattedPhone = `+91${phoneNumber}`;
      const confirmation = await loginWithPhone(formattedPhone, recaptchaVerifier.current);
      console.log("OTP Sent Successfully, confirmation result received");
      setConfirmationResult(confirmation);
      setIsLoadingOtp(false);
      setTimer(60); // Start 60s countdown
      
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: `Verification code sent to +91 ${phoneNumber}`,
      });
    } catch (err) {
      console.error("Error sending OTP:", err);
      setIsLoadingOtp(false);
      Toast.show({
        type: 'error',
        text1: 'Failed to Send OTP',
        text2: err.message || 'Something went wrong. Please try again.',
      });
    }
  };

  const handleVerifyOtp = async () => {
    if (isLoadingOtp) return;
    if (otp.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter the 6-digit code.',
      });
      return;
    }

    setIsLoadingOtp(true);
    try {
      await confirmationResult.confirm(otp);
      setIsMpinVerified(true); // Single-session bypass: They don't need MPIN if they just used SMS OTP
      // DO NOT set isLoadingOtp(false) here, keep the button disabled while redirecting
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged in successfully!',
      });
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setIsLoadingOtp(false);
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'The verification code you entered is incorrect.',
      });
    }
  };

  const handleSkip = () => {
    setIsLoadingSkip(true);
    setTimeout(() => {
      setIsLoadingSkip(false);
      router.push('/create-vault');
    }, 1000);
  };

  const onOtpChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 6) {
      if (cleaned.length > otp.length) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setOtp(cleaned);
    }
  };

  const isPhoneValid = phoneNumber.length >= 10;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header - Simple Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* Logo Section - Golden Arrowhead in White Circle */}
          <View style={styles.logoSection}>
            <View style={styles.logoBox}>
              {!confirmationResult ? (
                <View style={styles.arrowheadContainer}>
                  {/* 3D-Style Golden Arrowhead */}
                  <LinearGradient
                    colors={['#FFF2AE', '#DFAD30', '#B58529']}
                    style={styles.arrowheadLeft}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <LinearGradient
                    colors={['#DFAD30', '#855E1A']}
                    style={styles.arrowheadRight}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                </View>
              ) : (
                <View style={styles.doubleCardsContainer}>
                  {/* Double Gold Cards Logo */}
                  <LinearGradient
                    colors={['#ECCB77', '#C69320']}
                    style={[styles.goldCard, styles.goldCardBack]}
                  />
                  <LinearGradient
                    colors={['#ECCB77', '#C69320']}
                    style={[styles.goldCard, styles.goldCardFront]}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Titles - Balanced & Centered */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {confirmationResult 
                ? "Verify OTP" 
                : "Welcome to Swarna\nSakhi"}
            </Text>
            <Text style={styles.subtitle}>
              {confirmationResult 
                ? `Enter the 6-digit code sent to +91 ${phoneNumber}` 
                : "Enter your mobile number to continue"}
            </Text>
          </View>

          <CustomRecaptchaVerifier
            ref={recaptchaVerifier}
            firebaseConfig={{...auth.app.options}}
          />

          {/* Input Section - Pill-shaped */}
          {!confirmationResult ? (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.flagEmoji}>🇮🇳</Text>
                  <Text style={styles.countryCode}>+91</Text>
                </View>
                
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
              <Text style={styles.helperTextCenter}>We'll send a 6-digit verification code via SMS</Text>
            </View>
          ) : (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>ENTER 6-DIGIT OTP</Text>
              
              <TouchableOpacity 
                activeOpacity={1}
                onPress={() => {
                  otpInputRef.current?.blur();
                  setTimeout(() => otpInputRef.current?.focus(), 50);
                }}
                style={styles.otpContainer}
              >
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.otpBox, 
                      { borderColor: otp.length === index ? '#D4AF37' : '#E5E7EB' },
                      otp.length > index && { borderColor: '#D4AF37' }
                    ]}
                  >
                    <Text style={styles.otpText}>
                      {otp[index] || ""}
                    </Text>
                  </View>
                ))}
              </TouchableOpacity>

              <TextInput
                ref={otpInputRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={onOtpChange}
              />

              {/* Timer & Resend */}
              <View style={styles.timerContainer}>
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Resend code in <Text style={{ color: '#D4AF37', fontWeight: '800' }}>{timer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setConfirmationResult(null)} style={{ marginTop: 18 }}>
                  <Text style={styles.linkTextSimple}>Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Buttons Section - Thick & Pill-shaped */}
          <View style={styles.buttonsSection}>
            <TouchableOpacity 
              activeOpacity={0.8}
              disabled={(!confirmationResult && !isPhoneValid) || (confirmationResult && otp.length < 6) || isLoadingOtp}
              style={[
                styles.primaryButton,
                ((!confirmationResult && !isPhoneValid) || (confirmationResult && otp.length < 6)) && { backgroundColor: '#E5E7EB' }
              ]}
              onPress={confirmationResult ? handleVerifyOtp : handleSendOtp}
            >
              {isLoadingOtp ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[
                  styles.primaryButtonText,
                  ((!confirmationResult && !isPhoneValid) || (confirmationResult && otp.length < 6)) && { color: '#9CA3AF' }
                ]}>
                  {confirmationResult ? "VERIFY OTP" : "SEND OTP"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleSkip}
              disabled={isLoadingSkip || isLoadingOtp}
            >
              {isLoadingSkip ? (
                <ActivityIndicator color="#6B7280" />
              ) : (
                <Text style={styles.secondaryButtonText}>Skip Verification (Dev Mode)</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer - Consistent Branding */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText}>Terms</Text>
            {' '}and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </View>
        <View id="recaptcha-container" />
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 36, // Wider padding for airy feel
    alignItems: 'center',
  },
  logoSection: {
    marginTop: 15,
    marginBottom: 35,
    alignItems: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  arrowheadContainer: {
    width: 46,
    height: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    transform: [{ translateY: -2 }],
  },
  arrowheadLeft: {
    width: 22,
    height: 42,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 6,
    transform: [{ skewY: '-30deg' }, { translateX: 2 }],
    zIndex: 2,
  },
  arrowheadRight: {
    width: 22,
    height: 42,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 6,
    transform: [{ skewY: '30deg' }, { translateX: -2 }],
    zIndex: 1,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 45,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  inputSection: {
    width: '100%',
    marginBottom: 38,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 30, // Full pill shape
    paddingHorizontal: 22,
    height: 60, // Taller input as in image
    marginBottom: 20,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  flagEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 1.5,
  },
  helperTextCenter: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonsSection: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#D4AF37', // Brand gold color
    borderRadius: 30, // Pill shaped
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    padding: 30,
    paddingBottom: Platform.OS === 'android' ? 32 : 45,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  linkText: {
    color: '#D4AF37', // Vibrant Gold for Terms
    fontWeight: '700',
  },
  linkTextSimple: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  doubleCardsContainer: {
    width: 48,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  goldCard: {
    width: 24,
    height: 32,
    borderRadius: 4,
    position: 'absolute',
  },
  goldCardBack: {
    transform: [{ rotate: '-15deg' }, { translateX: -6 }],
    opacity: 0.9,
  },
  goldCardFront: {
    transform: [{ rotate: '15deg' }, { translateX: 6 }],
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 18,
  },
  otpBox: {
    width: 44,
    height: 58,
    borderWidth: 1.5,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  otpText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
    textDecorationLine: 'underline',
  },
});

