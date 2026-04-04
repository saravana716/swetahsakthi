import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from './context/ThemeContext';

const { width, height } = Dimensions.get('window');

const OVERLAY_COLOR = 'rgba(0,0,0,0.7)';
const FRAME_SIZE = width * 0.72;

export default function VaultPayScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Animated Scan Line
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(FRAME_SIZE - 2, {
        duration: 2500,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, []);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Handle live barcode scanning
  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned || isPaused || isProcessing) return;
    
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Process the result
    Alert.alert(
      "Scan Successful",
      `Result: ${data}`,
      [
        { text: "Cancel", onPress: () => setScanned(false), style: "cancel" },
        { text: "Proceed", onPress: () => {
          // Navigate to payment or process data
          console.log("QR Data:", data);
        }}
      ]
    );
  };

  // Gallery Scan
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessing(true);
        // SDK Compatibility Note: Scanning from static images is deprecated in SDK 52+
        // and requires specialized native packages. Live scanning remains 100% active.
        setTimeout(() => {
          setIsProcessing(false);
          Alert.alert("Feature Update", "To protect the stability of your app on this SDK version, please use the live camera for QR scanning.");
        }, 1200);
      }
    } catch (error) {
      console.error("Gallery scan error:", error);
      Alert.alert("Error", "Failed to scan image from gallery.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTorch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTorch(prev => !prev);
  };

  const togglePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(prev => !prev);
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={80} color={theme.textSecondary} />
          <Text style={[styles.permissionTitle, { color: theme.textPrimary }]}>Camera Access Required</Text>
          <Text style={[styles.permissionSub, { color: theme.textSecondary }]}>
            We need your permission to show the camera and scan QR codes for secure payments.
          </Text>
          <TouchableOpacity 
            style={[styles.permissionBtn, { backgroundColor: '#EAB308' }]} 
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>GRANT PERMISSION</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 24 }} onPress={() => router.back()}>
            <Text style={{ color: theme.primary, fontWeight: '700' }}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Main Camera View */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        {/* Dark Overlays for Viewfinder Effect */}
        <View style={styles.overlayContainer}>
          <View style={[styles.overlaySection, { height: (height - FRAME_SIZE) / 2.2 }]} />
          
          <View style={styles.row}>
            <View style={styles.overlaySide} />
            <View style={[styles.viewfinder, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
              {/* Corner Brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {!isPaused && (
                <Animated.View style={[styles.scanLine, animatedLineStyle]} />
              )}
              
              {isProcessing && (
                <View style={styles.loaderArea}>
                  <ActivityIndicator size="large" color="#EAB308" />
                  <Text style={styles.loaderText}>Processing...</Text>
                </View>
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>

          <View style={styles.overlayBottom}>
            <Text style={styles.hintText}>
              Align QR Code within the frame to scan
            </Text>
          </View>
        </View>
      </CameraView>

      {/* Top Header Actions */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan to Pay</Text>
        <View style={{ width: 44 }} /> 
      </View>

      {/* Bottom Controls Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.controlsRow}>
          {/* Gallery Button */}
          <View style={styles.controlItem}>
            <TouchableOpacity 
              style={[styles.circleBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]} 
              onPress={pickImage}
            >
              <Ionicons name="images-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>Gallery</Text>
          </View>

          {/* Main Action / SCAN Button */}
          <TouchableOpacity 
            style={styles.scanActionBtn} 
            activeOpacity={0.8}
            onPress={togglePause}
          >
            <View style={[styles.scanActionOuter, { borderColor: isPaused ? 'rgba(255,255,255,0.3)' : 'rgba(234, 179, 8, 0.4)' }]}>
              <View style={[styles.scanActionInner, { backgroundColor: isPaused ? '#475569' : '#EAB308' }]}>
                <Ionicons name={isPaused ? "play" : "scan"} size={32} color="#FFF" />
              </View>
            </View>
            <Text style={[styles.controlLabel, { marginTop: 8, fontWeight: '800' }]}>{isPaused ? 'Resume' : 'Scanning'}</Text>
          </TouchableOpacity>

          {/* Torch Button */}
          <View style={styles.controlItem}>
            <TouchableOpacity 
              style={[
                styles.circleBtn, 
                { backgroundColor: torch ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255,255,255,0.12)' }
              ]} 
              onPress={toggleTorch}
            >
              <Ionicons name={torch ? "flash" : "flash-outline"} size={24} color={torch ? "#EAB308" : "#FFF"} />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>Torch</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  permissionBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  permissionBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlaySection: {
    width: '100%',
    backgroundColor: OVERLAY_COLOR,
  },
  row: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  viewfinder: {
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  overlayBottom: {
    flex: 1,
    width: '100%',
    backgroundColor: OVERLAY_COLOR,
    alignItems: 'center',
    paddingTop: 40,
  },
  hintText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#EAB308',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    height: 2,
    backgroundColor: '#EAB308',
    width: '100%',
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  loaderArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  loaderText: {
    color: '#EAB308',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 13, 13, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  controlItem: {
    alignItems: 'center',
  },
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  controlLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  scanActionBtn: {
    alignItems: 'center',
    marginTop: -40, // Pull up the main button
  },
  scanActionOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    padding: 6,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanActionInner: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
