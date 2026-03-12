import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';

interface AvatarProps {
    imageUrl?: string | null;
    name?: string;
    size?: number;
    onPress?: () => void;
    showBorder?: boolean;
    isDark?: boolean;
}

export default function Avatar({
    imageUrl,
    name = '',
    size = 40,
    onPress,
    showBorder = false,
    isDark = false,
}: AvatarProps) {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Get initials from name (first letter of first and last name)
    const getInitials = () => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    // Generate color based on name
    const getBackgroundColor = () => {
        if (!name) return '#7C3AED';
        const colors = [
            '#7C3AED', // purple
            '#3B82F6', // blue
            '#10B981', // green
            '#F59E0B', // amber
            '#EF4444', // red
            '#EC4899', // pink
            '#8B5CF6', // violet
            '#06B6D4', // cyan
        ];
        const charCode = name.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    const showImage = imageUrl && !imageError;

    const containerStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: showImage ? 'transparent' : getBackgroundColor(),
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        overflow: 'hidden' as const,
        ...(showBorder && {
            borderWidth: 2,
            borderColor: isDark ? '#3F3F46' : '#E5E7EB',
        }),
    };

    const content = (
        <View style={containerStyle}>
            {showImage ? (
                <>
                    <Image
                        key={imageUrl}
                        source={{ uri: imageUrl }}
                        style={{ width: size, height: size }}
                        onLoadStart={() => setImageLoading(true)}
                        onLoadEnd={() => setImageLoading(false)}
                        onError={() => {
                            setImageError(true);
                            setImageLoading(false);
                        }}
                    />
                    {imageLoading && (
                        <View
                            style={{
                                position: 'absolute',
                                width: size,
                                height: size,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: getBackgroundColor(),
                            }}
                        >
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        </View>
                    )}
                </>
            ) : (
                <Text
                    style={{
                        color: '#FFFFFF',
                        fontSize: size * 0.4,
                        fontWeight: '600',
                    }}
                >
                    {getInitials()}
                </Text>
            )}
        </View>
    );

    if (onPress) {
        return (
            <Pressable onPress={onPress} style={{ opacity: 1 }}>
                {content}
            </Pressable>
        );
    }

    return content;
}
