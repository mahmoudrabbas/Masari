import * as SQLite from 'expo-sqlite';

export type WalletRow = {
    id: string;
    name: string;
    balance: number;
};

export type TransactionRow = {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    walletId: string;
    description: string;
    date: string;
    category?: string;
    refunded?: number;
};

export type TransferRow = {
    id: string;
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
};

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (db) return db;
    db = await SQLite.openDatabaseAsync('pocket_tracker.db');

    // Create base schema if missing
    await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income','expense')),
      amount REAL NOT NULL,
      walletId TEXT NOT NULL,
      description TEXT,
      category TEXT,
      date TEXT NOT NULL,
      FOREIGN KEY (walletId) REFERENCES wallets(id)
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY NOT NULL,
      fromWalletId TEXT NOT NULL,
      toWalletId TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (fromWalletId) REFERENCES wallets(id),
      FOREIGN KEY (toWalletId) REFERENCES wallets(id)
    );
  `);

    // Run lightweight migrations for older DB schemas
    try {
        const pragmaRows = await db.getAllAsync<{
            name: string;
            notnull: number;
        }>("PRAGMA table_info('transactions')");
        const hasWalletId = pragmaRows.some((r) => r.name === 'walletId');
        const snakeCol = pragmaRows.find((r) => r.name === 'wallet_id');
        const hasSnake = !!snakeCol;

        if (!hasWalletId) {
            // Add walletId column (nullable) so ALTER is safe on existing DBs
            await db.runAsync(
                'ALTER TABLE transactions ADD COLUMN walletId TEXT'
            );

            // If older schema used `wallet_id`, copy its values into new `walletId` column
            if (hasSnake) {
                await db.runAsync(
                    'UPDATE transactions SET walletId = wallet_id WHERE walletId IS NULL OR walletId = ?',
                    ['']
                );
            }

            // Backfill any remaining NULL/empty to the default wallet id placeholder.
            await db.runAsync(
                'UPDATE transactions SET walletId = ? WHERE walletId IS NULL OR walletId = ?',
                ['cash-default', '']
            );
        }

        // Add refunded flag to transactions to prevent duplicate refunds
        const hasRefunded = pragmaRows.some((r) => r.name === 'refunded');
        if (!hasRefunded) {
            try {
                await db.runAsync(
                    'ALTER TABLE transactions ADD COLUMN refunded INTEGER DEFAULT 0'
                );
            } catch (e) {
                // ignore if cannot alter
            }
        }

        // If legacy `wallet_id` column exists and was declared NOT NULL, rebuild table
        // to remove the old column and ensure the schema matches our current code.
        if (hasSnake && snakeCol && snakeCol.notnull === 1) {
            await db.execAsync('BEGIN TRANSACTION;');
            try {
                // Create new table with the expected schema
                await db.execAsync(`
                    CREATE TABLE IF NOT EXISTS transactions_new (
                      id TEXT PRIMARY KEY NOT NULL,
                      type TEXT NOT NULL CHECK (type IN ('income','expense')),
                      amount REAL NOT NULL,
                      walletId TEXT NOT NULL,
                      description TEXT,
                      category TEXT,
                      date TEXT NOT NULL,
                      FOREIGN KEY (walletId) REFERENCES wallets(id)
                    );
                `);

                // Copy data, preferring existing walletId, then wallet_id, then default
                await db.runAsync(
                    `INSERT INTO transactions_new (id, type, amount, walletId, description, category, date)
                     SELECT id, type, amount, COALESCE(walletId, wallet_id, ?) as walletId, description, category, date
                     FROM transactions;`,
                    ['cash-default']
                );

                // Replace old table
                await db.execAsync('DROP TABLE transactions;');
                await db.execAsync(
                    'ALTER TABLE transactions_new RENAME TO transactions;'
                );
                await db.execAsync('COMMIT;');
            } catch (inner) {
                await db.execAsync('ROLLBACK;');
                // eslint-disable-next-line no-console
                console.warn('DB table rebuild failed:', inner);
            }
        }
    } catch (e) {
        // Swallow migration errors to avoid breaking startup; log in console for debugging.
        // eslint-disable-next-line no-console
        console.warn('DB migration warning:', e);
    }

    // Ensure transfers table columns are correct (handle legacy column names)
    try {
        const transferPragma = await db.getAllAsync<{ name: string }>(
            "PRAGMA table_info('transfers')"
        );
        const transferCols = transferPragma.map((r) => r.name);
        const hasFrom = transferCols.includes('fromWalletId');
        const hasTo = transferCols.includes('toWalletId');

        if (!hasFrom || !hasTo) {
            // Determine best candidate column names from legacy patterns
            const fromCandidates = [
                'fromWalletId',
                'from_walletId',
                'from_wallet_id',
                'from walletId',
                'fromwalletid',
                'from_walletid',
            ];
            const toCandidates = [
                'toWalletId',
                'to_walletId',
                'to_wallet_id',
                'to walletId',
                'towalletid',
                'to_walletid',
            ];

            const pick = (candidates: string[]) =>
                candidates.find((c) => transferCols.includes(c)) ?? null;
            const fromCol = pick(fromCandidates);
            const toCol = pick(toCandidates);

            // Rebuild table safely copying existing data
            await db.execAsync('BEGIN TRANSACTION;');
            try {
                await db.execAsync(`
                    CREATE TABLE IF NOT EXISTS transfers_new (
                      id TEXT PRIMARY KEY NOT NULL,
                      fromWalletId TEXT NOT NULL,
                      toWalletId TEXT NOT NULL,
                      amount REAL NOT NULL,
                      date TEXT NOT NULL,
                      FOREIGN KEY (fromWalletId) REFERENCES wallets(id),
                      FOREIGN KEY (toWalletId) REFERENCES wallets(id)
                    );
                `);

                // Build SELECT mapping: use existing columns when present, otherwise default to 'cash-default'
                const fromExpr = fromCol
                    ? `COALESCE(${JSON.stringify(fromCol).replace(/"/g, '"')}, 'cash-default')`
                    : `'cash-default'`;
                const toExpr = toCol
                    ? `COALESCE(${JSON.stringify(toCol).replace(/"/g, '"')}, 'cash-default')`
                    : `'cash-default'`;

                // SQLite requires identifiers not to be quoted as JSON strings; instead, if column name contains special chars, wrap in double quotes
                const wrapIdent = (name: string | null) => {
                    if (!name) return null;
                    if (/[^a-zA-Z0-9_]/.test(name))
                        return `"${name.replace(/"/g, '"')}"`;
                    return name;
                };

                const fromIdent = wrapIdent(fromCol);
                const toIdent = wrapIdent(toCol);

                const finalFromExpr = fromIdent
                    ? `COALESCE(${fromIdent}, 'cash-default')`
                    : `'cash-default'`;
                const finalToExpr = toIdent
                    ? `COALESCE(${toIdent}, 'cash-default')`
                    : `'cash-default'`;

                await db.runAsync(
                    `INSERT INTO transfers_new (id, fromWalletId, toWalletId, amount, date)
                     SELECT id, ${finalFromExpr} as fromWalletId, ${finalToExpr} as toWalletId, amount, date FROM transfers;`
                );

                await db.execAsync('DROP TABLE transfers;');
                await db.execAsync(
                    'ALTER TABLE transfers_new RENAME TO transfers;'
                );
                await db.execAsync('COMMIT;');
            } catch (inner) {
                await db.execAsync('ROLLBACK;');
                // eslint-disable-next-line no-console
                console.warn('DB transfers table rebuild failed:', inner);
            }
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('DB transfers migration warning:', e);
    }

    // Seed a default wallet if none exist
    const existing = await db.getAllAsync<WalletRow>('SELECT * FROM wallets');
    if (existing.length === 0) {
        await db.runAsync(
            'INSERT INTO wallets (id, name, balance) VALUES (?, ?, ?)',
            ['cash-default', 'محفظة كاش', 0]
        );
    }

    return db;
}

export async function resetDbHandle() {
    db = null;
}
