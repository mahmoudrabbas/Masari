import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAvatar } from '../hooks/useAvatar';

export default function AvatarPicker({
    size = 36,
    style,
}: {
    size?: number;
    style?: any;
}) {
    const { uri, version, setAvatar, removeAvatar } = useAvatar();
    const [, setLocalVersion] = useState<number>(Date.now());

    // keep local version state in sync (used only to force re-render when provider isn't used directly)
    useEffect(() => {
        setLocalVersion(version);
    }, [version]);

    const pickImage = async () => {
        try {
            const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return;

            // Prefer the new API `ImagePicker.MediaType` when available.
            // Use the new lowercase media type value ('images') as a safe fallback
            // so we don't trigger the deprecated `MediaTypeOptions` branch.
            let mediaTypesToUse: any = 'images';
            if ((ImagePicker as any).MediaType) {
                mediaTypesToUse = (ImagePicker as any).MediaType.Images;
            }

            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaTypesToUse as any,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!res.canceled && res.assets && res.assets.length > 0) {
                const picked = res.assets[0].uri;
                await setAvatar(picked);
            }
        } catch (e) {
            // ignore errors
        }
    };

    return (
        <TouchableOpacity
            onPress={pickImage}
            onLongPress={async () => {
                // remove avatar on long press
                await removeAvatar();
            }}
            activeOpacity={0.8}
            style={[
                styles.wrap,
                { width: size, height: size, borderRadius: size / 2 },
                style,
            ]}
        >
            {uri ? (
                <Image
                    source={{ uri: uri + '?v=' + version }}
                    style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                    }}
                />
            ) : (
                <View
                    style={[
                        styles.placeholder,
                        {
                            width: size - 8,
                            height: size - 8,
                            borderRadius: (size - 8) / 2,
                        },
                    ]}
                />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wrap: {
        overflow: 'hidden',
        backgroundColor: '#e6e6e6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        backgroundColor: '#cfcfcf',
    },
});
