/**
 * Authentication utilities: JWT signing/verification and password hashing
 * Uses Web Crypto API for security
 */

import type { JWTPayload } from './types';

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const hashHex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [saltHex, originalHash] = hash.split(':');

  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const hashHex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex === originalHash;
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(data: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): ArrayBuffer {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Sign a JWT token
 */
export async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const encoder = new TextEncoder();

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));

  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  const encodedSignature = base64UrlEncode(signature);

  return `${data}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64UrlDecode(encodedSignature);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(data)
    );

    if (!isValid) {
      return null;
    }

    const payloadData = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(new TextDecoder().decode(payloadData)) as JWTPayload;

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Create a JWT token for a user
 */
export async function createUserToken(
  userId: string,
  email: string,
  tier: string,
  secret: string,
  expiresInDays: number = 30
): Promise<string> {
  const payload: JWTPayload = {
    userId,
    email,
    tier,
    exp: Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60)
  };

  return signJWT(payload, secret);
}
