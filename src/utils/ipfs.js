/**
 * High-reliability IPFS fetcher & Pinata uploader
 * Supports multiple fallback IPFS gateways, local dev proxy to eliminate extension/CORS blockers,
 * and dual Pinata authentication (JWT & API Keys)
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

/**
 * Safely extracts sanitized Pinata authentication options from environment.
 * Generates both Bearer JWT and API Key / Secret Key configurations for redundancy.
 */
function getPinataAuthOptions() {
  const jwt = (process.env.REACT_APP_PINATA_JWT || "").replace(/^["']|["']$/g, "").trim();
  const apiKey = (process.env.REACT_APP_PINATA_API_KEY || "").replace(/^["']|["']$/g, "").trim();
  const secretKey = (process.env.REACT_APP_PINATA_SECRET_KEY || "").replace(/^["']|["']$/g, "").trim();

  const authOptions = [];

  // Primary: Bearer JWT
  if (jwt && jwt.length > 20) {
    authOptions.push({
      type: "jwt",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
  }

  // Secondary: API Key + Secret Key
  if (apiKey && secretKey) {
    authOptions.push({
      type: "keys",
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: secretKey,
      },
    });
  }

  if (authOptions.length === 0) {
    throw new Error(
      "Missing Pinata credentials in .env. Please define REACT_APP_PINATA_JWT or REACT_APP_PINATA_API_KEY + REACT_APP_PINATA_SECRET_KEY."
    );
  }

  return authOptions;
}

/**
 * Get endpoint candidates (local proxy first to bypass ad-blockers, then direct Pinata API)
 */
function getEndpointCandidates(apiPath) {
  const isBrowser = typeof window !== "undefined";
  if (isBrowser) {
    return [
      `/pinning/${apiPath}`, // Local node proxy on localhost (immune to ad-blockers & CORS)
      `https://api.pinata.cloud/pinning/${apiPath}`, // Direct fallback
    ];
  }
  return [`https://api.pinata.cloud/pinning/${apiPath}`];
}

/**
 * Pins a File/Blob to IPFS using Pinata with automatic proxy & auth fallback
 *
 * @param {File | Blob} file
 * @param {string} [customFilename]
 * @returns {Promise<string>} The IPFS CID (IpfsHash)
 */
export async function pinFileToPinata(file, customFilename = null) {
  const authOptions = getPinataAuthOptions();
  const endpoints = getEndpointCandidates("pinFileToIPFS");
  let lastError = null;

  for (const endpoint of endpoints) {
    for (const option of authOptions) {
      try {
        const formData = new FormData();
        if (customFilename) {
          formData.append("file", file, customFilename);
        } else {
          formData.append("file", file);
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            ...option.headers,
          },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.IpfsHash) {
            return data.IpfsHash;
          }
        }

        const errText = await res.text();
        let parsedErr = errText;
        try {
          const json = JSON.parse(errText);
          parsedErr = json.error?.details || json.error?.reason || json.message || errText;
        } catch (e) {}

        lastError = new Error(`Pinata error (${res.status}): ${parsedErr}`);
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw (
    lastError ||
    new Error("Failed to pin file to IPFS via Pinata. Please verify Pinata credentials.")
  );
}

/**
 * Pins JSON metadata to IPFS using Pinata with automatic proxy & auth fallback
 *
 * @param {Object} metadata
 * @returns {Promise<string>} The IPFS CID (IpfsHash)
 */
export async function pinJSONToPinata(metadata) {
  const authOptions = getPinataAuthOptions();
  const endpoints = getEndpointCandidates("pinJSONToIPFS");
  let lastError = null;

  for (const endpoint of endpoints) {
    for (const option of authOptions) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...option.headers,
          },
          body: JSON.stringify(metadata),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.IpfsHash) {
            return data.IpfsHash;
          }
        }

        const errText = await res.text();
        let parsedErr = errText;
        try {
          const json = JSON.parse(errText);
          parsedErr = json.error?.details || json.error?.reason || json.message || errText;
        } catch (e) {}

        lastError = new Error(`Pinata error (${res.status}): ${parsedErr}`);
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw (
    lastError ||
    new Error("Failed to pin JSON metadata to IPFS via Pinata.")
  );
}
