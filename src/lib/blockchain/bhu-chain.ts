import crypto from "crypto";

export interface LandEventPayload {
  ulpin: string;
  eventType:
    | "PARCEL_REGISTRATION"
    | "SALE_DEED"
    | "INHERITANCE"
    | "GIFT_DEED"
    | "MORTGAGE"
    | "PLEDGE_RELEASE"
    | "COURT_LIEN"
    | "DISPUTE_FLAG"
    | "MUTATION_APPROVAL"
    | "RECORD_CORRECTION";
  previousOwnerHash: string;
  newOwnerHash: string;
  documentHash: string;
  documentTitle: string;
  registrationOfficeId: string;
  approverDigitalId: string;
  approvalTimestamp: Date;
  previousEventHash: string;
  metadata?: Record<string, any>;
}

export interface BlockStructure {
  eventId: string;
  blockNumber: number;
  ulpin: string;
  eventType: string;
  previousOwnerHash: string;
  newOwnerHash: string;
  documentHash: string;
  documentTitle: string;
  registrationOfficeId: string;
  approverDigitalId: string;
  approvalTimestamp: Date;
  previousEventHash: string;
  currentRecordHash: string;
  digitalSignature: string;
  metadataJson: string;
}

export const GENESIS_PREV_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Computes SHA-256 hash of any string or buffer
 */
export function sha256(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Computes identity hash for an owner (e.g. from Aadhaar/PAN + salt)
 * Ensures NO raw identity numbers are ever placed on-chain
 */
export function hashIdentity(identityNumber: string, salt: string = "BHU_CHAIN_SALT_2026"): string {
  return sha256(`${salt}:${identityNumber.trim().toUpperCase()}`);
}

/**
 * Computes the immutable cryptographic hash of a Land Event block
 */
export function calculateBlockHash(payload: {
  blockNumber: number;
  ulpin: string;
  eventType: string;
  previousOwnerHash: string;
  newOwnerHash: string;
  documentHash: string;
  registrationOfficeId: string;
  approverDigitalId: string;
  approvalTimestamp: string;
  previousEventHash: string;
  metadataJson: string;
}): string {
  const content = [
    payload.blockNumber,
    payload.ulpin,
    payload.eventType,
    payload.previousOwnerHash,
    payload.newOwnerHash,
    payload.documentHash,
    payload.registrationOfficeId,
    payload.approverDigitalId,
    payload.approvalTimestamp,
    payload.previousEventHash,
    payload.metadataJson,
  ].join("|");

  return sha256(content);
}

/**
 * Generates an authorized government officer digital signature placeholder
 * Designed to interface with PKI / e-Sign / DSC tokens in production
 */
export function generateDigitalSignature(
  recordHash: string,
  approverId: string,
  secretKey: string = "GOV_INDIA_LAND_AUTHORITY_ROOT_KEY"
): string {
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(`${approverId}:${recordHash}`);
  const signatureHex = hmac.digest("hex");
  return `SIG:ECDSA_SHA256:${approverId}:${signatureHex.slice(0, 32)}`;
}

/**
 * Creates a new block to be appended to the Bhu-Chain ledger
 */
export function createNewBlock(
  payload: LandEventPayload,
  currentBlockHeight: number
): BlockStructure {
  const blockNumber = currentBlockHeight + 1;
  const timestampStr = payload.approvalTimestamp.toISOString();
  const metadataJson = payload.metadata ? JSON.stringify(payload.metadata) : "{}";

  const currentRecordHash = calculateBlockHash({
    blockNumber,
    ulpin: payload.ulpin,
    eventType: payload.eventType,
    previousOwnerHash: payload.previousOwnerHash,
    newOwnerHash: payload.newOwnerHash,
    documentHash: payload.documentHash,
    registrationOfficeId: payload.registrationOfficeId,
    approverDigitalId: payload.approverDigitalId,
    approvalTimestamp: timestampStr,
    previousEventHash: payload.previousEventHash,
    metadataJson,
  });

  const eventId = `EVT-${payload.ulpin.slice(0, 6)}-${blockNumber}-${currentRecordHash.slice(0, 8).toUpperCase()}`;
  const digitalSignature = generateDigitalSignature(currentRecordHash, payload.approverDigitalId);

  return {
    eventId,
    blockNumber,
    ulpin: payload.ulpin,
    eventType: payload.eventType,
    previousOwnerHash: payload.previousOwnerHash,
    newOwnerHash: payload.newOwnerHash,
    documentHash: payload.documentHash,
    documentTitle: payload.documentTitle,
    registrationOfficeId: payload.registrationOfficeId,
    approverDigitalId: payload.approverDigitalId,
    approvalTimestamp: payload.approvalTimestamp,
    previousEventHash: payload.previousEventHash,
    currentRecordHash,
    digitalSignature,
    metadataJson,
  };
}

/**
 * Verifies the mathematical integrity and cryptographically linked chain of a parcel's events
 */
export function verifyChainIntegrity(events: BlockStructure[]): {
  isValid: boolean;
  totalBlocks: number;
  error?: string;
  invalidBlockIndex?: number;
} {
  if (events.length === 0) {
    return { isValid: true, totalBlocks: 0 };
  }

  // Sort by blockNumber ascending
  const sorted = [...events].sort((a, b) => a.blockNumber - b.blockNumber);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    // 1. Genesis block previous hash check
    if (i === 0) {
      if (current.previousEventHash !== GENESIS_PREV_HASH) {
        return {
          isValid: false,
          totalBlocks: sorted.length,
          invalidBlockIndex: i,
          error: `Genesis block (block 1) has invalid previous hash: expected ${GENESIS_PREV_HASH}, found ${current.previousEventHash}`,
        };
      }
    } else {
      // 2. Child block must reference exact hash of previous block
      const prev = sorted[i - 1];
      if (current.previousEventHash !== prev.currentRecordHash) {
        return {
          isValid: false,
          totalBlocks: sorted.length,
          invalidBlockIndex: i,
          error: `Chain broken at block ${current.blockNumber}: previousEventHash (${current.previousEventHash}) does not match Block ${prev.blockNumber} hash (${prev.currentRecordHash})`,
        };
      }
    }

    // 3. Recalculate block hash to detect tampering
    const timestampStr = new Date(current.approvalTimestamp).toISOString();
    const recalculatedHash = calculateBlockHash({
      blockNumber: current.blockNumber,
      ulpin: current.ulpin,
      eventType: current.eventType,
      previousOwnerHash: current.previousOwnerHash,
      newOwnerHash: current.newOwnerHash,
      documentHash: current.documentHash,
      registrationOfficeId: current.registrationOfficeId,
      approverDigitalId: current.approverDigitalId,
      approvalTimestamp: timestampStr,
      previousEventHash: current.previousEventHash,
      metadataJson: current.metadataJson || "{}",
    });

    if (recalculatedHash !== current.currentRecordHash) {
      return {
        isValid: false,
        totalBlocks: sorted.length,
        invalidBlockIndex: i,
        error: `Data tampering detected at block ${current.blockNumber}: stored hash ${current.currentRecordHash} does not match recalculated hash ${recalculatedHash}`,
      };
    }
  }

  return {
    isValid: true,
    totalBlocks: sorted.length,
  };
}

/**
 * Document Verification Engine: checks if an uploaded document hash matches an approved event
 */
export function verifyDocument(
  uploadedDocHash: string,
  events: BlockStructure[]
): {
  isAuthentic: boolean;
  matchedEvent?: BlockStructure;
  details: string;
} {
  const normalizedUploadedHash = uploadedDocHash.trim().toLowerCase();

  const match = events.find(
    (ev) => ev.documentHash.trim().toLowerCase() === normalizedUploadedHash
  );

  if (match) {
    return {
      isAuthentic: true,
      matchedEvent: match,
      details: `Authentic approved document. Verified against ${match.eventType} recorded on block #${match.blockNumber} by ${match.approverDigitalId}.`,
    };
  }

  return {
    isAuthentic: false,
    details:
      "FORGERY / UNAPPROVED DOCUMENT DETECTED: The cryptographic SHA-256 hash of this document does not match any approved event on the Bhu-Chain ledger for this parcel.",
  };
}
