import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { useColors } from '@/lib/useColors';

interface Props {
    location: string;
    height?: number;
    showOpenButton?: boolean;
}

export default function JobLocationMap({ location, height = 200, showOpenButton = true }: Props) {
    const C = useColors();
    const encodedLocation = encodeURIComponent(location);
    const mapsUrl = `https://maps.google.com/?q=${encodedLocation}`;
    const embedUrl = `https://maps.google.com/maps?q=${encodedLocation}&output=embed&z=15`;

    return (
        <View style={[styles.container, { height, borderColor: C.border }]}>
            <iframe
                src={embedUrl}
                style={{ border: 0, width: '100%', height: '100%' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={location}
            />
            <View style={[styles.overlay, { backgroundColor: C.text === '#FFFFFF' ? 'rgba(20,20,32,0.92)' : 'rgba(255,255,255,0.92)' }]}>
                <View style={styles.overlayContent}>
                    <MapPin size={16} color={C.purple} />
                    <Text style={[styles.overlayText, { color: C.text }]} numberOfLines={1}>{location}</Text>
                </View>
                {showOpenButton && (
                    <Pressable onPress={() => Linking.openURL(mapsUrl)} style={[styles.navBtn, { backgroundColor: C.purple }]}>
                        <Navigation size={16} color="#FFF" />
                        <Text style={styles.navBtnText}>Navigovať</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    overlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 10,
    },
    overlayContent: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 10 },
    overlayText: { fontSize: 13, fontWeight: '600', flex: 1 },
    navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    navBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
});
