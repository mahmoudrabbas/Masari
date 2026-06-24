import {
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
    useFonts,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import 'react-native-get-random-values';
import LoadingScreen from '../components/LoadingScreen';
import { getDb } from '../db/database';
import { AvatarProvider } from '../hooks/useAvatar';

I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [dbReady, setDbReady] = useState(false);

    let [fontsLoaded] = useFonts({
        IBMPlexSansArabic_400Regular,
        IBMPlexSansArabic_500Medium,
        IBMPlexSansArabic_600SemiBold,
        IBMPlexSansArabic_700Bold,
    });

    useEffect(() => {
        (async () => {
            await getDb();
            setDbReady(true);
        })();
    }, []);

    useEffect(() => {
        // Notifications initialization removed to avoid native EventEmitter
        // errors during app startup. Notifications are scheduled inside
        // db functions when needed and already guarded with try/catch.
    }, []);

    const onLayout = useCallback(async () => {
        if (fontsLoaded && dbReady) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, dbReady]);

    useEffect(() => {
        onLayout();
    }, [onLayout]);

    if (!fontsLoaded || !dbReady) {
        return <LoadingScreen />;
    }

    return (
        <>
            <StatusBar style="dark" />
            <AvatarProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                        name="wallet/[id]"
                        options={{ presentation: 'card' }}
                    />
                    <Stack.Screen
                        name="add-transaction"
                        options={{ presentation: 'modal' }}
                    />
                    <Stack.Screen
                        name="transfer"
                        options={{ presentation: 'modal' }}
                    />
                </Stack>
            </AvatarProvider>
        </>
    );
}
