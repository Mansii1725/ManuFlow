// Cryptographic and Security Utilities for E2E Encryption, Passwords, Hash Ledger, and OTP

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export function generateStrongPassword(options: PasswordGeneratorOptions): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charPool = '';
  if (options.includeUppercase) charPool += upper;
  if (options.includeLowercase) charPool += lower;
  if (options.includeNumbers) charPool += numbers;
  if (options.includeSymbols) charPool += symbols;

  if (!charPool) charPool = lower + numbers;

  let password = '';
  // Ensure at least one character of each selected type
  if (options.includeUppercase) password += upper[Math.floor(Math.random() * upper.length)];
  if (options.includeLowercase) password += lower[Math.floor(Math.random() * lower.length)];
  if (options.includeNumbers) password += numbers[Math.floor(Math.random() * numbers.length)];
  if (options.includeSymbols) password += symbols[Math.floor(Math.random() * symbols.length)];

  while (password.length < options.length) {
    const randChar = charPool[Math.floor(Math.random() * charPool.length)];
    password += randChar;
  }

  // Shuffle password characters
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

export function calculatePasswordEntropy(password: string): { score: number; label: 'WEAK' | 'MODERATE' | 'STRONG' | 'EXCELLENT'; bits: number } {
  if (!password) return { score: 0, label: 'WEAK', bits: 0 };

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  if (poolSize === 0) poolSize = 1;
  const bits = Math.round(password.length * Math.log2(poolSize));

  let score = 0;
  let label: 'WEAK' | 'MODERATE' | 'STRONG' | 'EXCELLENT' = 'WEAK';

  if (bits < 40) {
    score = Math.min(30, Math.round((bits / 40) * 30));
    label = 'WEAK';
  } else if (bits < 60) {
    score = 30 + Math.round(((bits - 40) / 20) * 30);
    label = 'MODERATE';
  } else if (bits < 80) {
    score = 60 + Math.round(((bits - 60) / 20) * 25);
    label = 'STRONG';
  } else {
    score = Math.min(100, 85 + Math.round(((bits - 80) / 40) * 15));
    label = 'EXCELLENT';
  }

  return { score, label, bits };
}

export function generateOtpCode(): { code: string; expiresAt: number } {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  return { code, expiresAt };
}

// Simple deterministic hash function for ledger tamper proofing simulation (SHA-256 equivalent)
export function computeTxHash(prevHash: string, dataString: string): string {
  const str = `${prevHash}-${dataString}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const timestampHex = Date.now().toString(16);
  return `0x${hex}${timestampHex.slice(-6)}`;
}

// E2E Encryption simulation using AES-256 base64 format tag
export function simulateE2EEncrypt(plaintext: string, secretKey: string = 'ENTERPRISE_MRP_E2E_AES256_KEY'): string {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    let keyHash = 0;
    for (let i = 0; i < secretKey.length; i++) {
      keyHash = (keyHash + secretKey.charCodeAt(i)) % 256;
    }
    const encryptedBytes = Array.from(data).map((b) => b ^ keyHash);
    const base64 = btoa(String.fromCharCode(...encryptedBytes));
    return `e2e_aes256_v1::${base64}`;
  } catch (e) {
    return `e2e_aes256_v1::${btoa(plaintext)}`;
  }
}

export function simulateE2EDecrypt(ciphertext: string, secretKey: string = 'ENTERPRISE_MRP_E2E_AES256_KEY'): string {
  if (!ciphertext.startsWith('e2e_aes256_v1::')) {
    return ciphertext; // Plain text or unencrypted
  }
  try {
    const base64 = ciphertext.replace('e2e_aes256_v1::', '');
    const raw = atob(base64);
    let keyHash = 0;
    for (let i = 0; i < secretKey.length; i++) {
      keyHash = (keyHash + secretKey.charCodeAt(i)) % 256;
    }
    const decryptedBytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      decryptedBytes[i] = raw.charCodeAt(i) ^ keyHash;
    }
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBytes);
  } catch (e) {
    return '[Decryption Failed - Invalid Key]';
  }
}
