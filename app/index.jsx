import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from './context/LanguageContext';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Animated values for the three bars
  const bar1Height = useRef(new Animated.Value(1)).current;
  const bar2Height = useRef(new Animated.Value(1)).current;
  const bar3Height = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in text and logo
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Spinning circle animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Logo bars oscillation animation ("rise up and low")
    const createOscillation = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.5,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createOscillation(bar1Height, 0).start();
    createOscillation(bar2Height, 200).start();
    createOscillation(bar3Height, 400).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      router.replace('/get-started');
    });
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGlow} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.logoCircle, { transform: [{ rotate: spin }] }]}>
          <Animated.View style={[styles.chartContainer, { transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }) }] }]}>
            <Animated.View style={[styles.bar, styles.barLeft, { transform: [{ scaleY: bar1Height }] }]} />
            <Animated.View style={[styles.bar, styles.barCenter, { transform: [{ scaleY: bar2Height }] }]} />
            <Animated.View style={[styles.bar, styles.barRight, { transform: [{ scaleY: bar3Height }] }]} />
          </Animated.View>
        </Animated.View>

        <Text style={styles.title}>{t('splash')?.title || "Swarna Sakhi"}</Text>
        <Text style={styles.subtitle}>{t('splash')?.subtitle || "YOUR DIGITAL GOLD PARTNER"}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.loadingText}>Securing Connection...</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGlow: {
    position: 'absolute',
    top: '25%',
    width: Dimensions.get('window').width * 1.5,
    height: Dimensions.get('window').width * 1.5,
    borderRadius: Dimensions.get('window').width * 0.75,
    backgroundColor: '#B58529',
    opacity: 0.05,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: '#7A5B1C', 
    borderBottomColor: '#D4AF37', // Gradient-like border effect
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 44,
    gap: 8,
  },
  bar: {
    width: 14,
    backgroundColor: '#F3C343',
    borderRadius: 4,
    shadowColor: '#F3C343',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8, // Added for Android shadow
  },
  barLeft: {
    height: 24,
  },
  barCenter: {
    height: 44,
  },
  barRight: {
    height: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFDF5',
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 2.5,
    marginBottom: 80,
  },
  progressContainer: {
    width: width * 0.75,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F3C343',
    borderRadius: 2,
    shadowColor: '#F3C343',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
});
