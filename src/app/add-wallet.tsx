import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { addWallet } from '../db/wallets';
import {
    colors,
    FONT_FAMILY,
    FONT_FAMILY_BOLD,
    radius,
    spacing,
} from '../theme/theme';

export const options = { presentation: 'modal' };

export default function AddWallet() {
    const router = useRouter();
    const [name, setName] = useState('');

    const onSave = async () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        await addWallet(trimmed, 0);
        router.back();
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <Text style={styles.title}>إضافة محفظة جديدة</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="اسم المحفظة"
                        style={styles.input}
                        textAlign="right"
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.cancel}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.cancelText}>إلغاء</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.save} onPress={onSave}>
                            <Text style={styles.saveText}>حفظ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.containerMargin,
        backgroundColor: colors.background,
        justifyContent: 'center',
        // marginTop: spacing.lg,
    },
    title: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: 20,
        textAlign: 'left',
        marginBottom: spacing.md,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        borderRadius: radius.md,
        padding: spacing.md,
        fontFamily: FONT_FAMILY,
        textAlign: 'left',
        backgroundColor: colors.surface,
    },
    actions: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginTop: spacing.lg,
    },
    cancel: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    cancelText: {
        color: colors.onSurfaceVariant,
        fontFamily: FONT_FAMILY,
    },
    save: {
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    saveText: {
        color: '#fff',
        fontFamily: FONT_FAMILY_BOLD,
    },
});
