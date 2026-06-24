import { Alert, Platform, ToastAndroid } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
    addNotification,
    StoredNotification,
} from '../utils/notificationStore';
import { getDb, TransactionRow } from './database';
import { adjustWalletBalance, getWalletById } from './wallets';

export async function addTransaction(input: {
    type: 'income' | 'expense';
    amount: number;
    walletId: string;
    description: string;
    category?: string;
    date: string;
}): Promise<string> {
    // Prevent expenses that exceed the wallet's available balance
    if (input.type === 'expense') {
        const wallet = await getWalletById(input.walletId);
        if (!wallet) {
            throw new Error('المحفظة غير موجودة');
        }
        if (wallet.balance < input.amount) {
            throw new Error('رصيد المحفظة غير كافٍ لإتمام هذه المعاملة');
        }
    }

    const database = await getDb();
    const id = uuidv4();

    await database.runAsync(
        `INSERT INTO transactions (id, type, amount, walletId, description, category, date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            input.type,
            input.amount,
            input.walletId,
            input.description,
            input.category ?? null,
            input.date,
        ]
    );

    const delta = input.type === 'income' ? input.amount : -input.amount;
    await adjustWalletBalance(input.walletId, delta);

    // Send a local notification to inform the user the transaction was created (native only)
    try {
        if (Platform.OS !== 'web') {
            const Notifications = await import('expo-notifications');
            const title =
                input.type === 'income' ? 'تم إضافة دخل' : 'تمت إضافة مصاريف';
            const body = `${input.description || ''} ${input.amount.toLocaleString()} ج.م`;
            await Notifications.scheduleNotificationAsync({
                content: { title, body },
                trigger: null,
            });

            // persist in-app notification
            const n: StoredNotification = {
                id,
                title,
                body,
                date: new Date().toISOString(),
            };
            await addNotification(n);

            // show quick toast (Android) or alert (iOS/web)
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

export async function getAllTransactions(): Promise<TransactionRow[]> {
    const database = await getDb();
    return database.getAllAsync<TransactionRow>(
        'SELECT * FROM transactions ORDER BY date DESC, rowid DESC'
    );
}

export async function getTransactionsByWallet(
    walletId: string
): Promise<TransactionRow[]> {
    const database = await getDb();
    return database.getAllAsync<TransactionRow>(
        'SELECT * FROM transactions WHERE walletId = ? ORDER BY date DESC, rowid DESC',
        [walletId]
    );
}

export async function getMonthlyTotals(year: number, month: number) {
    const database = await getDb();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const income = await database.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount),0) as total FROM transactions
     WHERE type = 'income' AND substr(date,1,7) = ?`,
        [monthStr]
    );
    const expense = await database.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount),0) as total FROM transactions
     WHERE type = 'expense' AND substr(date,1,7) = ?`,
        [monthStr]
    );

    return {
        income: income?.total ?? 0,
        expense: expense?.total ?? 0,
        net: (income?.total ?? 0) - (expense?.total ?? 0),
    };
}

export async function getExpensesByCategory(year: number, month: number) {
    const database = await getDb();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    return database.getAllAsync<{ category: string; total: number }>(
        `SELECT COALESCE(category, 'أخرى') as category, SUM(amount) as total
     FROM transactions
     WHERE type = 'expense' AND substr(date,1,7) = ?
     GROUP BY category
     ORDER BY total DESC`,
        [monthStr]
    );
}

export async function deleteTransaction(
    id: string,
    // legacy params - callers may still pass these, but we'll derive values from DB
    _walletId?: string,
    _type?: 'income' | 'expense',
    _amount?: number
) {
    const database = await getDb();

    // load the transaction from the DB to decide whether deletion should affect balance
    const t = await getTransactionById(id);
    if (!t) return;

    await database.runAsync('DELETE FROM transactions WHERE id = ?', [id]);

    // Only adjust wallet balance when the transaction represents a refund (استرداد)
    // Refund transactions are created with description starting with 'استرداد'
    const desc = (t.description || '').toString();
    if (desc.includes('استرداد')) {
        const delta = t.type === 'income' ? -t.amount : t.amount;
        await adjustWalletBalance(t.walletId, delta);
    }
}

export async function getTransactionById(id: string) {
    const database = await getDb();
    return database.getFirstAsync<TransactionRow>(
        'SELECT * FROM transactions WHERE id = ? LIMIT 1',
        [id]
    );
}

export async function updateTransaction(
    id: string,
    input: {
        type: 'income' | 'expense';
        amount: number;
        walletId: string;
        description: string;
        category?: string;
        date: string;
    }
) {
    const database = await getDb();
    const old = await getTransactionById(id);
    if (!old) throw new Error('Transaction not found');

    // reverse old impact
    const oldDelta = old.type === 'income' ? old.amount : -old.amount;
    await adjustWalletBalance(old.walletId, -oldDelta);

    // Prevent expenses that exceed the wallet's available balance after reversal
    if (input.type === 'expense') {
        const wallet = await getWalletById(input.walletId);
        if (!wallet) {
            // re-apply old impact to avoid leaving balances inconsistent
            await adjustWalletBalance(old.walletId, oldDelta);
            throw new Error('المحفظة غير موجودة');
        }
        if (wallet.balance < input.amount) {
            // re-apply old impact to avoid leaving balances inconsistent
            await adjustWalletBalance(old.walletId, oldDelta);
            throw new Error('رصيد المحفظة غير كافٍ لإتمام هذه المعاملة');
        }
    }

    // apply new impact
    const newDelta = input.type === 'income' ? input.amount : -input.amount;
    await adjustWalletBalance(input.walletId, newDelta);

    await database.runAsync(
        `UPDATE transactions SET type = ?, amount = ?, walletId = ?, description = ?, category = ?, date = ? WHERE id = ?`,
        [
            input.type,
            input.amount,
            input.walletId,
            input.description,
            input.category ?? null,
            input.date,
            id,
        ]
    );
}

export async function refundTransaction(id: string) {
    const database = await getDb();
    const t = await getTransactionById(id);
    if (!t) throw new Error('Transaction not found');
    // if already refunded, do nothing
    if ((t as any).refunded) {
        throw new Error('Already refunded');
    }

    const opposite: 'income' | 'expense' =
        t.type === 'expense' ? 'income' : 'expense';

    // create opposite transaction
    await addTransaction({
        type: opposite,
        amount: t.amount,
        walletId: t.walletId,
        description: `استرداد: ${t.description || ''}`,
        category: t.category ?? undefined,
        date: new Date().toISOString().slice(0, 10),
    });

    // mark original as refunded
    await database.runAsync(
        'UPDATE transactions SET refunded = 1 WHERE id = ?',
        [id]
    );
}
