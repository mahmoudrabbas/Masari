import { Alert, Platform, ToastAndroid } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import {
    addNotification,
    StoredNotification,
} from '../utils/notificationStore';
import { getDb, TransferRow } from './database';
import { adjustWalletBalance, getWalletById } from './wallets';

export async function addTransfer(input: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
}): Promise<string> {
    if (input.fromWalletId === input.toWalletId) {
        throw new Error('Cannot transfer to the same wallet');
    }

    // Prevent transfers that exceed the source wallet's available balance
    const fromWallet = await getWalletById(input.fromWalletId);
    if (!fromWallet) {
        throw new Error('المحفظة المصدر غير موجودة');
    }
    if (fromWallet.balance < input.amount) {
        throw new Error('رصيد المحفظة غير كافٍ لإتمام هذا التحويل');
    }

    const database = await getDb();
    const id = uuidv4();

    await database.runAsync(
        `INSERT INTO transfers (id, fromWalletId, toWalletId, amount, date)
     VALUES (?, ?, ?, ?, ?)`,
        [id, input.fromWalletId, input.toWalletId, input.amount, input.date]
    );

    await adjustWalletBalance(input.fromWalletId, -input.amount);
    await adjustWalletBalance(input.toWalletId, input.amount);

    // Send notification on native platforms and persist for in-app center
    try {
        if (Platform.OS !== 'web') {
            const Notifications = await import('expo-notifications');
            const title = 'تمت عملية تحويل';
            const body = `من ${input.fromWalletId} إلى ${input.toWalletId} ${input.amount.toLocaleString()} ج.م`;
            await Notifications.scheduleNotificationAsync({
                content: { title, body },
                trigger: null,
            });

            const n: StoredNotification = {
                id,
                title,
                body,
                date: new Date().toISOString(),
            };
            await addNotification(n);

            if (Platform.OS === 'android') {
                ToastAndroid.show(body, ToastAndroid.SHORT);
            } else {
                Alert.alert(title, body);
            }
        }
    } catch (e) {
        // ignore notification failures
    }

    return id;
}

export async function getAllTransfers(): Promise<TransferRow[]> {
    const database = await getDb();
    return database.getAllAsync<TransferRow>(
        'SELECT * FROM transfers ORDER BY date DESC, rowid DESC'
    );
}

export async function deleteTransfer(
    id: string,
    fromWalletId: string,
    toWalletId: string,
    amount: number
) {
    const database = await getDb();
    await database.runAsync('DELETE FROM transfers WHERE id = ?', [id]);
    // reverse balances applied when transfer was created
    await adjustWalletBalance(fromWalletId, amount); // give back to source
    await adjustWalletBalance(toWalletId, -amount); // remove from destination
}
