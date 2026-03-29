import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const PageLoader = ({ message = "Loading...", isDarkMode = true }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.6, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={isDarkMode ? 'dark' : 'light'} />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.ring, animatedRingStyle]}>
             <LinearGradient
                colors={['#FFB800', 'transparent', '#FFB800']}
                style={styles.gradientRing}
             />
          </Animated.View>
          
          <View style={styles.centerLogo}>
             <View style={styles.bar1} />
             <View style={styles.bar2} />
             <View style={styles.bar3} />
          </View>
        </View>

        <Animated.Text style={[styles.message, { color: isDarkMode ? '#FFFFFF' : '#000000' }, animatedTextStyle]}>
          {message}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 184, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.6,
  },
  centerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bar1: {
    width: 8,
    height: 20,
    backgroundColor: '#FFB800',
    borderRadius: 4,
  },
  bar2: {
    width: 8,
    height: 40,
    backgroundColor: '#FFB800',
    borderRadius: 4,
  },
  bar3: {
    width: 8,
    height: 28,
    backgroundColor: '#FFB800',
    borderRadius: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default PageLoader;
