import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_SEMIBOLD,
    radius,
    spacing,
} from '../theme/theme';

type Props = {
    visible: boolean;
    title?: string;
    children?: React.ReactNode;
    onCancel: () => void;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: string;
    cancelColor?: string;
};

export default function ConfirmModal({
    visible,
    title = 'تأكيد',
    children,
    onCancel,
    onConfirm,
    confirmLabel = 'تأكيد',
    cancelLabel = 'إلغاء',
    confirmColor,
    cancelColor,
}: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={s.backdrop}>
                <View style={s.container}>
                    <Text style={s.title}>{title}</Text>
                    <ScrollView style={s.content}>{children}</ScrollView>
                    <View style={s.actions}>
                        <TouchableOpacity onPress={onCancel} style={s.cancel}>
                            <Text
                                style={[
                                    s.cancelText,
                                    cancelColor ? { color: cancelColor } : {},
                                ]}
                            >
                                {cancelLabel}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onConfirm}
                            style={[
                                s.confirm,
                                confirmColor
                                    ? { backgroundColor: confirmColor }
                                    : {},
                            ]}
                        >
                            <Text
                                style={[
                                    s.confirmText,
                                    confirmColor ? { color: '#fff' } : {},
                                ]}
                            >
                                {confirmLabel}
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
    title: {
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        color: colors.onSurface,
        padding: spacing.md,
        borderBottomWidth: 1,
        borderColor: colors.outlineVariant,
    },
    content: { maxHeight: 300, padding: spacing.md },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: spacing.md,
        gap: spacing.sm,
    },
    cancel: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    cancelText: { fontFamily: FONT_FAMILY, color: colors.onSurfaceVariant },
    confirm: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primary,
        borderRadius: radius.sm,
    },
    confirmText: {
        fontFamily: FONT_FAMILY_SEMIBOLD,
        color: '#fff',
    },
});
