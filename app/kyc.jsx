import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { getAugmontKYCStatus, submitAugmontKYC, updateUserKycStatus } from '../services/augmontApi';
import { validateAge } from '../services/kycVerification';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

const { width } = Dimensions.get('window');

const STEPS = [
  { step: 1, title: 'PAN Verification', sub: 'Enter your Permanent Account Number (PAN) and take a photo.' },
  { step: 2, title: 'Aadhar Verification', sub: 'Enter your 12-digit Aadhar number and take a photo.' },
  { step: 3, title: 'Review & Submit', sub: 'Review your details and submit for verification.' },
];

const VerifiedSuccessView = ({ theme, isDarkMode, router, userProfile, insets }) => (
  <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: theme.card }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Identity Verified</Text>
      <View style={{ width: 44 }} />
    </View>

    <ScrollView contentContainerStyle={styles.introContent} showsVerticalScrollIndicator={false}>
      <View style={styles.successIconOuter}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.successIconInner}
        >
          <Ionicons name="checkmark-done" size={60} color="#FFF" />
        </LinearGradient>
      </View>

      <Text style={[styles.introTitle, { color: theme.textPrimary, marginTop: 24 }]}>Verification Success!</Text>
      <Text style={[styles.introSub, { color: theme.textSecondary }]}>
        Congratulations {userProfile?.displayName || 'Investor'}! Your identity has been verified successfully. You now have full access to gold and silver trading.
      </Text>

      <View style={[styles.verifiedDetailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.verifiedRow}>
          <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.verifiedLabel, { color: theme.textSecondary }]}>Account Status</Text>
            <Text style={[styles.verifiedValue, { color: '#10B981' }]}>Fully Verified & Secured</Text>
          </View>
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 16 }]} />
        
        <View style={styles.verifiedRow}>
          <Ionicons name="card-outline" size={24} color={theme.primary} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.verifiedLabel, { color: theme.textSecondary }]}>Verified PAN</Text>
            <Text style={[styles.verifiedValue, { color: theme.textPrimary }]}>
              {userProfile?.panNumber ? `XXXXX${userProfile.panNumber.slice(-4)}${userProfile.panNumber.slice(-1)}` : 'Verified Identification'}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 16 }]} />

        <View style={styles.verifiedRow}>
          <Ionicons name="calendar-outline" size={24} color={theme.primary} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.verifiedLabel, { color: theme.textSecondary }]}>Verified On</Text>
            <Text style={[styles.verifiedValue, { color: theme.textPrimary }]}>
              {(() => {
                try {
                  const dateVal = userProfile?.updatedAt;
                  const finalDate = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal || Date.now());
                  return finalDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                } catch (e) {
                  return 'Recently Verified';
                }
              })()}
            </Text>
          </View>
        </View>
      </View>

    </ScrollView>

    <View style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 60) }]}>
      <TouchableOpacity 
        style={styles.startBtn} 
        onPress={() => router.replace('/(tabs)/account')}
      >
        <LinearGradient colors={['#EAB308', '#D97706']} style={styles.startBtnGrad}>
          <Text style={styles.startBtnText}>Back to Account</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

export default function KYCScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { user, userProfile } = useAuth();
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [localStatus, setLocalStatus] = useState(userProfile?.kycStatus || 'pending');
  const [liveKycData, setLiveKycData] = useState(null);
  
  // KYC Fields
  const [panNumber, setPanNumber] = useState('');
  const [nameAsPerPan, setNameAsPerPan] = useState(userProfile?.displayName || '');
  const [dateOfBirth, setDateOfBirth] = useState(userProfile?.dateOfBirth || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAgeValid, setIsAgeValid] = useState(true);
  
  // Real-time Validation States
  const [isPanValid, setIsPanValid] = useState(false);
  const [isAadharValid, setIsAadharValid] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  
  // New Image States
  const [panImage, setPanImage] = useState(null);
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharImage, setAadharImage] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Processing...');

  // 1. Initial Status Sync
  useEffect(() => {
    const syncStatus = async () => {
      try {
        if (userProfile?.kycStatus === 'approved') {
          setLocalStatus('approved');
          setLiveKycData(userProfile); // Fallback to profile data if already approved in context
          setIsCheckingStatus(false);
          return;
        }

        const token = await user.getIdToken();
        const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
        
        if (uniqueId) {
          const statusData = await getAugmontKYCStatus(uniqueId, token);
          console.log("KYC Status Response:", JSON.stringify(statusData, null, 2));
          const liveData = statusData?.result?.data;
          if (liveData?.status) {
            setLocalStatus(liveData.status);
            setLiveKycData(liveData);
          }
        }
      } catch (error) {
        console.error("KYC Live Sync Error:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    syncStatus();
  }, [userProfile]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStarted(true);
    setCurrentStep(1);
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentStep < STEPS.length) {
      // Basic validation for step 1
      if (currentStep === 1) {
        if (!isPanValid) {
          Toast.show({ type: 'error', text1: 'Invalid PAN Number' });
          return;
        }
        if (!isAgeValid) {
          Toast.show({ type: 'error', text1: 'Min age required is 18 years' });
          return;
        }
        if (!panImage) {
          Toast.show({ type: 'error', text1: 'PAN Photo is required' });
          return;
        }
      }
      // Step 2 Aadhar validation
      if (currentStep === 2) {
        if (!isAadharValid) {
          Toast.show({ type: 'error', text1: 'Invalid Aadhar Number' });
          return;
        }
        if (!aadharImage) {
          Toast.show({ type: 'error', text1: 'Aadhar Photo is required' });
          return;
        }
      }
      setCurrentStep(prev => prev + 1);
    } else {
      // Step 3: Final Submission
      setLoading(true);
      setLoadingStatus("Verifying Identity...");
      
      try {
        // Multi-stage fake loader for premium feel
        setTimeout(() => setLoadingStatus("Analyzing Documents..."), 1000);
        setTimeout(() => setLoadingStatus("Checking Secure Vaults..."), 2000);
        setTimeout(() => setLoadingStatus("Finalizing Profile..."), 3000);

        const token = await user.getIdToken();
        const uniqueId = userProfile?.augmontUniqueId || userProfile?.uniqueId;
        
        if (!uniqueId) throw new Error("Augmont ID not found. Please complete profile first.");

        // 1. Submit to Augmont with Images
        const verificationResponse = await submitAugmontKYC(uniqueId, {
          panNumber,
          dateOfBirth,
          nameAsPerPan,
          aadharNumber: aadharNumber.replace(/\s/g, ''), // Strip spaces: "9635 9635 9635" → "963596359635"
          panImage,
          aadharImage
        }, token);
        
        console.log("KYC Verification Response:", JSON.stringify(verificationResponse, null, 2));

        // 2. Sync with MongoDB
        await updateUserKycStatus(userProfile.mongoId || userProfile._id, 'approved', token);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: 'success', text1: 'KYC Verified Successfully' });
        router.replace('/(tabs)');
      } catch (err) {
        console.error("KYC Submission Error:", err);
        Toast.show({ type: 'error', text1: err.message || 'Verification Failed' });
      } finally {
        setLoading(false);
      }
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dobString = selectedDate.toISOString().split('T')[0];
      setDateOfBirth(dobString);
      setIsAgeValid(validateAge(dobString));
    }
  };

  const formatPAN = (text) => {
    const uppercased = text.toUpperCase();
    setPanNumber(uppercased);
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    setIsPanValid(panRegex.test(uppercased));
  };

  const formatAadhar = (text) => {
    // Remove non-numeric
    const numeric = text.replace(/[^0-9]/g, '');
    const truncated = numeric.slice(0, 12);
    
    // Add spaces for display: XXXX XXXX XXXX
    let formatted = truncated;
    if (truncated.length > 4) formatted = truncated.slice(0, 4) + ' ' + truncated.slice(4);
    if (truncated.length > 8) formatted = formatted.slice(0, 9) + ' ' + truncated.slice(8);
    
    setAadharNumber(formatted);
    setIsAadharValid(truncated.length === 12);
  };

  // Determine if "Continue" button should be enabled
  useEffect(() => {
    if (currentStep === 1) {
      setIsFormValid(isPanValid && isAgeValid && !!panImage && !!nameAsPerPan);
    } else if (currentStep === 2) {
      setIsFormValid(isAadharValid && !!aadharImage);
    } else {
      setIsFormValid(true);
    }
  }, [currentStep, isPanValid, isAgeValid, panImage, nameAsPerPan, isAadharValid, aadharImage]);

  // === Early Returns (MUST be placed AFTER all hooks) ===
  if (isCheckingStatus) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: 12 }]}>Verifying Status...</Text>
      </View>
    );
  }

  if (localStatus === 'approved') {
    return <VerifiedSuccessView theme={theme} isDarkMode={isDarkMode} router={router} userProfile={userProfile} insets={insets} />;
  }

  const handleImageSelection = async (type, source) => {
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ type: 'error', text1: 'Camera permission denied' });
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.2, // Significantly reduced quality to prevent 413 Entity Too Large error
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({ type: 'error', text1: 'Gallery permission denied' });
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.2, // Significantly reduced quality to prevent 413 Entity Too Large error
        });
      }

      if (!result.canceled) {
        if (type === 'pan') setPanImage(result.assets[0].uri);
        else setAadharImage(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Image Selection Error:", error);
      Toast.show({ type: 'error', text1: 'Failed to select image' });
    }
  };

  const takePhoto = (type) => {
    Alert.alert(
      "Upload Image",
      "Choose an option",
      [
        { text: "Camera", onPress: () => handleImageSelection(type, 'camera') },
        { text: "Gallery", onPress: () => handleImageSelection(type, 'gallery') },
        { text: "Cancel", style: "cancel" }
      ]
    );
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
        </ScrollView>

        <View style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 60) }]}>
          <TouchableOpacity 
            style={styles.startBtn} 
            onPress={handleStart}
          >
            <LinearGradient colors={['#EAB308', '#D97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtnGrad}>
              <Text style={styles.startBtnText}>Start Verification</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Name As Per PAN</Text>
            <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 16 }]}>
              <TextInput
                style={[styles.inputField, { color: theme.textPrimary }]}
                placeholder="FULL NAME"
                placeholderTextColor={theme.textSecondary}
                value={nameAsPerPan}
                onChangeText={setNameAsPerPan}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>PAN Number</Text>
            <View style={[styles.inputBox, { 
              backgroundColor: theme.card, 
              borderColor: panNumber.length === 10 ? (isPanValid ? '#22C55E' : '#EF4444') : theme.border, 
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }]}>
              <TextInput
                style={[styles.inputField, { color: theme.textPrimary, flex: 1 }]}
                placeholder="ABCDE1234F"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                maxLength={10}
                value={panNumber}
                onChangeText={formatPAN}
              />
              {panNumber.length === 10 && (
                <Ionicons 
                  name={isPanValid ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={isPanValid ? "#22C55E" : "#EF4444"} 
                />
              )}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Date of Birth</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none" style={[styles.inputBox, { 
                backgroundColor: theme.card, 
                borderColor: dateOfBirth ? (isAgeValid ? '#22C55E' : '#EF4444') : theme.border,
                flexDirection: 'row',
                alignItems: 'center'
              }]}>
                <TextInput
                  style={[styles.inputField, { color: theme.textPrimary, flex: 1 }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                  value={dateOfBirth}
                />
                {dateOfBirth && (
                  <Ionicons 
                    name={isAgeValid ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={isAgeValid ? "#22C55E" : "#EF4444"} 
                  />
                )}
              </View>
              {!isAgeValid && dateOfBirth && (
                <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4, fontWeight: '600' }}>
                  You must be at least 18 years old to proceed.
                </Text>
              )}
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth ? new Date(dateOfBirth) : new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}

            <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 20 }]}>Take PAN Photo</Text>
            {panImage ? (
              <View style={[styles.uploadBox, { borderColor: '#22C55E' }]}>
                <Image source={{ uri: panImage }} style={styles.previewImage} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.uploadFileName, { color: theme.textPrimary }]}>PAN_IMAGE_CAPTURED.jpg</Text>
                  <TouchableOpacity onPress={() => takePhoto('pan')}>
                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>RETAKE PHOTO</Text>
                  </TouchableOpacity>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              </View>
            ) : (
              <TouchableOpacity style={[styles.uploadBox, { borderColor: theme.primary, borderStyle: 'dashed' }]} onPress={() => takePhoto('pan')}>
                <Ionicons name="camera-outline" size={24} color={theme.primary} />
                <Text style={[styles.uploadHint, { color: theme.primary }]}>Capture PAN Card</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Aadhar Number</Text>
            <View style={[styles.inputBox, { 
              backgroundColor: theme.card, 
              borderColor: aadharNumber.length === 14 ? (isAadharValid ? '#22C55E' : '#EF4444') : theme.border, 
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }]}>
              <TextInput
                style={[styles.inputField, { color: theme.textPrimary, flex: 1 }]}
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                maxLength={14}
                value={aadharNumber}
                onChangeText={formatAadhar}
              />
              {aadharNumber.length === 14 && (
                <Ionicons 
                  name={isAadharValid ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={isAadharValid ? "#22C55E" : "#EF4444"} 
                />
              )}
            </View>
            
            <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Take Aadhar Photo</Text>
            {aadharImage ? (
              <View style={[styles.uploadBox, { borderColor: '#22C55E' }]}>
                <Image source={{ uri: aadharImage }} style={styles.previewImage} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.uploadFileName, { color: theme.textPrimary }]}>AADHAR_IMAGE_CAPTURED.jpg</Text>
                  <TouchableOpacity onPress={() => takePhoto('aadhar')}>
                    <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>RETAKE PHOTO</Text>
                  </TouchableOpacity>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              </View>
            ) : (
              <TouchableOpacity style={[styles.uploadBox, { borderColor: theme.primary, borderStyle: 'dashed' }]} onPress={() => takePhoto('aadhar')}>
                <Ionicons name="camera-outline" size={24} color={theme.primary} />
                <Text style={[styles.uploadHint, { color: theme.primary }]}>Capture Aadhar Card</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.reviewArea}>
            {[
              { label: 'Name on PAN', value: nameAsPerPan },
              { label: 'PAN Number', value: panNumber },
              { label: 'PAN Card Photo', value: panImage ? 'Captured ✓' : 'Missing ✗' },
              { label: 'Aadhar Number', value: aadharNumber },
              { label: 'Aadhar Card Photo', value: aadharImage ? 'Captured ✓' : 'Missing ✗' },
              { label: 'Date of Birth', value: dateOfBirth },
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
      <View style={[
        styles.footer, 
        { 
          backgroundColor: theme.background, 
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 60),
          paddingHorizontal: 32
        }
      ]}>
        <TouchableOpacity 
          style={[styles.continueBtn, (loading || !isFormValid) && { opacity: 0.5 }]} 
          onPress={handleContinue} 
          disabled={loading || !isFormValid}
        >
          <LinearGradient
            colors={currentStep === STEPS.length ? ['#22C55E', '#15803D'] : ['#EAB308', '#D97706']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.continueBtnGrad}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.continueBtnText}>{loadingStatus}</Text>
              </View>
            ) : (
              <Text style={styles.continueBtnText}>
                {currentStep === STEPS.length ? 'Submit Verification' : 'Continue'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, fontWeight: '600' },
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
  reviewLabel: { fontSize: 13, fontWeight: '600' },
  reviewValue: { fontSize: 13, fontWeight: '800' },
  previewImage: {
    width: 60,
    height: 45,
    borderRadius: 8,
    marginRight: 12,
  },
  // Footer
  footer: {
    paddingHorizontal: 32,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  fixedFooter: {
    paddingHorizontal: 32,
    paddingTop: 16,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  continueBtn: { borderRadius: 16, overflow: 'hidden', height: 56 },
  continueBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  
  // Success View Styles
  successIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B98115',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  successIconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedDetailsCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    marginTop: 32,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  verifiedValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
