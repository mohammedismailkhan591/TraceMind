"use client";

import { useRef, useState } from "react";
import AppShell from "../../components/AppShell";
import { createClient } from "../../lib/supabase";

type Mode = "file" | "link" | "text";

function detectCategory(text: string) {
  const t = text.toLowerCase();

  if (/scholarship|fellowship|stipend/.test(t)) return "Scholarship";
  if (/internship|job|hiring|vacancy|career/.test(t)) return "Job";
  if (/hackathon|hackfest|competition/.test(t)) return "Hackathon";
  if (/course|bootcamp|workshop|class/.test(t)) return "Course";
  if (/event|conference|meetup|webinar/.test(t)) return "Event";
  if (/article|blog|research paper/.test(t)) return "Article";
  if (/whatsapp|message|chat/.test(t)) return "Message";

  return "Other";
}

export default function CapturePage() {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const chooseFile = (next?: File) => {
    if (!next) return;

    if (
      !next.type.startsWith("image/") &&
      next.type !== "application/pdf"
    ) {
      setMessage("Choose an image or PDF.");
      return;
    }

    if (next.size > 10 * 1024 * 1024) {
      setMessage("Files must be smaller than 10 MB.");
      return;
    }

    setFile(next);
    setMessage("");
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setLink("");
    setText("");
    setMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage("");

    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      if (!user) {
        throw new Error("Please log in again.");
      }

      /* ---------------- FILE ---------------- */

      if (mode === "file") {
        if (!file) {
          throw new Error("Choose a screenshot or PDF first.");
        }

        const safeName = file.name.replace(/[^\w.-]/g, "_");

        const path = `${user.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("memory-assets")
          .upload(path, file, {
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: memory, error: memoryError } = await supabase
          .from("memories")
          .insert({
            user_id: user.id,
            title: title.trim() || file.name,
            summary:
              "Saved file. Open the memory to view the original.",
            content: "",
            category:
              file.type === "application/pdf"
                ? "Document"
                : "Image",
            source_type:
              file.type === "application/pdf"
                ? "PDF"
                : "Screenshot",
            metadata: {
              processing: "local",
              file_name: file.name,
              mime_type: file.type,
              file_size: file.size,
            },
          })
          .select("id")
          .single();

        if (memoryError) {
          throw memoryError;
        }

        const { error: assetError } = await supabase
          .from("memory_assets")
          .insert({
            memory_id: memory.id,
            user_id: user.id,
            storage_path: path,
            file_name: file.name,
            mime_type: file.type,
            file_size: file.size,
          });

        if (assetError) {
          throw assetError;
        }

        setMessage("Memory saved successfully.");
        reset();
        return;
      }

      /* ---------------- LINK ---------------- */

      if (mode === "link") {
        const raw = link.trim();

        if (!raw) {
          throw new Error("Enter a website link.");
        }

        const url = new URL(
          /^https?:\/\//i.test(raw)
            ? raw
            : `https://${raw}`
        );

        const { error } = await supabase
          .from("memories")
          .insert({
            user_id: user.id,
            title: title.trim() || url.hostname,
            summary: `Saved website: ${url.hostname}`,
            content: url.toString(),
            category: "Website",
            source_type: "Link",
            source_url: url.toString(),
            metadata: {
              processing: "local",
            },
          });

        if (error) {
          throw error;
        }

        setMessage("Website saved successfully.");
        reset();
        return;
      }

      /* ---------------- TEXT ---------------- */

      const clean = text.trim();

      if (clean.length < 3) {
        throw new Error("Enter at least a few words.");
      }

      const summary = clean
        .replace(/\s+/g, " ")
        .slice(0, 220);

      const keywords = Array.from(
        new Set(
          clean
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, " ")
            .split(/\s+/)
            .filter((word) => word.length > 3)
        )
      ).slice(0, 15);

      const { error } = await supabase
        .from("memories")
        .insert({
          user_id: user.id,
          title: title.trim() || clean.slice(0, 70),
          summary:
            summary.length < clean.length
              ? `${summary}…`
              : summary,
          content: clean,
          category: detectCategory(clean),
          source_type: "Text",
          metadata: {
            processing: "local",
            keywords,
          },
        });

      if (error) {
        throw error;
      }

      setMessage("Text memory saved successfully.");
      reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <main className="capture-page">
        <header className="capture-header">
          <div>
            <span className="eyebrow">YOUR INFORMATION</span>
            <h1>Capture</h1>
            <p>
              Save something now and find it again whenever you need it.
            </p>
          </div>

          <div className="private-badge">
            <span className="private-dot" />
            Private workspace
          </div>
        </header>

        <section className="capture-container">
          {/* SOURCE SELECTOR */}

          <div className="source-selector">
            <button
              type="button"
              className={mode === "file" ? "source active" : "source"}
              onClick={() => {
                setMode("file");
                setMessage("");
              }}
            >
              <span className="source-icon">
                <UploadIcon />
              </span>

              <span>
                <strong>File</strong>
                <small>Screenshot or PDF</small>
              </span>
            </button>

            <button
              type="button"
              className={mode === "link" ? "source active" : "source"}
              onClick={() => {
                setMode("link");
                setMessage("");
              }}
            >
              <span className="source-icon">
                <LinkIcon />
              </span>

              <span>
                <strong>Website</strong>
                <small>Save a useful URL</small>
              </span>
            </button>

            <button
              type="button"
              className={mode === "text" ? "source active" : "source"}
              onClick={() => {
                setMode("text");
                setMessage("");
              }}
            >
              <span className="source-icon">
                <TextIcon />
              </span>

              <span>
                <strong>Text</strong>
                <small>Message or note</small>
              </span>
            </button>
          </div>

          {/* MAIN CARD */}

          <section className="capture-card">
            <div className="card-header">
              <div>
                <span className="eyebrow">NEW MEMORY</span>

                <h2>
                  {mode === "file"
                    ? "Upload a file"
                    : mode === "link"
                    ? "Save a website"
                    : "Save some text"}
                </h2>
              </div>

              <span className="step-label">01</span>
            </div>

            {/* TITLE */}

            <label className="field">
              <span>
                Title <em>Optional</em>
              </span>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this memory a useful name"
              />
            </label>

            {/* FILE */}

            {mode === "file" && (
              <div
                className={`dropzone ${
                  file ? "has-file" : ""
                }`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  chooseFile(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  ref={inputRef}
                  hidden
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={(e) =>
                    chooseFile(e.target.files?.[0])
                  }
                />

                <div className="upload-circle">
                  {file ? <CheckIcon /> : <UploadIcon />}
                </div>

                <strong>
                  {file
                    ? file.name
                    : "Drop a screenshot or PDF here"}
                </strong>

                <span>
                  {file
                    ? `${(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(2)} MB · ready to save`
                    : "or click to browse · maximum 10 MB"}
                </span>

                {file && (
                  <button
                    type="button"
                    className="change-file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);

                      if (inputRef.current) {
                        inputRef.current.value = "";
                      }
                    }}
                  >
                    Choose another file
                  </button>
                )}
              </div>
            )}

            {/* LINK */}

            {mode === "link" && (
              <label className="field">
                <span>Website URL</span>

                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com/..."
                  type="url"
                />
              </label>
            )}

            {/* TEXT */}

            {mode === "text" && (
              <label className="field">
                <span>Information</span>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the message, details or information you want to remember..."
                  rows={9}
                />
              </label>
            )}

            {/* FOOTER */}

            <div className="capture-footer">
              <div className="message-area">
                <span className="message-icon">
                  <LockIcon />
                </span>

                <p>
                  {message ||
                    "Your saved information stays in your private workspace."}
                </p>
              </div>

              <button
                type="button"
                className="save-button"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save memory"}

                <ArrowIcon />
              </button>
            </div>
          </section>
        </section>
      </main>

      <style jsx>{`
        .capture-page {
          min-height: 100vh;
          background: #f7f8fa;
          color: #17191e;
          padding: 34px 40px 70px;
        }

        .capture-header {
          max-width: 1080px;
          margin: 0 auto 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .eyebrow {
          display: block;
          color: #9b9fa7;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .capture-header h1 {
          margin: 7px 0 5px;
          font-size: 30px;
          line-height: 1;
          letter-spacing: -0.05em;
          font-weight: 750;
        }

        .capture-header p {
          margin: 0;
          color: #858990;
          font-size: 12px;
        }

        .private-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          background: #fff;
          border: 1px solid #e4e5e8;
          border-radius: 999px;
          color: #777b83;
          font-size: 9px;
          white-space: nowrap;
        }

        .private-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #555960;
        }

        .capture-container {
          width: min(920px, 100%);
          margin: 0 auto;
        }

        /* SOURCE TABS */

        .source-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 10px;
        }

        .source {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 62px;
          padding: 10px 13px;
          border: 1px solid #e3e4e7;
          border-radius: 13px;
          background: #fff;
          color: #70747c;
          text-align: left;
          cursor: pointer;
          transition: 0.15s ease;
        }

        .source:hover {
          border-color: #c8cad0;
        }

        .source.active {
          background: #17191e;
          border-color: #17191e;
          color: #fff;
        }

        .source-icon {
          width: 35px;
          height: 35px;
          flex: 0 0 35px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: #f1f2f4;
          color: #62666e;
        }

        .source.active .source-icon {
          background: #30333a;
          color: #fff;
        }

        .source strong,
        .source small {
          display: block;
        }

        .source strong {
          font-size: 11px;
          font-weight: 700;
        }

        .source small {
          margin-top: 3px;
          color: #9a9da4;
          font-size: 8px;
        }

        .source.active small {
          color: #a7abb3;
        }

        /* CARD */

        .capture-card {
          background: #fff;
          border: 1px solid #e3e4e7;
          border-radius: 17px;
          padding: 23px;
          box-shadow: 0 12px 35px rgba(20, 22, 27, 0.035);
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 21px;
        }

        .card-header h2 {
          margin: 6px 0 0;
          font-size: 18px;
          line-height: 1.2;
          letter-spacing: -0.035em;
          font-weight: 750;
        }

        .step-label {
          color: #a2a5ac;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        /* FIELDS */

        .field {
          display: block;
          margin-bottom: 15px;
        }

        .field > span {
          display: block;
          margin-bottom: 7px;
          color: #666a72;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .field em {
          margin-left: 4px;
          color: #afb2b8;
          font-style: normal;
          font-weight: 500;
          text-transform: none;
          letter-spacing: 0;
        }

        .field input,
        .field textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 13px;
          border: 1px solid #e0e1e4;
          border-radius: 10px;
          outline: none;
          background: #fafafa;
          color: #17191e;
          font-family: inherit;
          font-size: 12px;
          transition: 0.15s ease;
        }

        .field textarea {
          resize: vertical;
          min-height: 190px;
          line-height: 1.55;
        }

        .field input:focus,
        .field textarea:focus {
          border-color: #b9bcc2;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(23, 25, 30, 0.035);
        }

        /* DROPZONE */

        .dropzone {
          min-height: 230px;
          margin-bottom: 15px;
          padding: 25px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 1.5px dashed #d5d7db;
          border-radius: 13px;
          background: #fafbfc;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .dropzone:hover,
        .dropzone.has-file {
          border-color: #9da1a8;
          background: #f7f8f9;
        }

        .upload-circle {
          width: 44px;
          height: 44px;
          margin-bottom: 11px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #17191e;
          color: #fff;
        }

        .dropzone strong {
          max-width: 90%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 700;
        }

        .dropzone > span {
          margin-top: 5px;
          color: #999da5;
          font-size: 9px;
        }

        .change-file {
          margin-top: 12px;
          padding: 7px 10px;
          border: 1px solid #dedfe2;
          border-radius: 7px;
          background: #fff;
          color: #60646b;
          font-size: 9px;
          cursor: pointer;
        }

        .change-file:hover {
          border-color: #bfc2c7;
        }

        /* FOOTER */

        .capture-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding-top: 16px;
          border-top: 1px solid #ececef;
        }

        .message-area {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message-icon {
          width: 26px;
          height: 26px;
          flex: 0 0 26px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          background: #f2f3f5;
          color: #777b83;
        }

        .message-area p {
          margin: 0;
          color: #989ca3;
          font-size: 9px;
          line-height: 1.5;
        }

        .save-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
          padding: 11px 15px;
          border: 0;
          border-radius: 9px;
          background: #17191e;
          color: #fff;
          font-family: inherit;
          font-size: 10px;
          font-weight: 750;
          cursor: pointer;
          transition: 0.15s ease;
        }

        .save-button:hover {
          background: #292c32;
        }

        .save-button:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        /* ICONS */

        svg {
          width: 17px;
          height: 17px;
          display: block;
        }

        /* MOBILE */

        @media (max-width: 700px) {
          .capture-page {
            padding: 23px 15px 50px;
          }

          .capture-header {
            align-items: flex-start;
            margin-bottom: 22px;
          }

          .capture-header h1 {
            font-size: 27px;
          }

          .private-badge {
            display: none;
          }

          .source-selector {
            grid-template-columns: 1fr;
          }

          .source {
            min-height: 55px;
          }

          .capture-card {
            padding: 17px;
            border-radius: 15px;
          }

          .dropzone {
            min-height: 205px;
          }

          .capture-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .save-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </AppShell>
  );
}

/* ---------------- ICONS ---------------- */

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" />
      <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 7 20l1.15-1.15" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 6h14" />
      <path d="M12 6v13" />
      <path d="M8 19h8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}