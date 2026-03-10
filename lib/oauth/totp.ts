import { createHmac, randomBytes } from 'crypto';

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const ISSUER = 'SaaS Starter';

/**
 * Generate a random base32-encoded secret for TOTP
 */
export function generateSecret(): string {
  const buffer = randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generate an otpauth:// URI for QR code scanning
 */
export function generateOtpAuthUri(secret: string, userEmail: string): string {
  const encodedIssuer = encodeURIComponent(ISSUER);
  const encodedEmail = encodeURIComponent(userEmail);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Generate a data URL for a QR code containing the OTP auth URI.
 * Uses a simple SVG-based QR code approach.
 */
export function generateQRCodeDataUrl(otpauthUri: string): string {
  // Generate QR code matrix
  const modules = generateQRMatrix(otpauthUri);
  const size = modules.length;
  const scale = 8;
  const margin = 4;
  const totalSize = (size + margin * 2) * scale;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="white"/>`;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules[y][x]) {
        svg += `<rect x="${(x + margin) * scale}" y="${(y + margin) * scale}" width="${scale}" height="${scale}" fill="black"/>`;
      }
    }
  }
  svg += '</svg>';

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Verify a TOTP token against the secret
 * Allows a window of 1 period before and after for clock skew
 */
export function verifyToken(token: string, secret: string): boolean {
  const now = Math.floor(Date.now() / 1000);

  // Check current period and +/- 1 for clock skew
  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor((now + offset * TOTP_PERIOD) / TOTP_PERIOD);
    const expectedToken = generateTOTP(secret, counter);
    if (timingSafeEqual(token, expectedToken)) {
      return true;
    }
  }
  return false;
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// --- Internal helpers ---

function generateTOTP(secret: string, counter: number): string {
  const decodedSecret = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    buffer[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }

  const hmac = createHmac('sha1', decodedSecret);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const otp = code % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.replace(/=+$/, '').toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

// --- Minimal QR Code generation (version auto-detect, error correction L) ---

function generateQRMatrix(data: string): boolean[][] {
  // Encode data as byte-mode QR
  const dataBytes = Buffer.from(data, 'utf-8');
  const version = selectVersion(dataBytes.length);
  const size = version * 4 + 17;

  // Initialize the module grid
  const modules: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // Place finder patterns
  placeFinder(modules, reserved, 0, 0);
  placeFinder(modules, reserved, size - 7, 0);
  placeFinder(modules, reserved, 0, size - 7);

  // Place alignment patterns for versions >= 2
  if (version >= 2) {
    const positions = getAlignmentPositions(version);
    for (const row of positions) {
      for (const col of positions) {
        if (reserved[row]?.[col]) continue;
        placeAlignment(modules, reserved, row, col);
      }
    }
  }

  // Place timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) {
      modules[6][i] = i % 2 === 0;
      reserved[6][i] = true;
    }
    if (!reserved[i][6]) {
      modules[i][6] = i % 2 === 0;
      reserved[i][6] = true;
    }
  }

  // Dark module
  modules[size - 8][8] = true;
  reserved[size - 8][8] = true;

  // Reserve format info areas
  for (let i = 0; i < 8; i++) {
    if (!reserved[8][i]) { reserved[8][i] = true; modules[8][i] = false; }
    if (!reserved[i][8]) { reserved[i][8] = true; modules[i][8] = false; }
    if (!reserved[8][size - 1 - i]) { reserved[8][size - 1 - i] = true; modules[8][size - 1 - i] = false; }
    if (!reserved[size - 1 - i][8]) { reserved[size - 1 - i][8] = true; modules[size - 1 - i][8] = false; }
  }
  if (!reserved[8][8]) { reserved[8][8] = true; modules[8][8] = false; }

  // Reserve version info for version >= 7
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        reserved[i][size - 11 + j] = true;
        modules[i][size - 11 + j] = false;
        reserved[size - 11 + j][i] = true;
        modules[size - 11 + j][i] = false;
      }
    }
  }

  // Encode data
  const encoded = encodeData(dataBytes, version);

  // Place data bits
  placeData(modules, reserved, encoded, size);

  // Apply mask 0 (checkerboard)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        if ((r + c) % 2 === 0) {
          modules[r][c] = !modules[r][c];
        }
      }
    }
  }

  // Write format info (mask 0, EC level L = 01, mask pattern 000)
  writeFormatInfo(modules, size, 0, 1); // mask=0, ecLevel=1 (L)

  // Write version info for version >= 7
  if (version >= 7) {
    writeVersionInfo(modules, size, version);
  }

  return modules.map(row => row.map(cell => cell === true));
}

function selectVersion(dataLength: number): number {
  // Byte mode capacity for EC level L
  const capacities = [
    0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271,
    321, 367, 425, 458, 520, 586, 644, 718, 792, 858,
    929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732,
    1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953,
  ];
  for (let v = 1; v <= 40; v++) {
    if (capacities[v] >= dataLength) return v;
  }
  return 40;
}

function getAlignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const intervals = Math.floor(version / 7) + 1;
  const size = version * 4 + 17;
  const lastPos = size - 7;
  const firstPos = 6;
  if (intervals === 1) return [firstPos, lastPos];
  const step = Math.ceil((lastPos - firstPos) / intervals / 2) * 2;
  const positions = [firstPos];
  for (let pos = lastPos; pos > firstPos; pos -= step) {
    positions.splice(1, 0, pos);
  }
  return positions;
}

function placeFinder(modules: (boolean | null)[][], reserved: boolean[][], row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const mr = row + r;
      const mc = col + c;
      if (mr < 0 || mr >= modules.length || mc < 0 || mc >= modules.length) continue;
      let val = false;
      if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
        if (r === 0 || r === 6 || c === 0 || c === 6) val = true;
        else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) val = true;
      }
      modules[mr][mc] = val;
      reserved[mr][mc] = true;
    }
  }
}

function placeAlignment(modules: (boolean | null)[][], reserved: boolean[][], row: number, col: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const mr = row + r;
      const mc = col + c;
      if (mr < 0 || mr >= modules.length || mc < 0 || mc >= modules.length) continue;
      if (reserved[mr][mc]) continue;
      const val = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
      modules[mr][mc] = val;
      reserved[mr][mc] = true;
    }
  }
}

function encodeData(data: Buffer, version: number): boolean[] {
  const bits: boolean[] = [];

  // Mode indicator: byte mode = 0100
  pushBits(bits, 0b0100, 4);

  // Character count indicator
  const ccBits = version <= 9 ? 8 : 16;
  pushBits(bits, data.length, ccBits);

  // Data bytes
  for (let i = 0; i < data.length; i++) {
    pushBits(bits, data[i], 8);
  }

  // Terminator
  pushBits(bits, 0, Math.min(4, getTotalDataBits(version) - bits.length));

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(false);

  // Pad to capacity
  const totalBits = getTotalDataBits(version);
  let padByte = 0;
  while (bits.length < totalBits) {
    pushBits(bits, padByte === 0 ? 0xec : 0x11, 8);
    padByte ^= 1;
  }

  // Add EC codewords
  return addErrorCorrection(bits, version);
}

function getTotalDataBits(version: number): number {
  // Total data codewords for EC level L (bytes * 8)
  const dataCodewords = [
    0, 19, 34, 55, 80, 108, 136, 156, 194, 232, 274,
    324, 370, 428, 461, 523, 589, 647, 721, 795, 861,
    932, 1006, 1094, 1174, 1276, 1370, 1468, 1531, 1631, 1735,
    1843, 1955, 2071, 2191, 2306, 2434, 2566, 2702, 2812, 2956,
  ];
  return (dataCodewords[version] || 19) * 8;
}

function addErrorCorrection(dataBits: boolean[], version: number): boolean[] {
  const dataBytes: number[] = [];
  for (let i = 0; i < dataBits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < dataBits.length; j++) {
      byte = (byte << 1) | (dataBits[i + j] ? 1 : 0);
    }
    dataBytes.push(byte);
  }

  // For simplicity with EC level L, compute RS error correction
  const ecInfo = getECInfo(version);
  const allBlocks: { data: number[]; ec: number[] }[] = [];
  let offset = 0;

  for (const group of ecInfo.groups) {
    for (let i = 0; i < group.count; i++) {
      const blockData = dataBytes.slice(offset, offset + group.dataCodewords);
      offset += group.dataCodewords;
      const ec = computeReedSolomon(blockData, ecInfo.ecPerBlock);
      allBlocks.push({ data: blockData, ec });
    }
  }

  // Interleave data codewords
  const result: number[] = [];
  const maxDataLen = Math.max(...allBlocks.map(b => b.data.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of allBlocks) {
      if (i < block.data.length) result.push(block.data[i]);
    }
  }

  // Interleave EC codewords
  for (let i = 0; i < ecInfo.ecPerBlock; i++) {
    for (const block of allBlocks) {
      if (i < block.ec.length) result.push(block.ec[i]);
    }
  }

  const resultBits: boolean[] = [];
  for (const byte of result) {
    pushBits(resultBits, byte, 8);
  }
  return resultBits;
}

interface ECInfo {
  ecPerBlock: number;
  groups: { count: number; dataCodewords: number }[];
}

function getECInfo(version: number): ECInfo {
  // EC level L info for common versions
  const table: Record<number, ECInfo> = {
    1: { ecPerBlock: 7, groups: [{ count: 1, dataCodewords: 19 }] },
    2: { ecPerBlock: 10, groups: [{ count: 1, dataCodewords: 34 }] },
    3: { ecPerBlock: 15, groups: [{ count: 1, dataCodewords: 55 }] },
    4: { ecPerBlock: 20, groups: [{ count: 1, dataCodewords: 80 }] },
    5: { ecPerBlock: 26, groups: [{ count: 1, dataCodewords: 108 }] },
    6: { ecPerBlock: 18, groups: [{ count: 2, dataCodewords: 68 }] },
    7: { ecPerBlock: 20, groups: [{ count: 2, dataCodewords: 78 }] },
    8: { ecPerBlock: 24, groups: [{ count: 2, dataCodewords: 97 }] },
    9: { ecPerBlock: 30, groups: [{ count: 2, dataCodewords: 116 }] },
    10: { ecPerBlock: 18, groups: [{ count: 2, dataCodewords: 68 }, { count: 2, dataCodewords: 69 }] },
    11: { ecPerBlock: 20, groups: [{ count: 4, dataCodewords: 81 }] },
    12: { ecPerBlock: 24, groups: [{ count: 2, dataCodewords: 92 }, { count: 2, dataCodewords: 93 }] },
    13: { ecPerBlock: 26, groups: [{ count: 4, dataCodewords: 107 }] },
    14: { ecPerBlock: 30, groups: [{ count: 3, dataCodewords: 115 }, { count: 1, dataCodewords: 116 }] },
    15: { ecPerBlock: 22, groups: [{ count: 5, dataCodewords: 87 }, { count: 1, dataCodewords: 88 }] },
    16: { ecPerBlock: 24, groups: [{ count: 5, dataCodewords: 98 }, { count: 1, dataCodewords: 99 }] },
    17: { ecPerBlock: 28, groups: [{ count: 1, dataCodewords: 107 }, { count: 5, dataCodewords: 108 }] },
    18: { ecPerBlock: 30, groups: [{ count: 5, dataCodewords: 120 }, { count: 1, dataCodewords: 121 }] },
    19: { ecPerBlock: 28, groups: [{ count: 3, dataCodewords: 113 }, { count: 4, dataCodewords: 114 }] },
    20: { ecPerBlock: 28, groups: [{ count: 3, dataCodewords: 107 }, { count: 5, dataCodewords: 108 }] },
  };
  return table[version] || table[1];
}

function computeReedSolomon(data: number[], ecCount: number): number[] {
  const gen = getGeneratorPolynomial(ecCount);
  const result = new Uint8Array(data.length + ecCount);
  result.set(data);

  for (let i = 0; i < data.length; i++) {
    const coef = result[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        result[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }

  return Array.from(result.slice(data.length));
}

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x >= 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function getGeneratorPolynomial(degree: number): number[] {
  let gen = [1];
  for (let i = 0; i < degree; i++) {
    const newGen = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      newGen[j] ^= gen[j];
      newGen[j + 1] ^= gfMul(gen[j], GF_EXP[i]);
    }
    gen = newGen;
  }
  return gen;
}

function placeData(modules: (boolean | null)[][], reserved: boolean[][], bits: boolean[], size: number) {
  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // Skip timing column

    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (let c = 0; c < 2; c++) {
        const col = right - c;
        if (col < 0 || reserved[row][col]) continue;
        modules[row][col] = bitIndex < bits.length ? bits[bitIndex] : false;
        bitIndex++;
      }
    }
    upward = !upward;
  }
}

function writeFormatInfo(modules: (boolean | null)[][], size: number, mask: number, ecLevel: number) {
  const data = (ecLevel << 3) | mask;
  let bits = data;

  // Calculate BCH(15,5) error correction
  let rem = data << 10;
  for (let i = 4; i >= 0; i--) {
    if (rem & (1 << (i + 10))) {
      rem ^= 0x537 << i;
    }
  }
  bits = ((data << 10) | rem) ^ 0x5412;

  // Place format bits
  const formatBits: boolean[] = [];
  for (let i = 14; i >= 0; i--) {
    formatBits.push(Boolean((bits >> i) & 1));
  }

  // Around top-left finder
  const positions1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];

  // Around top-right and bottom-left finders
  const positions2 = [
    [8, size - 1], [8, size - 2], [8, size - 3], [8, size - 4],
    [8, size - 5], [8, size - 6], [8, size - 7], [8, size - 8],
    [size - 7, 8], [size - 6, 8], [size - 5, 8], [size - 4, 8],
    [size - 3, 8], [size - 2, 8], [size - 1, 8],
  ];

  for (let i = 0; i < 15; i++) {
    const [r1, c1] = positions1[i];
    modules[r1][c1] = formatBits[i];
    const [r2, c2] = positions2[i];
    modules[r2][c2] = formatBits[i];
  }
}

function writeVersionInfo(modules: (boolean | null)[][], size: number, version: number) {
  if (version < 7) return;

  let rem = version;
  for (let i = 0; i < 12; i++) {
    rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
  }
  const bits = (version << 12) | rem;

  for (let i = 0; i < 18; i++) {
    const bit = Boolean((bits >> i) & 1);
    const row = Math.floor(i / 3);
    const col = size - 11 + (i % 3);
    modules[row][col] = bit;
    modules[col][row] = bit;
  }
}

function pushBits(arr: boolean[], value: number, count: number) {
  for (let i = count - 1; i >= 0; i--) {
    arr.push(Boolean((value >> i) & 1));
  }
}
