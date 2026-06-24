import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { colors, FONT_FAMILY_SEMIBOLD, radius, spacing } from '../theme/theme';

export default function LoadingScreen() {
    const scale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.95,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [scale]);

    return (
        <View style={s.container}>
            <Animated.View style={[s.logoWrap, { transform: [{ scale }] }]}>
                <Image
                    source={require('../../assets/images/logo-glow.png')}
                    style={s.logo}
                    resizeMode="contain"
                />
            </Animated.View>
            <Text style={s.title}>مصاريفي</Text>
            <Text style={s.subtitle}>تابع مصاريفك بسهولة وبسرعة</Text>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
    },
    logoWrap: {
        width: 160,
        height: 160,
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    logo: {
        width: 140,
        height: 140,
    },
    title: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 28,
        color: colors.onSurface,
        marginTop: 8,
    },
    subtitle: {
        fontFamily: 'IBMPlexSansArabic_400Regular',
        fontSize: 14,
        color: colors.onSurfaceVariant,
        marginTop: 6,
    },
});
