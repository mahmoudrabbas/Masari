import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { getExpensesByCategory, getMonthlyTotals } from '../../db/transactions';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    FONT_FAMILY_MEDIUM,
    FONT_FAMILY_SEMIBOLD,
    radius,
    spacing,
} from '../../theme/theme';

const CATEGORY_COLORS = [
    colors.primary,
    colors.tertiary,
    colors.secondary,
    colors.inversePrimary,
];

function Donut({ data }: { data: { category: string; total: number }[] }) {
    const size = 180;
    const strokeWidth = 24;
    const radiusPx = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radiusPx;
    const total = data.reduce((s, d) => s + d.total, 0) || 1;

    let offsetAcc = 0;

    return (
        <Svg width={size} height={size}>
            <G rotation="-90" origin={`${center}, ${center}`}>
                {data.map((d, i) => {
                    const fraction = d.total / total;
                    const dash = fraction * circumference;
                    const gap = circumference - dash;
                    const circle = (
                        <Circle
                            key={d.category}
                            cx={center}
                            cy={center}
                            r={radiusPx}
                            stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offsetAcc}
                            fill="none"
                            strokeLinecap="butt"
                        />
                    );
                    offsetAcc += dash;
                    return circle;
                })}
            </G>
        </Svg>
    );
}

function TrendLine({ points }: { points: number[] }) {
    const width = 320;
    const height = 120;
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const stepX = width / (points.length - 1 || 1);

    const coords = points.map((p, i) => {
        const x = i * stepX;
        const y = height - ((p - min) / range) * height;
        return { x, y };
    });

    const linePath = coords
        .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
        .join(' ');

    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    return (
        <Svg width={width} height={height}>
            <Path d={areaPath} fill={colors.primary} fillOpacity={0.12} />
            <Path
                d={linePath}
                stroke={colors.primary}
                strokeWidth={2.5}
                fill="none"
            />
            {coords.map((c, i) => (
                <Circle key={i} cx={c.x} cy={c.y} r={3} fill={colors.primary} />
            ))}
        </Svg>
    );
}

export default function Statistics() {
    const [categoryData, setCategoryData] = useState<
        { category: string; total: number }[]
    >([]);
    const [monthly, setMonthly] = useState({ income: 0, expense: 0 });
    const [trend, setTrend] = useState<number[]>([]);

    const load = useCallback(async () => {
        const now = new Date();
        const cats = await getExpensesByCategory(
            now.getFullYear(),
            now.getMonth() + 1
        );
        setCategoryData(cats);

        const m = await getMonthlyTotals(now.getFullYear(), now.getMonth() + 1);
        setMonthly(m);

        const last6: number[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const t = await getMonthlyTotals(d.getFullYear(), d.getMonth() + 1);
            last6.push(t.expense);
        }
        setTrend(last6);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const totalExpense = categoryData.reduce((s, d) => s + d.total, 0);
    const incomeVsExpenseRatio =
        monthly.income > 0
            ? Math.round(
                  ((monthly.income - monthly.expense) / monthly.income) * 100
              )
            : 0;

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
        >
            {/* <Text style={styles.title}>الإحصائيات</Text> */}

            <Text style={styles.sectionTitle}>المصاريف حسب الفئة</Text>
            <View style={styles.donutCard}>
                <View style={styles.donutWrap}>
                    <Donut data={categoryData} />
                    <View style={styles.donutCenter}>
                        <Text style={styles.donutLabel}>الإجمالي</Text>
                        <Text style={styles.donutValue}>
                            {totalExpense.toLocaleString()}
                        </Text>
                        <Text style={styles.donutCurrency}>ج.م</Text>
                    </View>
                </View>

                <View style={styles.legend}>
                    {categoryData.map((d, i) => (
                        <View key={d.category} style={styles.legendItem}>
                            <View
                                style={[
                                    styles.legendDot,
                                    {
                                        backgroundColor:
                                            CATEGORY_COLORS[
                                                i % CATEGORY_COLORS.length
                                            ],
                                    },
                                ]}
                            />
                            <Text style={styles.legendLabel}>{d.category}</Text>
                            <Text style={styles.legendValue}>
                                {d.total.toLocaleString()} ج.م
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            <Text style={styles.sectionTitle}>نزعة الإنفاق الشهري</Text>
            <View style={styles.trendCard}>
                <TrendLine points={trend.length ? trend : [0, 0, 0, 0, 0, 0]} />
            </View>

            <Text style={styles.sectionTitle}>الدخل مقابل المصاريف</Text>
            <View style={styles.compareCard}>
                <View style={styles.compareRow}>
                    <View>
                        <Text style={styles.compareLabel}>المصاريف</Text>
                        <Text
                            style={[
                                styles.compareValue,
                                { color: colors.secondary },
                            ]}
                        >
                            {monthly.expense.toLocaleString()} ج.م
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.compareLabel}>الدخل</Text>
                        <Text
                            style={[
                                styles.compareValue,
                                { color: colors.primary },
                            ]}
                        >
                            {monthly.income.toLocaleString()} ج.م
                        </Text>
                    </View>
                </View>

                <Text style={styles.savingsLabel}>نسبة التوفير هذا الشهر</Text>
                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${Math.max(0, Math.min(100, incomeVsExpenseRatio))}%`,
                            },
                        ]}
                    />
                </View>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.containerMargin },
    title: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 28,
        color: colors.onSurface,
        textAlign: 'left',
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
    },
    sectionTitle: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        fontSize: 18,
        color: colors.onSurface,
        textAlign: 'left',
        marginBottom: spacing.sm,
    },
    donutCard: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radius.xl,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    donutWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    donutCenter: {
        position: 'absolute',
        alignItems: 'center',
    },
    donutLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        color: colors.onSurfaceVariant,
    },
    donutValue: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 24,
        color: colors.onSurface,
    },
    donutCurrency: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        color: colors.onSurfaceVariant,
    },
    legend: {
        width: '100%',
        gap: spacing.sm,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: radius.full,
        marginRight: spacing.xs,
    },
    legendLabel: {
        flex: 1,
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: 14,
        color: colors.onSurface,
        textAlign: 'left',
        marginRight: spacing.xs,
    },
    legendValue: {
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        color: colors.onSurfaceVariant,
    },
    trendCard: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radius.xl,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    compareCard: {
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: radius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    compareRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    compareLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        color: colors.onSurfaceVariant,
        textAlign: 'left',
    },
    compareValue: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 20,
        textAlign: 'left',
        marginTop: 2,
    },
    savingsLabel: {
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        color: colors.onSurfaceVariant,
        textAlign: 'left',
        marginBottom: spacing.xs,
    },
    progressTrack: {
        height: 8,
        borderRadius: radius.full,
        backgroundColor: colors.surfaceContainerHigh,
        overflow: 'hidden',
    },
    progressFill: {
        height: 8,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
    },
});
