const FREE_SECTOR = 0xffffffff;
const END_OF_CHAIN = 0xfffffffe;

function readUint16(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 2 > bytes.length) return null;
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(0, true);
}

function readUint32(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 4 > bytes.length) return null;
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
}

function sectorOffset(sectorId: number, sectorSize: number): number {
  return (sectorId + 1) * sectorSize;
}

function readSector(bytes: Uint8Array, sectorId: number, sectorSize: number): Uint8Array | null {
  const offset = sectorOffset(sectorId, sectorSize);
  if (sectorId >= END_OF_CHAIN || offset < 0 || offset + sectorSize > bytes.length) return null;
  return bytes.subarray(offset, offset + sectorSize);
}

function collectDirectorySectors(bytes: Uint8Array): Uint8Array[] {
  const sectorShift = readUint16(bytes, 30);
  const firstDirectorySector = readUint32(bytes, 48);
  if (sectorShift === null || firstDirectorySector === null || sectorShift < 9 || sectorShift > 12) {
    return [];
  }

  const sectorSize = 2 ** sectorShift;
  const fatSectorIds: number[] = [];
  for (let index = 0; index < 109; index += 1) {
    const sectorId = readUint32(bytes, 76 + index * 4);
    if (sectorId === null) break;
    if (sectorId !== FREE_SECTOR && sectorId !== END_OF_CHAIN) fatSectorIds.push(sectorId);
  }

  const fat: number[] = [];
  for (const fatSectorId of fatSectorIds) {
    const sector = readSector(bytes, fatSectorId, sectorSize);
    if (!sector) continue;
    for (let offset = 0; offset + 4 <= sector.length; offset += 4) {
      fat.push(new DataView(sector.buffer, sector.byteOffset + offset, 4).getUint32(0, true));
    }
  }

  const sectors: Uint8Array[] = [];
  const visited = new Set<number>();
  let sectorId = firstDirectorySector;
  for (let count = 0; count < 256; count += 1) {
    if (sectorId === END_OF_CHAIN || sectorId === FREE_SECTOR || visited.has(sectorId)) break;
    visited.add(sectorId);
    const sector = readSector(bytes, sectorId, sectorSize);
    if (!sector) break;
    sectors.push(sector);
    if (fat.length === 0) break;
    const nextSector = fat[sectorId];
    if (nextSector === undefined) break;
    sectorId = nextSector;
  }
  return sectors;
}

export function readCompoundDocumentStreamNames(bytes: Uint8Array): ReadonlySet<string> {
  const sectors = collectDirectorySectors(bytes);
  const names = new Set<string>();
  for (const sector of sectors) {
    for (let offset = 0; offset + 128 <= sector.length; offset += 128) {
      const nameLength = readUint16(sector, offset + 64);
      const objectType = sector[offset + 66];
      if (!nameLength || nameLength < 2 || nameLength > 64 || (objectType !== 1 && objectType !== 2 && objectType !== 5)) {
        continue;
      }
      const nameBytes = sector.subarray(offset, offset + nameLength - 2);
      const name = Buffer.from(nameBytes).toString("utf16le").replace(/\u0000+$/g, "");
      if (name) names.add(name);
    }
  }
  return names;
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const minimum = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x05 &&
      bytes[offset + 3] === 0x06
    ) {
      return offset;
    }
  }
  return -1;
}

export function readZipCentralDirectoryNames(bytes: Uint8Array): ReadonlySet<string> {
  const names = new Set<string>();
  const eocdOffset = findEndOfCentralDirectory(bytes);
  if (eocdOffset < 0) return names;

  const entryCount = readUint16(bytes, eocdOffset + 10);
  const centralDirectoryOffset = readUint32(bytes, eocdOffset + 16);
  if (entryCount === null || centralDirectoryOffset === null) return names;

  let offset = centralDirectoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (
      offset + 46 > bytes.length ||
      bytes[offset] !== 0x50 ||
      bytes[offset + 1] !== 0x4b ||
      bytes[offset + 2] !== 0x01 ||
      bytes[offset + 3] !== 0x02
    ) {
      break;
    }
    const fileNameLength = readUint16(bytes, offset + 28) ?? 0;
    const extraLength = readUint16(bytes, offset + 30) ?? 0;
    const commentLength = readUint16(bytes, offset + 32) ?? 0;
    const nameStart = offset + 46;
    const nameEnd = nameStart + fileNameLength;
    if (nameEnd > bytes.length) break;
    names.add(Buffer.from(bytes.subarray(nameStart, nameEnd)).toString("utf8"));
    offset = nameEnd + extraLength + commentLength;
  }
  return names;
}
