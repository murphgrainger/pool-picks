import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const RATIONALE_DECISION_KEY = "@poolpicks/push-rationale-decision-v1";

type RationaleDecision = "accepted" | "declined";

export async function getRationaleDecision(): Promise<RationaleDecision | null> {
  const value = await AsyncStorage.getItem(RATIONALE_DECISION_KEY);
  if (value === "accepted" || value === "declined") return value;
  return null;
}

export async function setRationaleDecision(decision: RationaleDecision) {
  await AsyncStorage.setItem(RATIONALE_DECISION_KEY, decision);
}

export async function getCurrentPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.status;
}

/**
 * Request push permission and resolve to the Expo push token if granted, null otherwise.
 * Caller should have shown a rationale UI before invoking this.
 */
export async function requestPermissionAndGetToken(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  return token.data;
}
