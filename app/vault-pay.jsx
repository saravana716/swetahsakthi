import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from './context/ThemeContext';

const { width, height } = Dimensions.get('window');

const OVERLAY_COLOR = 'rgba(0,0,0,0.65)';
const FRAME_SIZE = width * 0.7;

export default function VaultPayScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const [flash, setFlash] = useState(false);

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash(f => !f);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={22} color="#FFF" />
      </TouchableOpacity>

      {/* Camera Area */}
      <View style={styles.cameraArea}>
        {/* Simulated Camera Background */}
        <View style={styles.cameraBg}>
          {/* Top Overlay */}
          <View style={[styles.overlayTop, { height: (height - FRAME_SIZE) / 2.5, backgroundColor: OVERLAY_COLOR }]} />

          {/* Middle Row */}
          <View style={styles.middleRow}>
            <View style={[styles.overlaySide, { backgroundColor: OVERLAY_COLOR }]} />

            {/* QR Frame */}
            <View style={[styles.qrFrame, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
              {/* Gold Corner Brackets */}
              <View style={[styles.corner, styles.cornerTL, { borderColor: '#EAB308' }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: '#EAB308' }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: '#EAB308' }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: '#EAB308' }]} />

              {/* Scan Line */}
              <View style={styles.scanLine} />

              {/* Mock QR Placeholder Icon */}
              <View style={styles.qrMockContent}>
                <Ionicons name="play" size={64} color="rgba(255,255,255,0.15)" />
              </View>

              {/* Horizontal gold divider */}
              <View style={[styles.frameDivider, { backgroundColor: '#EAB308' }]} />
            </View>

            <View style={[styles.overlaySide, { backgroundColor: OVERLAY_COLOR }]} />
          </View>

          {/* Bottom Overlay */}
          <View style={[styles.overlayBottom, { backgroundColor: OVERLAY_COLOR }]}>
            <Text style={styles.scanHint}>Align QR Code within frame to pay from Vault</Text>
          </View>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={[styles.bottomBar, { backgroundColor: isDarkMode ? '#0F172A' : '#1E1E1E' }]}>
        {/* Gallery */}
        <TouchableOpacity style={styles.controlBtn} onPress={() => {}}>
          <View style={[styles.controlCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Ionicons name="image-outline" size={24} color="#FFF" />
          </View>
          <Text style={styles.controlLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Capture / Scan */}
        <TouchableOpacity style={styles.captureWrapper} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}>
          <View style={styles.captureOuter}>
            <View style={[styles.captureInner, { backgroundColor: '#EAB308' }]}>
              <View style={styles.captureCenter} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Flash */}
        <TouchableOpacity style={styles.controlBtn} onPress={toggleFlash}>
          <View style={[styles.controlCircle, { backgroundColor: flash ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.1)' }]}>
            <Ionicons name={flash ? 'flash' : 'flash-outline'} size={24} color={flash ? '#EAB308' : '#FFF'} />
          </View>
          <Text style={styles.controlLabel}>Flash</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 60,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraArea: {
    flex: 1,
  },
  cameraBg: {
    flex: 1,
    backgroundColor: '#2a2a2a',
  },
  overlayTop: {
    width: '100%',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlaySide: {
    flex: 1,
    height: FRAME_SIZE,
  },
  qrFrame: {
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  frameDivider: {
    position: 'absolute',
    bottom: FRAME_SIZE / 2,
    left: 0,
    right: 0,
    height: 1.5,
    opacity: 0.7,
  },
  scanLine: {
    position: 'absolute',
    top: FRAME_SIZE * 0.45,
    left: '10%',
    right: '10%',
    height: 1,
    backgroundColor: 'rgba(234,179,8,0.5)',
  },
  qrMockContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBottom: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 32,
  },
  scanHint: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  controlBtn: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  controlCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  captureWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  captureOuter: {
    padding: 4,
    borderRadius: 100,
    backgroundColor: 'rgba(234,179,8,0.2)',
  },
  captureInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureCenter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
});
