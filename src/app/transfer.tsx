import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
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
import { WalletRow } from '../db/database';
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

export default function Transfer() {
    const router = useRouter();
    const [wallets, setWallets] = useState<WalletRow[]>([]);
    const [fromId, setFromId] = useState<string | null>(null);
    const [toId, setToId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');

    useEffect(() => {
        (async () => {
            const list = await getWallets();
            setWallets(list);
            if (list.length > 0) setFromId(list[0].id);
            if (list.length > 1) setToId(list[1].id);
        })();
    }, []);

    const handleSave = async () => {
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0) {
            Alert.alert('خطأ', 'الرجاء إدخال مبلغ صحيح');
            return;
        }
        if (!fromId || !toId) {
            Alert.alert('خطأ', 'الرجاء اختيار المحافظ');
            return;
        }
        if (fromId === toId) {
            Alert.alert('خطأ', 'لا يمكن التحويل لنفس المحفظة');
            return;
        }

        try {
            await addTransfer({
                fromWalletId: fromId,
                toWalletId: toId,
                amount: numericAmount,
                date: new Date().toISOString().slice(0, 10),
            });
            router.back();
        } catch (e: any) {
            Alert.alert('خطأ', e.message);
        }
    };

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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
                    <Text style={styles.headerTitle}>تحويل بين المحافظ</Text>
                    <View style={{ width: 22 }} />
                </View>

                <Text style={styles.fieldLabel}>من محفظة</Text>
                <View style={styles.walletList}>
                    {wallets.map((w) => (
                        <TouchableOpacity
                            key={w.id}
                            style={[
                                styles.walletOption,
                                fromId === w.id && styles.walletOptionActive,
                            ]}
                            onPress={() => setFromId(w.id)}
                        >
                            <Text
                                style={[
                                    styles.walletOptionText,
                                    fromId === w.id &&
                                        styles.walletOptionTextActive,
                                ]}
                            >
                                {w.name} — {w.balance.toLocaleString()} ج.م
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.fieldLabel}>إلى محفظة</Text>
                <View style={styles.walletList}>
                    {wallets.map((w) => (
                        <TouchableOpacity
                            key={w.id}
                            style={[
                                styles.walletOption,
                                toId === w.id && styles.walletOptionActive,
                            ]}
                            onPress={() => setToId(w.id)}
                        >
                            <Text
                                style={[
                                    styles.walletOptionText,
                                    toId === w.id &&
                                        styles.walletOptionTextActive,
                                ]}
                            >
                                {w.name} — {w.balance.toLocaleString()} ج.م
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.fieldLabel}>المبلغ</Text>
                <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.outline}
                    style={styles.amountInput}
                />

                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => setIsConfirmOpen(true)}
                >
                    <Check color="#fff" size={20} />
                    <Text style={styles.saveBtnText}>تأكيد التحويل</Text>
                </TouchableOpacity>

                <ConfirmModal
                    visible={isConfirmOpen}
                    title={'تأكيد التحويل'}
                    onCancel={() => setIsConfirmOpen(false)}
                    onConfirm={async () => {
                        setIsConfirmOpen(false);
                        await handleSave();
                    }}
                    confirmLabel={'تحويل'}
                >
                    <Text
                        style={{
                            fontFamily: FONT_FAMILY_BOLD,
                            fontSize: 16,
                            color: colors.onSurface,
                            marginBottom: 8,
                        }}
                    >
                        تفاصيل التحويل
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
                        من: {wallets.find((w) => w.id === fromId)?.name || '-'}
                    </Text>
                    <Text
                        style={{
                            fontFamily: FONT_FAMILY,
                            color: colors.onSurfaceVariant,
                        }}
                    >
                        إلى: {wallets.find((w) => w.id === toId)?.name || '-'}
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
    fieldLabel: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 14,
        color: colors.onSurfaceVariant,
        textAlign: 'left',
        marginBottom: spacing.xs,
    },
    walletList: {
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    walletOption: {
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        borderRadius: radius.md,
        padding: spacing.md,
    },
    walletOptionActive: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceContainerLow,
    },
    walletOptionText: {
        fontFamily: FONT_FAMILY,
        fontSize: 15,
        color: colors.onSurface,
        textAlign: 'left',
    },
    walletOptionTextActive: {
        fontFamily: FONT_FAMILY_BOLD,
        color: colors.primary,
    },
    amountInput: {
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        borderRadius: radius.md,
        padding: spacing.md,
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 20,
        color: colors.onSurface,
        textAlign: 'center',
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
