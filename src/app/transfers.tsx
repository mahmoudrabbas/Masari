import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAllTransfers } from '../db/transfers';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_MEDIUM,
    radius,
    spacing,
} from '../theme/theme';

type Transfer = {
    id: string;
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
};

export default function Transfers() {
    const [transfers, setTransfers] = useState<Transfer[]>([]);

    const load = useCallback(async () => {
        const list = await getAllTransfers();
        setTransfers(list);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
        >
            <Text style={styles.title}>سجل التحويلات</Text>

            {transfers.length === 0 ? (
                <Text style={styles.empty}>لا توجد تحويلات بعد</Text>
            ) : (
                transfers.map((t) => (
                    <View key={t.id} style={styles.item}>
                        <View style={styles.row}>
                            <Text style={styles.label}>من</Text>
                            <Text style={styles.value}>{t.fromWalletId}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>إلى</Text>
                            <Text style={styles.value}>{t.toWalletId}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>المبلغ</Text>
                            <Text style={styles.value}>
                                {t.amount.toLocaleString()} ج.م
                            </Text>
                        </View>
                        <Text style={styles.date}>{t.date}</Text>
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
    title: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 22,
        textAlign: 'center',
        marginBottom: spacing.md,
        marginTop: spacing.sm,
        color: colors.onSurface,
    },
    empty: {
        textAlign: 'center',
        color: colors.onSurfaceVariant,
        fontFamily: FONT_FAMILY,
        marginTop: spacing.lg,
    },
    item: {
        backgroundColor: colors.surfaceContainerLowest,
        padding: spacing.md,
        borderRadius: radius.lg,
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    label: { fontFamily: FONT_FAMILY, color: colors.onSurfaceVariant },
    value: { fontFamily: FONT_FAMILY_MEDIUM, color: colors.onSurface },
    date: {
        fontFamily: FONT_FAMILY,
        color: colors.onSurfaceVariant,
        textAlign: 'left',
        marginTop: spacing.xs,
    },
});
