// app/_layout.js
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserProvider } from "../contexts/UserContext";

export default function RootLayout() {
  return (
    // <SafeAreaView style={{ flex: 1 }}>
      <UserProvider>
        <Stack screenOptions={{ headerShown: true, headerTitle: "" }} />
      </UserProvider>
    // </SafeAreaView>
  );
}
