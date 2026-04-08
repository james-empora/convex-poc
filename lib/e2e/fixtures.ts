type ActionItem = {
  id: string;
  fileId: string;
  assignee: string;
  description: string;
  dueDate: string;
  status: string;
  category: string;
};
import type { AppUser } from "@/lib/auth/permissions";
import type { FileSummary, ListFilesInput, ListFilesResult } from "@/lib/files/list-files";
import type { FileDetail } from "@/lib/files/get-file";
import type { FileDocumentSummary } from "@/lib/documents/list-file-documents";
import type { DocumentDetail } from "@/lib/documents/get-document";

type UploadedDocument = DocumentDetail & {
  documentType: string;
  filetype: string | null;
  fileSizeBytes: number | null;
  fileId: string | null;
};

declare global {
  var __EMPORA_E2E_STORE__: {
    uploadedDocuments: Map<string, UploadedDocument[]>;
  } | undefined;
}

const FILE_IDS = {
  austin: "11111111-1111-4111-8111-111111111111",
  dallas: "22222222-2222-4222-8222-222222222222",
  houston: "33333333-3333-4333-8333-333333333333",
} as const;

const DOC_IDS = {
  purchaseContract: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  wireInstructions: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  titleCommitment: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
} as const;

const NOW = new Date("2026-03-31T12:00:00.000Z");

const E2E_USER: AppUser = {
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  auth0Sub: "auth0|e2e-user",
  email: "playwright@emporatitle.com",
  displayName: "Playwright User",
  userType: "internal",
  entityType: null,
  entityId: null,
  permissions: ["employee", "admin"],
  active: true,
  lastLoginAt: NOW,
  createdAt: NOW,
  updatedAt: NOW,
};

const FILE_DETAILS: FileDetail[] = [
  {
    id: FILE_IDS.austin,
    fileNumber: "EM-2026-0001",
    fileType: "purchase",
    status: "pending",
    propertyAddress: "123 Test St",
    city: "Austin",
    state: "TX",
    county: "Travis",
    parcelNumber: "TRAVIS-1001",
    closingDate: "2026-04-02",
    openedAt: "2026-03-20T09:00:00.000Z",
    financingType: "loan",
    salesPrice: 45000000,
    loanAmount: 36000000,
    titleSearchStatus: "ordered",
    fileSubType: null,
    disburseDate: "2026-04-03",
    flags: ["rush", "emd_received"],
    progressPercent: 65,
    team: [{ role: "escrow_officer", name: "David Landreman" }],
    parties: [
      {
        role: "seller",
        side: "seller_side",
        entities: [
          {
            entityType: "individual",
            entityId: "44444444-4444-4444-8444-444444444444",
            name: "Sam Seller",
            email: "sam.seller@example.com",
            phone: "555-0100",
          },
        ],
      },
      {
        role: "buyer",
        side: "buyer_side",
        entities: [
          {
            entityType: "individual",
            entityId: "55555555-5555-4555-8555-555555555555",
            name: "Alice Buyer",
            email: "alice.buyer@example.com",
            phone: "555-0101",
          },
        ],
      },
      {
        role: "escrow_officer",
        side: "internal",
        entities: [
          {
            entityType: "individual",
            entityId: "66666666-6666-4666-8666-666666666666",
            name: "David Landreman",
            email: "david@emporatitle.com",
            phone: null,
          },
        ],
      },
    ],
    buyerNames: ["Alice Buyer"],
    sellerNames: ["Sam Seller"],
    closerName: "David Landreman",
    closerInitials: "DL",
  },
  {
    id: FILE_IDS.dallas,
    fileNumber: "EM-2026-0002",
    fileType: "refinance",
    status: "closed",
    propertyAddress: "456 Market Ave",
    city: "Dallas",
    state: "TX",
    county: "Dallas",
    parcelNumber: "DALLAS-2002",
    closingDate: "2026-03-28",
    openedAt: "2026-03-10T10:15:00.000Z",
    financingType: "cash",
    salesPrice: 32000000,
    loanAmount: null,
    titleSearchStatus: "clear",
    fileSubType: null,
    disburseDate: "2026-03-29",
    flags: [],
    progressPercent: 100,
    team: [{ role: "escrow_officer", name: "Sarah Chen" }],
    parties: [
      {
        role: "borrower",
        side: "buyer_side",
        entities: [
          {
            entityType: "individual",
            entityId: "77777777-7777-4777-8777-777777777777",
            name: "Riley Refi",
            email: "riley.refi@example.com",
            phone: "555-0102",
          },
        ],
      },
      {
        role: "escrow_officer",
        side: "internal",
        entities: [
          {
            entityType: "individual",
            entityId: "88888888-8888-4888-8888-888888888888",
            name: "Sarah Chen",
            email: "sarah@emporatitle.com",
            phone: null,
          },
        ],
      },
    ],
    buyerNames: ["Riley Refi"],
    sellerNames: [],
    closerName: "Sarah Chen",
    closerInitials: "SC",
  },
  {
    id: FILE_IDS.houston,
    fileNumber: "EM-2026-0003",
    fileType: "cash",
    status: "on_hold",
    propertyAddress: "789 Pine Rd",
    city: "Houston",
    state: "TX",
    county: "Harris",
    parcelNumber: "HARRIS-3003",
    closingDate: "2026-04-10",
    openedAt: "2026-03-18T13:45:00.000Z",
    financingType: "cash",
    salesPrice: 28000000,
    loanAmount: null,
    titleSearchStatus: "received",
    fileSubType: null,
    disburseDate: null,
    flags: ["hoa"],
    progressPercent: 30,
    team: [{ role: "escrow_officer", name: "David Landreman" }],
    parties: [
      {
        role: "seller",
        side: "seller_side",
        entities: [
          {
            entityType: "organization",
            entityId: "99999999-9999-4999-8999-999999999999",
            name: "Pine Road Holdings LLC",
            email: null,
            phone: null,
          },
        ],
      },
      {
        role: "buyer",
        side: "buyer_side",
        entities: [
          {
            entityType: "individual",
            entityId: "10101010-1010-4010-8010-101010101010",
            name: "Casey Cash",
            email: "casey.cash@example.com",
            phone: "555-0103",
          },
        ],
      },
      {
        role: "escrow_officer",
        side: "internal",
        entities: [
          {
            entityType: "individual",
            entityId: "66666666-6666-4666-8666-666666666666",
            name: "David Landreman",
            email: "david@emporatitle.com",
            phone: null,
          },
        ],
      },
    ],
    buyerNames: ["Casey Cash"],
    sellerNames: ["Pine Road Holdings LLC"],
    closerName: "David Landreman",
    closerInitials: "DL",
  },
];

const BASE_DOCUMENTS: UploadedDocument[] = [
  {
    id: DOC_IDS.purchaseContract,
    name: "Purchase Contract.pdf",
    documentType: "purchase_contract",
    filetype: "pdf",
    storagePath: `e2e://document/${DOC_IDS.purchaseContract}`,
    fileSizeBytes: 148000,
    createdAt: "2026-03-29T10:00:00.000Z",
    fileId: FILE_IDS.austin,
  },
  {
    id: DOC_IDS.wireInstructions,
    name: "Wire Instructions.docx",
    documentType: "wire_instruction",
    filetype: "docx",
    storagePath: `e2e://document/${DOC_IDS.wireInstructions}`,
    fileSizeBytes: 42000,
    createdAt: "2026-03-28T14:30:00.000Z",
    fileId: FILE_IDS.austin,
  },
  {
    id: DOC_IDS.titleCommitment,
    name: "Title Commitment.pdf",
    documentType: "title_commitment",
    filetype: "pdf",
    storagePath: `e2e://document/${DOC_IDS.titleCommitment}`,
    fileSizeBytes: 96000,
    createdAt: "2026-03-25T09:15:00.000Z",
    fileId: FILE_IDS.dallas,
  },
];

const ACTION_ITEMS: ActionItem[] = [
  {
    id: "e2e-ai-1",
    fileId: FILE_IDS.austin,
    assignee: "David Landreman",
    description: "Review purchase contract exhibits",
    dueDate: "2026-04-01",
    status: "pending",
    category: "document",
  },
  {
    id: "e2e-ai-2",
    fileId: FILE_IDS.austin,
    assignee: "David Landreman",
    description: "Confirm buyer wire timing",
    dueDate: "2026-04-02",
    status: "pending",
    category: "finance",
  },
  {
    id: "e2e-ai-3",
    fileId: FILE_IDS.dallas,
    assignee: "David Landreman",
    description: "Archive refi file packet",
    dueDate: "2026-03-31",
    status: "completed",
    category: "closing",
  },
];

function getStore() {
  if (!globalThis.__EMPORA_E2E_STORE__) {
    globalThis.__EMPORA_E2E_STORE__ = {
      uploadedDocuments: new Map(),
    };
  }

  return globalThis.__EMPORA_E2E_STORE__;
}

function toFileSummary(file: FileDetail): FileSummary {
  return {
    id: file.id,
    fileNumber: file.fileNumber,
    fileType: file.fileType,
    status: file.status,
    propertyAddress: file.propertyAddress,
    city: file.city,
    state: file.state,
    county: file.county,
    closingDate: file.closingDate,
    openedAt: file.openedAt,
    buyerNames: file.buyerNames,
    sellerNames: file.sellerNames,
    closerName: file.closerName,
    closerInitials: file.closerInitials,
    progressPercent: file.progressPercent,
  };
}

function toDocumentSummary(doc: UploadedDocument): FileDocumentSummary {
  return {
    id: doc.id,
    name: doc.name,
    documentType: doc.documentType,
    filetype: doc.filetype,
    storagePath: doc.storagePath,
    fileSizeBytes: doc.fileSizeBytes,
    pageCount: doc.filetype === "pdf" ? 1 : null,
    origin: "upload",
    createdAt: doc.createdAt,
  };
}

export function getE2EUser(): AppUser {
  return E2E_USER;
}

export function listE2EFiles(input: Partial<ListFilesInput> = {}): ListFilesResult {
  const filtered = FILE_DETAILS.filter((file) => {
    if (input.status && file.status !== input.status) return false;
    if (input.fileType && file.fileType !== input.fileType) return false;
    return true;
  }).map(toFileSummary);

  return {
    items: filtered,
    nextCursor: null,
  };
}

export function getE2EFile(fileId: string) {
  return FILE_DETAILS.find((file) => file.id === fileId) ?? null;
}

export function listE2EDocuments(fileId: string) {
  const uploaded = getStore().uploadedDocuments.get(fileId) ?? [];

  return [...BASE_DOCUMENTS, ...uploaded]
    .filter((doc) => doc.fileId === fileId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(toDocumentSummary);
}

export function getE2EDocument(documentId: string) {
  const uploaded = Array.from(getStore().uploadedDocuments.values()).flat();
  return [...BASE_DOCUMENTS, ...uploaded].find((doc) => doc.id === documentId) ?? null;
}

export function registerE2EDocument(input: {
  name: string;
  documentType: string;
  filetype: string;
  storagePath: string;
  fileSizeBytes: number;
  resourceType?: string;
  resourceId?: string;
}) {
  const document: UploadedDocument = {
    id: crypto.randomUUID(),
    name: input.name,
    documentType: input.documentType,
    filetype: input.filetype,
    storagePath: input.storagePath,
    fileSizeBytes: input.fileSizeBytes,
    createdAt: new Date().toISOString(),
    fileId: input.resourceType === "file" ? input.resourceId ?? null : null,
  };

  if (document.fileId) {
    const uploaded = getStore().uploadedDocuments.get(document.fileId) ?? [];
    getStore().uploadedDocuments.set(document.fileId, [...uploaded, document]);
  }

  return document;
}

export function listE2EActionItems(fileId: string, assignee: string) {
  return ACTION_ITEMS.filter(
    (item) => item.fileId === fileId && item.assignee === assignee,
  );
}

export function resetE2EState() {
  getStore().uploadedDocuments.clear();
}

export function buildE2EChatText({
  fileId,
  uploadedFiles,
}: {
  fileId?: string | null;
  uploadedFiles?: Array<{ name: string }>;
}) {
  const file = fileId ? getE2EFile(fileId) : null;
  const uploadText =
    uploadedFiles && uploadedFiles.length > 0
      ? ` I also received ${uploadedFiles[0].name}.`
      : "";

  if (file) {
    return `Mock response for ${file.propertyAddress}.${uploadText}`;
  }

  return `Mock coordinator response with portfolio context.${uploadText}`;
}
