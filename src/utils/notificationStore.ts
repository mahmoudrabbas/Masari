import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredNotification = {
    id: string;
    title: string;
    body: string;
    date: string;
    read?: boolean;
};

const KEY = '@pocket_tracker_notifications_v1';

export async function addNotification(n: StoredNotification) {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        const list: StoredNotification[] = raw ? JSON.parse(raw) : [];
        list.unshift(n);
        await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
    } catch (e) {
        // ignore
    }
}

export async function getNotifications(): Promise<StoredNotification[]> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

export async function markAllRead() {
    try {
        const list = await getNotifications();
        const updated = list.map((l) => ({ ...l, read: true }));
        await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    } catch (e) {}
}

export async function clearNotifications() {
    try {
        await AsyncStorage.removeItem(KEY);
    } catch (e) {}
}
