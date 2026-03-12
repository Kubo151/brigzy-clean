import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Linking, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Navigation, MapPin } from 'lucide-react-native';
import { useColors } from '@/lib/useColors';
import type { AppColors } from '@/lib/useColors';

// ── Geocoding via Nominatim (free, no API key) ──
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
            { headers: { 'User-Agent': 'BrigzyApp/1.0' } }
        );
        const data = await res.json();
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        return null;
    } catch {
        return null;
    }
}

function buildMapHTML(lat: number, lng: number, label: string, isDark: boolean) {
    return `
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0}
  html,body,#map{width:100%;height:100%}
  .leaflet-control-attribution{display:none!important}
</style>
</head><body>
<div id="map"></div>
<script>
  var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${lat},${lng}],15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  var icon=L.divIcon({
    className:'',
    html:'<div style="width:32px;height:32px;background:#7C3AED;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
    iconSize:[32,32],iconAnchor:[16,32]
  });
  L.marker([${lat},${lng}],{icon:icon}).addTo(map);
</script>
</body></html>`;
}

interface JobLocationMapProps {
    location: string;
    height?: number;
    showOpenButton?: boolean;
}

export default function JobLocationMap({ location, height = 200, showOpenButton = true }: JobLocationMapProps) {
    const C = useColors();
    const isDark = C.text === '#FFFFFF';
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        geocodeAddress(location).then((result) => {
            if (mounted) { setCoords(result); setLoading(false); }
        });
        return () => { mounted = false; };
    }, [location]);

    const openInMaps = () => {
        const encoded = encodeURIComponent(location);
        if (Platform.OS === 'ios') {
            Linking.openURL(`maps://maps.apple.com/?q=${encoded}`).catch(() => {
                Linking.openURL(`https://maps.google.com/?q=${encoded}`);
            });
        } else {
            Linking.openURL(`geo:0,0?q=${encoded}`).catch(() => {
                Linking.openURL(`https://maps.google.com/?q=${encoded}`);
            });
        }
    };

    const st = makeStyles(C);

    if (loading) {
        return (
            <View style={[st.container, { height }]}>
                <ActivityIndicator color={C.purple} />
            </View>
        );
    }

    if (!coords) {
        return (
            <Pressable onPress={openInMaps} style={({ pressed }) => [st.fallbackCard, pressed && { opacity: 0.8 }]}>
                <View style={st.fallbackIconWrap}>
                    <MapPin size={24} color={C.purple} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={st.fallbackAddress}>{location}</Text>
                    <Text style={st.fallbackHint}>Kliknutím otvoríte v mapách</Text>
                </View>
                <Navigation size={18} color={C.purple} />
            </Pressable>
        );
    }

    const html = buildMapHTML(coords.lat, coords.lng, location, isDark);

    return (
        <View style={[st.container, { height }]}>
            <WebView
                source={{ html }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                originWhitelist={['*']}
            />

            {/* Address overlay */}
            <View style={st.overlay}>
                <View style={st.overlayContent}>
                    <MapPin size={16} color={C.purple} />
                    <Text style={st.overlayText} numberOfLines={1}>{location}</Text>
                </View>
                {showOpenButton && (
                    <Pressable onPress={openInMaps} style={({ pressed }) => [st.navBtn, pressed && { opacity: 0.8 }]}>
                        <Navigation size={16} color="#FFF" />
                        <Text style={st.navBtnText}>Navigovať</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
    container: {
        borderRadius: 16, overflow: 'hidden',
        backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center',
    },
    overlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: C.text === '#FFFFFF' ? 'rgba(20,20,32,0.92)' : 'rgba(255,255,255,0.92)',
    },
    overlayContent: {
        flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 10,
    },
    overlayText: {
        fontSize: 13, fontWeight: '600', color: C.text, flex: 1,
    },
    navBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: C.purple, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    },
    navBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
    fallbackCard: {
        flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14,
        backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    },
    fallbackIconWrap: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: C.purpleDim, alignItems: 'center', justifyContent: 'center',
    },
    fallbackAddress: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
    fallbackHint: { fontSize: 12, color: C.secondaryLabel },
});
