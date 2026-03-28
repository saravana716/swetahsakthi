import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from './context/ThemeContext';

const { width } = Dimensions.get('window');

const STEPS = [
  { step: 1, title: 'PAN Verification', sub: 'Enter your Permanent Account Number (PAN) as per official records.' },
  { step: 2, title: 'Aadhar Verification', sub: 'Enter your 12-digit Aadhar number for identity verification.' },
  { step: 3, title: 'Live Selfie Capture', sub: 'Take a live selfie to verify your identity.' },
  { step: 4, title: 'Review & Submit', sub: 'Review your details and submit for verification.' },
];

export default function KYCScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [panNumber, setPanNumber] = useState('');
  const [panFileSelected] = useState(true); // mock

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStarted(true);
    setCurrentStep(1);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  if (!started) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.card }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Identity Verification</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
          {/* Shield Icon */}
          <View style={styles.shieldContainer}>
            <Ionicons name="shield-checkmark" size={72} color="#EAB308" />
          </View>

          <Text style={[styles.introTitle, { color: theme.textPrimary }]}>Verification Required</Text>
          <Text style={[styles.introSub, { color: theme.textSecondary }]}>
            To comply with financial regulations and secure your gold investments, please complete your KYC.
          </Text>

          {/* Steps Card */}
          <View style={[styles.stepsCard, { backgroundColor: theme.card }]}>
            {[
              { icon: 'checkmark-circle', label: 'PAN Card Details' },
              { icon: 'checkmark-circle', label: 'Aadhar Card Verification' },
              { icon: 'checkmark-circle', label: 'Live Selfie Capture' },
            ].map((item, i) => (
              <View key={i} style={[styles.stepRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                <Ionicons name={item.icon} size={22} color="#22C55E" />
                <Text style={[styles.stepRowLabel, { color: theme.textPrimary }]}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderColor: isDarkMode ? '#334155' : '#DBEAFE' }]}>
            <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
            <Text style={[styles.infoText, { color: isDarkMode ? '#93C5FD' : '#1D4ED8' }]}>
              Verification usually takes less than 2 minutes and is encrypted end-to-end.
            </Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <LinearGradient colors={['#EAB308', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtnGrad}>
              <Text style={styles.startBtnText}>Start Verification</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step screens
  const step = STEPS[currentStep - 1];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card }]}
          onPress={() => currentStep === 1 ? setStarted(false) : setCurrentStep(p => p - 1)}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Identity Verification</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Step Progress */}
      <View style={styles.progressRow}>
        {STEPS.map((s) => (
          <View key={s.step} style={styles.progressItem}>
            <View style={[styles.progressDot, {
              backgroundColor: s.step < currentStep ? '#22C55E' : s.step === currentStep ? '#EAB308' : (isDarkMode ? '#334155' : '#E2E8F0')
            }]}>
              {s.step < currentStep
                ? <Ionicons name="checkmark" size={12} color="#FFF" />
                : <Text style={styles.progressNum}>{s.step}</Text>
              }
            </View>
            {s.step < STEPS.length && (
              <View style={[styles.progressLine, { backgroundColor: s.step < currentStep ? '#22C55E' : (isDarkMode ? '#334155' : '#E2E8F0') }]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.stepLabel, { color: '#EAB308' }]}>STEP {currentStep} OF {STEPS.length}</Text>
        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>{step.title}</Text>
        <Text style={[styles.stepSub, { color: theme.textSecondary }]}>{step.sub}</Text>

        {currentStep === 1 && (
          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>PAN Number</Text>
            <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TextInput
                style={[styles.inputField, { color: theme.textPrimary }]}
                placeholder="ABCDE1234F"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                maxLength={10}
                value={panNumber}
                onChangeText={setPanNumber}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 20 }]}>Upload PAN Photo (Optional)</Text>
            <View style={[styles.uploadBox, { borderColor: '#EAB308' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              <Text style={[styles.uploadFileName, { color: theme.textPrimary }]}>PAN_Front_Scan.jpg</Text>
            </View>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Aadhar Number</Text>
            <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TextInput
                style={[styles.inputField, { color: theme.textPrimary }]}
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={14}
              />
            </View>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 20 }]}>Upload Aadhar Photo (Optional)</Text>
            <TouchableOpacity style={[styles.uploadBox, { borderColor: isDarkMode ? '#334155' : '#E2E8F0', borderStyle: 'dashed' }]}>
              <Ionicons name="cloud-upload-outline" size={24} color={theme.textSecondary} />
              <Text style={[styles.uploadHint, { color: theme.textSecondary }]}>Tap to upload</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.selfieArea}>
            <View style={[styles.selfieFrame, { borderColor: '#EAB308' }]}>
              <Ionicons name="person-circle-outline" size={96} color={isDarkMode ? '#334155' : '#E2E8F0'} />
              <Text style={[styles.selfieHint, { color: theme.textSecondary }]}>Position your face within the frame</Text>
            </View>
            <TouchableOpacity style={[styles.captureBtn, { backgroundColor: '#EAB308' }]}>
              <Ionicons name="camera-outline" size={28} color="#FFF" />
              <Text style={styles.captureBtnText}>Take Selfie</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.reviewArea}>
            {[
              { label: 'PAN Number', value: panNumber || 'ABCDE1234F' },
              { label: 'Aadhar', value: 'XXXX XXXX XXXX' },
              { label: 'Selfie', value: 'Captured ✓' },
            ].map((row, i) => (
              <View key={i} style={[styles.reviewRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.reviewLabel, { color: theme.textSecondary }]}>{row.label}</Text>
                <Text style={[styles.reviewValue, { color: theme.textPrimary }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <LinearGradient
            colors={currentStep === STEPS.length ? ['#22C55E', '#15803D'] : ['#EAB308', '#D97706']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.continueBtnGrad}
          >
            <Text style={styles.continueBtnText}>
              {currentStep === STEPS.length ? 'Submit Verification' : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 16,
  },
  progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNum: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  progressLine: { flex: 1, height: 2, marginHorizontal: 4 },

  // Intro
  introContent: { paddingHorizontal: 24, alignItems: 'center', paddingTop: 20 },
  shieldContainer: { marginVertical: 32, alignItems: 'center' },
  introTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  introSub: { fontSize: 14, lineHeight: 22, textAlign: 'center', fontWeight: '500', marginBottom: 28 },
  stepsCard: {
    width: '100%',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  stepRowLabel: { fontSize: 15, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 28,
    width: '100%',
  },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  startBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', height: 58 },
  startBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // Steps
  stepContent: { paddingHorizontal: 24, paddingBottom: 120 },
  stepLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  stepTitle: { fontSize: 26, fontWeight: '900', marginBottom: 10 },
  stepSub: { fontSize: 14, lineHeight: 22, fontWeight: '500', marginBottom: 28 },
  formGroup: { width: '100%' },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  inputBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  inputField: { fontSize: 16, fontWeight: '600' },
  uploadBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    borderStyle: 'dashed',
  },
  uploadFileName: { fontSize: 14, fontWeight: '600' },
  uploadHint: { fontSize: 14, fontWeight: '500' },
  selfieArea: { alignItems: 'center', gap: 24 },
  selfieFrame: {
    width: width - 80,
    height: width - 80,
    borderRadius: (width - 80) / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieHint: { textAlign: 'center', marginTop: 16, fontSize: 13, fontWeight: '500' },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 10,
  },
  captureBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  reviewArea: { gap: 12 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  reviewLabel: { fontSize: 14, fontWeight: '600' },
  reviewValue: { fontSize: 14, fontWeight: '800' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1,
  },
  continueBtn: { borderRadius: 16, overflow: 'hidden', height: 56 },
  continueBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
