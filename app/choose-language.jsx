import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from './context/LanguageContext';
import { useTheme } from './context/ThemeContext';

const LANGUAGES = [
  { id: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
];

export default function ChooseLanguageScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { theme } = useTheme();
  const [isContinuing, setIsContinuing] = useState(false);

  // Use local state before committing to global state, or just commit directly.
  const [selectedLang, setSelectedLang] = useState(language);

  const handleContinue = () => {
    setIsContinuing(true);
    setLanguage(selectedLang);
    setTimeout(() => {
      setIsContinuing(false);
      router.push('/referral');
    }, 800);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        
        {/* Header Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconGlow, { backgroundColor: theme.isDarkMode ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.1)' }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary }]}>
              <Ionicons name="globe-outline" size={32} color="#FFF" />
            </View>
          </View>
        </View>

        {/* Titles */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Choose Language</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Select your preferred language for the app</Text>
        </View>

        {/* Language List */}
        <ScrollView 
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                activeOpacity={0.7}
                style={[
                  styles.languageCard, 
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && { borderColor: theme.primary, borderWidth: 2 }
                ]}
                onPress={() => setSelectedLang(lang.id)}
              >
                <Text style={styles.flagEmoji}>{lang.flag}</Text>
                <View style={styles.langTextContainer}>
                  <Text style={[styles.langName, { color: theme.textPrimary }]}>{lang.name}</Text>
                  <Text style={[styles.langNative, { color: theme.textSecondary }]}>{lang.nativeName}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleContinue}
            disabled={isContinuing}
          >
            {isContinuing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{t('continue')}</Text>
            )}
          </TouchableOpacity>
        </View>
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
    height: 40,
    borderRadius: 20, // Pill shape for the globe
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
    marginBottom: 30,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F3F4F6', // Light gray border by default
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  languageCardActive: {
    borderColor: '#D19E2B', // Gold border when selected
    backgroundColor: '#FFFAEF', // Very slight gold tint background
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  langTextContainer: {
    flex: 1,
  },
  langName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  langNative: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D19E2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'android' ? 32 : 40,
    backgroundColor: '#FAFAFA',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    backgroundColor: '#C69320', // Solid gold color to match simple design
    shadowColor: '#D19E2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
