import { z } from "zod";

const extractionResultSchema = z.object({
  pages: z.array(
    z.object({
      pageNumber: z.number().int().positive(),
      text: z.string(),
    }),
  ),
  totalPages: z.number().int().nonnegative(),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;

type TokenUsage = { inputTokens: number; outputTokens: number };
type ExtractionStepResult = {
  extraction: ExtractionResult;
  modelId: string | null;
  tokenUsage: TokenUsage | null;
};

async function loadDocumentAndWorkflowRun(documentId: string) {
  "use step";
  const { createConvexHttpClient, api } = await import("@/lib/convex/client");
  const convex = createConvexHttpClient();
  return await convex.query(api.documents.getExtractionContext, { documentId });
}

async function markWorkflowRunning(workflowRunId: string) {
  "use step";
  const { createConvexHttpClient, api } = await import("@/lib/convex/client");
  const convex = createConvexHttpClient();
  await convex.mutation(api.documents.markExtractionRunning, { workflowRunId });
}

async function extractTextFromDocument(storagePath: string, filetype: string | null): Promise<ExtractionStepResult> {
  "use step";
  const { get } = await import("@vercel/blob");

  const result = await get(storagePath, { access: "private" });
  if (!result || result.statusCode !== 200) {
    throw new Error(`Failed to fetch blob: ${result?.statusCode ?? "not found"}`);
  }
  const response = new Response(result.stream);
  const fileBuffer = Buffer.from(await response.arrayBuffer());

  if (filetype === "pdf") {
    return extractTextFromPdf(fileBuffer);
  }

  return extractTextWithModel(fileBuffer, filetype);
}

async function extractTextWithModel(fileBuffer: Buffer, filetype: string | null): Promise<ExtractionStepResult> {
  "use step";
  const { generateText, Output } = await import("ai");
  const { resolveWorkflowModel } = await import("@/lib/ai/model");

  const mediaType = getMediaType(filetype);
  const isImage = mediaType.startsWith("image/");
  const filePart = isImage
    ? { type: "image" as const, image: fileBuffer, mediaType }
    : { type: "file" as const, data: fileBuffer, mediaType };
  const modelId = "anthropic/claude-sonnet-4.6";

  const { output: object, usage } = await generateText({
    model: resolveWorkflowModel(modelId),
    output: Output.object({ schema: extractionResultSchema }),
    messages: [{
      role: "user",
      content: [
        filePart,
        {
          type: "text" as const,
          text: [
            "Extract ALL text from this document.",
            "For each page, return the page number and the complete text content.",
            "Preserve the original text as faithfully as possible (do not summarize or paraphrase).",
            "If this is a single-page image, use pageNumber 1.",
            "Return every page, even if a page has minimal content.",
          ].join(" "),
        },
      ],
    }],
  });

  if (!object) throw new Error("No structured output returned from extraction");
  return {
    extraction: object,
    modelId,
    tokenUsage: { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 },
  };
}

async function extractTextFromPdf(fileBuffer: Buffer): Promise<ExtractionStepResult> {
  "use step";
  const directText = await extractEmbeddedPdfText(fileBuffer);
  if (directText.totalPages > 0 && directText.pages.some((page) => page.text.trim())) {
    return { extraction: directText, modelId: null, tokenUsage: null };
  }

  if (process.env.AI_GATEWAY_API_KEY) {
    return extractTextWithModel(fileBuffer, "pdf");
  }

  return ocrPdfPagesWithClaudeCode(fileBuffer);
}

async function extractEmbeddedPdfText(fileBuffer: Buffer): Promise<ExtractionResult> {
  "use step";
  const { getDocumentProxy, extractText } = await import("unpdf");

  try {
    const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
    const { text, totalPages } = await extractText(pdf, { mergePages: false });
    return {
      pages: text.map((pageText, index) => ({
        pageNumber: index + 1,
        text: normalizeExtractedPdfText(pageText),
      })),
      totalPages,
    };
  } catch {
    return { pages: [], totalPages: 0 };
  }
}

async function ocrPdfPagesWithClaudeCode(fileBuffer: Buffer): Promise<ExtractionStepResult> {
  "use step";
  const { generateText, Output } = await import("ai");
  const { mkdtemp, rm, writeFile, readdir, readFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { promisify } = await import("node:util");
  const { execFile } = await import("node:child_process");
  const { resolveModel } = await import("@/lib/ai/model");

  const execFileAsync = promisify(execFile);
  const tempDir = await mkdtemp(join(tmpdir(), "empora-pdftoppm-"));
  const pdfPath = join(tempDir, "document.pdf");
  const outputPrefix = join(tempDir, "page");
  const modelId = "anthropic/claude-sonnet-4.6";

  try {
    await writeFile(pdfPath, fileBuffer);
    await execFileAsync("pdftoppm", ["-png", pdfPath, outputPrefix]);

    const imageFiles = (await readdir(tempDir))
      .filter((name) => /^page-\\d+\\.png$/.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (imageFiles.length === 0) {
      throw new Error("pdftoppm produced no page images");
    }

    const imageParts = await Promise.all(
      imageFiles.map(async (name) => ({
        type: "image" as const,
        image: (await readFile(join(tempDir, name))).toString("base64"),
        mimeType: "image/png",
      })),
    );

    const { output: object, usage } = await generateText({
      model: resolveModel(modelId),
      output: Output.object({ schema: extractionResultSchema }),
      messages: [{
        role: "user",
        content: [
          ...imageParts,
          {
            type: "text" as const,
            text: [
              "Extract ALL text from this PDF represented as page images.",
              "For each page image, return the matching page number and the complete text content.",
              "Preserve the original text as faithfully as possible (do not summarize or paraphrase).",
              "Return every page, even if a page has minimal content.",
            ].join(" "),
          },
        ],
      }],
    });

    if (!object) throw new Error("No structured output returned from PDF OCR");
    return {
      extraction: object,
      modelId,
      tokenUsage: { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 },
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function saveExtractionResults(documentId: string, extraction: ExtractionResult, workflowRunId: string) {
  "use step";
  const { createConvexHttpClient, api } = await import("@/lib/convex/client");
  const convex = createConvexHttpClient();
  await convex.mutation(api.documents.completeExtraction, { documentId, extraction, workflowRunId });
}

async function saveChatMessages(
  threadId: string,
  messages: Array<{
    role: string;
    content: string;
    model?: string | null;
    tokenUsage?: { inputTokens: number; outputTokens: number } | null;
  }>,
  startOrdinal: number,
) {
  "use step";
  const { createConvexHttpClient, api } = await import("@/lib/convex/client");
  const convex = createConvexHttpClient();
  return await convex.mutation(api.documents.appendThreadMessages, { threadId, messages, startOrdinal });
}

async function resolveFileId(documentId: string): Promise<string | null> {
  "use step";
  const { createConvexHttpClient, api } = await import("@/lib/convex/client");
  const convex = createConvexHttpClient();
  return await convex.query(api.documents.resolveAttachedFileId, { documentId });
}

async function analyzeExtractedFindings(documentId: string, fileId: string, extraction: ExtractionResult) {
  "use step";
  const fullText = extraction.pages
    .map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`)
    .join("\n\n");

  if (!fullText.trim()) {
    return { findingsCreated: 0, sourcesAdded: 0 };
  }

  const { generateText, stepCountIs } = await import("ai");
  const { resolveWorkflowModel } = await import("@/lib/ai/model");
  const { buildChatTools } = await import("@/lib/tools/registry");
  const { createConvexHttpClient } = await import("@/lib/convex/client");

  const result = await generateText({
    model: resolveWorkflowModel(),
    tools: buildChatTools(null, createConvexHttpClient()),
    stopWhen: stepCountIs(30),
    system: FINDING_ANALYSIS_SYSTEM_PROMPT,
    prompt: [
      "Analyze the following document for title-relevant findings.",
      "",
      `Document ID: ${documentId}`,
      `File ID: ${fileId}`,
      "",
      "Instructions:",
      `1. First call list_findings with fileId "${fileId}" to see existing findings.`,
      "2. Read through the document text below and identify all title-relevant findings.",
      "3. For each finding you identify:",
      "   - If an existing finding covers the same issue, call add_finding_source to link this document as additional evidence.",
      "   - If no existing finding matches, call create_finding with the appropriate type, a clear summary, and the source excerpt.",
      "4. Include the verbatim excerpt and page number for every source reference.",
      "",
      "Document text:",
      "",
      fullText,
    ].join("\n"),
  });

  const toolCalls = result.steps.flatMap((step) => step.toolCalls);
  const created = toolCalls.filter((call) => call.toolName === "create_finding").length;
  const added = toolCalls.filter((call) => call.toolName === "add_finding_source").length;
  const totalUsage = result.steps.reduce(
    (acc, step) => ({
      inputTokens: acc.inputTokens + (step.usage.inputTokens ?? 0),
      outputTokens: acc.outputTokens + (step.usage.outputTokens ?? 0),
    }),
    { inputTokens: 0, outputTokens: 0 },
  );

  return {
    findingsCreated: created,
    sourcesAdded: added,
    modelId: "anthropic/claude-sonnet-4.6",
    tokenUsage: totalUsage,
  };
}

async function markWorkflowFailed(workflowRunId: string, errorMessage: string) {
  "use step";
  const { createConvexHttpClient, api } = await import("@/lib/convex/client");
  const convex = createConvexHttpClient();
  await convex.mutation(api.documents.failExtraction, { workflowRunId, errorMessage });
}

export async function extractDocumentText(documentId: string) {
  "use workflow";

  const { workflowRunId, threadId, storagePath, filetype } = await loadDocumentAndWorkflowRun(documentId);
  await markWorkflowRunning(workflowRunId);

  try {
    const { extraction, modelId: extractionModel, tokenUsage: extractionUsage } =
      await extractTextFromDocument(storagePath, filetype);

    let nextOrdinal = 0;
    if (threadId) {
      nextOrdinal = await saveChatMessages(
        threadId,
        [
          { role: "user", content: `Extract all text from document ${documentId} (${filetype ?? "unknown"} format).` },
          {
            role: "assistant",
            content: `Extracted ${extraction.totalPages} page(s) with ${extraction.pages.reduce((n, p) => n + p.text.length, 0)} characters of text.`,
            model: extractionModel,
            tokenUsage: extractionUsage,
          },
        ],
        nextOrdinal,
      );
    }

    await saveExtractionResults(documentId, extraction, workflowRunId);

    const fileId = await resolveFileId(documentId);
    if (fileId && extraction.totalPages > 0) {
      try {
        const findingResult = await analyzeExtractedFindings(documentId, fileId, extraction);
        if (threadId) {
          await saveChatMessages(
            threadId,
            [
              { role: "user", content: `Analyze extracted text for title-relevant findings. Document: ${documentId}, File: ${fileId}.` },
              {
                role: "assistant",
                content: `Finding analysis complete: created ${findingResult.findingsCreated} finding(s), added ${findingResult.sourcesAdded} source(s).`,
                model: findingResult.modelId,
                tokenUsage: findingResult.tokenUsage,
              },
            ],
            nextOrdinal,
          );
        }
      } catch (findingError) {
        console.error("[extract-document-text] Finding analysis failed", findingError);
      }
    }

    return { documentId, extraction };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown extraction error";
    await markWorkflowFailed(workflowRunId, message);
    throw error;
  }
}

function getMediaType(filetype: string | null): string {
  switch (filetype) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
      return "image/jpeg";
    case "tiff":
      return "image/tiff";
    default:
      return "application/octet-stream";
  }
}

function normalizeExtractedPdfText(text: string) {
  return text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
}

const FINDING_ANALYSIS_SYSTEM_PROMPT = [
  "You are a title operations analyst reviewing extracted document text.",
  "Your job is to identify title-relevant findings and record them using tools.",
  "Avoid duplicates: first inspect existing findings, then either add a source or create a new finding.",
  "Use concise, specific summaries and include verbatim excerpts with page numbers.",
].join(" ");
