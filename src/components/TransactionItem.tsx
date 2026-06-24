import {
    Car,
    Globe,
    Grid3x3,
    PiggyBank,
    ShoppingBag,
    Utensils,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_MEDIUM,
    radius,
    spacing,
} from '../theme/theme';

type Props = {
    description: string;
    category?: string;
    date: string;
    amount: number;
    type: 'income' | 'expense';
};

const categoryIcons: Record<string, any> = {
    طعام: Utensils,
    مواصلات: Car,
    اتصالات: Globe,
    تسوق: ShoppingBag,
    دخل: PiggyBank,
};

export default function TransactionItem({
    description,
    category,
    date,
    amount,
    type,
}: Props) {
    const Icon = categoryIcons[category ?? ''] ?? Grid3x3;
    const isExpense = type === 'expense';
    const amountColor = isExpense ? colors.secondary : colors.primary;
    const iconBg = isExpense
        ? colors.surfaceContainerHigh
        : colors.primaryContainer;
    const iconColor = isExpense ? colors.onSurfaceVariant : colors.onPrimary;

    return (
        <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                <Icon color={iconColor} size={20} />
            </View>

            <View style={styles.middle}>
                <Text style={styles.merchant}>{description}</Text>
                <Text style={styles.meta}>
                    {category ?? ''} • {date}
                </Text>
            </View>

            <Text style={[styles.amount, { color: amountColor }]}>
                {isExpense ? '-' : '+'}
                {amount.toLocaleString()}.00
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    middle: {
        flex: 1,
    },
    merchant: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 16,
        color: colors.onSurface,
        textAlign: 'left',
    },
    meta: {
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        color: colors.onSurfaceVariant,
        textAlign: 'left',
        marginTop: 2,
    },
    amount: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 16,
        textAlign: 'right',
    },
});
