/**
 * Access Key Management for IP Vault
 * Supports both modern Cryptographic Access Keys (AES-256-GCM + IV + SHA-256)
 * and legacy v2 keys for backward compatibility.
 */

const KEY_PREFIX = "IPV-";
const STORAGE_PREFIX = "ip_vault_asset_key_";

/**
 * Generates a tamper-evident, cryptographic access key.
 * Contains the token ID, Base64 AES-256 decryption key, initialization vector (IV),
 * and asset SHA-256 fingerprint.
 *
 * @param {Object} params
 * @param {number|string} params.tokenId
 * @param {string} [params.keyBase64]
 * @param {string} [params.ivBase64]
 * @param {string} [params.sha256Hex]
 * @param {string} [params.name]
 * @returns {string} The formatted access key (e.g. IPV-eyJ2IjoiMy4w...)
 */
export function generateAccessKey({ tokenId, keyBase64 = null, ivBase64 = null, sha256Hex = null, name = null }) {
  const payload = {
    v: "3.0",
    t: Number(tokenId),
    k: keyBase64 || null,
    i: ivBase64 || null,
    h: sha256Hex || null,
    n: name || null,
  };

  const jsonStr = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  return `${KEY_PREFIX}${base64}`;
}

/**
 * Decodes an access key string (handles IPV- prefix, raw base64, or legacy keys).
 *
 * @param {string} rawKey
 * @returns {{
 *   tokenId: number,
 *   isEncrypted: boolean,
 *   keyBase64: string | null,
 *   ivBase64: string | null,
 *   sha256Hex: string | null,
 *   name: string | null,
 *   version: string
 * }}
 */
export function decodeAccessKey(rawKey) {
  if (!rawKey || typeof rawKey !== "string") {
    throw new Error("Please provide a valid access key string.");
  }

  let cleaned = rawKey.trim();

  // Strip prefix if present
  if (cleaned.startsWith(KEY_PREFIX)) {
    cleaned = cleaned.slice(KEY_PREFIX.length);
  }

  try {
    const jsonStr = decodeURIComponent(escape(atob(cleaned)));
    const parsed = JSON.parse(jsonStr);

    if (parsed.t === undefined) {
      throw new Error("Invalid key payload: missing token ID");
    }

    const isEncrypted = Boolean(parsed.k && parsed.i);

    return {
      tokenId: Number(parsed.t),
      isEncrypted,
      keyBase64: parsed.k || null,
      ivBase64: parsed.i || null,
      sha256Hex: parsed.h || null,
      name: parsed.n || null,
      version: parsed.v || "2.0",
    };
  } catch (err) {
    // If it's a plain integer (e.g. user typed "1")
    if (/^\d+$/.test(cleaned)) {
      return {
        tokenId: Number(cleaned),
        isEncrypted: false,
        keyBase64: null,
        ivBase64: null,
        sha256Hex: null,
        name: null,
        version: "1.0",
      };
    }
    throw new Error("Invalid access key format. Please check the key and try again.");
  }
}

/**
 * Persists an asset's cryptographic keys in creator's browser storage
 */
export function saveLocalAssetKey(tokenId, { keyBase64, ivBase64, sha256Hex, name }) {
  if (!tokenId) return;
  try {
    const storageKey = `${STORAGE_PREFIX}${tokenId}`;
    const data = {
      tokenId: Number(tokenId),
      keyBase64,
      ivBase64,
      sha256Hex,
      name,
      savedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not save asset key to local storage", e);
  }
}

/**
 * Retrieves an asset's cryptographic keys from creator's browser storage
 */
export function getLocalAssetKey(tokenId) {
  if (!tokenId) return null;
  try {
    const storageKey = `${STORAGE_PREFIX}${tokenId}`;
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
