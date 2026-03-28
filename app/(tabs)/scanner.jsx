import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions,
  Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen() {
  const router = useRouter();
  const [flashOn, setFlashOn] = useState(false);

  return (
    <View style={styles.container}>
      {/* Mock Camera Preview (Dark Gradient) */}
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header Overlay */}
      <SafeAreaView style={styles.overlayHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <TouchableOpacity 
            style={styles.flashBtn}
            onPress={() => setFlashOn(!flashOn)}
          >
            <Ionicons name={flashOn ? "flash" : "flash-off"} size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Scanning UI */}
      <View style={styles.scannerWrapper}>
        <View style={styles.scanFrame}>
          {/* Corner Borders */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          {/* Animated Scanning Line (Mock) */}
          <View style={styles.scanLine} />
        </View>
        <Text style={styles.hintText}>Align QR code within the frame to scan</Text>
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerAction}>
          <View style={styles.actionCircle}>
            <Ionicons name="image-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.actionLabel}>Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.footerAction}>
          <View style={styles.actionCircle}>
            <Ionicons name="apps-outline" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.actionLabel}>My QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: Platform.OS === 'android' ? 20 : 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#EAB308',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    right: '5%',
    height: 2,
    backgroundColor: '#EAB308',
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    opacity: 0.6,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 40,
    fontWeight: '600',
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 40,
  },
  footerAction: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.9,
  },
});
