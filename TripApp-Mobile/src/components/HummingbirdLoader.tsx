import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

type Props = {
  size?: number;
  color?: string;
};

export default function HummingbirdLoader({ size = 32, color = '#5eead4' }: Props) {
  const flap = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flapLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flap, { toValue: 1, duration: 140, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(flap, { toValue: 0, duration: 140, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    flapLoop.start();
    bobLoop.start();
    return () => {
      flapLoop.stop();
      bobLoop.stop();
    };
  }, [flap, bob]);

  const leftWing = flap.interpolate({ inputRange: [0, 1], outputRange: [-28, 32] });
  const rightWing = flap.interpolate({ inputRange: [0, 1], outputRange: [28, -32] });
  const bodyY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] });

  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Animated.View style={{ width: size, height: size, transform: [{ translateY: bodyY }] }}>
        <Svg viewBox="0 0 64 64" width={size} height={size}>
          <G>
            <Path d="M30 40 L24 54 L31 47 L34 55 L35 41" fill={color} opacity={0.9} />
            <Ellipse cx="32" cy="35" rx="6.5" ry="8.5" fill={color} />
            <Circle cx="36" cy="26" r="5.2" fill={color} />
            <Path d="M40 24.5 L58 20.5 L41 27.2 Z" fill={color} />
            <Circle cx="37.5" cy="25" r="0.9" fill="#0f1a1a" />
            <Ellipse cx="32.5" cy="36" rx="3.2" ry="5.2" fill={color} opacity={0.25} />
          </G>

          <AnimatedG originX="30" originY="30" rotation={leftWing}>
            <Path d="M30 30 C20 22, 8 20, 4 24 C10 25, 17 28, 28 33 Z" fill={color} opacity={0.85} />
          </AnimatedG>
          <AnimatedG originX="34" originY="30" rotation={rightWing}>
            <Path d="M34 30 C42 20, 54 18, 60 22 C54 24, 46 28, 36 33 Z" fill={color} opacity={0.75} />
          </AnimatedG>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
