
import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  convertInchesToTwip,
} from "docx";

// Ensure Node runtime (docx uses Buffer)
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { title, text, lines, segments } = body ?? {};

    // Accept any payload shape from the UI
    let content = "";
    if (typeof text === "string" && text.trim()) {
      content = text;
    } else if (Array.isArray(lines) && lines.length) {
      content = lines
        .map((l: any) => (typeof l === "string" ? l : l?.text ?? ""))
        .join("\n");
    } else if (Array.isArray(segments) && segments.length) {
      content = segments.map((s: any) => s?.text ?? "").join("\n");
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: "No transcript text provided" },
        { status: 400 }
      );
    }

    // Build heading text like: "Transcription – DD/MM/YYYY"
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB"); // DD/MM/YYYY
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const headingText = `Transcription – ${dateStr}`;
    const subheadingText = `${dateStr}, ${timeStr}`;

    // Split content into paragraphs: treat blank lines as paragraph breaks
    const blocks = content
      .split(/\n{2,}/g) // two+ newlines = new paragraph
      .map((b) => b.replace(/\n/g, " ").trim()) // single newlines collapse to spaces
      .filter(Boolean);

    // Styles
    const TITLE_COLOR = "2563EB";  // Tailwind 'blue-600'
    const SUBTLE_GRAY = "6B7280";  // Tailwind 'slate-500'
    const BODY_COLOR  = "111111";  // near-black
    const BASE_SIZE   = 24;        // 12pt (docx uses half-points)

    const titlePara = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: headingText,
          color: TITLE_COLOR,
          size: 56, // ~28pt
        }),
      ],
    });

    const subTitlePara = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: subheadingText,
          italics: true,
          color: SUBTLE_GRAY,
          size: 20, // ~10pt
        }),
      ],
    });

    // Build clean paragraphs (no first-line indent, justified)
    const bodyParas = blocks.map(
      (block) =>
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276, after: 120 }, // ~1.15 line height, 6pt after
          // indent: { firstLine: 720 },      // ← REMOVED: no first-line indent
          children: [
            new TextRun({
              text: block,
              color: BODY_COLOR,
              size: BASE_SIZE,                // 12pt body
              // font intentionally set via default style below
            }),
          ],
        })
    );

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Times New Roman",
              size: BASE_SIZE,
              color: BODY_COLOR,
            },
            paragraph: {
              spacing: { line: 276, after: 120 },
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              // Set margins to 0.75" (narrow). For Word's "Narrow" margins, use 0.5" instead.
              margin: {
                top: convertInchesToTwip(0.75),
                right: convertInchesToTwip(0.75),
                bottom: convertInchesToTwip(0.75),
                left: convertInchesToTwip(0.75),
              },
            },
          },
          children: [titlePara, subTitlePara, ...bodyParas],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const safeName = `Transcription_${now
      .toISOString()
      .replace(/[:.]/g, "-")}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=${safeName}`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: "Server failed to export docx" },
      { status: 500 }
    );
  }
}
