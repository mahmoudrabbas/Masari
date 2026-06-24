import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Car,
    Check,
    Grid3x3,
    ShoppingBag,
    Utensils,
    X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import ConfirmModal from '../components/ConfirmModal';
import DatePickerModal from '../components/DatePickerModal';
import { WalletRow } from '../db/database';
import {
    addTransaction,
    getTransactionById,
    updateTransaction,
} from '../db/transactions';
import { addTransfer } from '../db/transfers';
import { getWallets } from '../db/wallets';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_MEDIUM,
    FONT_FAMILY_SEMIBOLD,
    radius,
    spacing,
} from '../theme/theme';

type Kind = 'income' | 'expense' | 'transfer';

const categories = [
    { key: 'طعام', label: 'طعام', icon: Utensils },
    { key: 'مواصلات', label: 'مواصلات', icon: Car },
    { key: 'تسوق', label: 'تسوق', icon: ShoppingBag },
    { key: 'أخرى', label: 'المزيد', icon: Grid3x3 },
];

export default function AddTransaction() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [kind, setKind] = useState<Kind>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('طعام');
    const [note, setNote] = useState('');
    const [wallets, setWallets] = useState<WalletRow[]>([]);
    const [walletId, setWalletId] = useState<string | null>(null);
    const [toWalletId, setToWalletId] = useState<string | null>(null);
    const [walletOpen, setWalletOpen] = useState(false);
    const [fromWalletOpen, setFromWalletOpen] = useState(false);
    const [toWalletOpen, setToWalletOpen] = useState(false);
    const [date] = useState(new Date().toISOString().slice(0, 10));
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(date);

    useEffect(() => {
        (async () => {
            const list = await getWallets();
            setWallets(list);
            if (list.length > 0) setWalletId(list[0].id);
            if (list.length > 1) setToWalletId(list[1].id);
            else if (list.length === 1) setToWalletId(list[0].id);
        })();
    }, []);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const t = await getTransactionById(id as string);
                if (t) {
                    setKind(t.type as Kind);
                    setAmount(String(t.amount));
                    setCategory(t.category ?? 'طعام');
                    setNote(t.description ?? '');
                    setWalletId(t.walletId);
                    setSelectedDate(t.date);
                }
            } catch (e) {
                // ignore
            }
        })();
    }, [id]);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSave = async () => {
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0) {
            Alert.alert('خطأ', 'الرجاء إدخال مبلغ صحيح');
            return;
        }

        if (kind === 'transfer') {
            if (!walletId || !toWalletId) {
                Alert.alert('خطأ', 'الرجاء اختيار المحفظتين');
                return;
            }
            if (walletId === toWalletId) {
                Alert.alert('خطأ', 'لا يمكن التحويل إلى نفس المحفظة');
                return;
            }
            await addTransfer({
                fromWalletId: walletId,
                toWalletId: toWalletId,
                amount: numericAmount,
                date: selectedDate || date,
            });
            router.back();
            return;
        }

        if (!walletId) {
            Alert.alert('خطأ', 'الرجاء اختيار محفظة');
            return;
        }

        try {
            if (id) {
                await updateTransaction(id as string, {
                    type: kind,
                    amount: numericAmount,
                    walletId: walletId as string,
                    description: note || category,
                    category,
                    date: selectedDate || date,
                });
            } else {
                await addTransaction({
                    type: kind,
                    amount: numericAmount,
                    walletId: walletId as string,
                    description: note || category,
                    category,
                    date: selectedDate || date,
                });
            }

            router.back();
        } catch (e: any) {
            // Show an in-app ConfirmModal with the error message coming from the DB layer
            setErrorMessage(e?.message || 'حدث خطأ أثناء حفظ المعاملة');
            setErrorModalOpen(true);
        }
    };

    const selectedWallet = wallets.find((w) => w.id === walletId);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <X color={colors.onSurface} size={22} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>إضافة معاملة</Text>
                    <View style={{ width: 22 }} />
                </View>

                <View style={styles.tabRow}>
                    {(['income', 'expense', 'transfer'] as Kind[]).map((k) => (
                        <TouchableOpacity
                            key={k}
                            style={[styles.tab, kind === k && styles.tabActive]}
                            onPress={() => setKind(k)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    kind === k && styles.tabTextActive,
                                ]}
                            >
                                {k === 'income'
                                    ? 'دخل'
                                    : k === 'expense'
                                      ? 'مصروف'
                                      : 'تحويل'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.amountSection}>
                    <Text style={styles.amountLabel}>المبلغ</Text>
                    <View style={styles.amountRow}>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={colors.outline}
                            style={styles.amountInput}
                        />
                        <Text style={styles.currency}>EGP</Text>
                    </View>
                </View>

                {kind === 'transfer' ? (
                    <>
                        <Text style={styles.fieldLabel}>من المحفظة</Text>
                        <TouchableOpacity
                            style={styles.walletSelector}
                            onPress={() => setFromWalletOpen((s) => !s)}
                        >
                            <Text style={styles.walletSelectorText}>
                                {selectedWallet
                                    ? selectedWallet.name
                                    : 'اختر محفظة'}
                            </Text>
                        </TouchableOpacity>

                        {fromWalletOpen && (
                            <View style={styles.walletList}>
                                {wallets.map((w) => (
                                    <TouchableOpacity
                                        key={w.id}
                                        style={
                                            w.id === walletId
                                                ? [
                                                      styles.walletItem,
                                                      styles.walletItemActive,
                                                  ]
                                                : styles.walletItem
                                        }
                                        onPress={() => {
                                            setWalletId(w.id);
                                            setFromWalletOpen(false);
                                        }}
                                    >
                                        <Text style={styles.walletBalance}>
                                            {w.balance.toLocaleString()} ج.م
                                        </Text>
                                        <Text style={styles.walletName}>
                                            {w.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={styles.fieldLabel}>إلى المحفظة</Text>
                        <TouchableOpacity
                            style={styles.walletSelector}
                            onPress={() => setToWalletOpen((s) => !s)}
                        >
                            <Text style={styles.walletSelectorText}>
                                {toWalletId
                                    ? wallets.find((w) => w.id === toWalletId)
                                          ?.name
                                    : 'اختر محفظة'}
                            </Text>
                        </TouchableOpacity>

                        {toWalletOpen && (
                            <View style={styles.walletList}>
                                {wallets.map((w) => (
                                    <TouchableOpacity
                                        key={w.id}
                                        style={
                                            w.id === toWalletId
                                                ? [
                                                      styles.walletItem,
                                                      styles.walletItemActive,
                                                  ]
                                                : styles.walletItem
                                        }
                                        onPress={() => {
                                            setToWalletId(w.id);
                                            setToWalletOpen(false);
                                        }}
                                    >
                                        <Text style={styles.walletBalance}>
                                            {w.balance.toLocaleString()} ج.م
                                        </Text>
                                        <Text style={styles.walletName}>
                                            {w.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        <Text style={styles.fieldLabel}>المحفظة</Text>
                        <TouchableOpacity
                            style={styles.walletSelector}
                            onPress={() => setWalletOpen((s) => !s)}
                        >
                            <Text style={styles.walletSelectorText}>
                                {selectedWallet
                                    ? selectedWallet.name
                                    : 'اختر محفظة'}
                            </Text>
                        </TouchableOpacity>

                        {walletOpen && (
                            <View style={styles.walletList}>
                                {wallets.map((w) => (
                                    <TouchableOpacity
                                        key={w.id}
                                        style={
                                            w.id === walletId
                                                ? [
                                                      styles.walletItem,
                                                      styles.walletItemActive,
                                                  ]
                                                : styles.walletItem
                                        }
                                        onPress={() => {
                                            setWalletId(w.id);
                                            setWalletOpen(false);
                                        }}
                                    >
                                        <Text style={styles.walletBalance}>
                                            {w.balance.toLocaleString()} ج.م
                                        </Text>
                                        <Text style={styles.walletName}>
                                            {w.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                )}

                <Text style={styles.fieldLabel}>الصنف</Text>
                <View style={styles.categoryRow}>
                    {categories.map((c) => {
                        const Icon = c.icon;
                        const active = category === c.key;
                        return (
                            <TouchableOpacity
                                key={c.key}
                                style={[
                                    styles.categoryBtn,
                                    active && styles.categoryBtnActive,
                                ]}
                                onPress={() => setCategory(c.key)}
                            >
                                <View
                                    style={[
                                        styles.categoryIconWrap,
                                        active && styles.categoryIconWrapActive,
                                    ]}
                                >
                                    <Icon
                                        color={
                                            active
                                                ? '#fff'
                                                : colors.onSurfaceVariant
                                        }
                                        size={20}
                                    />
                                </View>
                                <Text style={styles.categoryLabel}>
                                    {c.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.fieldLabel}>التاريخ</Text>
                <TouchableOpacity
                    style={styles.dateBox}
                    onPress={() => setIsDatePickerOpen(true)}
                >
                    <Text style={styles.dateText}>{selectedDate}</Text>
                </TouchableOpacity>
                <DatePickerModal
                    visible={isDatePickerOpen}
                    initialDateISO={selectedDate}
                    onCancel={() => setIsDatePickerOpen(false)}
                    onConfirm={(iso) => {
                        setSelectedDate(iso);
                        setIsDatePickerOpen(false);
                    }}
                />

                <Text style={styles.fieldLabel}>ملاحظات</Text>
                <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="أضف وصفاً للمعاملة..."
                    placeholderTextColor={colors.outline}
                    style={styles.notesInput}
                    multiline
                    textAlign="right"
                />

                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => setIsConfirmOpen(true)}
                >
                    <Check color="#fff" size={20} />
                    <Text style={styles.saveBtnText}>حفظ المعاملة</Text>
                </TouchableOpacity>

                <ConfirmModal
                    visible={isConfirmOpen}
                    title={
                        kind === 'transfer' ? 'تأكيد التحويل' : 'تأكيد المعاملة'
                    }
                    onCancel={() => setIsConfirmOpen(false)}
                    onConfirm={async () => {
                        setIsConfirmOpen(false);
                        await handleSave();
                    }}
                    confirmLabel={kind === 'transfer' ? 'تحويل' : 'حفظ'}
                >
                    <Text
                        style={{
                            fontFamily: FONT_FAMILY_BOLD,
                            fontSize: 16,
                            color: colors.onSurface,
                            marginBottom: 8,
                        }}
                    >
                        {kind === 'transfer'
                            ? 'تفاصيل التحويل'
                            : 'تفاصيل المعاملة'}
                    </Text>
                    <Text
                        style={{
                            fontFamily: FONT_FAMILY,
                            color: colors.onSurfaceVariant,
                        }}
                    >
                        المبلغ: {amount} ج.م
                    </Text>
                    <Text
                        style={{
                            fontFamily: FONT_FAMILY,
                            color: colors.onSurfaceVariant,
                        }}
                    >
                        النوع:{' '}
                        {kind === 'income'
                            ? 'دخل'
                            : kind === 'expense'
                              ? 'مصروف'
                              : 'تحويل'}
                    </Text>
                    {kind === 'transfer' ? (
                        <>
                            <Text
                                style={{
                                    fontFamily: FONT_FAMILY,
                                    color: colors.onSurfaceVariant,
                                }}
                            >
                                من:{' '}
                                {wallets.find((w) => w.id === walletId)?.name ||
                                    '-'}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: FONT_FAMILY,
                                    color: colors.onSurfaceVariant,
                                }}
                            >
                                إلى:{' '}
                                {wallets.find((w) => w.id === toWalletId)
                                    ?.name || '-'}
                            </Text>
                        </>
                    ) : (
                        <Text
                            style={{
                                fontFamily: FONT_FAMILY,
                                color: colors.onSurfaceVariant,
                            }}
                        >
                            المحفظة:{' '}
                            {wallets.find((w) => w.id === walletId)?.name ||
                                '-'}
                        </Text>
                    )}
                    <Text
                        style={{
                            fontFamily: FONT_FAMILY,
                            color: colors.onSurfaceVariant,
                        }}
                    >
                        التاريخ: {selectedDate}
                    </Text>
                    <Text
                        style={{
                            fontFamily: FONT_FAMILY,
                            color: colors.onSurfaceVariant,
                        }}
                    >
                        الصنف: {category}
                    </Text>
                    {note ? (
                        <Text
                            style={{
                                fontFamily: FONT_FAMILY,
                                color: colors.onSurfaceVariant,
                                marginTop: 8,
                            }}
                        >
                            ملاحظة: {note}
                        </Text>
                    ) : null}
                </ConfirmModal>

                <ConfirmModal
                    visible={errorModalOpen}
                    title={'خطأ'}
                    onCancel={() => setErrorModalOpen(false)}
                    onConfirm={() => setErrorModalOpen(false)}
                    confirmLabel={'حسناً'}
                    cancelLabel={'إغلاق'}
                >
                    <Text
                        style={{
                            fontFamily: FONT_FAMILY,
                            color: colors.onSurfaceVariant,
                        }}
                    >
                        {errorMessage}
                    </Text>
                </ConfirmModal>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
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
        color: colors.primary,
    },
    tabRow: {
        flexDirection: 'row-reverse',
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: radius.md,
        padding: 4,
        marginBottom: spacing.lg,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: radius.default,
    },
    tabActive: { backgroundColor: colors.surfaceContainerLowest },
    tabText: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 14,
        color: colors.onSurfaceVariant,
    },
    tabTextActive: { color: colors.primary, fontFamily: FONT_FAMILY_BOLD },
    amountSection: { alignItems: 'center', marginBottom: spacing.lg },
    amountLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        color: colors.onSurfaceVariant,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    amountInput: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 36,
        color: colors.onSurface,
        minWidth: 120,
        textAlign: 'center',
    },
    currency: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 20,
        color: colors.onSurface,
    },
    fieldLabel: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 14,
        color: colors.onSurfaceVariant,
        textAlign: 'left',
        marginBottom: spacing.xs,
    },
    walletSelector: {
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    walletList: {
        marginBottom: spacing.lg,
    },
    walletItem: {
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletItemActive: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceContainerLowest,
    },
    walletName: { fontFamily: FONT_FAMILY_MEDIUM, color: colors.onSurface },
    walletBalance: { fontFamily: FONT_FAMILY, color: colors.onSurfaceVariant },
    walletSelectorText: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 15,
        color: colors.onSurface,
        textAlign: 'left',
    },
    categoryRow: {
        flexDirection: 'row-reverse',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    categoryBtn: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    categoryBtnActive: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceContainerLowest,
    },
    categoryIconWrap: {
        width: 44,
        height: 44,
        borderRadius: radius.full,
        backgroundColor: colors.surfaceContainerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    categoryIconWrapActive: { backgroundColor: colors.primary },
    categoryLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        color: colors.onSurfaceVariant,
    },
    dateBox: {
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    dateText: {
        fontFamily: FONT_FAMILY,
        fontSize: 15,
        color: colors.onSurface,
        textAlign: 'left',
    },
    notesInput: {
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        borderRadius: radius.md,
        padding: spacing.md,
        minHeight: 100,
        fontFamily: FONT_FAMILY,
        fontSize: 15,
        color: colors.onSurface,
        textAlign: 'left',
        textAlignVertical: 'top',
        marginBottom: spacing.lg,
    },
    saveBtn: {
        flexDirection: 'row-reverse',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    saveBtnText: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        color: '#fff',
        fontSize: 16,
    },
});
