import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, TrendingUp } from 'lucide-react-native';
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
import { getAllTransactions, getMonthlyTotals } from '../../db/transactions';
import { getTotalBalance, getWallets } from '../../db/wallets';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_MEDIUM,
    FONT_FAMILY_SEMIBOLD,
    radius,
    spacing,
} from '../../theme/theme';

export default function Dashboard() {
    const router = useRouter();
    const [wallets, setWallets] = useState<WalletRow[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [recent, setRecent] = useState<TransactionRow[]>([]);
    const [monthly, setMonthly] = useState({ income: 0, expense: 0, net: 0 });

    const load = useCallback(async () => {
        const [w, total, txns] = await Promise.all([
            getWallets(),
            getTotalBalance(),
            getAllTransactions(),
        ]);
        setWallets(w);
        setTotalBalance(total);
        setRecent(txns.slice(0, 4));

        const now = new Date();
        const m = await getMonthlyTotals(now.getFullYear(), now.getMonth() + 1);
        setMonthly(m);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.content}
            >
                <View style={styles.header}>
                    {/* <View style={styles.headerIcons}>
                        <TouchableOpacity
                            style={styles.bellBtn}
                            onPress={() => router.push('/notifications')}
                        >
                            <Bell color={colors.onSurface} size={20} />
                        </TouchableOpacity>
                        <View style={styles.avatarPlaceholder} />
                    </View> */}
                    <Text style={styles.headerTitle}>مصاريفي</Text>
                </View>

                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>إجمالي الرصيد</Text>
                    <Text style={styles.totalAmount}>
                        ج.م {totalBalance.toLocaleString()}
                    </Text>
                    <View style={styles.growthChip}>
                        <TrendingUp color="#fff" size={14} />
                        <Text style={styles.growthText}>+5.2% هذا الشهر</Text>
                    </View>
                </View>

                <View style={styles.miniRow}>
                    {wallets.slice(0, 2).map((w) => (
                        <TouchableOpacity
                            key={w.id}
                            style={styles.miniCard}
                            onPress={() => router.push(`/wallet/${w.id}`)}
                        >
                            <Text style={styles.miniName}>{w.name}</Text>
                            <Text style={styles.miniBalance}>
                                {w.balance.toLocaleString()}
                            </Text>
                            <Text style={styles.miniCurrency}>ج.م</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>ملخص الشهر</Text>
                <View style={styles.summaryRow}>
                    <View
                        style={[
                            styles.summaryCard,
                            { backgroundColor: colors.errorContainer },
                        ]}
                    >
                        <Text style={styles.summaryLabel}>المصاريف</Text>
                        <Text
                            style={[
                                styles.summaryValue,
                                { color: colors.secondary },
                            ]}
                        >
                            {monthly.expense.toLocaleString()}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.summaryCard,
                            { backgroundColor: colors.surfaceContainerHigh },
                        ]}
                    >
                        <Text style={styles.summaryLabel}>الدخل</Text>
                        <Text
                            style={[
                                styles.summaryValue,
                                { color: colors.primary },
                            ]}
                        >
                            {monthly.income.toLocaleString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.recentHeader}>
                    <TouchableOpacity>
                        <Text style={styles.viewAll}>عرض الكل</Text>
                    </TouchableOpacity>
                    <Text style={styles.sectionTitle}>أحدث العمليات</Text>
                </View>

                {recent.length === 0 ? (
                    <Text style={styles.emptyText}>لا توجد معاملات بعد</Text>
                ) : (
                    recent.map((t) => (
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

                <View style={{ height: 80 }} />
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/add-transaction')}
            >
                <Plus color="#fff" size={26} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.containerMargin },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        // marginTop: spacing.sm,
        // paddingTop: spacing.xs,
    },
    headerTitle: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 20,
        color: colors.onSurface,
    },
    headerIcons: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.surfaceContainerHigh,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    bellBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    totalCard: {
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    totalLabel: {
        fontFamily: FONT_FAMILY,
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
    },
    totalAmount: {
        fontFamily: FONT_FAMILY_BOLD,
        color: '#fff',
        fontSize: 32,
        marginTop: spacing.xs,
    },
    growthChip: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: radius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        marginTop: spacing.sm,
    },
    growthText: { fontFamily: FONT_FAMILY_MEDIUM, color: '#fff', fontSize: 13 },
    miniRow: {
        flexDirection: 'row-reverse',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    miniCard: {
        flex: 1,
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
    },
    miniName: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 14,
        color: colors.onSurfaceVariant,
        textAlign: 'left',
    },
    miniBalance: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 22,
        color: colors.onSurface,
        textAlign: 'left',
        marginTop: spacing.xs,
    },
    miniCurrency: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        color: colors.onSurfaceVariant,
        textAlign: 'left',
    },
    sectionTitle: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 20,
        color: colors.onSurface,
        textAlign: 'left',
        marginBottom: spacing.sm,
    },
    summaryRow: {
        flexDirection: 'row-reverse',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    summaryCard: {
        flex: 1,
        borderRadius: radius.lg,
        padding: spacing.md,
        // borderWidth: 3,
        // borderColor: colors.secondary,
    },
    summaryLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        color: colors.onSurfaceVariant,
        textAlign: 'left',
    },
    summaryValue: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 22,
        textAlign: 'left',
        marginTop: 2,
    },
    recentHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewAll: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 13,
        color: colors.primary,
    },
    emptyText: {
        fontFamily: FONT_FAMILY,
        color: colors.onSurfaceVariant,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        width: 56,
        height: 56,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
});
