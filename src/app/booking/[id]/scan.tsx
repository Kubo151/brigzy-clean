import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, CheckCircle, XCircle, CameraOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useClay } from '@/lib/useClay';
import { useText } from '@/lib/useText';
import { supabase } from '@/lib/supabase';
import { ClaySurface, ClayButton } from '@/components/clay';
import { goBack } from '@/lib/nav';

// S6 (poster side) — scan the worker's rotating QR to record check-in/out.
// Web only for now (getUserMedia + jsQR); native falls back to the manual
// check-in/out buttons already on the booking hub.

type ScanState = 'scanning' | 'success' | 'error' | 'camera_denied';

export default function QrScanScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const C = useClay();
    const text = useText();

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const busyRef = useRef(false);

    const [state, setState] = useState<ScanState>('scanning');
    const [successInfo, setSuccessInfo] = useState<{ kind: string; time: string; hasGps: boolean } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const stopCamera = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    const getGps = useCallback((): Promise<{ lat: number; lng: number } | null> => {
        return new Promise((resolve) => {
            if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
            const timer = setTimeout(() => resolve(null), 3000);
            navigator.geolocation.getCurrentPosition(
                (pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
                () => { clearTimeout(timer); resolve(null); },
                { timeout: 2800 },
            );
        });
    }, []);

    const handleDecoded = useCallback(async (raw: string) => {
        if (busyRef.current || !id) return;
        busyRef.current = true;
        try {
            const parsed = JSON.parse(raw);
            const nonce = parsed?.n;
            if (!nonce) throw new Error('bad_payload');

            const gps = await getGps();
            const { data, error } = await supabase.functions.invoke('attendance', {
                body: { booking_id: id, nonce, lat: gps?.lat, lng: gps?.lng },
            });
            if (error || data?.error) {
                const code = data?.error ?? 'internal_error';
                const msg = code === 'nonce_expired' ? text.qrExpiredError
                    : code === 'wrong_booking' ? text.qrWrongBookingError
                        : code === 'nonce_already_used' ? text.qrUsedError
                            : text.qrGenericError;
                setErrorMsg(msg);
                setState('error');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setTimeout(() => { setState('scanning'); busyRef.current = false; }, 2200);
                return;
            }
            stopCamera();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSuccessInfo({
                kind: data.kind === 'check_in' ? text.scanSuccessCheckIn : text.scanSuccessCheckOut,
                time: new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }),
                hasGps: !!gps,
            });
            setState('success');
            setTimeout(() => { goBack(); }, 2000);
        } catch (e) {
            console.error('❌ [QrScan] decode failed:', e);
            setErrorMsg(text.qrGenericError);
            setState('error');
            setTimeout(() => { setState('scanning'); busyRef.current = false; }, 1800);
        }
    }, [id, text, getGps, stopCamera]);

    useEffect(() => {
        if (Platform.OS !== 'web') return;
        let cancelled = false;

        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                const jsQR = (await import('jsqr')).default;
                const canvas = canvasRef.current ?? document.createElement('canvas');
                canvasRef.current = canvas;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                const tick = () => {
                    if (cancelled) return;
                    const video = videoRef.current;
                    if (video && ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code?.data && !busyRef.current) {
                            handleDecoded(code.data);
                        }
                    }
                    rafRef.current = requestAnimationFrame(tick);
                };
                rafRef.current = requestAnimationFrame(tick);
            } catch (e) {
                console.error('❌ [QrScan] camera denied:', e);
                if (!cancelled) setState('camera_denied');
            }
        })();

        return () => { cancelled = true; stopCamera(); };
    }, [handleDecoded, stopCamera]);

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: '#000' }]} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); stopCamera(); goBack(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.94 }] }]}>
                    <ClaySurface radius={14} style={{ width: 42, height: 42 }} contentStyle={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={20} color={C.text} strokeWidth={2.2} />
                    </ClaySurface>
                </Pressable>
                <Text style={styles.headerTitle}>{text.scanQrTitle}</Text>
            </View>

            {Platform.OS === 'web' ? (
                <View style={styles.cameraWrap}>
                    {/* eslint-disable-next-line react/no-unknown-property */}
                    <video ref={videoRef as any} playsInline muted style={webVideoStyle as any} />
                    <View pointerEvents="none" style={styles.viewfinder} />
                    {state === 'scanning' && (
                        <Text style={styles.hint}>{text.scanQrHint}</Text>
                    )}
                    {state === 'success' && successInfo && (
                        <View style={[styles.overlay, { backgroundColor: 'rgba(16,185,129,0.92)' }]}>
                            <CheckCircle size={64} color="#fff" strokeWidth={1.8} />
                            <Text style={styles.overlayTitle}>{successInfo.kind}</Text>
                            <Text style={styles.overlaySub}>{successInfo.time}</Text>
                        </View>
                    )}
                    {state === 'error' && (
                        <View style={[styles.overlay, { backgroundColor: 'rgba(239,68,68,0.92)' }]}>
                            <XCircle size={56} color="#fff" strokeWidth={1.8} />
                            <Text style={styles.overlayTitle}>{errorMsg}</Text>
                        </View>
                    )}
                    {state === 'camera_denied' && (
                        <View style={styles.overlay}>
                            <CameraOff size={56} color="#fff" strokeWidth={1.6} />
                            <Text style={styles.overlayTitle}>{text.cameraDenied}</Text>
                            <Text style={styles.overlaySub}>{text.cameraDeniedHint}</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.cameraWrap}>
                    <CameraOff size={56} color="#fff" strokeWidth={1.6} />
                    <Text style={[styles.overlayTitle, { marginTop: 16 }]}>{text.cameraDeniedHint}</Text>
                    <ClayButton label={text.closeAction} onPress={() => goBack()} style={{ marginTop: 20 }} />
                </View>
            )}
        </SafeAreaView>
    );
}

const webVideoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff', flex: 1, letterSpacing: -0.3 },
    cameraWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    viewfinder: {
        position: 'absolute', width: 240, height: 240, borderRadius: 24,
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)',
    },
    hint: { position: 'absolute', bottom: 40, color: '#fff', fontSize: 14, fontWeight: '700' },
    overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
    overlayTitle: { color: '#fff', fontSize: 19, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
    overlaySub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
