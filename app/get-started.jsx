import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from './context/LanguageContext';

const { width, height } = Dimensions.get('window');

// Local gold video asset
const GOLD_VIDEO_SOURCE = require('../assets/images/bg.mp4');
const LOGO_SOURCE = require('../assets/images/Logo.jpeg');

export default function GetStartedScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation states
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(30)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerSlide = useRef(new Animated.Value(40)).current;

  // Video Player configuration
  const player = useVideoPlayer(GOLD_VIDEO_SOURCE, (player) => {
    player.loop = true;
    player.play();
    player.muted = true; // Essential for auto-play on some platforms
  });

  useEffect(() => {
    // Orchestrated entrance animations
    Animated.stagger(250, [
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(subtitleSlide, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(footerOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(footerSlide, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/(tabs)');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* High-Performance Looping Video Background */}
      <VideoView
        style={styles.videoBackground}
        player={player}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
        nativeControls={false}
      />
      
      {/* Refined Gradient Overlay for contrast and luxury feel */}
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
        style={styles.gradientOverlay}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Animated Top Header Logo */}
        <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.logoBox}>
            <Image 
              source={LOGO_SOURCE} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerLogoText}>{t('splash')?.title || "Swarna Sakhi"}</Text>
          <Text style={styles.headerSubLogoText}>DIGITAL VAULT</Text>
        </Animated.View>

        {/* Animated Central Content */}
        <View style={styles.centerContent}>
          <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleSlide }] }]}>
            {t('get_started')?.title?.split(' ').slice(0,2).join(' ') + '\n' + t('get_started')?.title?.split(' ').slice(2).join(' ') || "Secure Your\nWealth Digitally"}
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity, transform: [{ translateY: subtitleSlide }] }]}>
            {t('get_started')?.subtitle || "Buy, Sell & save 24k Digital Gold instantly at live market prices."}
          </Animated.Text>
        </View>

        {/* Animated Bottom Actions */}
        <Animated.View style={[styles.footer, { opacity: footerOpacity, transform: [{ translateY: footerSlide }] }]}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleGetStarted}
            disabled={isLoading}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#DEAA31', '#B6820F']}
              style={styles.getStartedButton}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.getStartedText}>{t('get_started')?.btn || "GET STARTED"}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerInfo}>
             <Text style={styles.footerInfoTextMain}>Login or create account with your mobile number</Text>
             <Text style={styles.footerInfoText}>TRUSTED BY 10K+ PRIVATE INVESTORS</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DEAA31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerLogoText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerSubLogoText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
    opacity: 0.8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 44,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '85%',
    opacity: 0.9,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonWrapper: {
    width: '100%',
    shadowColor: '#DEAA31',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  getStartedButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footerInfo: {
    alignItems: 'center',
    gap: 12,
  },
  footerInfoTextMain: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  footerInfoText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.6,
  },
});
