import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLanguage } from './context/LanguageContext';
import { useTheme } from './context/ThemeContext';

export default function CreateVaultScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();
  // We can pass the phone number down if needed. Mocking it for now.
  const phoneNumber = '+91 9342508799';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [isAccepted, setIsAccepted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const isValid = fullName.trim().length > 2 && city.trim().length > 2 && isAccepted;

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      router.push('/choose-language');
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Avatar Icon */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarGlow, { backgroundColor: theme.isDarkMode ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.1)' }]}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
                <Ionicons name="person-outline" size={28} color="#FFF" />
              </View>
            </View>
          </View>

          {/* Titles */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('create_vault')?.title || "Create Your Vault"}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Set up your Swarna Sakhi profile</Text>
          </View>

          {/* Verified Phone Badge */}
          <View style={[styles.verifiedBadge, { backgroundColor: theme.isDarkMode ? '#064E3B' : '#ECFDF5' }]}>
            <View style={styles.checkboxIcon}>
              <Ionicons name="checkbox" size={20} color="#10B981" />
            </View>
            <Text style={[styles.verifiedText, { color: theme.isDarkMode ? '#A7F3D0' : '#047857' }]}>
              {phoneNumber} — Verified
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('create_vault')?.fullname?.toUpperCase() + " *" || "FULL NAME *"}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="person-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.textSecondary}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('create_vault')?.email?.toUpperCase() + " (OPTIONAL)" || "EMAIL (OPTIONAL)"}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('create_vault')?.city?.toUpperCase() || "CITY"}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="location-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  placeholder="Your city"
                  placeholderTextColor={theme.textSecondary}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity 
            style={styles.termsContainer} 
            activeOpacity={0.7}
            onPress={() => setIsAccepted(!isAccepted)}
          >
            <View style={[styles.checkbox, { borderColor: theme.border }, isAccepted && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
              {isAccepted && <Ionicons name="checkmark" size={16} color="#FFF" />}
            </View>
            <Text style={[styles.termsText, { color: theme.textSecondary }]}>
              {t('create_vault')?.terms1 || "I accept the "}
              <Text style={[styles.termsLink, { color: theme.primary }]}>{t('create_vault')?.terms2 || "Terms & Conditions"}</Text> 
              {t('create_vault')?.terms3 || " and authorize Swarna Sakhi to manage my digital vault."} 
            </Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Create Vault Button (Bottom sticky) */}
        <View style={styles.footer}>
          <TouchableOpacity 
            activeOpacity={0.8}
            disabled={!isValid || isCreating || isSkipping}
            style={[
              styles.primaryButtonWrapper,
              (!isValid || isCreating || isSkipping) && { opacity: 0.5 }
            ]}
            onPress={handleCreate}
          >
            {isValid ? (
              <LinearGradient
                colors={['#D19E2B', '#B7821B']}
                style={styles.primaryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonTextActive}>{t('continue') || "CONTINUE >"}</Text>
                )}
              </LinearGradient>
            ) : (
              <View style={[styles.primaryButton, { backgroundColor: theme.isDarkMode ? '#1E293B' : '#EBEBEB' }]}>
                {isCreating ? (
                  <ActivityIndicator color={theme.textSecondary} />
                ) : (
                  <Text style={[styles.primaryButtonTextDisabled, { color: theme.textSecondary }]}>{t('continue') || "CONTINUE >"}</Text>
                )}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.skipButton, { backgroundColor: theme.isDarkMode ? theme.itemBg : '#F9FAFB' }]}
            onPress={handleSkip}
            disabled={isSkipping || isCreating}
          >
            {isSkipping ? (
              <ActivityIndicator color={theme.textSecondary} />
            ) : (
              <Text style={[styles.skipButtonText, { color: theme.textPrimary }]}>Skip</Text>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  avatarGlow: {
    padding: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 50,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D19E2B', // Golden brand color
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4', // Very light green
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 16, // Pill shape
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  checkboxIcon: {
    marginRight: 8,
  },
  verifiedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534', // Dark green text
    letterSpacing: 0.5,
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 56, // Fixed height for inputs
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    height: '100%',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 16,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4, // Slight rounding for checkbox
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: '#D19E2B',
    backgroundColor: '#D19E2B', // Gold when checked
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#D19E2B',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 32,
    backgroundColor: '#FAFAFA',
  },
  primaryButtonWrapper: {
    width: '100%',
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
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
