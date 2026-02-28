import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLanguage } from './context/LanguageContext';
import { useTheme } from './context/ThemeContext';

export default function ReferralScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [referralCode, setReferralCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const isValid = referralCode.trim().length > 2;

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleSkip = () => {
    setIsSkipping(true);
    setTimeout(() => {
      setIsSkipping(false);
      router.replace('/(tabs)');
    }, 800);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Header Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconGlow, { backgroundColor: theme.isDarkMode ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.1)' }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.primary }]}>
                <Ionicons name="gift-outline" size={28} color="#FFF" />
              </View>
            </View>
          </View>

          {/* Titles */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('referral')?.haveCode || "Got a Referral Code?"}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t('referral')?.subtitle || "If someone referred you, enter their code below.\nThey'll earn rewards on your purchases!"}
            </Text>
          </View>

          {/* Input Area */}
          <View style={styles.inputSection}>
            <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="gift-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder={t('referral')?.inputPlaceholder?.toUpperCase() || "ENTER REFERRAL CODE (E.G. VYV)"}
                placeholderTextColor={theme.textSecondary}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.isDarkMode ? '#1E293B' : '#F9FAFB' }]}>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              <Text style={styles.bulb}>💡 </Text>
              <Text style={[styles.infoBold, { color: theme.textPrimary }]}>How it works:</Text> Your referrer will receive <Text style={[styles.infoBold, { color: theme.textPrimary }]}>1%</Text> of every gold purchase you make, as a reward forever. Only one referrer per account.
            </Text>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />
        </View>

        {/* Footer Area */}
        <View style={styles.footer}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[
              styles.primaryButton, 
              { backgroundColor: theme.primary },
              !isValid && { backgroundColor: theme.isDarkMode ? '#1E293B' : '#EBEBEB' }
            ]}
            onPress={handleApply}
            disabled={!isValid || isApplying || isSkipping}
          >
            {isApplying ? (
              <ActivityIndicator color={isValid ? "#FFF" : theme.textSecondary} />
            ) : (
              <Text style={[
                styles.primaryButtonText, 
                { color: '#FFF' },
                !isValid && { color: theme.textSecondary }
              ]}>
                {t('referral')?.applyBtn?.toUpperCase() || "APPLY CODE"} {'>'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: theme.isDarkMode ? theme.itemBg : '#F9FAFB' }]}
            onPress={handleSkip}
            disabled={isSkipping || isApplying}
          >
            {isSkipping ? (
              <ActivityIndicator color={theme.textSecondary} />
            ) : (
              <Text style={[styles.secondaryButtonText, { color: theme.textPrimary }]}>{t('referral')?.skipBtn || "Skip for now"}</Text>
            )}
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 20,
  },
  iconGlow: {
    padding: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 50,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32, // Perfect circle for gift
    backgroundColor: '#C69320', // Golden background
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D19E2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 64,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    letterSpacing: 1.5,
    height: '100%',
  },
  infoBox: {
    backgroundColor: '#FDF8ED', // Light gold/brown tint
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3E5CA', // Slightly darker gold/brown border
  },
  infoText: {
    fontSize: 13,
    color: '#8C5614', // Deep golden brown text
    lineHeight: 20,
  },
  bulb: {
    fontSize: 14,
  },
  infoBold: {
    fontWeight: '700',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'android' ? 32 : 40,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    backgroundColor: '#C69320',
    shadowColor: '#D19E2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  primaryButtonDisabled: {
    backgroundColor: '#EBEBEB',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  primaryButtonTextDisabled: {
    color: '#9CA3AF',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
  },
});
