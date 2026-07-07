import { Redirect } from 'expo-router';

// Legacy flat account screen - superseded by the profile tab.
export default function LegacyAccountRedirect() {
    return <Redirect href="/(tabs)/account" />;
}
