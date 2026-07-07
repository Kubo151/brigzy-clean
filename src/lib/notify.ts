import { Alert, Platform } from 'react-native';

type AlertButton = {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Cross-platform Alert.alert: React Native's Alert is a NO-OP on web, which
 * silently swallows every validation and error message in the browser. On web
 * this falls back to window.alert / window.confirm and still fires the button
 * callbacks the caller expects.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== 'web') {
        Alert.alert(title, message, buttons);
        return;
    }
    const text = message ? `${title}\n\n${message}` : title;
    if (!buttons || buttons.length <= 1) {
        window.alert(text);
        buttons?.[0]?.onPress?.();
    } else {
        const confirmed = window.confirm(text);
        const confirmBtn = buttons.find((b) => b.style !== 'cancel');
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        (confirmed ? confirmBtn : cancelBtn)?.onPress?.();
    }
}
