import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
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
  ScrollView,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { 
  createUserInDB, 
  createUserInAugmont, 
  getMasterStates, 
  getMasterCities 
} from '../services/augmontApi';
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
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { user, updateProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    mobileNumber: user?.phoneNumber || '',
    pin: '',
    userState: '',
    stateId: '',
    userCity: '',
    cityId: '',
    userPincode: '',
    dateOfBirth: '',
    nomineeName: '',
    nomineeRelation: '',
    nomineeDateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);
  
  // States & Cities Master Data
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  
  // Date Pickers
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [showNomineePicker, setShowNomineePicker] = useState(false);

  // Initial Fetches
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const token = await user.getIdToken();
        const data = await getMasterStates(token);
        setStatesList(data);
      } catch (err) {
        console.error("Failed to load states:", err);
      }
    };
    fetchStates();
  }, []);

  const handleStateSelect = async (state) => {
    setFormData(prev => ({ ...prev, userState: state.name, stateId: state.id, userCity: '', cityId: '' }));
    setShowStateModal(false);
    setIsCitiesLoading(true);
    try {
      const token = await user.getIdToken();
      const cities = await getMasterCities(state.id, token);
      setCitiesList(cities);
    } catch (err) {
      console.error("Failed to load cities:", err);
      Toast.show({ type: 'error', text1: 'Failed to load cities' });
    } finally {
      setIsCitiesLoading(false);
    }
  };

  const handleCitySelect = (city) => {
    setFormData(prev => ({ ...prev, userCity: city.name, cityId: city.id }));
    setShowCityModal(false);
  };

  const onBirthDateChange = (event, selectedDate) => {
    setShowBirthPicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dateOfBirth: selectedDate.toISOString().split('T')[0] }));
    }
  };

  const onNomineeDateChange = (event, selectedDate) => {
    setShowNomineePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, nomineeDateOfBirth: selectedDate.toISOString().split('T')[0] }));
    }
  };

  const handleComplete = async () => {
    // Basic validation
    if (!formData.displayName || !formData.email || !formData.mobileNumber || formData.pin.length !== 4) {
      Toast.show({ type: 'error', text1: 'Fill all core fields' });
      return;
    }

    if (!formData.userState || !formData.userPincode || !formData.dateOfBirth) {
      Toast.show({ type: 'error', text1: 'KYC fields are required for Augmont' });
      return;
    }

    setLoading(true);
    try {
      let finalUniqueId = `USR${Date.now()}`;
      let mongoRecordId = null;
      let isSuccessMessage = 'Your account is ready! ✨';
      const token = await user.getIdToken();
      
      // 1. MongoDB Payload
      const mongoPayload = {
        name: formData.displayName,
        mobile: user.phoneNumber || formData.mobileNumber,
        email: formData.email,
        mpin: formData.pin,
        uniqueId: finalUniqueId,
        goldBalance: 0,
        walletBalance: 0,
        kycStatus: "pending"
      };

      // Helper: Clean mobile to 10 digits
      const cleanMobile = (m) => {
        const d = m.replace(/\D/g, '');
        return d.length > 10 ? d.slice(-10) : d;
      };

      // Helper: Try to convert DD/MM/YYYY to YYYY-MM-DD if needed
      const formatToAugmontDate = (dateStr) => {
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          const [d, m, y] = dateStr.split('/');
          return `${y}-${m}-${d}`;
        }
        return dateStr;
      };

      // 2. Augmont Payload (as per Swagger)
      const augmontPayload = {
        userName: formData.displayName,
        mobileNumber: cleanMobile(mongoPayload.mobile),
        emailId: formData.email,
        uniqueId: finalUniqueId,
        userState: formData.stateId, // Using official IDs
        userCity: formData.cityId,   // Using official IDs
        userPincode: formData.userPincode,
        dateOfBirth: formData.dateOfBirth, // Guaranteed YYYY-MM-DD by picker
        nomineeName: formData.nomineeName || 'N/A',
        nomineeRelation: formData.nomineeRelation || 'N/A',
        nomineeDateOfBirth: formData.nomineeDateOfBirth || formData.dateOfBirth
      };

      console.log("Starting Two-Way Integration...");

      // A. Call MongoDB
      try {
        const dbResponse = await createUserInDB(mongoPayload, token);
        console.log('MongoDB Response:', dbResponse);
        mongoRecordId = dbResponse?.data?._id || dbResponse?._id || null;
      } catch (dbError) {
        console.log("MongoDB failed, attempting recovery...");
        // Recovery logic (existing)
        const allResponse = await fetch('http://13.63.202.142:5001/api/users', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const allUsersData = await allResponse.json();
        const userList = Array.isArray(allUsersData) ? allUsersData : allUsersData?.data || [];
        const existingUser = userList.find(u => u.mobile === mongoPayload.mobile);
        
        if (existingUser) {
          mongoRecordId = existingUser._id;
          finalUniqueId = existingUser.uniqueId || finalUniqueId;
        } else {
          throw dbError;
        }
      }

      // B. Call Augmont (Two-Way Sync)
      try {
        const augResponse = await createUserInAugmont(augmontPayload, token);
        console.log('Augmont Response:', augResponse);
        isSuccessMessage = "Profile & Augmont linked successfully!";
      } catch (augError) {
        console.error("Augmont integration failed but MongoDB ok:", augError);
        isSuccessMessage = "Profile saved. Augmont sync pending.";
        // We don't block the whole flow if Augmont fails but DB is ok, 
        // though in production we might want to retry.
      }

      Toast.show({ 
        type: 'success', 
        text1: 'Success!', 
        text2: isSuccessMessage, 
        position: 'top', 
        visibilityTime: 3000 
      });

      // 3. Save to Firebase
      setTimeout(async () => {
        try {
          await updateProfile({
            displayName: formData.displayName,
            email: formData.email,
            appPin: formData.pin,
            augmontUniqueId: finalUniqueId,
            mongoId: mongoRecordId,
            profileSetupComplete: true,
            // Keep additional info for records
            userState: formData.userState,
            userPincode: formData.userPincode,
            dob: formData.dateOfBirth,
          });
        } catch (fbError) {
          console.error("Firebase save failed:", fbError);
        }
      }, 1500);

    } catch (error) {
      console.error("Setup error:", error);
      Toast.show({ 
        type: 'error', 
        text1: 'Setup Failed',
        text2: error?.message || 'Error occurred'
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
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Basic Information</Text>
            
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

            <View style={styles.divider} />
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Augmont KYC Details</Text>

            <Pressable onPress={() => setShowBirthPicker(true)}>
              <View pointerEvents="none">
                <CustomInput
                  icon="calendar-outline"
                  theme={theme}
                  placeholder="YOUR BIRTH DATE"
                  value={formData.dateOfBirth ? formData.dateOfBirth.split('-').reverse().join('/') : ''}
                  onChangeText={() => {}}
                />
              </View>
            </Pressable>

            {showBirthPicker && (
              <DateTimePicker
                value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onBirthDateChange}
              />
            )}

            <Pressable onPress={() => setShowStateModal(true)}>
              <View pointerEvents="none">
                <CustomInput
                  icon="map-outline"
                  theme={theme}
                  placeholder="SELECT STATE"
                  value={formData.userState}
                  onChangeText={() => {}}
                />
              </View>
            </Pressable>

            <View style={styles.row}>
              <View style={{ flex: 1.2, marginRight: 8 }}>
                <Pressable onPress={() => {
                  if (!formData.stateId) {
                    Toast.show({ type: 'info', text1: 'Select State First' });
                    return;
                  }
                  setShowCityModal(true);
                }}>
                  <View pointerEvents="none">
                    <CustomInput
                      icon="business-outline"
                      theme={theme}
                      placeholder="SELECT CITY"
                      value={formData.userCity}
                      onChangeText={() => {}}
                    />
                  </View>
                </Pressable>
              </View>
              <View style={{ flex: 0.8 }}>
                <CustomInput
                  icon="location-outline"
                  theme={theme}
                  placeholder="PINCODE"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={formData.userPincode}
                  onChangeText={(txt) => setFormData({ ...formData, userPincode: txt })}
                />
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Nominee Information</Text>

            <CustomInput
              icon="people-outline"
              theme={theme}
              placeholder="NOMINEE NAME"
              value={formData.nomineeName}
              onChangeText={(txt) => setFormData({ ...formData, nomineeName: txt })}
            />

            <CustomInput
              icon="git-branch-outline"
              theme={theme}
              placeholder="RELATION"
              value={formData.nomineeRelation}
              onChangeText={(txt) => setFormData({ ...formData, nomineeRelation: txt })}
            />

            <Pressable onPress={() => setShowNomineePicker(true)}>
              <View pointerEvents="none">
                <CustomInput
                  icon="calendar-clear-outline"
                  theme={theme}
                  placeholder="NOMINEE BIRTH DATE"
                  value={formData.nomineeDateOfBirth ? formData.nomineeDateOfBirth.split('-').reverse().join('/') : ''}
                  onChangeText={() => {}}
                />
              </View>
            </Pressable>

            {showNomineePicker && (
              <DateTimePicker
                value={formData.nomineeDateOfBirth ? new Date(formData.nomineeDateOfBirth) : new Date(1980, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onNomineeDateChange}
              />
            )}
          </View>
        </ScrollView>

        {/* Master Data Modals */}
        <Modal visible={showStateModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Choose State</Text>
              <FlatList
                style={{ flex: 1, width: '100%' }}
                data={statesList}
                keyExtractor={(item, index) => (item.id || index).toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.modalItem, { borderBottomColor: theme.border }]} 
                    onPress={() => handleStateSelect(item)}
                  >
                    <Text style={[styles.modalItemText, { color: theme.textPrimary }]}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => setShowStateModal(false)} style={styles.closeButton}>
                <Text style={{ color: theme.primary, fontWeight: '700' }}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showCityModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Choose City</Text>
              
              {isCitiesLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={{ marginTop: 12, color: theme.textSecondary, fontWeight: '600' }}>Fetching cities...</Text>
                </View>
              ) : (
                <FlatList
                  style={{ flex: 1, width: '100%' }}
                  data={citiesList}
                  keyExtractor={(item, index) => (item.id || index).toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.modalItem, { borderBottomColor: theme.border }]} 
                      onPress={() => handleCitySelect(item)}
                    >
                      <Text style={[styles.modalItemText, { color: theme.textPrimary }]}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
              
              <TouchableOpacity onPress={() => setShowCityModal(false)} style={styles.closeButton}>
                <Text style={{ color: theme.primary, fontWeight: '700' }}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 60) }]}>
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
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
    paddingHorizontal: 32,
    paddingTop: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '80%', // Fixed height prevents Android collapse
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
});
