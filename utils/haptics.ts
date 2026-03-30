import * as Haptics from "expo-haptics";

const isNative = process.env.EXPO_OS !== "web";

export function impactMedium() {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function impactLight() {
  if (isNative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function notifyWarning() {
  if (isNative) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

export function notifySuccess() {
  if (isNative) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}
