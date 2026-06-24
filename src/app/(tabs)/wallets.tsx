import { useFocusEffect, useRouter } from 'expo-router';
import {
    ArrowLeftRight,
    CreditCard,
    History,
    Plus,
    Wallet as WalletIcon,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ConfirmModal from '../../components/ConfirmModal';
import { WalletRow } from '../../db/database';
import { getTransactionsByWallet } from '../../db/transactions';
import { deleteWallet, getWallets } from '../../db/wallets';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_MEDIUM,
    FONT_FAMILY_SEMIBOLD,
    radius,
    spacing,
} from '../../theme/theme';

type WalletWithStats = WalletRow & { income: number; expense: number };

export default function Wallets() {
    const router = useRouter();
    const [wallets, setWallets] = useState<WalletWithStats[]>([]);
    const [deleteCandidate, setDeleteCandidate] = useState<WalletRow | null>(
        null
    );
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const load = useCallback(async () => {
        const list = await getWallets();
        const now = new Date();

        const withStats = await Promise.all(
            list.map(async (w) => {
                const txns = await getTransactionsByWallet(w.id);
                const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const monthTxns = txns.filter((t) =>
                    t.date.startsWith(monthStr)
                );
                const income = monthTxns
                    .filter((t) => t.type === 'income')
                    .reduce((s, t) => s + t.amount, 0);
                const expense = monthTxns
                    .filter((t) => t.type === 'expense')
                    .reduce((s, t) => s + t.amount, 0);
                return { ...w, income, expense };
            })
        );

        setWallets(withStats);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const handleAddWallet = () => {
        router.push('/add-wallet');
    };

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                {/* <View style={styles.avatarPlaceholder} /> */}
                <Text style={styles.headerTitle}>محافظي</Text>
            </View>

            {wallets.map((w, idx) => {
                const isPrimary = idx % 2 === 0;
                const bg = isPrimary ? colors.primary : colors.tertiary;
                const Icon = isPrimary ? WalletIcon : CreditCard;

                return (
                    <TouchableOpacity
                        key={w.id}
                        style={[styles.card, { backgroundColor: bg }]}
                        onPress={() => router.push(`/wallet/${w.id}`)}
                        onLongPress={() => {
                            setDeleteCandidate(w);
                            setIsDeleteConfirmOpen(true);
                        }}
                    >
                        <View style={styles.cardTop}>
                            <View style={styles.iconWrap}>
                                <Icon color="#fff" size={18} />
                            </View>
                            <Text style={styles.cardLabel}>إجمالي الرصيد</Text>
                        </View>
                        <Text style={styles.cardBalance}>
                            ج.م {w.balance.toLocaleString()}
                        </Text>
                        <Text style={styles.cardName}>{w.name}</Text>
                        <Text style={styles.cardSub}>كاش</Text>

                        <View style={styles.divider} />

                        <View style={styles.statsRow}>
                            <View>
                                <Text style={styles.statLabel}>المصاريف</Text>
                                <Text style={styles.statValue}>
                                    {w.expense.toLocaleString()} ↓
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.statLabel}>الدخل</Text>
                                <Text style={styles.statValue}>
                                    {w.income.toLocaleString()} ↑
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push('/transfers')}
                >
                    <History color={colors.onSurface} size={20} />
                    <Text style={styles.actionText}>سجل التحويلات</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push('/transfer')}
                >
                    <ArrowLeftRight color={colors.onSurface} size={20} />
                    <Text style={styles.actionText}>تحويل بين المحافظ</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={handleAddWallet}>
                <Text style={styles.addBtnText}>إضافة محفظة جديدة</Text>
                <Plus color="#fff" size={20} />
            </TouchableOpacity>

            <View style={{ height: 40 }} />
            <ConfirmModal
                visible={isDeleteConfirmOpen}
                title={'حذف المحفظة'}
                onCancel={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeleteCandidate(null);
                }}
                onConfirm={async () => {
                    if (deleteCandidate) {
                        await deleteWallet(deleteCandidate.id);
                        setIsDeleteConfirmOpen(false);
                        setDeleteCandidate(null);
                        load();
                    }
                }}
                confirmLabel={'حذف'}
                confirmColor={colors.secondary}
                cancelLabel={'إلغاء'}
            >
                <Text
                    style={{
                        fontFamily: FONT_FAMILY,
                        color: colors.onSurfaceVariant,
                    }}
                >
                    هل أنت متأكد أنك تريد حذف المحفظة التالية؟
                </Text>
                <Text
                    style={{
                        fontFamily: FONT_FAMILY_BOLD,
                        marginTop: 8,
                        color: colors.onSurface,
                    }}
                >
                    {deleteCandidate?.name}
                </Text>
            </ConfirmModal>
        </ScrollView>
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
    },
    headerTitle: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 20,
        color: colors.onSurface,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.surfaceContainerHigh,
    },
    card: {
        borderRadius: radius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    cardTop: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: FONT_FAMILY,
        fontSize: 13,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBalance: {
        color: '#fff',
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 28,
        textAlign: 'left',
        marginTop: spacing.sm,
    },
    cardName: {
        color: '#fff',
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 16,
        textAlign: 'left',
        marginTop: spacing.xs,
    },
    cardSub: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        textAlign: 'left',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginVertical: spacing.md,
    },
    statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
    statLabel: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        textAlign: 'left',
    },
    statValue: {
        color: '#fff',
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 16,
        textAlign: 'left',
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row-reverse',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: 'center',
        gap: spacing.xs,
    },
    actionText: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 13,
        color: colors.onSurface,
        textAlign: 'center',
    },
    addBtn: {
        flexDirection: 'row-reverse',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    addBtnText: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        color: '#fff',
        fontSize: 16,
    },
});
