import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, FONT_FAMILY, radius, spacing } from '../theme/theme';

type Props = {
    visible: boolean;
    initialDateISO: string;
    onCancel: () => void;
    onConfirm: (iso: string) => void;
};

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export default function DatePickerModal({
    visible,
    initialDateISO,
    onCancel,
    onConfirm,
}: Props) {
    const initial = useMemo(() => new Date(initialDateISO), [initialDateISO]);
    const [displayMonth, setDisplayMonth] = useState(startOfMonth(initial));
    const [selected, setSelected] = useState<Date>(initial);

    const weeks: (Date | null)[] = useMemo(() => {
        const start = startOfMonth(displayMonth);
        const end = endOfMonth(displayMonth);
        const days: (Date | null)[] = [];
        const firstWeekday = start.getDay();
        for (let i = 0; i < firstWeekday; i++) days.push(null);
        for (let d = 1; d <= end.getDate(); d++)
            days.push(
                new Date(displayMonth.getFullYear(), displayMonth.getMonth(), d)
            );
        while (days.length % 7 !== 0) days.push(null);
        return days;
    }, [displayMonth]);

    const monthLabel = `${displayMonth.getFullYear()} - ${displayMonth.toLocaleString(undefined, { month: 'long' })}`;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={s.backdrop}>
                <View style={s.container}>
                    <View style={s.header}>
                        <TouchableOpacity
                            onPress={() =>
                                setDisplayMonth(
                                    (prev) =>
                                        new Date(
                                            prev.getFullYear(),
                                            prev.getMonth() - 1,
                                            1
                                        )
                                )
                            }
                        >
                            <Text style={s.nav}>‹</Text>
                        </TouchableOpacity>
                        <Text style={s.title}>{monthLabel}</Text>
                        <TouchableOpacity
                            onPress={() =>
                                setDisplayMonth(
                                    (prev) =>
                                        new Date(
                                            prev.getFullYear(),
                                            prev.getMonth() + 1,
                                            1
                                        )
                                )
                            }
                        >
                            <Text style={s.nav}>›</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={s.weekdays}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                            (wd) => (
                                <Text key={wd} style={s.weekdayText}>
                                    {wd}
                                </Text>
                            )
                        )}
                    </View>

                    <View style={s.grid}>
                        {weeks.map((d, i) => {
                            const isSelected =
                                d &&
                                selected &&
                                d.toDateString() === selected.toDateString();
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[s.day, isSelected && s.daySelected]}
                                    onPress={() => d && setSelected(d)}
                                    disabled={!d}
                                >
                                    <Text
                                        style={[
                                            s.dayText,
                                            isSelected && s.dayTextSelected,
                                        ]}
                                    >
                                        {d ? d.getDate() : ''}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={s.actions}>
                        <TouchableOpacity
                            onPress={onCancel}
                            style={s.actionBtn}
                        >
                            <Text style={s.actionText}>إلغاء</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() =>
                                onConfirm(selected.toISOString().slice(0, 10))
                            }
                            style={[s.actionBtn, s.confirm]}
                        >
                            <Text style={[s.actionText, { color: '#fff' }]}>
                                اختر
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: spacing.md,
    },
    container: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderColor: colors.outlineVariant,
    },
    title: { fontFamily: FONT_FAMILY, color: colors.onSurface, fontSize: 16 },
    nav: { fontSize: 22, color: colors.onSurface },
    weekdays: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    weekdayText: {
        fontFamily: FONT_FAMILY,
        color: colors.onSurfaceVariant,
        width: 28,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: spacing.md,
        gap: spacing.xs,
    },
    day: {
        width: '14.28%',
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 6,
    },
    daySelected: { backgroundColor: colors.primary },
    dayText: { fontFamily: FONT_FAMILY, color: colors.onSurface },
    dayTextSelected: { color: '#fff' },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: spacing.md,
        gap: spacing.sm,
    },
    actionBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    confirm: { backgroundColor: colors.primary, borderRadius: radius.sm },
    actionText: { fontFamily: FONT_FAMILY, color: colors.primary },
});
