
"use client";

import { useRef, useState } from "react";
import { createClient } from "../../lib/supabase";

type CaptureMode = "file" | "link" | "text";

export default function CapturePage() {
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<CaptureMode>("file");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const chooseFile = (selected: File | undefined) => {
    if (!selected) return;

    if (
      !selected.type.startsWith("image/") &&
      selected.type !== "application/pdf"
    ) {
      setMessage("Please select an image or PDF.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setMessage("File must be smaller than 10 MB.");
      return;
    }

    setFile(selected);
    setMessage("");

    if (selected.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview("");
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    chooseFile(event.target.files?.[0]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const resetForm = () => {
    setFile(null);
    setPreview("");
    setTitle("");
    setLink("");
    setText("");
    setMessage("");

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  };

  const saveMemory = async () => {
    setSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please log in again.");
        return;
      }

      /* =========================
         FILE CAPTURE
      ========================= */

      if (mode === "file") {
        if (!file) {
          setMessage("Please select a screenshot or PDF first.");
          return;
        }

        const filePath = `${user.id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("memory-assets")
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const isPdf = file.type === "application/pdf";

        const { data: memory, error: memoryError } =
          await supabase
            .from("memories")
            .insert({
              user_id: user.id,
              title: title.trim() || file.name,
              summary: "Memory captured by TraceMind.",
              content: "",
              category: isPdf ? "Document" : "Screenshot",
              source_type: isPdf ? "PDF" : "Screenshot",
              source_name: file.name,
              ocr_text: "",
              important_details: [],
              keywords: [],
              ai_processed: false,
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
            storage_path: filePath,
            file_name: file.name,
            mime_type: file.type,
            file_size: file.size,
          });

        if (assetError) {
          throw assetError;
        }

        setMessage("✓ Memory saved successfully.");
        resetForm();
        return;
      }

      /* =========================
         LINK CAPTURE
      ========================= */

      if (mode === "link") {
        const cleanLink = link.trim();

        if (!cleanLink) {
          setMessage("Please enter a website link.");
          return;
        }

        let validUrl = "";

        try {
          const url = new URL(
            cleanLink.startsWith("http")
              ? cleanLink
              : `https://${cleanLink}`
          );

          validUrl = url.toString();
        } catch {
          setMessage("Please enter a valid website URL.");
          return;
        }

        const { error } = await supabase
          .from("memories")
          .insert({
            user_id: user.id,
            title: title.trim() || validUrl,
            summary: "Website saved by TraceMind.",
            content: "",
            category: "Website",
            source_type: "Link",
            source_url: validUrl,
            source_name: validUrl,
            ocr_text: "",
            important_details: [],
            keywords: [],
            ai_processed: false,
          });

        if (error) {
          throw error;
        }

        setMessage("✓ Website saved successfully.");
        resetForm();
        return;
      }

      /* =========================
         TEXT CAPTURE
      ========================= */

      if (mode === "text") {
        const cleanText = text.trim();

        if (!cleanText) {
          setMessage("Please paste or type some information.");
          return;
        }

        if (cleanText.length < 3) {
          setMessage("Please enter a little more information.");
          return;
        }

        const { error } = await supabase
          .from("memories")
          .insert({
            user_id: user.id,
            title: title.trim() || "Saved text",
            summary:
              cleanText.length > 180
                ? `${cleanText.substring(0, 180)}...`
                : cleanText,
            content: cleanText,
            category: "Text",
            source_type: "Text",
            source_name: "Manual text",
            ocr_text: cleanText,
            important_details: [],
            keywords: [],
            ai_processed: false,
          });

        if (error) {
          throw error;
        }

        setMessage("✓ Text memory saved successfully.");
        resetForm();
      }
    } catch (error: any) {
      setMessage(error?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">T</div>
          <span>TraceMind</span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="nav">
  <a href="/dashboard">
    <span>⌂</span>
    Home
  </a>

  <a href="/capture" className="active">
    <span>＋</span>
    Capture
  </a>

  <a href="/memories">
    <span>▣</span>
    Memories
  </a>

  <a href="/Timeline">
    <span>◫</span>
    Timeline
  </a>

  <a href="/reminders">
    <span>◷</span>
    Reminders
  </a>
</nav>

        <a href="/profile" className="account">
          <div className="avatar">M</div>

          <div>
            <strong>My Account</strong>
            <small>Profile & settings</small>
          </div>
        </a>
      </aside>

      {/* MAIN */}

      <section className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">PERSONAL MEMORY</div>
            <h1>Capture</h1>
          </div>

          <a href="/capture" className="capture-button">
            + Capture memory
          </a>
        </header>

        {/* HERO */}

        <section className="hero">
          <div className="hero-copy">
            <span className="hero-label">CAPTURE A MEMORY</span>

            <h2>
              Save something
              <br />
              <span>you don't want to lose.</span>
            </h2>

            <p>
              Capture information from files, websites, messages, or
              anything else you may want to find again later.
            </p>
          </div>

          <div className="hero-orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />

            <div className="orbit-dot dot-one" />
            <div className="orbit-dot dot-two" />

            <div className="orbit-center">TM</div>
          </div>
        </section>

        {/* CAPTURE TYPES */}

        <section className="section">
          <div className="section-heading">
            <div>
              <span>CHOOSE A SOURCE</span>
              <h2>What would you like to save?</h2>
            </div>
          </div>

          <div className="capture-tabs">
            <button
              className={mode === "file" ? "active" : ""}
              onClick={() => {
                setMode("file");
                setMessage("");
              }}
            >
              <span className="tab-icon">↑</span>

              <div>
                <strong>File</strong>
                <small>Screenshot or PDF</small>
              </div>
            </button>

            <button
              className={mode === "link" ? "active" : ""}
              onClick={() => {
                setMode("link");
                setMessage("");
              }}
            >
              <span className="tab-icon">↗</span>

              <div>
                <strong>Website</strong>
                <small>Save a useful link</small>
              </div>
            </button>

            <button
              className={mode === "text" ? "active" : ""}
              onClick={() => {
                setMode("text");
                setMessage("");
              }}
            >
              <span className="tab-icon">T</span>

              <div>
                <strong>Text</strong>
                <small>Paste a message or note</small>
              </div>
            </button>
          </div>
        </section>

        {/* CAPTURE CARD */}

        <section className="capture-card">
          {/* FILE */}

          {mode === "file" && (
            <>
              <div
                className={`drop-zone ${file ? "has-file" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInput.current?.click()}
              >
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileChange}
                  hidden
                />

                {!file ? (
                  <div className="empty-upload">
                    <div className="upload-icon">↑</div>

                    <h2>Drop your screenshot or PDF here</h2>

                    <p>
                      or <span>choose a file</span> from your computer
                    </p>

                    <small>
                      PNG, JPG, WEBP or PDF · Max 10 MB
                    </small>
                  </div>
                ) : (
                  <div className="selected-file">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Selected screenshot"
                      />
                    ) : (
                      <div className="pdf-preview">PDF</div>
                    )}

                    <div className="file-info">
                      <span className="file-label">
                        SELECTED FILE
                      </span>

                      <strong>{file.name}</strong>

                      <p>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      type="button"
                      className="remove"
                      onClick={(e) => {
                        e.stopPropagation();

                        setFile(null);
                        setPreview("");

                        if (fileInput.current) {
                          fileInput.current.value = "";
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="details">
                <label>MEMORY NAME</label>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give this memory a useful name"
                />
              </div>
            </>
          )}

          {/* LINK */}

          {mode === "link" && (
            <div className="form-area">
              <div className="large-icon">↗</div>

              <span className="form-label">WEBSITE</span>

              <h2>Save a website</h2>

              <p className="form-description">
                Found something useful online? Save the original link
                so TraceMind can help you find it later.
              </p>

              <label>WEBSITE URL</label>

              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com/..."
                type="url"
              />

              <label>
                MEMORY NAME <span>OPTIONAL</span>
              </label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is this website about?"
              />
            </div>
          )}

          {/* TEXT */}

          {mode === "text" && (
            <div className="form-area">
              <div className="large-icon">T</div>

              <span className="form-label">TEXT</span>

              <h2>Save text</h2>

              <p className="form-description">
                Paste a WhatsApp message, important information, a
                note, or anything you want to remember.
              </p>

              <label>MEMORY NAME</label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this memory a name"
              />

              <label>INFORMATION</label>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type the information here..."
                rows={10}
              />

              <div className="character-count">
                {text.length} characters
              </div>
            </div>
          )}

          {/* SAVE */}

          <button
            className="save-button"
            onClick={saveMemory}
            disabled={
              saving ||
              (mode === "file" && !file) ||
              (mode === "link" && !link.trim()) ||
              (mode === "text" && !text.trim())
            }
          >
            {saving ? "Saving memory..." : "Save to TraceMind →"}
          </button>

          {message && (
            <div
              className={`message ${
                message.startsWith("✓") ? "success" : ""
              }`}
            >
              {message}
            </div>
          )}
        </section>

        <div className="privacy">
          <span>LOCKED</span>
          Your information is stored privately in your TraceMind account.
        </div>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f7f8fa;
          color: #17191e;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* SIDEBAR */

        .sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: 238px;
          background: #fff;
          border-right: 1px solid #e7e8eb;
          display: flex;
          flex-direction: column;
          padding: 28px 18px 20px;
          z-index: 20;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 10px;
          font-size: 18px;
          font-weight: 750;
          letter-spacing: -0.4px;
        }

        .logo-mark {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: #17191e;
          color: white;
          font-size: 15px;
          font-weight: 800;
        }

        .workspace-label {
          margin: 48px 12px 13px;
          color: #a1a4aa;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.5px;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .nav a {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px 13px;
          border-radius: 11px;
          text-decoration: none;
          color: #777b83;
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .nav a span {
          width: 20px;
          text-align: center;
          font-size: 18px;
        }

        .nav a:hover {
          background: #f4f5f7;
          color: #17191e;
        }

        .nav a.active {
          background: #17191e;
          color: white;
        }

        .account {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border-top: 1px solid #ececef;
          padding-top: 18px;
          text-decoration: none;
          color: inherit;
        }

        .avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: #eceef1;
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 13px;
        }

        .account strong,
        .account small {
          display: block;
        }

        .account strong {
          font-size: 12px;
        }

        .account small {
          color: #999ca2;
          margin-top: 2px;
          font-size: 10px;
        }

        /* CONTENT */

        .content {
          margin-left: 238px;
          padding: 34px 46px 70px;
          max-width: 1500px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .eyebrow {
          color: #9b9ea5;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.4px;
          margin-bottom: 5px;
        }

        .topbar h1 {
          margin: 0;
          font-size: 30px;
          letter-spacing: -1px;
        }

        .capture-button {
          background: #17191e;
          color: white;
          text-decoration: none;
          padding: 11px 17px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 650;
        }

        .capture-button:hover {
          background: #292c33;
        }

        /* HERO */

        .hero {
          min-height: 255px;
          border-radius: 24px;
          background: #17191e;
          color: white;
          padding: 38px 42px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          overflow: hidden;
          position: relative;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
        }

        .hero-label {
          color: #9ea2aa;
          font-size: 10px;
          letter-spacing: 1.7px;
          font-weight: 750;
        }

        .hero h2 {
          margin: 12px 0;
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.03;
          letter-spacing: -2px;
          max-width: 650px;
        }

        .hero h2 span {
          color: #a9adb5;
        }

        .hero p {
          color: #a9adb5;
          max-width: 560px;
          font-size: 14px;
          line-height: 1.7;
          margin: 0;
        }

        /* ORBIT */

        .hero-orbit {
          width: 190px;
          height: 190px;
          position: relative;
          margin-right: 45px;
          flex-shrink: 0;
        }

        .orbit-ring {
          position: absolute;
          inset: 0;
          border: 1px solid #383b42;
          border-radius: 50%;
        }

        .ring-two {
          inset: 27px;
          border-color: #454850;
        }

        .orbit-center {
          position: absolute;
          width: 55px;
          height: 55px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: #fff;
          color: #17191e;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 800;
        }

        .orbit-dot {
          position: absolute;
          width: 9px;
          height: 9px;
          background: white;
          border-radius: 50%;
        }

        .dot-one {
          top: 11px;
          left: 93px;
        }

        .dot-two {
          bottom: 22px;
          right: 8px;
        }

        /* SECTIONS */

        .section {
          margin-top: 38px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 15px;
        }

        .section-heading > div > span {
          color: #9b9ea5;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.4px;
        }

        .section-heading h2 {
          margin: 5px 0 0;
          font-size: 21px;
          letter-spacing: -0.5px;
        }

        /* TABS */

        .capture-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .capture-tabs button {
          border: 1px solid #e7e8eb;
          background: #fff;
          border-radius: 15px;
          padding: 17px;
          display: flex;
          align-items: center;
          gap: 13px;
          text-align: left;
          cursor: pointer;
          transition: 0.2s ease;
          font-family: inherit;
          color: #17191e;
        }

        .capture-tabs button:hover {
          border-color: #cfd1d6;
          transform: translateY(-1px);
        }

        .capture-tabs button.active {
          background: #17191e;
          color: white;
          border-color: #17191e;
        }

        .tab-icon {
          width: 39px;
          height: 39px;
          border-radius: 11px;
          background: #f0f1f3;
          color: #17191e;
          display: grid;
          place-items: center;
          font-size: 17px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .capture-tabs button.active .tab-icon {
          background: #fff;
          color: #17191e;
        }

        .capture-tabs strong {
          display: block;
          font-size: 13px;
        }

        .capture-tabs small {
          display: block;
          color: #999ca2;
          margin-top: 3px;
          font-size: 10px;
        }

        .capture-tabs button.active small {
          color: #9ea2aa;
        }

        /* CARD */

        .capture-card {
          margin-top: 14px;
          background: #fff;
          border: 1px solid #e7e8eb;
          border-radius: 18px;
          padding: 20px;
        }

        /* FILE UPLOAD */

        .drop-zone {
          min-height: 280px;
          border: 1px dashed #d4d6db;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px;
          cursor: pointer;
          transition: 0.2s ease;
          background: #fafbfc;
        }

        .drop-zone:hover,
        .drop-zone.has-file {
          border-color: #aeb1b7;
          background: #f7f8fa;
        }

        .empty-upload {
          width: 100%;
        }

        .upload-icon {
          width: 54px;
          height: 54px;
          margin: 0 auto 17px;
          border-radius: 15px;
          display: grid;
          place-items: center;
          background: #eceef1;
          color: #17191e;
          font-size: 27px;
          font-weight: 500;
        }

        .drop-zone h2,
        .form-area h2 {
          margin: 0 0 8px;
          font-size: 20px;
          letter-spacing: -0.5px;
        }

        .drop-zone p {
          color: #777b83;
          font-size: 13px;
          margin: 0;
        }

        .drop-zone p span {
          color: #17191e;
          font-weight: 700;
        }

        .drop-zone small {
          color: #9b9ea5;
          display: block;
          margin-top: 17px;
          font-size: 10px;
        }

        /* SELECTED FILE */

        .selected-file {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 17px;
          text-align: left;
        }

        .selected-file img,
        .pdf-preview {
          width: 125px;
          height: 125px;
          object-fit: cover;
          border-radius: 13px;
          border: 1px solid #e3e4e7;
          flex-shrink: 0;
        }

        .pdf-preview {
          display: grid;
          place-items: center;
          background: #f0f1f3;
          color: #17191e;
          font-weight: 800;
          font-size: 23px;
        }

        .file-info {
          min-width: 0;
        }

        .file-label {
          display: block;
          color: #9b9ea5;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.3px;
          margin-bottom: 7px;
        }

        .file-info strong {
          display: block;
          word-break: break-word;
          font-size: 14px;
        }

        .file-info p {
          margin: 7px 0 0;
          color: #9b9ea5;
          font-size: 11px;
        }

        .remove {
          margin-left: auto;
          border: 1px solid #e2e3e6;
          background: white;
          color: #777b83;
          padding: 9px 12px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 650;
        }

        .remove:hover {
          background: #f4f5f7;
          color: #17191e;
        }

        /* FORM */

        .details {
          padding: 22px 2px 2px;
        }

        .form-area {
          padding: 18px 5px 5px;
        }

        .large-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #eceef1;
          color: #17191e;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 17px;
        }

        .form-label {
          display: block;
          color: #9b9ea5;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.4px;
          margin-bottom: 7px;
        }

        .form-description {
          color: #777b83;
          line-height: 1.65;
          margin: 0 0 24px;
          max-width: 650px;
          font-size: 13px;
        }

        label {
          display: block;
          color: #777b83;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.2px;
          margin: 17px 0 8px;
        }

        label span {
          color: #b0b2b7;
          font-weight: 500;
          margin-left: 5px;
          letter-spacing: 0;
        }

        input,
        textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #e0e1e4;
          border-radius: 11px;
          padding: 13px 14px;
          outline: none;
          font-size: 13px;
          font-family: inherit;
          background: #fff;
          color: #17191e;
          transition: 0.2s ease;
        }

        textarea {
          resize: vertical;
          line-height: 1.6;
          min-height: 180px;
        }

        input::placeholder,
        textarea::placeholder {
          color: #b0b2b7;
        }

        input:focus,
        textarea:focus {
          border-color: #999ca2;
          box-shadow: 0 0 0 3px rgba(23, 25, 30, 0.04);
        }

        .character-count {
          text-align: right;
          color: #9b9ea5;
          font-size: 10px;
          margin-top: 6px;
        }

        /* SAVE */

        .save-button {
          width: 100%;
          margin-top: 20px;
          border: 0;
          border-radius: 11px;
          padding: 14px;
          background: #17191e;
          color: white;
          font-weight: 650;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          transition: 0.2s ease;
        }

        .save-button:hover:not(:disabled) {
          background: #292c33;
        }

        .save-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .message {
          margin-top: 12px;
          padding: 12px;
          border-radius: 10px;
          background: #f0f1f3;
          text-align: center;
          color: #777b83;
          font-size: 12px;
        }

        .message.success {
          background: #f0f1f3;
          color: #17191e;
        }

        /* PRIVACY */

        .privacy {
          text-align: center;
          margin-top: 18px;
          color: #a1a4aa;
          font-size: 10px;
        }

        .privacy span {
          font-size: 8px;
          font-weight: 750;
          letter-spacing: 1px;
          margin-right: 6px;
        }

        /* TABLET */

        @media (max-width: 900px) {
          .sidebar {
            width: 76px;
            padding: 28px 10px 20px;
          }

          .logo {
            justify-content: center;
            padding: 0;
          }

          .logo span,
          .workspace-label,
          .nav a:not(.active)::after,
          .nav a {
            font-size: 0;
          }

          .nav a {
            justify-content: center;
            padding: 13px;
          }

          .nav a span {
            font-size: 18px;
          }

          .account {
            justify-content: center;
          }

          .account > div:last-child {
            display: none;
          }

          .content {
            margin-left: 76px;
            padding: 30px 28px 60px;
          }

          .hero-orbit {
            margin-right: 10px;
          }
        }

        /* MOBILE */

        @media (max-width: 650px) {
          .sidebar {
            width: 64px;
            padding-left: 7px;
            padding-right: 7px;
          }

          .content {
            margin-left: 64px;
            padding: 22px 15px 50px;
          }

          .topbar {
            margin-bottom: 20px;
          }

          .topbar h1 {
            font-size: 25px;
          }

          .capture-button {
            padding: 9px 11px;
            font-size: 11px;
          }

          .hero {
            min-height: auto;
            padding: 29px 25px;
          }

          .hero h2 {
            font-size: 31px;
            letter-spacing: -1.4px;
          }

          .hero p {
            font-size: 12px;
          }

          .hero-orbit {
            display: none;
          }

          .capture-tabs {
            grid-template-columns: 1fr;
          }

          .capture-tabs button {
            padding: 14px;
          }

          .capture-card {
            padding: 14px;
          }

          .drop-zone {
            min-height: 245px;
            padding: 20px;
          }

          .selected-file {
            flex-direction: column;
            text-align: center;
          }

          .remove {
            margin: 0;
          }

          .form-area {
            padding: 13px 3px 4px;
          }
        }
      `}</style>
    </main>
  );
}

