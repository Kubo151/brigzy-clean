import { Redirect } from 'expo-router';

// Legacy flat home screen - superseded by the tab navigator.
export default function LegacyHomeRedirect() {
    return <Redirect href="/(tabs)" />;
}
