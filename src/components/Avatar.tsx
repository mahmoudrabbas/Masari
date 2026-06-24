import { Image, StyleSheet, View } from 'react-native';
import { useAvatar } from '../hooks/useAvatar';

export default function Avatar({ size = 36, style }: { size?: number; style?: any }) {
    const { uri, version } = useAvatar();

    if (uri) {
        return (
            <Image
                source={{ uri: uri + '?v=' + version }}
                style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
            />
        );
    }

    return (
        <View
            style={[
                styles.placeholder,
                { width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: '#cfcfcf',
    },
});
