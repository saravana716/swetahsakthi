import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  ScrollView
} from 'react-native';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { createUserInDB } from '../services/augmontApi';
import Toast from 'react-native-toast-message';

// Move CustomInput outside of the main component to prevent remounting on every state update
const CustomInput = ({ icon, theme, value, onChangeText, placeholder, keyboardType, maxLength, secureTextEntry }) => (
  <View style={styles.inputGroup}>
    <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Ionicons name={icon} size={20} color={theme.textSecondary} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: theme.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
      />
    </View>
  </View>
);

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    mobileNumber: user?.phoneNumber || '',
    pin: '',
  });
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!formData.displayName || !formData.email || !formData.mobileNumber || formData.pin.length !== 4) {
      Toast.show({ type: 'error', text1: 'Fill all fields correctly' });
      return;
    }

    setLoading(true);
    try {
      // 1. Generate an App-specific precise uniqueId
      let finalUniqueId = `USR${Date.now()}`;
      let mongoRecordId = null;
      let isSuccessMessage = 'Your account is ready! ✨';
      const token = await user.getIdToken();
      
      const userPayload = {
        name: formData.displayName,
        mobile: user.phoneNumber || formData.mobileNumber,
        email: formData.email,
        mpin: formData.pin,
        uniqueId: finalUniqueId,
        goldBalance: 0,
        walletBalance: 0,
        kycStatus: "pending"
      };

      try {
        const apiResponse = await createUserInDB(userPayload, token);
        console.log('MongoDB User Creation Response:', apiResponse);
        mongoRecordId = apiResponse?.data?._id || apiResponse?._id || null;
        if (apiResponse?.message) isSuccessMessage = apiResponse.message;
      } catch (dbError) {
        console.log("MongoDB creation failed. Attempting Self-Healing for Orphaned Account...");
        
        try {
          // Self-Healing Strategy: If MongoDB rejected the creation because the user already exists,
          // (which happened because a previous backend crash stopped Firebase from saving completely)
          // we fetch the user list, find their old MongoDB _id, and surgically restore the Firebase link!
          const allResponse = await fetch('http://13.63.202.142:5001/api/users', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const allUsersData = await allResponse.json();
          // Backend normally returns { data: [...] } for list views, or [...]
          const userList = Array.isArray(allUsersData) ? allUsersData : allUsersData?.data || [];
          
          const existingUser = userList.find(u => u.mobile === userPayload.mobile || u.mobile === formData.mobileNumber);
          
          if (existingUser) {
            console.log("Found Orphaned User! Auto-Restoring:", existingUser._id);
            mongoRecordId = existingUser._id;
            finalUniqueId = existingUser.uniqueId || finalUniqueId; // Re-use old uniqueId if it safely exists
            isSuccessMessage = 'Profile safely restored and connected!';
          } else {
            // Unrelated error, throw it so the toast correctly shows to the user
            throw dbError;
          }
        } catch (recoveryError) {
          throw dbError; // Throw original creation error if recovery catastrophically fails
        }
      }

      // Show Toast immediately so they can read it!
      Toast.show({ type: 'success', text1: 'Profile Ready!', text2: isSuccessMessage, position: 'top', visibilityTime: 3000 });

      // Delay Firebase save slightly so the layout guard doesn't instantly rip them to Dashboard
      setTimeout(async () => {
        // 3. Save to Firebase (using the recovered or new data)
        try {
          await updateProfile({
            displayName: formData.displayName,
            email: formData.email,
            appPin: formData.pin,
            augmontUniqueId: finalUniqueId,
            mongoId: mongoRecordId,
            profileSetupComplete: true,
          });
          // router.replace will be naturally handled by _layout.jsx once profile is completely loaded!
        } catch (fbError) {
          console.error("Delayed FB save failed:", fbError);
        }
      }, 1500);

    } catch (error) {
      console.error("Profile save error:", error);
      Toast.show({ 
        type: 'error', 
        text1: 'Account Setup Failed',
        text2: error?.message || 'Error setting up account. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.iconContainer}>
            <View style={[styles.iconGlow, { backgroundColor: isDarkMode ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.1)' }]}>
              <View style={[styles.iconBox, { backgroundColor: theme.primary }]}>
                <Ionicons name="person-add-outline" size={28} color="#FFF" />
              </View>
            </View>
          </View>

          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Complete Profile</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Tell us a bit more about yourself to get started with your digital vault.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <CustomInput
              icon="person-outline"
              theme={theme}
              placeholder="FULL NAME"
              value={formData.displayName}
              onChangeText={(txt) => setFormData({ ...formData, displayName: txt })}
            />

            <CustomInput
              icon="mail-outline"
              theme={theme}
              placeholder="EMAIL ADDRESS"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(txt) => setFormData({ ...formData, email: txt })}
            />

            <CustomInput
              icon="call-outline"
              theme={theme}
              placeholder="MOBILE NUMBER"
              keyboardType="phone-pad"
              value={formData.mobileNumber}
              onChangeText={(txt) => setFormData({ ...formData, mobileNumber: txt })}
            />

            <CustomInput
              icon="lock-closed-outline"
              theme={theme}
              placeholder="4-DIGIT APP PIN"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry={true}
              value={formData.pin}
              onChangeText={(txt) => setFormData({ ...formData, pin: txt })}
            />
          </View>

          <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F9FAFB', borderColor: theme.border }]}>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              <Text style={styles.bulb}>💡 </Text>
              <Text style={[styles.infoBold, { color: theme.textPrimary }]}>Security Tip:</Text> Use a unique PIN to protect your digital assets. Your data is always encrypted.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>COMPLETE SETUP {'>'}</Text>
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
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 20,
  },
  iconGlow: {
    padding: 10,
    borderRadius: 50,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 64,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    height: '100%',
  },
  infoBox: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
