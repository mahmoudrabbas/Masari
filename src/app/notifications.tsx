import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_MEDIUM,
    radius,
    spacing,
} from '../theme/theme';
import {
    clearNotifications,
    getNotifications,
    markAllRead,
    StoredNotification,
} from '../utils/notificationStore';

export default function NotificationsScreen() {
    const [items, setItems] = useState<StoredNotification[]>([]);

    const load = useCallback(async () => {
        const list = await getNotifications();
        setItems(list);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const handleClear = async () => {
        await clearNotifications();
        setItems([]);
    };

    const handleMarkAll = async () => {
        await markAllRead();
        load();
    };

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
        >
            <View style={styles.headerRow}>
                <Text style={styles.title}>الإشعارات</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={handleMarkAll}
                        style={styles.actionBtn}
                    >
                        <Text style={styles.actionText}>تعليم الكل كمقروء</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleClear}
                        style={styles.actionBtn}
                    >
                        <Text style={styles.actionText}>مسح</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {items.length === 0 ? (
                <Text style={styles.empty}>لا توجد إشعارات بعد</Text>
            ) : (
                items.map((n) => (
                    <View
                        key={n.id}
                        style={[styles.item, n.read ? {} : styles.unread]}
                    >
                        <Text style={styles.itemTitle}>{n.title}</Text>
                        <Text style={styles.itemBody}>{n.body}</Text>
                        <Text style={styles.itemDate}>
                            {new Date(n.date).toLocaleString()}
                        </Text>
                    </View>
                ))
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.containerMargin },
    headerRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerActions: { flexDirection: 'row-reverse', gap: 8 },
    actionBtn: { marginLeft: 8 },
    actionText: { color: colors.primary, fontFamily: FONT_FAMILY_MEDIUM },
    title: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 20,
        textAlign: 'right',
        color: colors.onSurface,
    },
    empty: {
        textAlign: 'center',
        color: colors.onSurfaceVariant,
        marginTop: spacing.lg,
    },
    item: {
        backgroundColor: colors.surfaceContainerLowest,
        padding: spacing.md,
        borderRadius: radius.lg,
        marginBottom: spacing.md,
    },
    unread: { borderLeftWidth: 4, borderLeftColor: colors.primary },
    itemTitle: { fontFamily: FONT_FAMILY_MEDIUM, color: colors.onSurface },
    itemBody: {
        fontFamily: FONT_FAMILY,
        color: colors.onSurfaceVariant,
        marginTop: spacing.xs,
    },
    itemDate: {
        fontFamily: FONT_FAMILY,
        color: colors.onSurfaceVariant,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
});
