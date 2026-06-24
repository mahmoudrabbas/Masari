import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ConfirmModal from '../../components/ConfirmModal';
import TransactionItem from '../../components/TransactionItem';
import { deleteTransaction, getAllTransactions } from '../../db/transactions';
import { deleteTransfer, getAllTransfers } from '../../db/transfers';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_MEDIUM,
    FONT_FAMILY_SEMIBOLD,
    radius,
    spacing,
} from '../../theme/theme';

export default function Transactions() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [transfers, setTransfers] = useState<any[]>([]);
    const [deleteTx, setDeleteTx] = useState<null | any>(null);
    const [deleteTr, setDeleteTr] = useState<null | any>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const load = useCallback(async () => {
        const txs = await getAllTransactions();
        setTransactions(txs);
        const trs = await getAllTransfers();
        setTransfers(trs);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const onEditTransaction = (id: string) => {
        router.push(`/add-transaction?id=${id}`);
    };

    const onDeleteTransaction = async () => {
        if (!deleteTx) return;
        await deleteTransaction(
            deleteTx.id,
            deleteTx.walletId,
            deleteTx.type,
            deleteTx.amount
        );
        setConfirmOpen(false);
        setDeleteTx(null);
        await load();
    };

    const onDeleteTransfer = async () => {
        if (!deleteTr) return;
        await deleteTransfer(
            deleteTr.id,
            deleteTr.fromWalletId,
            deleteTr.toWalletId,
            deleteTr.amount
        );
        setConfirmOpen(false);
        setDeleteTr(null);
        await load();
    };

    const onRefundTransaction = async (t: any) => {
        // create opposite transaction as refund
        const opposite = t.type === 'expense' ? 'income' : 'expense';
        await import('../../db/transactions').then(async (m) => {
            await m.addTransaction({
                type: opposite,
                amount: t.amount,
                walletId: t.walletId,
                description: `استرداد: ${t.description || ''}`,
                category: t.category ?? null,
                date: new Date().toISOString().slice(0, 10),
            });
        });
        await load();
    };

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
        >
            <Text style={styles.title}>العمليات</Text>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>المعاملات</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/add-transaction')}
                    >
                        <Text style={styles.add}>إضافة</Text>
                    </TouchableOpacity>
                </View>

                {transactions.length === 0 ? (
                    <Text style={styles.empty}>لا توجد معاملات بعد</Text>
                ) : (
                    transactions.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            onPress={() => onEditTransaction(t.id)}
                            onLongPress={() => {
                                setDeleteTx(t);
                                setConfirmOpen(true);
                            }}
                        >
                            <TransactionItem
                                description={t.description}
                                category={t.category}
                                date={t.date}
                                amount={t.amount}
                                type={t.type}
                            />
                            <View style={{ height: spacing.sm }} />
                        </TouchableOpacity>
                    ))
                )}
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>التحويلات</Text>
                    <TouchableOpacity onPress={() => router.push('/transfer')}>
                        <Text style={styles.add}>إضافة</Text>
                    </TouchableOpacity>
                </View>

                {transfers.length === 0 ? (
                    <Text style={styles.empty}>لا توجد تحويلات بعد</Text>
                ) : (
                    transfers.map((tr) => (
                        <TouchableOpacity
                            key={tr.id}
                            onLongPress={() => {
                                setDeleteTr(tr);
                                setConfirmOpen(true);
                            }}
                        >
                            <View style={styles.transferItem}>
                                <View style={styles.transferTop}>
                                    <View style={styles.walletsColumn}>
                                        <View style={styles.walletRowSmall}>
                                            <Text style={styles.walletLabel}>
                                                من
                                            </Text>
                                            <Text
                                                style={styles.walletNameSmall}
                                                numberOfLines={1}
                                            >
                                                {tr.fromWalletId}
                                            </Text>
                                        </View>
                                        <View style={styles.walletRowSmall}>
                                            <Text style={styles.walletLabel}>
                                                إلى
                                            </Text>
                                            <Text
                                                style={styles.walletNameSmall}
                                                numberOfLines={1}
                                            >
                                                {tr.toWalletId}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.amountBox}>
                                    <Text style={styles.amountText}>
                                        {tr.amount.toLocaleString()} ج.م
                                    </Text>
                                </View>

                                <View style={styles.transferMeta}>
                                    <ArrowRight
                                        color={colors.onSurfaceVariant}
                                        size={14}
                                    />
                                    <Text style={styles.date}>{tr.date}</Text>
                                </View>
                            </View>
                            <View style={{ height: spacing.sm }} />
                        </TouchableOpacity>
                    ))
                )}
            </View>

            <ConfirmModal
                visible={confirmOpen}
                title={deleteTx ? 'حذف المعاملة' : 'حذف التحويل'}
                onCancel={() => {
                    setConfirmOpen(false);
                    setDeleteTx(null);
                    setDeleteTr(null);
                }}
                onConfirm={async () => {
                    if (deleteTx) await onDeleteTransaction();
                    else if (deleteTr) await onDeleteTransfer();
                }}
                confirmColor={colors.secondary}
                confirmLabel="حذف"
            >
                <Text
                    style={{
                        fontFamily: FONT_FAMILY,
                        color: colors.onSurfaceVariant,
                    }}
                >
                    هل أنت متأكد؟ هذه العملية لا يمكن التراجع عنها
                </Text>
                {deleteTx ? (
                    <TouchableOpacity
                        style={{ marginTop: spacing.md }}
                        onPress={async () => {
                            setConfirmOpen(false);
                            await onRefundTransaction(deleteTx);
                        }}
                    >
                        <Text style={{ color: colors.primary }}>
                            استرداد المبلغ
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </ConfirmModal>

            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.containerMargin },
    title: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 22,
        color: colors.onSurface,
        textAlign: 'center',
        // marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    section: { marginBottom: spacing.lg },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontFamily: FONT_FAMILY_BOLD,
        color: colors.onSurface,
    },
    add: { color: colors.primary, fontFamily: FONT_FAMILY_MEDIUM },
    empty: {
        textAlign: 'center',
        color: colors.onSurfaceVariant,
        marginTop: spacing.md,
    },
    transferItem: {
        backgroundColor: colors.surfaceContainerLowest,
        padding: spacing.md,
        borderRadius: radius.lg,
        elevation: 1,
    },
    transferTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletsColumn: { flex: 1, paddingLeft: spacing.md },
    walletRowSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    walletLabel: {
        fontFamily: FONT_FAMILY,
        color: colors.onSurfaceVariant,
        width: 36,
    },
    walletNameSmall: {
        fontFamily: FONT_FAMILY_MEDIUM,
        color: colors.onSurface,
        flex: 1,
    },
    amountBox: {
        backgroundColor: colors.surfaceContainerHigh,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        minWidth: 110,
        alignItems: 'center',
        justifyContent: 'center',
    },
    amountText: { fontFamily: FONT_FAMILY_BOLD, color: colors.primary },
    transferMeta: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    date: {
        fontFamily: FONT_FAMILY,
        color: colors.onSurfaceVariant,
        marginTop: spacing.xs,
        textAlign: 'left',
    },
});
