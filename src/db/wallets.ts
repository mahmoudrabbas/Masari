import { v4 as uuidv4 } from 'uuid';
import { getDb, WalletRow } from './database';

export async function getWallets(): Promise<WalletRow[]> {
    const database = await getDb();
    return database.getAllAsync<WalletRow>(
        'SELECT * FROM wallets ORDER BY rowid ASC'
    );
}

export async function getWalletById(id: string): Promise<WalletRow | null> {
    const database = await getDb();
    const row = await database.getFirstAsync<WalletRow>(
        'SELECT * FROM wallets WHERE id = ?',
        [id]
    );
    return row ?? null;
}

export async function addWallet(
    name: string,
    initialBalance = 0
): Promise<string> {
    const database = await getDb();
    const id = uuidv4();
    await database.runAsync(
        'INSERT INTO wallets (id, name, balance) VALUES (?, ?, ?)',
        [id, name, initialBalance]
    );
    return id;
}

export async function deleteWallet(id: string): Promise<void> {
    const database = await getDb();
    await database.runAsync('DELETE FROM transactions WHERE walletId = ?', [
        id,
    ]);
    await database.runAsync(
        'DELETE FROM transfers WHERE fromWalletId = ? OR toWalletId = ?',
        [id, id]
    );
    await database.runAsync('DELETE FROM wallets WHERE id = ?', [id]);
}

export async function adjustWalletBalance(
    id: string,
    delta: number
): Promise<void> {
    const database = await getDb();
    await database.runAsync(
        'UPDATE wallets SET balance = balance + ? WHERE id = ?',
        [delta, id]
    );
}

export async function getTotalBalance(): Promise<number> {
    const database = await getDb();
    const row = await database.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(balance), 0) as total FROM wallets'
    );
    return row?.total ?? 0;
}
