
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../../../components/sidebar";
import { createClient } from "../../../lib/supabase";

type Memory = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  source_type: string;
  source_url: string | null;
  deadline: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

type Asset = {
  id: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memoryId = params?.id as string;

  const [memory, setMemory] = useState<Memory | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (memoryId) {
      loadMemory();
    }
  }, [memoryId]);

  async function loadMemory() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: memoryData, error: memoryError } = await supabase
      .from("memories")
      .select("*")
      .eq("id", memoryId)
      .eq("user_id", user.id)
      .single();

    if (memoryError || !memoryData) {
      setMemory(null);
      setLoading(false);
      return;
    }

    setMemory(memoryData);

    const { data: assetData } = await supabase
      .from("memory_assets")
      .select("*")
      .eq("memory_id", memoryId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assetData) {
      setAsset(assetData);

      const { data: signedData } = await supabase.storage
        .from("memory-assets")
        .createSignedUrl(assetData.storage_path, 60 * 60);

      if (signedData?.signedUrl) {
        setAssetUrl(signedData.signedUrl);
      }
    }

    setLoading(false);
  }

  async function toggleFavorite() {
    if (!memory || favoriteLoading) return;

    setFavoriteLoading(true);

    const newValue = !memory.is_favorite;

    const { error } = await supabase
      .from("memories")
      .update({
        is_favorite: newValue,
      })
      .eq("id", memory.id);

    if (!error) {
      setMemory({
        ...memory,
        is_favorite: newValue,
      });
    }

    setFavoriteLoading(false);
  }

  async function deleteMemory() {
    if (!memory || deleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this memory?"
    );

    if (!confirmed) return;

    setDeleting(true);

    if (asset) {
      await supabase.storage
        .from("memory-assets")
        .remove([asset.storage_path]);

      await supabase
        .from("memory_assets")
        .delete()
        .eq("id", asset.id);
    }

    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", memory.id);

    if (error) {
      alert("Unable to delete this memory.");
      setDeleting(false);
      return;
    }

    router.push("/memories");
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return "Unknown size";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getSourceLabel(sourceType: string) {
    switch (sourceType) {
      case "image":
        return "Image";
      case "pdf":
        return "PDF";
      case "website":
        return "Website";
      case "text":
        return "Text";
      case "voice":
        return "Voice";
      default:
        return sourceType || "Memory";
    }
  }

  function getInitial(title: string) {
    return title?.charAt(0)?.toUpperCase() || "T";
  }

  if (loading) {
    return (
      <>
        <Sidebar />

        <main className="memory-page">
          <div className="loading-screen">
            <div className="loading-spinner" />
            <p>Loading memory...</p>
          </div>
        </main>

        <PageStyles />
      </>
    );
  }

  if (!memory) {
    return (
      <>
        <Sidebar />

        <main className="memory-page">
          <div className="not-found">
            <div className="not-found-icon">?</div>

            <p className="eyebrow">MEMORY NOT FOUND</p>

            <h1>This memory doesn't exist.</h1>

            <p>
              It may have been deleted or you may not have permission to view
              it.
            </p>

            <Link href="/memories" className="back-button">
              ← Back to memories
            </Link>
          </div>
        </main>

        <PageStyles />
      </>
    );
  }

  return (
    <>
      <Sidebar />

      <main className="memory-page">
        <header className="topbar">
          <div>
            <p className="eyebrow">PERSONAL MEMORY</p>
            <h1>Memory</h1>
          </div>

          <Link href="/capture" className="capture-button">
            <span>＋</span>
            Capture memory
          </Link>
        </header>

        <section className="hero">
          <div className="hero-content">
            <p className="hero-label">
              {getSourceLabel(memory.source_type)}
            </p>

            <h2>
              {memory.title}
              <span>saved in your memory space.</span>
            </h2>

            <p className="hero-description">
              Everything you saved about this memory, kept in one place so you
              can find it again when you need it.
            </p>

            <div className="hero-meta">
              <span>Saved {formatDate(memory.created_at)}</span>

              {memory.category && (
                <>
                  <i />
                  <span>{memory.category}</span>
                </>
              )}
            </div>
          </div>

          <div className="orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />
            <div className="orbit-ring ring-three" />

            <div className="orbit-center">
              {getInitial(memory.title)}
            </div>

            <div className="orbit-dot dot-one" />
            <div className="orbit-dot dot-two" />
            <div className="orbit-dot dot-three" />
          </div>
        </section>

        <div className="action-row">
          <button
            className={`action-button ${
              memory.is_favorite ? "favorite-active" : ""
            }`}
            onClick={toggleFavorite}
            disabled={favoriteLoading}
          >
            <span>{memory.is_favorite ? "★" : "☆"}</span>
            {memory.is_favorite
              ? "Favorited"
              : "Add to favorites"}
          </button>

          <button
            className="action-button danger"
            onClick={deleteMemory}
            disabled={deleting}
          >
            <span>⌫</span>
            {deleting ? "Deleting..." : "Delete memory"}
          </button>
        </div>

        <section className="details-layout">
          <div className="main-column">
            {memory.summary && (
              <section className="section-block">
                <div className="section-heading">
                  <p className="eyebrow">SUMMARY</p>
                  <h3>What you remembered</h3>
                </div>

                <div className="white-card summary-card">
                  <p>{memory.summary}</p>
                </div>
              </section>
            )}

            {memory.content && (
              <section className="section-block">
                <div className="section-heading">
                  <p className="eyebrow">CONTENT</p>
                  <h3>Saved information</h3>
                </div>

                <div className="white-card content-card">
                  <div className="content-text">
                    {memory.content}
                  </div>
                </div>
              </section>
            )}

            {asset && assetUrl && (
              <section className="section-block">
                <div className="section-heading">
                  <p className="eyebrow">ORIGINAL SOURCE</p>
                  <h3>Attached file</h3>
                </div>

                <div className="white-card asset-card">
                  <div className="asset-header">
                    <div className="asset-icon">
                      {asset.mime_type?.startsWith("image/")
                        ? "▧"
                        : asset.mime_type === "application/pdf"
                        ? "PDF"
                        : "FILE"}
                    </div>

                    <div className="asset-info">
                      <strong>
                        {asset.file_name || "Attached file"}
                      </strong>

                      <span>
                        {formatFileSize(asset.file_size)}
                        {asset.mime_type
                          ? ` · ${asset.mime_type}`
                          : ""}
                      </span>
                    </div>

                    <a
                      href={assetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="open-file"
                    >
                      Open
                    </a>
                  </div>

                  {asset.mime_type?.startsWith("image/") && (
                    <div className="image-preview">
                      <img
                        src={assetUrl}
                        alt={
                          asset.file_name ||
                          "Memory attachment"
                        }
                      />
                    </div>
                  )}

                  {asset.mime_type === "application/pdf" && (
                    <div className="pdf-preview">
                      <iframe
                        src={assetUrl}
                        title={
                          asset.file_name ||
                          "PDF preview"
                        }
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {memory.source_url && (
              <section className="section-block">
                <div className="section-heading">
                  <p className="eyebrow">SOURCE</p>
                  <h3>Original website</h3>
                </div>

                <div className="white-card source-card">
                  <div className="source-symbol">↗</div>

                  <div className="source-details">
                    <span>Original link</span>
                    <strong>{memory.source_url}</strong>
                  </div>

                  <a
                    href={memory.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-file"
                  >
                    Visit
                  </a>
                </div>
              </section>
            )}
          </div>

          <aside className="side-column">
            <section className="white-card info-card">
              <p className="eyebrow">MEMORY DETAILS</p>

              <div className="info-list">
                <div className="info-item">
                  <span>Source</span>
                  <strong>
                    {getSourceLabel(memory.source_type)}
                  </strong>
                </div>

                <div className="info-item">
                  <span>Category</span>
                  <strong>
                    {memory.category || "Other"}
                  </strong>
                </div>

                <div className="info-item">
                  <span>Saved</span>
                  <strong>
                    {formatDate(memory.created_at)}
                  </strong>
                </div>

                <div className="info-item">
                  <span>Updated</span>
                  <strong>
                    {formatDate(memory.updated_at)}
                  </strong>
                </div>

                <div className="info-item">
                  <span>Favorite</span>
                  <strong>
                    {memory.is_favorite ? "Yes" : "No"}
                  </strong>
                </div>
              </div>
            </section>

            {memory.deadline && (
              <section className="white-card deadline-card">
                <p className="eyebrow">DEADLINE</p>

                <div className="deadline-value">
                  {formatDate(memory.deadline)}
                </div>

                <p>
                  This memory has a deadline attached to it.
                </p>
              </section>
            )}

            <section className="white-card tip-card">
              <div className="tip-mark">T</div>

              <div>
                <p className="eyebrow">TRACEMIND TIP</p>

                <h4>Keep the context.</h4>

                <p>
                  Saving the original source with a memory makes
                  it much easier to understand and find again later.
                </p>
              </div>
            </section>

            <Link href="/memories" className="back-link">
              ← Back to all memories
            </Link>
          </aside>
        </section>
      </main>

      <PageStyles />
    </>
  );
}

function PageStyles() {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
      }

      body {
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

      .memory-page {
        width: calc(100% - 238px);
        min-height: 100vh;
        margin-left: 238px;
        padding: 34px 46px 70px;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 28px;
      }

      .eyebrow {
        margin: 0 0 7px;
        color: #a1a4aa;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.5px;
        text-transform: uppercase;
      }

      .topbar h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1;
        letter-spacing: -1px;
      }

      .capture-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #17191e;
        color: #ffffff;
        text-decoration: none;
        border-radius: 10px;
        padding: 11px 15px;
        font-size: 12px;
        font-weight: 700;
        transition: 0.2s ease;
      }

      .capture-button:hover {
        background: #292c33;
        transform: translateY(-1px);
      }

      .capture-button span {
        font-size: 16px;
      }

      .hero {
        position: relative;
        min-height: 340px;
        overflow: hidden;
        border-radius: 22px;
        background: #17191e;
        color: #ffffff;
        padding: 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }

      .hero-content {
        position: relative;
        z-index: 2;
        max-width: 700px;
      }

      .hero-label {
        margin: 0 0 18px;
        color: #9ea2aa;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.7px;
        text-transform: uppercase;
      }

      .hero h2 {
        max-width: 720px;
        margin: 0;
        font-size: clamp(38px, 5vw, 67px);
        line-height: 0.98;
        letter-spacing: -3.5px;
        font-weight: 750;
      }

      .hero h2 span {
        display: block;
        color: #70747d;
      }

      .hero-description {
        max-width: 580px;
        margin: 25px 0 0;
        color: #aeb2ba;
        font-size: 14px;
        line-height: 1.7;
      }

      .hero-meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 24px;
        color: #858992;
        font-size: 11px;
        font-weight: 600;
      }

      .hero-meta i {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #5e626a;
      }

      .orbit {
        position: absolute;
        right: 30px;
        top: 50%;
        width: 330px;
        height: 330px;
        transform: translateY(-50%);
      }

      .orbit-ring {
        position: absolute;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
      }

      .ring-one {
        width: 180px;
        height: 180px;
        left: 75px;
        top: 75px;
      }

      .ring-two {
        width: 260px;
        height: 260px;
        left: 35px;
        top: 35px;
      }

      .ring-three {
        width: 325px;
        height: 325px;
        left: 2px;
        top: 2px;
      }

      .orbit-center {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 72px;
        height: 72px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: #ffffff;
        color: #17191e;
        font-size: 24px;
        font-weight: 800;
      }

      .orbit-dot {
        position: absolute;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #ffffff;
      }

      .dot-one {
        top: 30px;
        left: 158px;
      }

      .dot-two {
        right: 26px;
        top: 154px;
      }

      .dot-three {
        bottom: 32px;
        left: 70px;
      }

      .action-row {
        display: flex;
        gap: 9px;
        margin-bottom: 38px;
      }

      .action-button {
        border: 1px solid #e1e3e7;
        background: #ffffff;
        color: #565a62;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s ease;
      }

      .action-button:hover {
        border-color: #cfd2d7;
        color: #17191e;
      }

      .action-button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .action-button span {
        margin-right: 7px;
        font-size: 14px;
      }

      .favorite-active {
        background: #17191e;
        color: #ffffff;
        border-color: #17191e;
      }

      .details-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 310px;
        gap: 28px;
        align-items: start;
      }

      .main-column {
        min-width: 0;
      }

      .section-block {
        margin-bottom: 38px;
      }

      .section-heading {
        margin-bottom: 14px;
      }

      .section-heading h3 {
        margin: 0;
        font-size: 22px;
        letter-spacing: -0.7px;
      }

      .white-card {
        background: #ffffff;
        border: 1px solid #e7e8eb;
        border-radius: 15px;
      }

      .summary-card {
        padding: 24px;
      }

      .summary-card p {
        margin: 0;
        color: #555962;
        font-size: 15px;
        line-height: 1.8;
      }

      .content-card {
        padding: 25px;
      }

      .content-text {
        white-space: pre-wrap;
        color: #4d5159;
        font-size: 14px;
        line-height: 1.85;
      }

      .asset-card {
        overflow: hidden;
      }

      .asset-header {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 17px;
      }

      .asset-icon {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border-radius: 10px;
        background: #f0f1f3;
        display: grid;
        place-items: center;
        color: #17191e;
        font-size: 10px;
        font-weight: 800;
      }

      .asset-info {
        min-width: 0;
        flex: 1;
      }

      .asset-info strong {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
      }

      .asset-info span {
        display: block;
        margin-top: 4px;
        color: #999ca2;
        font-size: 10px;
      }

      .open-file {
        flex-shrink: 0;
        color: #17191e;
        text-decoration: none;
        border: 1px solid #dfe1e5;
        border-radius: 8px;
        padding: 8px 11px;
        font-size: 11px;
        font-weight: 700;
      }

      .open-file:hover {
        background: #f5f6f7;
      }

      .image-preview {
        border-top: 1px solid #ececef;
        background: #f5f6f7;
        padding: 20px;
        text-align: center;
      }

      .image-preview img {
        max-width: 100%;
        max-height: 700px;
        border-radius: 9px;
        object-fit: contain;
      }

      .pdf-preview {
        border-top: 1px solid #ececef;
        background: #f4f5f6;
        padding: 14px;
      }

      .pdf-preview iframe {
        width: 100%;
        height: 650px;
        display: block;
        border: 0;
        border-radius: 8px;
        background: #ffffff;
      }

      .source-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 17px;
      }

      .source-symbol {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        border-radius: 10px;
        background: #f0f1f3;
        display: grid;
        place-items: center;
        font-size: 18px;
      }

      .source-details {
        min-width: 0;
        flex: 1;
      }

      .source-details span {
        display: block;
        color: #999ca2;
        font-size: 10px;
        margin-bottom: 4px;
      }

      .source-details strong {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 650;
      }

      .side-column {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .info-card {
        padding: 22px;
      }

      .info-list {
        margin-top: 18px;
      }

      .info-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        padding: 13px 0;
        border-top: 1px solid #ececef;
      }

      .info-item span {
        color: #999ca2;
        font-size: 11px;
      }

      .info-item strong {
        text-align: right;
        font-size: 11px;
        font-weight: 700;
      }

      .deadline-card {
        padding: 22px;
      }

      .deadline-value {
        margin-top: 12px;
        font-size: 20px;
        font-weight: 750;
        letter-spacing: -0.5px;
      }

      .deadline-card p:last-child {
        margin: 8px 0 0;
        color: #999ca2;
        font-size: 11px;
        line-height: 1.6;
      }

      .tip-card {
        display: flex;
        gap: 13px;
        padding: 20px;
      }

      .tip-mark {
        width: 34px;
        height: 34px;
        flex-shrink: 0;
        border-radius: 9px;
        background: #17191e;
        color: #ffffff;
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 800;
      }

      .tip-card h4 {
        margin: 0 0 7px;
        font-size: 14px;
      }

      .tip-card p:last-child {
        margin: 0;
        color: #8b8e95;
        font-size: 11px;
        line-height: 1.65;
      }

      .back-link {
        color: #777b83;
        text-decoration: none;
        font-size: 12px;
        font-weight: 700;
      }

      .back-link:hover {
        color: #17191e;
      }

      .loading-screen {
        min-height: 70vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 12px;
        color: #888c94;
      }

      .loading-screen p {
        margin: 0;
        font-size: 13px;
      }

      .loading-spinner {
        width: 25px;
        height: 25px;
        border: 3px solid #e2e3e6;
        border-top-color: #17191e;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .not-found {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .not-found-icon {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: #17191e;
        color: #ffffff;
        display: grid;
        place-items: center;
        font-weight: 800;
        margin-bottom: 20px;
      }

      .not-found h1 {
        margin: 0;
        font-size: 30px;
        letter-spacing: -1px;
      }

      .not-found > p:not(.eyebrow) {
        max-width: 420px;
        margin: 12px 0 22px;
        color: #858991;
        font-size: 13px;
        line-height: 1.7;
      }

      .back-button {
        background: #17191e;
        color: #ffffff;
        text-decoration: none;
        border-radius: 10px;
        padding: 11px 15px;
        font-size: 12px;
        font-weight: 700;
      }

      @media (max-width: 1100px) {
        .details-layout {
          grid-template-columns: 1fr;
        }

        .side-column {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .orbit {
          opacity: 0.5;
          right: -30px;
        }
      }

      @media (max-width: 900px) {
        .memory-page {
          width: calc(100% - 76px);
          margin-left: 76px;
        }

        .hero {
          padding: 38px;
        }

        .hero h2 {
          font-size: 48px;
        }
      }

      @media (max-width: 700px) {
        .memory-page {
          padding: 25px 20px 50px;
        }

        .topbar {
          align-items: flex-start;
        }

        .capture-button {
          padding: 10px 11px;
        }

        .capture-button span {
          display: none;
        }

        .hero {
          min-height: 350px;
          padding: 30px;
        }

        .hero h2 {
          font-size: 39px;
          letter-spacing: -2px;
        }

        .orbit {
          opacity: 0.18;
          right: -100px;
        }

        .side-column {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 650px) {
        .memory-page {
          width: calc(100% - 68px);
          margin-left: 68px;
          padding: 22px 15px 50px;
        }

        .hero {
          border-radius: 17px;
          padding: 26px;
        }

        .hero h2 {
          font-size: 34px;
        }

        .action-row {
          flex-wrap: wrap;
        }

        .action-button {
          flex: 1;
          min-width: 150px;
        }
      }
    `}</style>
  );
}

