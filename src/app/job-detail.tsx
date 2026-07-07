import { Redirect, useLocalSearchParams } from 'expo-router';

// Legacy flat job-detail screen - superseded by /job/[id].
export default function LegacyJobDetailRedirect() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    return <Redirect href={id ? `/job/${id}` : '/(tabs)'} />;
}
