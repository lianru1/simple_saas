import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/** Max file size: 4 MB (Vercel serverless body limit safety margin) */
const MAX_FILE_SIZE = 4 * 1024 * 1024;

/** Allowed MIME types */
const ALLOWED_TYPES: Record<string, string> = {
  "text/plain": "txt",
  "text/markdown": "md",
  "text/x-markdown": "md",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/**
 * POST /api/upload/extract
 *
 * Accepts multipart/form-data with one or more files.
 * Extracts text from .txt, .md, .pdf, .docx files.
 *
 * Returns: { texts: string[], combinedText: string, totalLength: number }
 */
export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to upload files." },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided." },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 files per upload." },
        { status: 400 }
      );
    }

    const texts: string[] = [];

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 4 MB limit.` },
          { status: 413 }
        );
      }

      // Validate file type
      const mimeType = file.type || "";
      const extension = ALLOWED_TYPES[mimeType];

      if (!extension) {
        // Also check by file extension for cases where MIME isn't detected
        const nameExt = file.name.split(".").pop()?.toLowerCase();
        if (!nameExt || !["txt", "md", "pdf", "docx"].includes(nameExt)) {
          return NextResponse.json(
            {
              error: `Unsupported file type: "${file.name}". Supported: .txt, .md, .pdf, .docx`,
            },
            { status: 400 }
          );
        }
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const extracted = await extractText(buffer, file.name);
        if (extracted.trim()) {
          texts.push(`--- ${file.name} ---\n${extracted}`);
        }
      } catch (err) {
        console.error(`Failed to extract text from ${file.name}:`, err);
        return NextResponse.json(
          { error: `Failed to read "${file.name}". The file may be corrupted or in an unsupported format.` },
          { status: 422 }
        );
      }
    }

    if (texts.length === 0) {
      return NextResponse.json(
        { error: "No text could be extracted from the uploaded files." },
        { status: 422 }
      );
    }

    const combinedText = texts.join("\n\n");
    const totalLength = combinedText.length;

    return NextResponse.json({ texts, combinedText, totalLength });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to process uploaded files. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Extract text from a file buffer based on its extension.
 */
async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "txt":
    case "md":
      return buffer.toString("utf-8");

    case "pdf": {
      // pdf-parse v2 uses class-based API
      const { PDFParse } = await import("pdf-parse");
      const pdf = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await pdf.getText();
      await pdf.destroy();
      return result.text;
    }

    case "docx": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    default:
      throw new Error(`Unsupported file extension: .${ext}`);
  }
}
