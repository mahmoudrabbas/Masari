import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = '@pocket_tracker_avatar_uri';

type AvatarContextType = {
    uri: string | null;
    version: number;
    setAvatar: (u: string) => Promise<void>;
    removeAvatar: () => Promise<void>;
};

const AvatarContext = createContext<AvatarContextType | null>(null);

export const AvatarProvider = ({ children }: { children: React.ReactNode }) => {
    const [uri, setUri] = useState<string | null>(null);
    const [version, setVersion] = useState<number>(Date.now());

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) setUri(stored);
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    const setAvatar = async (u: string) => {
        try {
            setUri(u);
            setVersion(Date.now());
            await AsyncStorage.setItem(STORAGE_KEY, u);
        } catch (e) {
            // ignore
        }
    };

    const removeAvatar = async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            // ignore
        }
        setUri(null);
        setVersion(Date.now());
    };

    return (
        <AvatarContext.Provider value={{ uri, version, setAvatar, removeAvatar }}>
            {children}
        </AvatarContext.Provider>
    );
};

export function useAvatar() {
    const ctx = useContext(AvatarContext);
    if (!ctx) throw new Error('useAvatar must be used within AvatarProvider');
    return ctx;
}
