/**
 * High-reliability IPFS fetcher with multiple fallback gateways
 */

const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
];

/**
 * Clean CID string (handles ipfs:// prefixes)
 */
export function normalizeCID(cidOrUri) {
  if (!cidOrUri) return "";
  return cidOrUri.replace(/^ipfs:\/\//, "").trim();
}

/**
 * Fetches JSON metadata from IPFS trying multiple gateways
 */
export async function fetchIPFSJSON(cid) {
  const cleanCID = normalizeCID(cid);
  let lastError = null;

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${cleanCID}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Failed to fetch IPFS metadata from all gateways for CID: ${cleanCID}. (${lastError?.message})`);
}

/**
 * Fetches raw Blob/ArrayBuffer from IPFS trying multiple gateways
 */
export async function fetchIPFSBlob(cid) {
  const cleanCID = normalizeCID(cid);
  let lastError = null;

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${cleanCID}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.blob();
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Failed to fetch file from IPFS gateways for CID: ${cleanCID}. (${lastError?.message})`);
}

