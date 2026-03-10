/**
 * Pure JavaScript QR Code Generator
 *
 * Generates QR codes from text strings without external libraries.
 * Implements a simplified QR code encoding (Mode 4 byte encoding, ECC Level M).
 * Outputs a data URL suitable for <img> src attributes.
 */

// ---------------------------------------------------------------------------
// QR Code bit matrix generation
// ---------------------------------------------------------------------------

/** Error correction level M (15% recovery) lookup tables */
const EC_CODEWORDS_PER_BLOCK: Record<number, number> = {
  1: 10, 2: 16, 3: 26, 4: 18, 5: 24, 6: 16, 7: 18, 8: 22, 9: 22, 10: 26,
};

const NUM_DATA_CODEWORDS: Record<number, number> = {
  1: 16, 2: 28, 3: 44, 4: 64, 5: 86, 6: 108, 7: 124, 8: 154, 9: 182, 10: 216,
};

const ALIGNMENT_PATTERN_POSITIONS: Record<number, number[]> = {
  2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 52],
};

/**
 * Determine the minimum QR version for a given byte-mode payload length.
 */
function getMinVersion(dataLength: number): number {
  for (let v = 1; v <= 10; v++) {
    const capacity = NUM_DATA_CODEWORDS[v];
    // Byte mode: 4 bits mode indicator + char count bits + 8 bits per char
    const charCountBits = v <= 9 ? 8 : 16;
    const totalBits = 4 + charCountBits + dataLength * 8;
    if (Math.ceil(totalBits / 8) <= capacity) return v;
  }
  // Fall back to version 10 (max supported here)
  return 10;
}

function getModuleCount(version: number): number {
  return 17 + version * 4;
}

/**
 * Create a 2D boolean matrix (true = dark module).
 */
function createMatrix(size: number): boolean[][] {
  return Array.from({ length: size }, () => Array<boolean>(size).fill(false));
}

function createReserved(size: number): boolean[][] {
  return Array.from({ length: size }, () => Array<boolean>(size).fill(false));
}

/**
 * Place finder patterns at the three corners.
 */
function placeFinderPatterns(
  matrix: boolean[][],
  reserved: boolean[][],
  size: number
): void {
  const positions = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];

  for (const [row, col] of positions) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;

        const isOuter =
          r === -1 || r === 7 || c === -1 || c === 7;
        const isInner =
          r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const isBorder =
          r === 0 || r === 6 || c === 0 || c === 6;

        matrix[rr][cc] = !isOuter && (isBorder || isInner);
        reserved[rr][cc] = true;
      }
    }
  }
}

/**
 * Place alignment patterns.
 */
function placeAlignmentPatterns(
  matrix: boolean[][],
  reserved: boolean[][],
  version: number
): void {
  const positions = ALIGNMENT_PATTERN_POSITIONS[version];
  if (!positions) return;

  for (const row of positions) {
    for (const col of positions) {
      // Skip if overlapping finder patterns
      if (reserved[row]?.[col]) continue;

      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const rr = row + r;
          const cc = col + c;
          if (rr < 0 || rr >= matrix.length || cc < 0 || cc >= matrix.length)
            continue;
          const isBorder = r === -2 || r === 2 || c === -2 || c === 2;
          const isCenter = r === 0 && c === 0;
          matrix[rr][cc] = isBorder || isCenter;
          reserved[rr][cc] = true;
        }
      }
    }
  }
}

/**
 * Place timing patterns (row 6, col 6).
 */
function placeTimingPatterns(
  matrix: boolean[][],
  reserved: boolean[][],
  size: number
): void {
  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) {
      matrix[6][i] = i % 2 === 0;
      reserved[6][i] = true;
    }
    if (!reserved[i][6]) {
      matrix[i][6] = i % 2 === 0;
      reserved[i][6] = true;
    }
  }
}

/**
 * Reserve format and version info areas.
 */
function reserveFormatAreas(
  reserved: boolean[][],
  size: number
): void {
  // Format info around finder patterns
  for (let i = 0; i < 9; i++) {
    if (i < size) reserved[8][i] = true;
    if (i < size) reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
  // Dark module
  reserved[size - 8][8] = true;
}

// ---------------------------------------------------------------------------
// Data encoding (Byte mode)
// ---------------------------------------------------------------------------

function encodeData(data: string, version: number): number[] {
  const charCountBits = version <= 9 ? 8 : 16;
  const bytes = new TextEncoder().encode(data);
  const totalDataCodewords = NUM_DATA_CODEWORDS[version];

  // Build bit stream
  const bits: number[] = [];

  function pushBits(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      bits.push((value >> i) & 1);
    }
  }

  // Mode indicator: 0100 = byte mode
  pushBits(0b0100, 4);
  // Character count
  pushBits(bytes.length, charCountBits);
  // Data
  for (const b of bytes) {
    pushBits(b, 8);
  }
  // Terminator (up to 4 zeros)
  const maxBits = totalDataCodewords * 8;
  const terminatorLen = Math.min(4, maxBits - bits.length);
  pushBits(0, terminatorLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Convert to bytes
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] || 0);
    }
    codewords.push(byte);
  }

  // Pad codewords
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (codewords.length < totalDataCodewords) {
    codewords.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  return codewords;
}

// ---------------------------------------------------------------------------
// Reed-Solomon Error Correction (GF(256))
// ---------------------------------------------------------------------------

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

function initGaloisField(): void {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d; // primitive polynomial
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
}
initGaloisField();

function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

function generateECCodewords(
  data: number[],
  ecCount: number
): number[] {
  // Build generator polynomial
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const newGen = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      newGen[j] ^= gen[j];
      newGen[j + 1] ^= gfMultiply(gen[j], GF_EXP[i]);
    }
    gen = newGen;
  }

  // Polynomial division
  const result = new Array(ecCount).fill(0);
  const message = [...data, ...result];

  for (let i = 0; i < data.length; i++) {
    const coef = message[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        message[i + j] ^= gfMultiply(gen[j], coef);
      }
    }
  }

  return message.slice(data.length);
}

function buildFinalMessage(
  dataCodewords: number[],
  version: number
): number[] {
  const ecPerBlock = EC_CODEWORDS_PER_BLOCK[version];
  const totalDataCW = NUM_DATA_CODEWORDS[version];

  // For simplicity, use single block for small versions
  const data = dataCodewords.slice(0, totalDataCW);
  const ec = generateECCodewords(data, ecPerBlock);

  return [...data, ...ec];
}

// ---------------------------------------------------------------------------
// Data placement
// ---------------------------------------------------------------------------

function placeData(
  matrix: boolean[][],
  reserved: boolean[][],
  data: number[],
  size: number
): void {
  // Convert to bit stream
  const bits: number[] = [];
  for (const byte of data) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i) & 1);
    }
  }

  let bitIdx = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    // Skip timing pattern column
    if (right === 6) right = 5;

    const rowRange = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rowRange) {
      for (const col of [right, right - 1]) {
        if (col < 0 || col >= size) continue;
        if (reserved[row][col]) continue;
        if (bitIdx < bits.length) {
          matrix[row][col] = bits[bitIdx] === 1;
          bitIdx++;
        }
      }
    }

    upward = !upward;
  }
}

// ---------------------------------------------------------------------------
// Masking (pattern 0: (row + col) % 2 === 0)
// ---------------------------------------------------------------------------

function applyMask(
  matrix: boolean[][],
  reserved: boolean[][],
  size: number
): void {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!reserved[row][col] && (row + col) % 2 === 0) {
        matrix[row][col] = !matrix[row][col];
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Format information
// ---------------------------------------------------------------------------

const FORMAT_INFO_BITS: Record<number, number> = {
  0: 0x5412,
  1: 0x5125,
  2: 0x5e7c,
  3: 0x5b4b,
  4: 0x45f9,
  5: 0x40ce,
  6: 0x4f97,
  7: 0x4aa0,
};

function placeFormatInfo(
  matrix: boolean[][],
  size: number,
  maskPattern: number
): void {
  // ECC level M = 0, mask pattern
  const ecLevel = 0; // M
  const formatKey = ecLevel * 8 + maskPattern;
  const info = FORMAT_INFO_BITS[formatKey] ?? 0x5412;

  // Place around top-left finder
  const positions1 = [
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    [7, 8], [8, 8],
    [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  ];

  for (let i = 0; i < 15; i++) {
    const bit = ((info >> (14 - i)) & 1) === 1;
    if (positions1[i]) {
      matrix[positions1[i][0]][positions1[i][1]] = bit;
    }
  }

  // Place along right side of top-left and bottom of top-left
  const positions2: [number, number][] = [
    [8, size - 1], [8, size - 2], [8, size - 3], [8, size - 4],
    [8, size - 5], [8, size - 6], [8, size - 7],
    [size - 7, 8], [size - 6, 8], [size - 5, 8], [size - 4, 8],
    [size - 3, 8], [size - 2, 8], [size - 1, 8],
  ];

  for (let i = 0; i < 14; i++) {
    const bit = ((info >> i) & 1) === 1;
    if (positions2[i]) {
      matrix[positions2[i][0]][positions2[i][1]] = bit;
    }
  }

  // Dark module
  matrix[size - 8][8] = true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a QR code as a 2D boolean matrix.
 * true = dark module, false = light module.
 */
export function generateQRMatrix(text: string): boolean[][] {
  const version = getMinVersion(new TextEncoder().encode(text).length);
  const size = getModuleCount(version);

  const matrix = createMatrix(size);
  const reserved = createReserved(size);

  // Step 1: Place function patterns
  placeFinderPatterns(matrix, reserved, size);
  placeAlignmentPatterns(matrix, reserved, version);
  placeTimingPatterns(matrix, reserved, size);
  reserveFormatAreas(reserved, size);

  // Step 2: Encode data
  const dataCodewords = encodeData(text, version);
  const finalMessage = buildFinalMessage(dataCodewords, version);

  // Step 3: Place data
  placeData(matrix, reserved, finalMessage, size);

  // Step 4: Apply mask (pattern 0)
  applyMask(matrix, reserved, size);

  // Step 5: Place format info
  placeFormatInfo(matrix, size, 0);

  return matrix;
}

/**
 * Convert a QR matrix to an SVG string.
 */
export function qrMatrixToSvg(
  matrix: boolean[][],
  options: { moduleSize?: number; margin?: number; darkColor?: string; lightColor?: string } = {}
): string {
  const {
    moduleSize = 10,
    margin = 4,
    darkColor = '#000000',
    lightColor = '#ffffff',
  } = options;

  const size = matrix.length;
  const totalSize = (size + margin * 2) * moduleSize;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="${lightColor}"/>`;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (matrix[row][col]) {
        const x = (col + margin) * moduleSize;
        const y = (row + margin) * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}

/**
 * Convert a text string to a QR code data URL (SVG format).
 */
export function generateQRCodeDataURL(
  text: string,
  options: { moduleSize?: number; margin?: number } = {}
): string {
  const matrix = generateQRMatrix(text);
  const svg = qrMatrixToSvg(matrix, options);
  const encoded = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}
