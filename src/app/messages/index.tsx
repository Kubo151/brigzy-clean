import { Redirect } from 'expo-router';

// Duplicate of the Messages tab - redirect to the canonical (tabs) screen
// (which also has the people search). The /messages/[userId] chat threads
// are separate routes and unaffected.
export default function LegacyMessagesRedirect() {
    return <Redirect href="/(tabs)/messages" />;
}
