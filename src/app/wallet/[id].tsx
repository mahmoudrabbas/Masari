import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import TransactionItem from '../../components/TransactionItem';
import { TransactionRow, WalletRow } from '../../db/database';
import { getTransactionsByWallet } from '../../db/transactions';
import { getWalletById } from '../../db/wallets';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_SEMIBOLD,
    radius,
    spacing,
} from '../../theme/theme';

export default function WalletDetails() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [wallet, setWallet] = useState<WalletRow | null>(null);
    const [transactions, setTransactions] = useState<TransactionRow[]>([]);

    const load = useCallback(async () => {
        if (!id) return;
        const w = await getWalletById(id);
        const txns = await getTransactionsByWallet(id);
        setWallet(w);
        setTransactions(txns);
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    if (!wallet) return null;

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ChevronRight color={colors.onSurface} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{wallet.name}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>الرصيد الحالي</Text>
                <Text style={styles.balanceValue}>
                    {wallet.balance.toLocaleString()} ج.م
                </Text>
            </View>

            <Text style={styles.sectionTitle}>سجل المعاملات</Text>

            {transactions.length === 0 ? (
                <Text style={styles.emptyText}>
                    لا توجد معاملات في هذه المحفظة
                </Text>
            ) : (
                transactions.map((t) => (
                    <TransactionItem
                        key={t.id}
                        description={t.description}
                        category={t.category}
                        date={t.date}
                        amount={t.amount}
                        type={t.type}
                    />
                ))
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.containerMargin },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
    },
    headerTitle: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 18,
        color: colors.onSurface,
    },
    balanceCard: {
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    balanceLabel: {
        fontFamily: FONT_FAMILY,
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
    },
    balanceValue: {
        fontFamily: FONT_FAMILY_BOLD,
        color: '#fff',
        fontSize: 30,
        marginTop: spacing.xs,
    },
    sectionTitle: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 18,
        color: colors.onSurface,
        textAlign: 'left',
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontFamily: FONT_FAMILY,
        color: colors.onSurfaceVariant,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
});
