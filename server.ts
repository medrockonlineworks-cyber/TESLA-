import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const SECRET_KEY = process.env.OFFLINE_VERIFICATION_SECRET || 'tesla-super-secret-cryptographic-signing-key-2026';

// Initialize PostgreSQL client pool if credentials are set
let pool: pg.Pool | null = null;
const isPostgresConfigured = !!(
  process.env.SQL_HOST &&
  process.env.SQL_DB_NAME &&
  process.env.SQL_ADMIN_USER &&
  process.env.SQL_ADMIN_PASSWORD
);

if (isPostgresConfigured) {
  try {
    pool = new pg.Pool({
      host: process.env.SQL_HOST,
      database: process.env.SQL_DB_NAME,
      user: process.env.SQL_ADMIN_USER,
      password: process.env.SQL_ADMIN_PASSWORD,
      port: 5432,
      ssl: false,
    });
    console.log('🔌 Backend server successfully connected to PostgreSQL.');

    // Automatically bootstrap database tables on startup if PostgreSQL is used
    pool.query(`
      CREATE TABLE IF NOT EXISTS offline_payment_codes (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        txid VARCHAR(255) NOT NULL,
        verification_code VARCHAR(255) UNIQUE NOT NULL,
        signature VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        used BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP WITH TIME ZONE,
        admin_id VARCHAR(255)
      );
    `).then(() => {
      console.log('✅ PostgreSQL table offline_payment_codes initialized successfully.');
    }).catch(err => {
      console.error('❌ Failed to bootstrap offline_payment_codes table:', err);
    });

    pool.query(`
      CREATE TABLE IF NOT EXISTS code_verification_logs (
        id VARCHAR(255) PRIMARY KEY,
        verification_code VARCHAR(255) NOT NULL,
        attempted_by VARCHAR(255),
        user_email VARCHAR(255),
        success BOOLEAN DEFAULT FALSE,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).then(() => {
      console.log('✅ PostgreSQL table code_verification_logs initialized successfully.');
    }).catch(err => {
      console.error('❌ Failed to bootstrap code_verification_logs table:', err);
    });

    pool.query(`
      CREATE TABLE IF NOT EXISTS offline_withdrawal_codes (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL,
        verification_code VARCHAR(255) UNIQUE NOT NULL,
        signature VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        used BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP WITH TIME ZONE,
        admin_id VARCHAR(255)
      );
    `).then(() => {
      console.log('✅ PostgreSQL table offline_withdrawal_codes initialized successfully.');
    }).catch(err => {
      console.error('❌ Failed to bootstrap offline_withdrawal_codes table:', err);
    });

    pool.query(`
      CREATE TABLE IF NOT EXISTS withdrawal_verification_logs (
        id VARCHAR(255) PRIMARY KEY,
        verification_code VARCHAR(255) NOT NULL,
        attempted_by VARCHAR(255),
        user_email VARCHAR(255),
        success BOOLEAN DEFAULT FALSE,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).then(() => {
      console.log('✅ PostgreSQL table withdrawal_verification_logs initialized successfully.');
    }).catch(err => {
      console.error('❌ Failed to bootstrap withdrawal_verification_logs table:', err);
    });

  } catch (err) {
    console.error('❌ Failed to initialize PostgreSQL pool on backend:', err);
  }
} else {
  console.log('⚙️ Backend server running with fallback In-Memory/Simulated storage.');
}

// In-memory fallbacks for offline codes and audit logs
interface OfflineCodeMemory {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  txid: string;
  verification_code: string;
  signature: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired';
  used: boolean;
  verified_at?: string;
  admin_id?: string;
}

interface VerificationLogMemory {
  id: string;
  verification_code: string;
  attempted_by: string;
  user_email: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

interface OfflineWithdrawalCodeMemory {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  verification_code: string;
  signature: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired';
  used: boolean;
  verified_at?: string;
  admin_id?: string;
}

interface WithdrawalVerificationLogMemory {
  id: string;
  verification_code: string;
  attempted_by: string;
  user_email: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

let offlineCodesMemory: OfflineCodeMemory[] = [];
let verificationLogsMemory: VerificationLogMemory[] = [];
let offlineWithdrawalCodesMemory: OfflineWithdrawalCodeMemory[] = [];
let withdrawalVerificationLogsMemory: WithdrawalVerificationLogMemory[] = [];

// Helper to generate a highly distinct 8-character code
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars like O, 0, I, 1
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${part1}-${part2}`;
}

// Helper to generate cryptographic signature
function calculateSignature(email: string, amount: number, txid: string, code: string, expiresAt: string): string {
  const payload = `${email.toLowerCase().trim()}|${Number(amount).toFixed(2)}|${txid.toUpperCase().trim()}|${code}|${expiresAt}`;
  return crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
}

// Helper to generate cryptographic signature for withdrawal
function calculateWithdrawalSignature(email: string, amount: number, code: string, expiresAt: string): string {
  const payload = `${email.toLowerCase().trim()}|${Number(amount).toFixed(2)}|${code}|${expiresAt}`;
  return crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
}

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', postgres: !!pool });
});

// 1b. APK Download
app.get('/api/download-apk', (req, res) => {
  const filePath = path.join(process.cwd(), 'tesla_app.apk');
  res.download(filePath, 'Tesla_Investment_Limited_v1.0.4.apk', (err) => {
    if (err) {
      console.error('Failed to download APK file:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download APK file' });
      }
    }
  });
});

// 2. Generate Offline Verification Code (Admin Action)
app.post('/api/offline-code/generate', async (req, res) => {
  try {
    const { email, amount, txid, expires_minutes, admin_id, user_id } = req.body;

    if (!email || !amount || !txid || !user_id) {
      return res.status(400).json({ error: 'Missing required fields (email, amount, txid, user_id).' });
    }

    const durationMinutes = parseInt(expires_minutes) || 10;
    const verificationCode = generateVerificationCode();
    
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const signature = calculateSignature(email, amount, txid, verificationCode, expiresAt);

    const newCode: OfflineCodeMemory = {
      id: 'ofc_' + crypto.randomUUID().replace(/-/g, ''),
      user_id,
      user_email: email.toLowerCase().trim(),
      amount: parseFloat(amount),
      txid: txid.toUpperCase().trim(),
      verification_code: verificationCode,
      signature,
      created_at: createdAt,
      expires_at: expiresAt,
      status: 'pending',
      used: false,
      admin_id: admin_id || 'admin_direct',
    };

    if (pool) {
      await pool.query(
        `INSERT INTO offline_payment_codes 
         (id, user_id, user_email, amount, txid, verification_code, signature, created_at, expires_at, status, used, admin_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          newCode.id,
          newCode.user_id,
          newCode.user_email,
          newCode.amount,
          newCode.txid,
          newCode.verification_code,
          newCode.signature,
          newCode.created_at,
          newCode.expires_at,
          newCode.status,
          newCode.used,
          newCode.admin_id,
        ]
      );
    } else {
      offlineCodesMemory.push(newCode);
    }

    res.json({ success: true, code: newCode });
  } catch (err: any) {
    console.error('Code generation failed:', err);
    res.status(500).json({ error: 'Internal server error while generating verification code.' });
  }
});

// 3. Cryptographically Verify Code & Credit Wallet (User Action)
app.post('/api/offline-code/verify', async (req, res) => {
  const { code, userId, userEmail } = req.body;
  const attemptedAt = new Date().toISOString();
  const logId = 'log_' + crypto.randomUUID().replace(/-/g, '');

  const logAttempt = async (success: boolean, errMsg?: string) => {
    const newLog: VerificationLogMemory = {
      id: logId,
      verification_code: code || 'UNKNOWN',
      attempted_by: userId || 'ANONYMOUS',
      user_email: userEmail || 'UNKNOWN',
      success,
      error_message: errMsg,
      created_at: attemptedAt,
    };

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO code_verification_logs (id, verification_code, attempted_by, user_email, success, error_message, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [newLog.id, newLog.verification_code, newLog.attempted_by, newLog.user_email, newLog.success, newLog.error_message, newLog.created_at]
        );
      } catch (logErr) {
        console.error('Failed to write to database verification log:', logErr);
      }
    } else {
      verificationLogsMemory.unshift(newLog);
    }
  };

  try {
    if (!code || !userId || !userEmail) {
      await logAttempt(false, 'Missing input fields');
      return res.status(400).json({ error: 'Missing code, userId, or userEmail.' });
    }

    const cleanCode = code.toUpperCase().trim();
    let record: OfflineCodeMemory | null = null;

    if (pool) {
      const { rows } = await pool.query(
        'SELECT * FROM offline_payment_codes WHERE verification_code = $1',
        [cleanCode]
      );
      if (rows && rows.length > 0) {
        const r = rows[0];
        record = {
          id: r.id,
          user_id: r.user_id,
          user_email: r.user_email,
          amount: parseFloat(r.amount),
          txid: r.txid,
          verification_code: r.verification_code,
          signature: r.signature,
          created_at: new Date(r.created_at).toISOString(),
          expires_at: new Date(r.expires_at).toISOString(),
          status: r.status,
          used: r.used,
          verified_at: r.verified_at ? new Date(r.verified_at).toISOString() : undefined,
          admin_id: r.admin_id,
        };
      }
    } else {
      record = offlineCodesMemory.find(c => c.verification_code === cleanCode) || null;
    }

    // 1. Check if verification code exists
    if (!record) {
      await logAttempt(false, 'Invalid Verification Code');
      return res.status(400).json({ error: 'Invalid Verification Code' });
    }

    // 2. Check if code already used
    if (record.used || record.status === 'completed') {
      await logAttempt(false, 'Verification Code Already Used');
      return res.status(400).json({ error: 'Verification Code Already Used' });
    }

    // 3. Check if code expired
    if (new Date(record.expires_at).getTime() < Date.now()) {
      if (pool) {
        await pool.query("UPDATE offline_payment_codes SET status = 'expired' WHERE id = $1", [record.id]);
      } else {
        record.status = 'expired';
      }
      await logAttempt(false, 'Verification Code Expired');
      return res.status(400).json({ error: 'Verification Code Expired' });
    }

    // 4. Check email matches
    if (record.user_email.toLowerCase() !== userEmail.toLowerCase()) {
      await logAttempt(false, 'Email Mismatch');
      return res.status(400).json({ error: 'Email Mismatch' });
    }

    // 5. Check user ID matches
    if (record.user_id !== userId) {
      await logAttempt(false, 'User ID Mismatch');
      return res.status(400).json({ error: 'User ID Mismatch' });
    }

    // 6. Cryptographic signature verification (ensure payload is unmodified and authentic)
    const expectedSignature = calculateSignature(
      record.user_email,
      record.amount,
      record.txid,
      record.verification_code,
      record.expires_at
    );

    if (record.signature !== expectedSignature) {
      await logAttempt(false, 'Invalid Signature / Code Tampered');
      return res.status(400).json({ error: 'Invalid Signature' });
    }

    // --- ALL VALIDATIONS PASSED: EXECUTE CREDIT WALLET ---
    const verifiedAt = new Date().toISOString();

    if (pool) {
      // Create db client transaction to guarantee atomicity and avoid race conditions / double credit
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Check again inside block transaction to double-prevent replay attacks
        const checkRes = await client.query('SELECT used FROM offline_payment_codes WHERE id = $1 FOR UPDATE', [record.id]);
        if (checkRes.rows[0].used) {
          throw new Error('Verification Code Already Used (Replay Prevented)');
        }

        // Mark code as used
        await client.query(
          "UPDATE offline_payment_codes SET used = true, status = 'completed', verified_at = $1 WHERE id = $2",
          [verifiedAt, record.id]
        );

        // Increase user's wallet balance
        await client.query(
          "UPDATE users SET balance = balance + $1 WHERE id = $2",
          [record.amount, record.user_id]
        );

        // Create transaction record
        const txId = 'tx_ofv_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
        await client.query(
          `INSERT INTO transactions (id, user_id, type, amount, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            txId,
            record.user_id,
            'deposit',
            record.amount,
            `Offline Cryptographic Verification Success - TXID: ${record.txid}`,
            verifiedAt
          ]
        );

        await client.query('COMMIT');
      } catch (err: any) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      // Fallback update
      record.used = true;
      record.status = 'completed';
      record.verified_at = verifiedAt;
    }

    await logAttempt(true);
    res.json({
      success: true,
      amount: record.amount,
      txid: record.txid,
      verified_at: verifiedAt,
    });
  } catch (err: any) {
    console.error('Verification failed:', err);
    await logAttempt(false, err.message || 'System error');
    res.status(500).json({ error: err.message || 'Verification Failed' });
  }
});

// 4. Admin API: Retrieve codes
app.get('/api/offline-code/admin/list', async (req, res) => {
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM offline_payment_codes ORDER BY created_at DESC');
      res.json(rows);
    } else {
      res.json(offlineCodesMemory);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve codes' });
  }
});

// 5. Admin API: Delete expired codes
app.delete('/api/offline-code/admin/expired', async (req, res) => {
  try {
    if (pool) {
      const { rowCount } = await pool.query("DELETE FROM offline_payment_codes WHERE expires_at < NOW() AND status = 'pending'");
      res.json({ success: true, deleted: rowCount });
    } else {
      const countBefore = offlineCodesMemory.length;
      offlineCodesMemory = offlineCodesMemory.filter(c => !(new Date(c.expires_at).getTime() < Date.now() && c.status === 'pending'));
      res.json({ success: true, deleted: countBefore - offlineCodesMemory.length });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear expired codes' });
  }
});

// 6. Admin API: Retrieve Audit verification logs
app.get('/api/offline-code/admin/logs', async (req, res) => {
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM code_verification_logs ORDER BY created_at DESC LIMIT 100');
      res.json(rows);
    } else {
      res.json(verificationLogsMemory);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// ============================================================================
// OFFLINE WITHDRAWAL CRYPTOGRAPHIC VERIFICATION ENDPOINTS
// ============================================================================

// 1. Generate Offline Withdrawal Verification Code (Admin Action)
app.post('/api/offline-withdrawal/generate', async (req, res) => {
  try {
    const { email, amount, expires_minutes, admin_id, user_id } = req.body;

    if (!email || !amount || !user_id) {
      return res.status(400).json({ error: 'Missing required fields (email, amount, user_id).' });
    }

    const durationMinutes = parseInt(expires_minutes) || 10;
    const verificationCode = generateVerificationCode();
    
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const signature = calculateWithdrawalSignature(email, amount, verificationCode, expiresAt);

    const newCode: OfflineWithdrawalCodeMemory = {
      id: 'ofw_' + crypto.randomUUID().replace(/-/g, ''),
      user_id,
      user_email: email.toLowerCase().trim(),
      amount: parseFloat(amount),
      verification_code: verificationCode,
      signature,
      created_at: createdAt,
      expires_at: expiresAt,
      status: 'pending',
      used: false,
      admin_id: admin_id || 'admin_direct',
    };

    if (pool) {
      await pool.query(
        `INSERT INTO offline_withdrawal_codes 
         (id, user_id, user_email, amount, verification_code, signature, created_at, expires_at, status, used, admin_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          newCode.id,
          newCode.user_id,
          newCode.user_email,
          newCode.amount,
          newCode.verification_code,
          newCode.signature,
          newCode.created_at,
          newCode.expires_at,
          newCode.status,
          newCode.used,
          newCode.admin_id,
        ]
      );
    } else {
      offlineWithdrawalCodesMemory.push(newCode);
    }

    res.json({ success: true, code: newCode });
  } catch (err: any) {
    console.error('Withdrawal code generation failed:', err);
    res.status(500).json({ error: 'Internal server error while generating verification code.' });
  }
});

// 2. Cryptographically Verify Code & Deduct Wallet (User Action)
app.post('/api/offline-withdrawal/verify', async (req, res) => {
  const { code, userId, userEmail } = req.body;
  const attemptedAt = new Date().toISOString();
  const logId = 'log_w_' + crypto.randomUUID().replace(/-/g, '');

  const logAttempt = async (success: boolean, errMsg?: string) => {
    const newLog: WithdrawalVerificationLogMemory = {
      id: logId,
      verification_code: code || 'UNKNOWN',
      attempted_by: userId || 'ANONYMOUS',
      user_email: userEmail || 'UNKNOWN',
      success,
      error_message: errMsg,
      created_at: attemptedAt,
    };

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO withdrawal_verification_logs (id, verification_code, attempted_by, user_email, success, error_message, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [newLog.id, newLog.verification_code, newLog.attempted_by, newLog.user_email, newLog.success, newLog.error_message, newLog.created_at]
        );
      } catch (logErr) {
        console.error('Failed to write to database withdrawal verification log:', logErr);
      }
    } else {
      withdrawalVerificationLogsMemory.unshift(newLog);
    }
  };

  try {
    if (!code || !userId || !userEmail) {
      await logAttempt(false, 'Missing input fields');
      return res.status(400).json({ error: 'Missing code, userId, or userEmail.' });
    }

    const cleanCode = code.toUpperCase().trim();
    let record: OfflineWithdrawalCodeMemory | null = null;

    if (pool) {
      const { rows } = await pool.query(
        'SELECT * FROM offline_withdrawal_codes WHERE verification_code = $1',
        [cleanCode]
      );
      if (rows && rows.length > 0) {
        const r = rows[0];
        record = {
          id: r.id,
          user_id: r.user_id,
          user_email: r.user_email,
          amount: parseFloat(r.amount),
          verification_code: r.verification_code,
          signature: r.signature,
          created_at: new Date(r.created_at).toISOString(),
          expires_at: new Date(r.expires_at).toISOString(),
          status: r.status,
          used: r.used,
          verified_at: r.verified_at ? new Date(r.verified_at).toISOString() : undefined,
          admin_id: r.admin_id,
        };
      }
    } else {
      record = offlineWithdrawalCodesMemory.find(c => c.verification_code === cleanCode) || null;
    }

    // 1. Check if verification code exists
    if (!record) {
      await logAttempt(false, 'Invalid Verification Code');
      return res.status(400).json({ error: 'Invalid Verification Code' });
    }

    // 2. Check if code already used
    if (record.used || record.status === 'completed') {
      await logAttempt(false, 'Verification Code Already Used');
      return res.status(400).json({ error: 'Verification Code Already Used' });
    }

    // 3. Check if code expired
    if (new Date(record.expires_at).getTime() < Date.now()) {
      if (pool) {
        await pool.query("UPDATE offline_withdrawal_codes SET status = 'expired' WHERE id = $1", [record.id]);
      } else {
        record.status = 'expired';
      }
      await logAttempt(false, 'Verification Code Expired');
      return res.status(400).json({ error: 'Verification Code Expired' });
    }

    // 4. Check email matches
    if (record.user_email.toLowerCase() !== userEmail.toLowerCase()) {
      await logAttempt(false, 'Email Mismatch');
      return res.status(400).json({ error: 'Email Mismatch' });
    }

    // 5. Check user ID matches
    if (record.user_id !== userId) {
      await logAttempt(false, 'User ID Mismatch');
      return res.status(400).json({ error: 'User ID Mismatch' });
    }

    // 6. Cryptographic signature verification (ensure payload is unmodified and authentic)
    const expectedSignature = calculateWithdrawalSignature(
      record.user_email,
      record.amount,
      record.verification_code,
      record.expires_at
    );

    if (record.signature !== expectedSignature) {
      await logAttempt(false, 'Invalid Signature / Code Tampered');
      return res.status(400).json({ error: 'Invalid Signature' });
    }

    // --- ALL VALIDATIONS PASSED: EXECUTE WALLET DEDUCTION AND COMPLETED WITHDRAWAL ---
    const verifiedAt = new Date().toISOString();

    if (pool) {
      // Create db client transaction to guarantee atomicity and avoid double execution
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Check user balance first
        const userRes = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [record.user_id]);
        if (!userRes.rows || userRes.rows.length === 0) {
          throw new Error('User Profile Not Found');
        }
        const currentBalance = parseFloat(userRes.rows[0].balance);
        if (currentBalance < record.amount) {
          throw new Error('Insufficient Balance for Withdrawal');
        }

        // Check again inside block transaction to double-prevent replay attacks
        const checkRes = await client.query('SELECT used FROM offline_withdrawal_codes WHERE id = $1 FOR UPDATE', [record.id]);
        if (checkRes.rows[0].used) {
          throw new Error('Verification Code Already Used (Replay Prevented)');
        }

        // Mark code as used
        await client.query(
          "UPDATE offline_withdrawal_codes SET used = true, status = 'completed', verified_at = $1 WHERE id = $2",
          [verifiedAt, record.id]
        );

        // Deduct user's wallet balance
        await client.query(
          "UPDATE users SET balance = balance - $1 WHERE id = $2",
          [record.amount, record.user_id]
        );

        // Create transaction record
        const txId = 'tx_ofw_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
        await client.query(
          `INSERT INTO transactions (id, user_id, type, amount, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            txId,
            record.user_id,
            'withdrawal',
            record.amount,
            `Offline Cryptographic Withdrawal Verification Success`,
            verifiedAt
          ]
        );

        await client.query('COMMIT');
      } catch (err: any) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      // Fallback update
      record.used = true;
      record.status = 'completed';
      record.verified_at = verifiedAt;
    }

    await logAttempt(true);
    res.json({
      success: true,
      amount: record.amount,
      verified_at: verifiedAt,
    });
  } catch (err: any) {
    console.error('Withdrawal verification failed:', err);
    await logAttempt(false, err.message || 'System error');
    res.status(500).json({ error: err.message || 'Verification Failed' });
  }
});

// 3. Admin API: Retrieve withdrawal codes
app.get('/api/offline-withdrawal/admin/list', async (req, res) => {
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM offline_withdrawal_codes ORDER BY created_at DESC');
      res.json(rows);
    } else {
      res.json(offlineWithdrawalCodesMemory);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve codes' });
  }
});

// 4. Admin API: Delete expired withdrawal codes
app.delete('/api/offline-withdrawal/admin/expired', async (req, res) => {
  try {
    if (pool) {
      const { rowCount } = await pool.query("DELETE FROM offline_withdrawal_codes WHERE expires_at < NOW() AND status = 'pending'");
      res.json({ success: true, deleted: rowCount });
    } else {
      const countBefore = offlineWithdrawalCodesMemory.length;
      offlineWithdrawalCodesMemory = offlineWithdrawalCodesMemory.filter(c => !(new Date(c.expires_at).getTime() < Date.now() && c.status === 'pending'));
      res.json({ success: true, deleted: countBefore - offlineWithdrawalCodesMemory.length });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear expired codes' });
  }
});

// 5. Admin API: Retrieve Audit verification logs for withdrawals
app.get('/api/offline-withdrawal/admin/logs', async (req, res) => {
  try {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM withdrawal_verification_logs ORDER BY created_at DESC LIMIT 100');
      res.json(rows);
    } else {
      res.json(withdrawalVerificationLogsMemory);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// ============================================================================
// VITE DEV SERVER MIDDLEWARE & STATIC FILE SERVING
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Secure Cryptographic Verification backend running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start full-stack server:', err);
});
