import {
  readCompoundDocumentStreamNames,
  readZipCentralDirectoryNames,
} from "./document-signatures";

const DOCUMENT_MIME_TYPES = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
  png: "image/png",
  webp: "image/webp",
} as const;

type SupportedDocumentMime = (typeof DOCUMENT_MIME_TYPES)[keyof typeof DOCUMENT_MIME_TYPES];

type ValidationResult =
  | { mimeType: SupportedDocumentMime; ok: true }
  | { error: string; ok: false };

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function isLegacyWordDocument(bytes: Uint8Array): boolean {
  const names = readCompoundDocumentStreamNames(bytes);
  return names.has("WordDocument") && (names.has("0Table") || names.has("1Table"));
}

function isWordOpenXmlDocument(bytes: Uint8Array): boolean {
  const names = readZipCentralDirectoryNames(bytes);
  return (
    names.has("[Content_Types].xml") &&
    names.has("_rels/.rels") &&
    names.has("word/document.xml")
  );
}

function detectMimeType(bytes: Uint8Array): SupportedDocumentMime | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return DOCUMENT_MIME_TYPES.pdf;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return DOCUMENT_MIME_TYPES.jpeg;
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return DOCUMENT_MIME_TYPES.png;
  }
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return DOCUMENT_MIME_TYPES.webp;
  }
  if (
    startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) &&
    isLegacyWordDocument(bytes)
  ) {
    return DOCUMENT_MIME_TYPES.doc;
  }
  if (startsWith(bytes, [0x50, 0x4b]) && isWordOpenXmlDocument(bytes)) {
    return DOCUMENT_MIME_TYPES.docx;
  }
  return null;
}

const allowedExtensions: Record<SupportedDocumentMime, ReadonlySet<string>> = {
  [DOCUMENT_MIME_TYPES.doc]: new Set(["doc"]),
  [DOCUMENT_MIME_TYPES.docx]: new Set(["docx"]),
  [DOCUMENT_MIME_TYPES.jpeg]: new Set(["jpg", "jpeg"]),
  [DOCUMENT_MIME_TYPES.pdf]: new Set(["pdf"]),
  [DOCUMENT_MIME_TYPES.png]: new Set(["png"]),
  [DOCUMENT_MIME_TYPES.webp]: new Set(["webp"]),
};

export function validateDocumentUpload(input: {
  bytes: Uint8Array;
  declaredMimeType: string;
  fileName: string;
}): ValidationResult {
  const declaredMimeType = input.declaredMimeType.trim().toLowerCase();
  if (!declaredMimeType) {
    return { error: "Dosyanın MIME türü gönderilmelidir.", ok: false };
  }
  if (declaredMimeType === "application/octet-stream") {
    return { error: "Genel binary MIME türü kabul edilmiyor.", ok: false };
  }

  const detectedMimeType = detectMimeType(input.bytes);
  if (!detectedMimeType) {
    return { error: "Dosyanın gerçek içeriği desteklenen bir belge türü değil.", ok: false };
  }
  if (declaredMimeType !== detectedMimeType) {
    return { error: "Dosyanın bildirilen türü gerçek içeriğiyle eşleşmiyor.", ok: false };
  }

  const extension = input.fileName.toLowerCase().split(".").pop() ?? "";
  if (!allowedExtensions[detectedMimeType].has(extension)) {
    return { error: "Dosya uzantısı gerçek içeriğiyle eşleşmiyor.", ok: false };
  }

  return { mimeType: detectedMimeType, ok: true };
}
