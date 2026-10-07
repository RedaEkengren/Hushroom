import nacl from 'tweetnacl';
import { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

export type EncryptedEnvelope = { ciphertext: string; nonce: string };
export type DecryptedMessage = { text: string; sender: string; timestamp: number };

export function generatePassphrase(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function deriveKey(passphrase: string): Uint8Array {
  return nacl.hash(decodeUTF8(passphrase)).slice(0, nacl.secretbox.keyLength);
}

// Sender + timestamp are bound INTO the ciphertext as part of the encrypted
// payload (Sprint 15.5). NaCl secretbox is AEAD, so a server (or any MITM
// without the E2EE key) cannot rewrite the sender or shift the timestamp
// without breaking the auth tag — the receiver gets null at decrypt time.
export function encryptMessage(
  text: string,
  key: Uint8Array,
  sender: string,
  timestamp: number,
): EncryptedEnvelope {
  const payload = JSON.stringify({ s: sender, t: timestamp, m: text });
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const encrypted = nacl.secretbox(decodeUTF8(payload), nonce, key);
  return { ciphertext: encodeBase64(encrypted), nonce: encodeBase64(nonce) };
}

export function decryptMessage(
  ciphertext: string,
  nonce: string,
  key: Uint8Array,
): DecryptedMessage | null {
  try {
    const decrypted = nacl.secretbox.open(decodeBase64(ciphertext), decodeBase64(nonce), key);
    if (!decrypted) return null;
    const parsed = JSON.parse(encodeUTF8(decrypted));
    if (
      typeof parsed?.s !== 'string' ||
      typeof parsed?.t !== 'number' ||
      typeof parsed?.m !== 'string'
    ) {
      return null;
    }
    return { text: parsed.m, sender: parsed.s, timestamp: parsed.t };
  } catch {
    return null;
  }
}
