import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';
import { useTheme } from './context/ThemeContext';

export default function ReferralScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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
      router.replace('/login');
    }, 1500);
  };

  const handleSkip = () => {
    setIsSkipping(true);
    setTimeout(() => {
      setIsSkipping(false);
      router.replace('/login');
    }, 800);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContent}>
            {/* Header Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconGlow, { backgroundColor: theme.isDarkMode ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.1)' }]}>
                <View style={[styles.iconBox, { backgroundColor: theme.primary }]}>
                  <Ionicons name="gift-outline" size={32} color="#FFF" />
                </View>
              </View>
            </View>

            {/* Titles */}
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{t('referral')?.haveCode || "Got a Referral Code?"}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {t('referral')?.subtitle || "If someone referred you, enter their code below to unlock rewards!"}
              </Text>
            </View>

            {/* Input Area */}
            <View style={styles.inputSection}>
              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="gift-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder={t('referral')?.inputPlaceholder?.toUpperCase() || "ENTER REFERRAL CODE"}
                  placeholderTextColor={theme.textSecondary}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Info Box */}
            <View style={[styles.infoBox, { backgroundColor: theme.isDarkMode ? '#1E293B' : '#FDF8ED' }]}>
              <View style={styles.infoRow}>
                <Text style={styles.bulb}>💡</Text>
                <View style={styles.infoTextWrapper}>
                  <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>How it works:</Text>
                  <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                    Your referrer will receive <Text style={styles.infoBonus}>1%</Text> of every gold purchase you make as a reward forever.
                  </Text>
                </View>
              </View>
            </View>

            {/* Spacer for bottom breathing room */}
            <View style={{ height: 60 }} />
          </View>
        </ScrollView>

        {/* Fixed Footer AREA */}
        <View style={[styles.fixedFooter, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 24) }]}>
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
            style={styles.skipLink}
            onPress={handleSkip}
            disabled={isSkipping || isApplying}
          >
            {isSkipping ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.skipLinkText, { color: theme.textSecondary }]}>
                {t('referral')?.skipBtn || "Skip for now"}
              </Text>
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
  mainContent: {
    paddingHorizontal: 36,
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 30 : 15,
    marginBottom: 40,
  },
  iconGlow: {
    padding: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 70,
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
    marginBottom: 45,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 14,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
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
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3E5CA',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  bulb: {
    fontSize: 18,
  },
  infoBonus: {
    fontWeight: '900',
    color: '#D4AF37',
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
  skipLink: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipLinkText: {
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  fixedFooter: {
    paddingHorizontal: 36,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
});
