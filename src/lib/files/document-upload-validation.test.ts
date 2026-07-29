import { describe, expect, it } from "vitest";

import { validateDocumentUpload } from "./document-upload-validation";

function makeOleDocument(streamNames: string[]): Uint8Array {
  const sectorSize = 512;
  const bytes = new Uint8Array(sectorSize * 2);
  bytes.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], 0);
  const view = new DataView(bytes.buffer);
  view.setUint16(28, 0xfffe, true);
  view.setUint16(30, 9, true);
  view.setUint32(48, 0, true);
  for (let index = 0; index < 109; index += 1) view.setUint32(76 + index * 4, 0xffffffff, true);

  streamNames.slice(0, 4).forEach((name, index) => {
    const offset = sectorSize + index * 128;
    const encoded = Buffer.from(`${name}\u0000`, "utf16le");
    bytes.set(encoded.subarray(0, 64), offset);
    view.setUint16(offset + 64, Math.min(encoded.length, 64), true);
    bytes[offset + 66] = index === 0 ? 5 : 2;
  });
  return bytes;
}

function makeZipCentralDirectory(fileNames: string[]): Uint8Array {
  const encodedNames = fileNames.map((fileName) => Buffer.from(fileName, "utf8"));
  const centralDirectorySize = encodedNames.reduce(
    (total, fileName) => total + 46 + fileName.length,
    0,
  );
  const bytes = new Uint8Array(centralDirectorySize + 22);
  const view = new DataView(bytes.buffer);

  let offset = 0;
  for (const fileName of encodedNames) {
    view.setUint32(offset, 0x02014b50, true);
    view.setUint16(offset + 28, fileName.length, true);
    bytes.set(fileName, offset + 46);
    offset += 46 + fileName.length;
  }

  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 8, encodedNames.length, true);
  view.setUint16(offset + 10, encodedNames.length, true);
  view.setUint32(offset + 12, centralDirectorySize, true);
  view.setUint32(offset + 16, 0, true);
  return bytes;
}

describe("validateDocumentUpload", () => {
  it("requires an explicit matching MIME type", () => {
    const bytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    expect(validateDocumentUpload({ bytes, declaredMimeType: "", fileName: "rapor.pdf" })).toEqual({
      error: "Dosyanın MIME türü gönderilmelidir.",
      ok: false,
    });
  });

  it("rejects generic octet-stream declarations", () => {
    const bytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    expect(
      validateDocumentUpload({
        bytes,
        declaredMimeType: "application/octet-stream",
        fileName: "rapor.pdf",
      }).ok,
    ).toBe(false);
  });

  it("accepts a compound Word document with Word streams", () => {
    expect(
      validateDocumentUpload({
        bytes: makeOleDocument(["Root Entry", "WordDocument", "1Table"]),
        declaredMimeType: "application/msword",
        fileName: "rapor.doc",
      }),
    ).toEqual({ mimeType: "application/msword", ok: true });
  });

  it("rejects an Excel compound file renamed as doc", () => {
    const result = validateDocumentUpload({
      bytes: makeOleDocument(["Root Entry", "Workbook"]),
      declaredMimeType: "application/msword",
      fileName: "rapor.doc",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts DOCX only when required Word entries exist in the ZIP central directory", () => {
    const bytes = makeZipCentralDirectory([
      "[Content_Types].xml",
      "_rels/.rels",
      "word/document.xml",
    ]);
    expect(
      validateDocumentUpload({
        bytes,
        declaredMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileName: "rapor.docx",
      }),
    ).toEqual({
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ok: true,
    });
  });

  it("rejects a ZIP renamed as docx when the Word document entry is missing", () => {
    const result = validateDocumentUpload({
      bytes: makeZipCentralDirectory(["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml"]),
      declaredMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileName: "rapor.docx",
    });
    expect(result.ok).toBe(false);
  });
});
