"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "../../lib/supabase";

type ExtractedInfo = {
  title: string;
  category: string;
  deadline: string | null;
  summary: string;
  keywords: string[];
};

function detectCategory(text: string) {
  const value = text.toLowerCase();

  if (/scholarship|stipend|financial aid|grant|fellowship/.test(value))
    return "Scholarships";

  if (/job|hiring|vacancy|recruitment|career|employment|internship/.test(value))
    return "Jobs";

  if (/hackathon|coding challenge|coding competition|programming contest/.test(value))
    return "Hackathons";

  if (/course|certification|training|workshop|learning program/.test(value))
    return "Courses";

  if (/conference|webinar|meetup|event|summit/.test(value))
    return "Events";

  if (/article|blog|publication|research paper/.test(value))
    return "Articles";

  if (/whatsapp|telegram|message|chat/.test(value))
    return "Messages";

  if (/notice|document|application form|pdf/.test(value))
    return "Documents";

  return "Other";
}

function extractKeywords(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 5);

  const stopWords = new Set([
    "about",
    "which",
    "there",
    "their",
    "these",
    "those",
    "would",
    "could",
    "should",
    "where",
    "while",
    "please",
    "application",
    "information",
    "available",
  ]);

  return [...new Set(words.filter((word) => !stopWords.has(word)))].slice(
    0,
    10
  );
}

function extractDeadline(text: string) {
  const patterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/i,
    /\b(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/i,
    /\b((January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      const date = new Date(match[1]);

      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }

  return null;
}

function createSummary(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return "No readable text was detected.";
  }

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.length > 20)
    .slice(0, 2);

  if (sentences.length > 0) {
    return sentences.join(" ");
  }

  return cleaned.slice(0, 300);
}

function extractInformation(text: string, fileName: string): ExtractedInfo {
  const cleaned = text.trim();

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 3);

  const title =
    lines.find(
      (line) =>
        line.length >= 5 &&
        line.length <= 120 &&
        !/^(page|www\.|http|email|phone|date|time)/i.test(line)
    ) || fileName.replace(/\.[^/.]+$/, "");

  return {
    title,
    category: detectCategory(cleaned),
    deadline: extractDeadline(cleaned),
    summary: createSummary(cleaned),
    keywords: extractKeywords(cleaned),
  };
}

export default function CapturePage() {
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [info, setInfo] = useState<ExtractedInfo | null>(null);

  const processImage = async (selectedFile: File) => {
    const Tesseract = await import("tesseract.js");

    const result = await Tesseract.recognize(selectedFile, "eng", {
      logger: (data) => {
        if (data.status === "recognizing text") {
          setMessage(
            `Reading screenshot... ${Math.round((data.progress || 0) * 100)}%`
          );
        }
      },
    });

    return result.data.text;
  };

  const processPdf = async (selectedFile: File) => {
    const buffer = await selectedFile.arrayBuffer();

    const pdfjsLib = await import("pdfjs-dist");

    const pdf = await pdfjsLib.getDocument({
      data: buffer,
    }).promise;

    let fullText = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      setMessage(`Reading PDF page ${pageNumber} of ${pdf.numPages}...`);

      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      const pageText = content.items
        .map((item: any) => item.str || "")
        .join(" ");

      fullText += pageText + "\n";
    }

    return fullText;
  };

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setMessage("");
    setExtractedText("");
    setInfo(null);

    try {
      setProcessing(true);

      let text = "";

      if (selectedFile.type.startsWith("image/")) {
        text = await processImage(selectedFile);
      } else if (selectedFile.type === "application/pdf") {
        text = await processPdf(selectedFile);
      } else {
        setMessage("Please upload an image or PDF.");
        setProcessing(false);
        return;
      }

      setExtractedText(text);

      const extracted = extractInformation(text, selectedFile.name);

      setInfo(extracted);

      if (!title) {
        setTitle(extracted.title);
      }

      setMessage("Information extracted successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        "The file was uploaded, but automatic text extraction failed."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    try {
      setProcessing(true);
      setMessage("Saving your memory...");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please log in first.");
        setProcessing(false);
        return;
      }

      const storagePath = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("memory-assets")
        .upload(storagePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const finalInfo =
        info ||
        extractInformation(extractedText, file.name);

      const { data: memory, error: memoryError } = await supabase
        .from("memories")
        .insert({
          user_id: user.id,
          title: title.trim() || finalInfo.title,
          summary: finalInfo.summary,
          content: extractedText,
          category: finalInfo.category,
          source_type: file.type === "application/pdf" ? "PDF" : "Screenshot",
          deadline: finalInfo.deadline,
          metadata: {
            keywords: finalInfo.keywords,
            processing: "local",
            text_extracted: Boolean(extractedText.trim()),
          },
        })
        .select()
        .single();

      if (memoryError) {
        throw memoryError;
      }

      const { error: assetError } = await supabase
        .from("memory_assets")
        .insert({
          memory_id: memory.id,
          user_id: user.id,
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
        });

      if (assetError) {
        throw assetError;
      }

      setMessage("Memory saved successfully.");

      setFile(null);
      setTitle("");
      setExtractedText("");
      setInfo(null);
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "Something went wrong.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="page">
      <aside className="sidebar">
        <div className="logo">T</div>

        <nav>
          <Link href="/dashboard">⌂</Link>
          <Link className="active" href="/capture">＋</Link>
          <Link href="/memories">▣</Link>
          <Link href="/timeline">◷</Link>
          <Link href="/reminders">◌</Link>
        </nav>
      </aside>

      <section className="content">
        <div className="header">
          <div>
            <p className="eyebrow">TRACE YOUR INFORMATION</p>
            <h1>Capture a memory</h1>
            <p className="subtitle">
              Upload something you found and TraceMind will extract useful
              information from it.
            </p>
          </div>
        </div>

        <div className="capture-grid">
          <div className="upload-card">
            <div
              className="drop-zone"
              onClick={() =>
                document.getElementById("fileInput")?.click()
              }
            >
              <div className="upload-icon">↑</div>

              <h2>
                {file ? file.name : "Drop a screenshot or PDF here"}
              </h2>

              <p>
                TraceMind can read text from images and PDFs locally.
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("fileInput")?.click();
                }}
              >
                Choose file
              </button>

              <input
                id="fileInput"
                type="file"
                accept="image/*,.pdf"
                hidden
                onChange={(e) => {
                  const selected = e.target.files?.[0];

                  if (selected) {
                    handleFile(selected);
                  }
                }}
              />
            </div>

            {file && (
              <div className="file-row">
                <div>
                  <strong>{file.name}</strong>
                  <span>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setInfo(null);
                    setExtractedText("");
                    setMessage("");
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="details-card">
            <p className="eyebrow">MEMORY DETAILS</p>

            <label>Title</label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this memory a name"
            />

            {info && (
              <div className="analysis">
                <div>
                  <span>Category</span>
                  <strong>{info.category}</strong>
                </div>

                <div>
                  <span>Deadline</span>
                  <strong>
                    {info.deadline
                      ? new Date(info.deadline).toLocaleDateString()
                      : "Not detected"}
                  </strong>
                </div>

                <div>
                  <span>Keywords</span>
                  <strong>
                    {info.keywords.length
                      ? info.keywords.join(", ")
                      : "None detected"}
                  </strong>
                </div>
              </div>
            )}

            {info && (
              <div className="summary">
                <span>Automatic summary</span>
                <p>{info.summary}</p>
              </div>
            )}

            <button
              className="save"
              disabled={!file || processing}
              onClick={handleUpload}
            >
              {processing ? "Processing..." : "Save to TraceMind"}
            </button>

            {message && <p className="message">{message}</p>}
          </div>
        </div>

        {extractedText && (
          <section className="text-preview">
            <div>
              <p className="eyebrow">EXTRACTED INFORMATION</p>
              <h2>What TraceMind found</h2>
            </div>

            <div className="text-box">
              {extractedText}
            </div>
          </section>
        )}
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 80% 10%,
              rgba(99, 102, 241, 0.1),
              transparent 30%
            ),
            #f7f8fc;
          color: #171923;
        }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 82px;
          background: rgba(255, 255, 255, 0.92);
          border-right: 1px solid #e7e9f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 10;
          backdrop-filter: blur(16px);
        }

        .logo {
          width: 42px;
          height: 42px;
          margin-top: 24px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: #171923;
          color: white;
          font-weight: 800;
          font-size: 20px;
        }

        nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        nav a {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          text-decoration: none;
          color: #858b9b;
          font-size: 21px;
          transition: 0.2s;
        }

        nav a:hover,
        nav a.active {
          background: #eef0ff;
          color: #4f46e5;
        }

        .content {
          margin-left: 82px;
          padding: 55px 6%;
          max-width: 1500px;
        }

        .eyebrow {
          margin: 0 0 9px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #73798a;
        }

        h1 {
          margin: 0;
          font-size: clamp(32px, 4vw, 50px);
          letter-spacing: -0.04em;
        }

        .subtitle {
          margin-top: 12px;
          color: #73798a;
          max-width: 650px;
          line-height: 1.6;
        }

        .capture-grid {
          margin-top: 42px;
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 22px;
        }

        .upload-card,
        .details-card,
        .text-preview {
          background: white;
          border: 1px solid #e7e9f0;
          border-radius: 24px;
          padding: 25px;
          box-shadow: 0 15px 45px rgba(20, 25, 45, 0.05);
        }

        .drop-zone {
          min-height: 390px;
          border: 1.5px dashed #cfd3df;
          border-radius: 19px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
          cursor: pointer;
          transition: 0.2s;
        }

        .drop-zone:hover {
          border-color: #818cf8;
          background: #fafaff;
        }

        .upload-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: #f0f1ff;
          color: #4f46e5;
          font-size: 27px;
          margin-bottom: 20px;
        }

        .drop-zone h2 {
          margin: 0;
          font-size: 21px;
        }

        .drop-zone p {
          color: #858b9b;
          max-width: 380px;
          line-height: 1.5;
        }

        .drop-zone button,
        .file-row button {
          border: 0;
          border-radius: 11px;
          padding: 11px 17px;
          background: #171923;
          color: white;
          cursor: pointer;
        }

        .file-row {
          margin-top: 15px;
          padding: 14px;
          border-radius: 14px;
          background: #f7f8fc;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .file-row div {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .file-row strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-row span {
          color: #858b9b;
          font-size: 12px;
        }

        .file-row button {
          background: #eceef4;
          color: #303442;
        }

        .details-card {
          display: flex;
          flex-direction: column;
        }

        label {
          margin-top: 18px;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 700;
        }

        input {
          width: 100%;
          border: 1px solid #dfe2eb;
          border-radius: 12px;
          padding: 13px 14px;
          outline: none;
          font-size: 14px;
        }

        input:focus {
          border-color: #818cf8;
        }

        .analysis {
          margin-top: 20px;
          display: grid;
          gap: 10px;
        }

        .analysis div {
          padding: 12px;
          border-radius: 13px;
          background: #f7f8fc;
        }

        .analysis span,
        .summary span {
          display: block;
          color: #858b9b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 5px;
        }

        .analysis strong {
          font-size: 13px;
          line-height: 1.5;
          word-break: break-word;
        }

        .summary {
          margin-top: 18px;
          padding: 15px;
          background: #fafaff;
          border-radius: 14px;
        }

        .summary p {
          margin: 0;
          color: #626878;
          font-size: 13px;
          line-height: 1.55;
        }

        .save {
          margin-top: auto;
          padding: 14px;
          border: 0;
          border-radius: 13px;
          background: #171923;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .save:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .message {
          margin: 12px 0 0;
          font-size: 13px;
          color: #626878;
          text-align: center;
        }

        .text-preview {
          margin-top: 22px;
        }

        .text-preview h2 {
          margin: 0;
          font-size: 22px;
        }

        .text-box {
          margin-top: 18px;
          max-height: 300px;
          overflow: auto;
          white-space: pre-wrap;
          padding: 18px;
          background: #f7f8fc;
          border-radius: 15px;
          color: #555b6d;
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .capture-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .sidebar {
            width: 65px;
          }

          .content {
            margin-left: 65px;
            padding: 35px 18px;
          }

          .sidebar .logo {
            width: 36px;
            height: 36px;
          }

          nav a {
            width: 40px;
            height: 40px;
          }

          .drop-zone {
            min-height: 300px;
          }
        }
      `}</style>
    </main>
  );
}