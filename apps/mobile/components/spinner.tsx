import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
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
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [{ rotate }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <LinearGradient id="pp-trail" x1="1" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor={color} stopOpacity={0} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.6} />
          </LinearGradient>
        </Defs>
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
  );
}
