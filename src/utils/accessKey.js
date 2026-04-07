/**
 * Generates a shareable access key from an owner address and record index.
 * The key is a Base64-encoded JSON string.
 *
 * @param {string} ownerAddress - The wallet address of the content owner
 * @param {number} recordIndex - The index of the record in the owner's records array
 * @returns {string} Base64-encoded access key
 */
export function generateAccessKey(ownerAddress, recordIndex) {
  const payload = JSON.stringify({
    o: ownerAddress,
    i: recordIndex,
    v: 1, // version for future compatibility
  });
  return btoa(payload);
}

/**
 * Decodes an access key back into owner address and record index.
 *
 * @param {string} key - Base64-encoded access key
 * @returns {{ owner: string, index: number }} Decoded payload
 * @throws {Error} If the key is invalid
 */
export function decodeAccessKey(key) {
  try {
    const cleaned = key.trim();
    const decoded = atob(cleaned);
    const parsed = JSON.parse(decoded);

    if (!parsed.o || parsed.i === undefined) {
      throw new Error("Invalid key structure");
    }

    return {
      owner: parsed.o,
      index: Number(parsed.i),
    };
  } catch (err) {
    throw new Error(
      "Invalid access key. Please check the key and try again."
    );
  }
}
