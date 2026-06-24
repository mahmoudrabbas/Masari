import { ArrowDown, ArrowUp, CreditCard, Wallet } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_MEDIUM,
    radius,
    spacing,
} from '../theme/theme';

type Props = {
    name: string;
    balance: number;
    income: number;
    expense: number;
    variant: 'primary' | 'secondary';
    onPress?: () => void;
};

export default function WalletCard({
    name,
    balance,
    income,
    expense,
    variant,
    onPress,
}: Props) {
    const bg = variant === 'primary' ? colors.primary : colors.tertiary;
    const Icon = variant === 'primary' ? Wallet : CreditCard;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={[styles.card, { backgroundColor: bg }]}
        >
            <View style={styles.topRow}>
                <Text style={styles.label}>إجمالي الرصيد</Text>
                <View style={styles.iconWrap}>
                    <Icon color="#fff" size={18} />
                </View>
            </View>

            <Text style={styles.balance}>ج.م {balance.toLocaleString()}</Text>
            <Text style={styles.name}>{name}</Text>

            <View style={styles.divider} />

            <View style={styles.bottomRow}>
                <View style={styles.statBlock}>
                    <Text style={styles.statLabel}>المصاريف</Text>
                    <View style={styles.statValueRow}>
                        <Text style={styles.statValue}>
                            {expense.toLocaleString()}
                        </Text>
                        <ArrowUp color="#fff" size={14} />
                    </View>
                </View>
                <View style={styles.statBlock}>
                    <Text style={styles.statLabel}>الدخل</Text>
                    <View style={styles.statValueRow}>
                        <Text style={styles.statValue}>
                            {income.toLocaleString()}
                        </Text>
                        <ArrowDown color="#fff" size={14} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        textAlign: 'left',
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    balance: {
        color: '#fff',
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 30,
        textAlign: 'left',
        marginTop: spacing.sm,
    },
    name: {
        color: 'rgba(255,255,255,0.9)',
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 16,
        textAlign: 'left',
        marginTop: spacing.xs,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginVertical: spacing.md,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBlock: {
        alignItems: 'flex-start',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        textAlign: 'left',
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    statValue: {
        color: '#fff',
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 16,
    },
});
