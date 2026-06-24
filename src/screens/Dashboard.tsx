import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Bell, Plus, TrendingUp } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Avatar from '../components/Avatar';
// Avatar is provided by the Tabs header; local import removed
import TransactionItem from '../components/TransactionItem';
import { TransactionRow, WalletRow } from '../db/database';
import { getAllTransactions, getMonthlyTotals } from '../db/transactions';
import { getTotalBalance, getWallets } from '../db/wallets';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_MEDIUM,
    FONT_FAMILY_SEMIBOLD,
    radius,
    spacing,
} from '../theme/theme';

export default function Dashboard() {
    const navigation = useNavigation<any>();
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
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>تتبع مصاريفي</Text>
                    <View style={styles.headerIcons}>
                        <Avatar size={36} style={{ borderWidth: 2, borderColor: colors.primary }} />
                        <TouchableOpacity style={styles.bellBtn}>
                            <Bell color={colors.onSurface} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Total balance card */}
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

                {/* Wallet mini cards */}
                <View style={styles.miniRow}>
                    {wallets.slice(0, 2).map((w) => (
                        <TouchableOpacity
                            key={w.id}
                            style={styles.miniCard}
                            onPress={() =>
                                navigation.navigate('WalletDetails', {
                                    walletId: w.id,
                                })
                            }
                        >
                            <Text style={styles.miniName}>{w.name}</Text>
                            <Text style={styles.miniBalance}>
                                {w.balance.toLocaleString()}
                            </Text>
                            <Text style={styles.miniCurrency}>ج.م</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Monthly summary */}
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

                {/* Recent transactions */}
                <View style={styles.recentHeader}>
                    <Text style={styles.sectionTitle}>أحدث العمليات</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAll}>عرض الكل</Text>
                    </TouchableOpacity>
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
                onPress={() => navigation.navigate('AddTransaction')}
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
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerTitle: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 20,
        color: colors.onSurface,
        textAlign: 'left',
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
        textAlign: 'left',
    },
    totalAmount: {
        fontFamily: FONT_FAMILY_BOLD,
        color: '#fff',
        fontSize: 32,
        marginTop: spacing.xs,
        textAlign: 'left',
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
    growthText: {
        fontFamily: FONT_FAMILY_MEDIUM,
        color: '#fff',
        fontSize: 13,
    },
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
        textAlign: 'right',
    },
    miniBalance: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 22,
        color: colors.onSurface,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
    miniCurrency: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        color: colors.onSurfaceVariant,
        textAlign: 'right',
    },
    sectionTitle: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 20,
        color: colors.onSurface,
        textAlign: 'right',
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
        borderRightWidth: 3,
        borderRightColor: colors.secondary,
    },
    summaryLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        color: colors.onSurfaceVariant,
        textAlign: 'right',
    },
    summaryValue: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 22,
        textAlign: 'right',
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
