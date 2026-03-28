import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { markSplashFinished } = useAuth();
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Animated values for the three bars
  const bar1Scale = useRef(new Animated.Value(1)).current;
  const bar2Scale = useRef(new Animated.Value(1)).current;
  const bar3Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Bars oscillation animation
    const animateBar = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.4,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    animateBar(bar1Scale, 0).start();
    animateBar(bar2Scale, 250).start();
    animateBar(bar3Scale, 500).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      // Just mark it as finished. 
      // The _layout.jsx global guard will automatically route the user based on their true Auth state.
      markSplashFinished();
    });
  }, []); // Empty dependency array ensures the splash animation never restarts mid-way

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Exact Background Glow from Image 12:15 (Top-left) */}
      <LinearGradient
        colors={['#2D1B08', '#000000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.6 }}
      />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
            <View style={styles.logoRing} />
            <View style={styles.barsRow}>
                <Animated.View style={[styles.bar, styles.bar1, { transform: [{ scaleY: bar1Scale }] }]} />
                <Animated.View style={[styles.bar, styles.bar2, { transform: [{ scaleY: bar2Scale }] }]} />
                <Animated.View style={[styles.bar, styles.bar3, { transform: [{ scaleY: bar3Scale }] }]} />
            </View>
        </View>

        {/* Brand Section */}
        <View style={styles.textContainer}>
            <Text style={styles.title}>{t('splash')?.title || "Swarna Sakhi"}</Text>
            <Text style={styles.subtitle}>{t('splash')?.subtitle || "YOUR DIGITAL GOLD PARTNER"}</Text>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
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
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 45,
  },
  logoRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.2,
    borderColor: 'rgba(122, 91, 28, 0.3)', 
    borderTopColor: 'rgba(255, 184, 0, 0.5)',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bar: {
    width: 16,
    backgroundColor: '#FFB800', 
    borderRadius: 3,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  bar1: {
    height: 30,
  },
  bar2: {
    height: 60,
  },
  bar3: {
    height: 42,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  title: {
    fontSize: 40,
    fontWeight: '800', 
    color: '#FFFFFF', 
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A8A', 
    letterSpacing: 3, 
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  progressSection: {
    width: width * 0.72,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 3, 
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFB800', 
    borderRadius: 2,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  loadingText: {
    fontSize: 12,
    color: '#666666', 
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

