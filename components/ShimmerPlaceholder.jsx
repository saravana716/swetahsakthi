import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

const ShimmerPlaceholder = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style = {},
  shimmerColors = ['#E1E9EE', '#F2F8FC', '#E1E9EE'],
  isDarkMode = false
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Convert percentage strings to numeric pixel values for the animation
  const numericWidth = typeof width === 'string' 
    ? (width.includes('%') ? (parseFloat(width) / 100) * SCREEN_WIDTH : parseFloat(width))
    : width;

  useEffect(() => {
    const startAnimation = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startAnimation());
    };

    startAnimation();

    return () => animatedValue.stopAnimation();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-numericWidth, numericWidth],
  });

  const baseColor = isDarkMode ? '#1E293B' : '#E1E9EE';
  const highlightColor = isDarkMode ? '#334155' : '#F2F8FC';
  const colors = isDarkMode 
    ? [baseColor, highlightColor, baseColor] 
    : shimmerColors;

  return (
    <View 
      style={[
        styles.container, 
        { width, height, borderRadius, backgroundColor: baseColor }, 
        style
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
});

export default ShimmerPlaceholder;
