import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Colors } from "@/constants/theme";

type HeaderProps = {
  title: string;
  canGoBack: boolean;
  onBack?: () => void;
  right?: ReactNode;
};

export function Header({ title, canGoBack, onBack, right }: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <View style={styles.side}>
          {canGoBack && (
            <Pressable hitSlop={12} onPress={onBack} style={styles.iconBtn}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Path
                  d="M15 18 L9 12 L15 6"
                  stroke={Colors.light.tint}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </Pressable>
          )}
        </View>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.light.background },
  bar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  side: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sideRight: { alignItems: "center" },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  title: {
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: "700",
  },
});
