import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { Colors } from "@/constants/theme";

type Props = {
  size?: number;
  color?: string;
};

export function Spinner({ size = 24, color = Colors.light.tint }: Props) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(-360, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [rotation]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Circle
          cx="20"
          cy="20"
          r="15"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.1}
        />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, orbitStyle]}>
        <Svg width={size} height={size} viewBox="0 0 40 40">
          <Defs>
            <LinearGradient id="pp-trail" x1="1" y1="1" x2="0" y2="0">
              <Stop offset="0%" stopColor={color} stopOpacity={0} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </LinearGradient>
          </Defs>
          <G>
            <Path
              d="M 20 5 A 15 15 0 0 1 35 20"
              fill="none"
              stroke="url(#pp-trail)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <Circle cx="20" cy="5" r="4" fill={color} opacity={0.9} />
            <Circle cx="18.5" cy="3.5" r="0.7" fill={color} opacity={0.4} />
            <Circle cx="21.5" cy="4" r="0.7" fill={color} opacity={0.4} />
            <Circle cx="20" cy="6.5" r="0.7" fill={color} opacity={0.4} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
