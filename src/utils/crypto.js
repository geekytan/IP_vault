/**
 * Zero-Knowledge Cryptographic Engine for IP Vault
 * Utilizes the native Web Crypto API (SubtleCrypto) for high-performance,
 * hardware-accelerated SHA-256 hashing and AES-256-GCM encryption/decryption.
 *
 * Files are hashed and encrypted client-side in browser memory before
 * touching any network or IPFS nodes.
 */

// Convert ArrayBuffer to Hex string
export function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert Hex string to Uint8Array
export function hexToBuffer(hex) {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const match = cleanHex.match(/.{1,2}/g);
  if (!match) return new Uint8Array(0);
  return new Uint8Array(match.map((byte) => parseInt(byte, 16)));
}

// Convert Uint8Array to URL-safe Base64
export function uint8ArrayToBase64(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Convert URL-safe Base64 to Uint8Array
export function base64ToUint8Array(base64) {
  let str = base64.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Computes the SHA-256 cryptographic digest of a File, Blob, or ArrayBuffer.
 * Returns both the hex string and bytes32 representation for Solidity contracts.
 *
 * @param {File | Blob | ArrayBuffer} data
 * @returns {Promise<{ hex: string, bytes32: string }>}
 */
export async function computeSHA256(data) {
  let buffer;
  if (data instanceof ArrayBuffer) {
    buffer = data;
  } else if (data instanceof Blob || (typeof File !== "undefined" && data instanceof File)) {
    buffer = await data.arrayBuffer();
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer;
  } else if (typeof data === "string") {
    buffer = new TextEncoder().encode(data).buffer;
  } else {
    throw new Error("Unsupported data format for SHA-256 hashing");
  }

  const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
  const hex = bufferToHex(hashBuffer);
  return {
    hex,
    bytes32: `0x${hex}`,
  };
}

/**
 * Generates an exportable 256-bit AES-GCM cryptographic key.
 * @returns {Promise<CryptoKey>}
 */
export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a CryptoKey to a URL-safe Base64 string.
 * @param {CryptoKey} key
 * @returns {Promise<string>}
 */
export async function exportKeyToBase64(key) {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return uint8ArrayToBase64(new Uint8Array(exported));
}

/**
 * Imports a CryptoKey from a Base64 string.
 * @param {string} base64Key
 * @returns {Promise<CryptoKey>}
 */
export async function importKeyFromBase64(base64Key) {
  const keyBytes = base64ToUint8Array(base64Key);
  return await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a File or ArrayBuffer using AES-256-GCM.
 * Generates a fresh 12-byte random Initialization Vector (IV).
 *
 * @param {File | Blob} file
 * @param {CryptoKey} [existingKey] - Optional existing key; if not provided, a new one is generated.
 * @returns {Promise<{
 *   encryptedBlob: Blob,
 *   keyBase64: string,
 *   ivBase64: string,
 *   sha256Hex: string,
 *   originalName: string,
 *   originalType: string,
 *   originalSize: number
 * }>}
 */
export async function encryptFile(file, existingKey = null) {
  const fileBuffer = await file.arrayBuffer();

  // 1. Calculate original unencrypted SHA-256 hash (Proof of Existence & Prior Art)
  const { hex: sha256Hex } = await computeSHA256(fileBuffer);

  // 2. Obtain or generate AES-256 key
  const key = existingKey || (await generateAESKey());
  const keyBase64 = await exportKeyToBase64(key);

  // 3. Generate 96-bit (12-byte) cryptographically secure random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ivBase64 = uint8ArrayToBase64(iv);

  // 4. Encrypt with AES-GCM
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128, // 128-bit authentication tag
    },
    key,
    fileBuffer
  );

  const encryptedBlob = new Blob([ciphertextBuffer], {
    type: "application/octet-stream",
  });

  return {
    encryptedBlob,
    keyBase64,
    ivBase64,
    sha256Hex,
    originalName: file.name || "unnamed_asset",
    originalType: file.type || "application/octet-stream",
    originalSize: file.size || fileBuffer.byteLength,
  };
}

/**
 * Decrypts an encrypted ArrayBuffer or Blob using AES-256-GCM with key & IV.
 * Verifies authenticity tag and compares recovered file SHA-256 against expected hash.
 *
 * @param {ArrayBuffer | Blob} encryptedData
 * @param {string} keyBase64 - URL-safe Base64 encoded AES-256 key
 * @param {string} ivBase64 - URL-safe Base64 encoded 12-byte IV
 * @param {string} [expectedSha256] - Optional expected SHA-256 hex to verify integrity
 * @param {string} [mimeType] - MIME type for the returned Blob
 * @returns {Promise<{ decryptedBlob: Blob, decryptedBuffer: ArrayBuffer, verified: boolean }>}
 */
export async function decryptFile(encryptedData, keyBase64, ivBase64, expectedSha256 = null, mimeType = "application/octet-stream") {
  let encryptedBuffer;
  if (encryptedData instanceof ArrayBuffer) {
    encryptedBuffer = encryptedData;
  } else if (encryptedData instanceof Blob) {
    encryptedBuffer = await encryptedData.arrayBuffer();
  } else {
    throw new Error("Invalid encrypted data type");
  }

  const key = await importKeyFromBase64(keyBase64);
  const iv = base64ToUint8Array(ivBase64);

  let decryptedBuffer;
  try {
    decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128,
      },
      key,
      encryptedBuffer
    );
  } catch (err) {
    throw new Error("Decryption failed. The access key may be invalid, or the file was corrupted.");
  }

  // Verify SHA-256 integrity
  let verified = true;
  if (expectedSha256) {
    const { hex: actualSha256 } = await computeSHA256(decryptedBuffer);
    verified = actualSha256.toLowerCase() === expectedSha256.toLowerCase();
    if (!verified) {
      throw new Error(`Integrity verification failed! Expected hash ${expectedSha256}, but got ${actualSha256}`);
    }
  }

  const decryptedBlob = new Blob([decryptedBuffer], { type: mimeType });

  return {
    decryptedBlob,
    decryptedBuffer,
    verified,
  };
}

