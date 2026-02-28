import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLanguage } from './context/LanguageContext';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [isLoadingSkip, setIsLoadingSkip] = useState(false);

  const handleSendOtp = () => {
    setIsLoadingOtp(true);
    setTimeout(() => {
      setIsLoadingOtp(false);
      console.log("SEND OTP PRESSED FOR:", phoneNumber);
      // Move to next step here
    }, 1500);
  };

  const handleSkip = () => {
    setIsLoadingSkip(true);
    setTimeout(() => {
      setIsLoadingSkip(false);
      router.push('/create-vault');
    }, 1000);
  };

  const isPhoneValid = phoneNumber.length >= 10;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header - Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.card }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoOuterGlow}>
              <View style={styles.logoBox}>
                <View style={styles.arrowBase}>
                  <LinearGradient
                    colors={['#FFF2AE', '#DFAD30', '#B58529']}
                    style={styles.arrowTriangle}
                    start={{ x: 0.2, y: 0.2 }}
                    end={{ x: 0.8, y: 0.8 }}
                  />
                  <View style={styles.arrowCutout} />
                </View>
              </View>
            </View>
          </View>

          {/* Titles */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('login')?.title?.split(' ').slice(0, 2).join(' ') + '\n' + t('login')?.title?.split(' ').slice(2).join(' ') || "Welcome to Swarna\nSakhi"}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('login')?.subtitle || "Enter your mobile number to continue"}</Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('login')?.mobilePlaceholder?.toUpperCase() || "MOBILE NUMBER"}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Flag & Code */}
              <View style={[styles.countryCodeContainer, { borderRightColor: theme.border }]}>
                <Text style={styles.flagEmoji}>🇮🇳</Text>
                <Text style={[styles.countryCode, { color: theme.textPrimary }]}>+91</Text>
              </View>
              
              {/* Input */}
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="98765 43210"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>
            <Text style={[styles.helperText, { color: theme.textSecondary }]}>
              We'll send a 6-digit verification code via SMS
            </Text>
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonsSection}>
            <TouchableOpacity 
              activeOpacity={0.8}
              disabled={!isPhoneValid || isLoadingOtp || isLoadingSkip}
              style={[
                styles.primaryButtonWrapper,
                (!isPhoneValid || isLoadingSkip) && { opacity: 0.5 }
              ]}
              onPress={handleSendOtp}
            >
              {isPhoneValid && !isLoadingSkip ? (
                <LinearGradient
                  colors={['#D19E2B', '#B7821B']}
                  style={styles.primaryButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoadingOtp ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryButtonTextActive}>{t('login')?.sendBtn || "SEND OTP"}</Text>
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.primaryButton, { backgroundColor: theme.isDarkMode ? '#1E293B' : '#EBEBEB' }]}>
                  {isLoadingOtp ? (
                    <ActivityIndicator color={theme.textSecondary} />
                  ) : (
                    <Text style={[styles.primaryButtonTextDisabled, { color: theme.textSecondary }]}>{t('login')?.sendBtn || "SEND OTP"}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryButton, { backgroundColor: theme.isDarkMode ? theme.itemBg : '#F9FAFB' }]}
              onPress={handleSkip}
              disabled={isLoadingSkip || isLoadingOtp}
            >
              {isLoadingSkip ? (
                <ActivityIndicator color={theme.textSecondary} />
              ) : (
                <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>{t('login')?.skipVerif || "Skip Verification"} (Dev Mode)</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            By continuing, you agree to our{' '}
            <Text style={[styles.linkText, { color: theme.primary }]}>Terms</Text>
            {' '}and{' '}
            <Text style={[styles.linkText, { color: theme.primary }]}>Privacy Policy</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Slight off-white background based on reference
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  logoSection: {
    marginTop: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  logoOuterGlow: {
    padding: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
    borderRadius: 50,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 40, 
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  arrowBase: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: 4 }],
  },
  arrowTriangle: {
    width: 42,
    height: 42,
    transform: [{ rotate: '45deg' }, { translateY: -4 }],
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  arrowCutout: {
    position: 'absolute',
    bottom: -15,
    width: 60,
    height: 30,
    backgroundColor: '#FFFFFF',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  inputSection: {
    width: '100%',
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Lighter grey background for input
    borderRadius: 20, // High border radius like full pill
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 12,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 2, // Space out the numbers slightly
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  buttonsSection: {
    width: '100%',
  },
  primaryButtonWrapper: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 30, // Pill shaped button
    shadowColor: '#D19E2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Shadow only applies roughly on view wrapper
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  primaryButtonTextActive: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  primaryButtonTextDisabled: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'android' ? 32 : 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#D4AF37', // Gold links
    fontWeight: '600',
  },
});
