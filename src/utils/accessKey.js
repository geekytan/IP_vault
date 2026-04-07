/**
 * Generates a shareable access key from a token ID.
 * Much simpler than before — a single token ID is all that's needed
 * to look up the owner and metadata on-chain.
 *
 * @param {number} tokenId - The NFT token ID
 * @returns {string} Base64-encoded access key
 */
export function generateAccessKey(tokenId) {
  const payload = JSON.stringify({
    t: tokenId,
    v: 2, // version 2 = NFT-based
  });
  return btoa(payload);
}

/**
 * Decodes an access key back into a token ID.
 *
 * @param {string} key - Base64-encoded access key
 * @returns {{ tokenId: number }} Decoded payload
 * @throws {Error} If the key is invalid
 */
export function decodeAccessKey(key) {
  try {
    const cleaned = key.trim();
    const decoded = atob(cleaned);
    const parsed = JSON.parse(decoded);

    if (parsed.t === undefined) {
      throw new Error("Invalid key structure");
    }

    return {
      tokenId: Number(parsed.t),
    };
  } catch (err) {
    throw new Error(
      "Invalid access key. Please check the key and try again."
    );
  }
}
