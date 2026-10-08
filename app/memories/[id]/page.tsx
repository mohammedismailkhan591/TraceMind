import { createServerClient } from "../../../lib/supabase-server";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function MemoryDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  async function deleteMemory() {
    "use server";
    const store = await cookies();
    const client = createServerClient(store);
    const { data: { user: currentUser } } = await client.auth.getUser();
    if (!currentUser) return;
    await client.from("memories").delete().eq("id", id).eq("user_id", currentUser.id);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
          <div className="detail-page">
          <div className="error-box">
            <h2>Session expired</h2>
            <p>Please login again to view this memory.</p>

            <Link href="/login" className="primary-button">
              Login
            </Link>
          </div>
        </div>
      );
  }

  const { data: memory, error } = await supabase
    .from("memories")
    .select(`
      id,
      title,
      summary,
      content,
      category,
      source_type,
      source_url,
      deadline,
      is_favorite,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !memory) {
    return (
          <div className="detail-page">

          <Link href="/memories" className="back-link">
            ← Back to memories
          </Link>

          <div className="not-found">
            <div className="not-found-icon">
              <FileIcon />
            </div>

            <h1>Memory not found</h1>

            <p>
              This memory may have been deleted or you
              may not have permission to view it.
            </p>

            <Link
              href="/memories"
              className="primary-button"
            >
              Back to memories
            </Link>
          </div>

        </div>
      );
  }

  return (
      <div className="detail-page">

        {/* BACK */}

        <Link
          href="/memories"
          className="back-link"
        >
          ← Back to memories
        </Link>

        {/* MAIN CARD */}

        <div className="detail-card">

          {/* TOP */}

          <div className="detail-header">

            <div>

              <div className="top-meta">

                <span
                  className={`source-badge ${getSourceClass(
                    memory.source_type
                  )}`}
                >
                  {getSourceIcon(
                    memory.source_type
                  )}

                  {memory.source_type}
                </span>

                <span className="category-badge">
                  {memory.category || "Other"}
                </span>

              </div>

              <h1>{memory.title}</h1>

              <p className="saved-text">
                Saved{" "}
                {formatDate(memory.created_at)}
              </p>

            </div>

            <div
              className={`favorite ${
                memory.is_favorite
                  ? "active"
                  : ""
              }`}
            >
              <StarIcon
                filled={memory.is_favorite}
              />

              {memory.is_favorite
                ? "Important"
                : "Saved memory"}
            </div>

          </div>

          <div className="divider" />

          {/* SUMMARY */}

          {memory.summary && (
            <section className="content-section">

              <h2>Summary</h2>

              <p className="summary">
                {memory.summary}
              </p>

            </section>
          )}

          {/* CONTENT */}

          {memory.content && (
            <section className="content-section">

              <h2>Captured content</h2>

              <div className="content-box">
                {memory.content}
              </div>

            </section>
          )}

          {/* INFORMATION */}

          <section className="content-section">

            <h2>Information</h2>

            <div className="info-grid">

              <InfoItem
                label="Category"
                value={
                  memory.category || "Other"
                }
              />

              <InfoItem
                label="Source"
                value={
                  memory.source_type
                }
              />

              <InfoItem
                label="Saved"
                value={formatDate(
                  memory.created_at
                )}
              />

              <InfoItem
                label="Deadline"
                value={
                  memory.deadline
                    ? formatDate(
                        memory.deadline
                      )
                    : "No deadline"
                }
                danger={
                  !!memory.deadline
                }
              />

            </div>

          </section>

          {/* DEADLINE */}

          {memory.deadline && (
            <section className="deadline-box">

              <div className="deadline-icon">
                <CalendarIcon />
              </div>

              <div>
                <strong>
                  Deadline
                </strong>

                <p>
                  {formatDate(
                    memory.deadline
                  )}
                </p>
              </div>

            </section>
          )}

          {/* SOURCE */}

          <section className="content-section">

            <h2>Original source</h2>

            {memory.source_url ? (
              <a
                href={memory.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-card"
              >
                <div className="source-card-icon">
                  <ExternalIcon />
                </div>

                <div>
                  <strong>
                    Open original source
                  </strong>

                  <span>
                    View the website or
                    original link
                  </span>
                </div>

                <ExternalIcon />
              </a>
            ) : (
              <div className="no-source">
                <FileIcon />

                <div>
                  <strong>
                    No external source
                  </strong>

                  <span>
                    This memory was captured
                    without an original URL.
                  </span>
                </div>
              </div>
            )}

          </section>

          {/* ACTIONS */}

          <div className="actions">

            <Link
              href="/memories"
              className="secondary-button"
            >
              ← Back
            </Link>

            <form action={deleteMemory}>
              <button type="submit" className="danger-button">
                Delete memory
              </button>
            </form>

          </div>

        </div>

      </div>

      <style>{`

        .detail-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 28px 60px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          margin-bottom: 16px;
          color: #64748b;
          font-size: 12px;
          font-weight: 650;
          text-decoration: none;
        }

        .back-link:hover {
          color: #2563eb;
        }

        .detail-card {
          padding: 25px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: white;
          box-shadow:
            0 7px 25px
            rgba(15, 23, 42, 0.045);
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .top-meta {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 10px;
        }

        .source-badge,
        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 750;
        }

        .source-badge svg {
          width: 11px;
          height: 11px;
        }

        .category-badge {
          color: #475569;
          background: #f1f5f9;
        }

        .source-screenshot {
          color: #7c3aed;
          background: #f5f3ff;
        }

        .source-pdf {
          color: #dc2626;
          background: #fef2f2;
        }

        .source-website,
        .source-link {
          color: #2563eb;
          background: #eff6ff;
        }

        .source-text {
          color: #059669;
          background: #ecfdf5;
        }

        .source-voice {
          color: #ea580c;
          background: #fff7ed;
        }

        .source-other {
          color: #475569;
          background: #f1f5f9;
        }

        .detail-header h1 {
          margin: 0;
          color: #0f172a;
          font-size: 27px;
          line-height: 1.25;
          letter-spacing: -0.03em;
        }

        .saved-text {
          margin: 7px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        .favorite {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 9px;
          border-radius: 7px;
          color: #64748b;
          background: #f8fafc;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .favorite.active {
          color: #b45309;
          background: #fffbeb;
        }

        .favorite svg {
          width: 14px;
          height: 14px;
        }

        .divider {
          height: 1px;
          margin: 21px 0;
          background: #eef2f7;
        }

        .content-section {
          margin-top: 22px;
        }

        .content-section h2 {
          margin: 0 0 8px;
          color: #334155;
          font-size: 12px;
          font-weight: 800;
        }

        .summary {
          margin: 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.7;
        }

        .content-box {
          padding: 13px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          color: #475569;
          background: #f8fafc;
          white-space: pre-wrap;
          font-size: 11px;
          line-height: 1.65;
        }

        .info-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 9px;
        }

        .info-item {
          padding: 11px;
          border-radius: 9px;
          background: #f8fafc;
        }

        .info-item span {
          display: block;
          color: #94a3b8;
          font-size: 9px;
        }

        .info-item strong {
          display: block;
          margin-top: 4px;
          color: #334155;
          font-size: 11px;
        }

        .info-item strong.danger {
          color: #dc2626;
        }

        .deadline-box {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
          padding: 12px;
          border: 1px solid #fde68a;
          border-radius: 9px;
          background: #fffbeb;
        }

        .deadline-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #b45309;
          background: #fef3c7;
        }

        .deadline-icon svg {
          width: 15px;
          height: 15px;
        }

        .deadline-box strong {
          display: block;
          color: #92400e;
          font-size: 11px;
        }

        .deadline-box p {
          margin: 2px 0 0;
          color: #b45309;
          font-size: 10px;
        }

        .source-card,
        .no-source {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          text-decoration: none;
          background: #f8fafc;
        }

        .source-card:hover {
          border-color: #bfdbfe;
          background: #eff6ff;
        }

        .source-card-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #2563eb;
          background: #dbeafe;
        }

        .source-card-icon svg,
        .source-card > svg {
          width: 14px;
          height: 14px;
        }

        .source-card > svg {
          margin-left: auto;
          color: #94a3b8;
        }

        .source-card strong,
        .no-source strong {
          display: block;
          color: #334155;
          font-size: 11px;
        }

        .source-card span,
        .no-source span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 9px;
        }

        .no-source {
          color: #94a3b8;
        }

        .no-source > svg {
          width: 20px;
          height: 20px;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 25px;
          padding-top: 17px;
          border-top: 1px solid #eef2f7;
        }

        .primary-button,
        .secondary-button,
        .delete-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 35px;
          padding: 0 12px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 750;
          text-decoration: none;
          cursor: pointer;
        }

        .primary-button {
          color: white;
          background: #2563eb;
        }

        .secondary-button {
          color: #475569;
          background: white;
          border: 1px solid #dbe2ea;
        }

        .delete-button {
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .error-box,
        .not-found {
          padding: 40px 25px;
          text-align: center;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          background: white;
        }

        .error-box h2,
        .not-found h1 {
          margin: 0;
          color: #0f172a;
          font-size: 20px;
        }

        .error-box p,
        .not-found p {
          margin: 7px 0 17px;
          color: #64748b;
          font-size: 12px;
        }

        .not-found-icon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          margin: 0 auto 13px;
          border-radius: 13px;
          color: #2563eb;
          background: #eff6ff;
        }

        .not-found-icon svg {
          width: 22px;
          height: 22px;
        }

        @media (max-width: 760px) {
          .detail-page {
            padding: 25px 17px 50px;
          }

          .detail-card {
            padding: 19px;
          }

          .detail-header {
            flex-direction: column;
          }

          .info-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .detail-header h1 {
            font-size: 23px;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .actions {
            justify-content: stretch;
          }

          .actions > * {
            flex: 1;
          }
        }

      `}</style>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="info-item">
      <span>{label}</span>

      <strong className={danger ? "danger" : ""}>
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getSourceClass(source: string) {
  const value = source.toLowerCase();

  if (value.includes("screenshot"))
    return "source-screenshot";

  if (value.includes("pdf"))
    return "source-pdf";

  if (value.includes("website"))
    return "source-website";

  if (value.includes("link"))
    return "source-link";

  if (value.includes("text"))
    return "source-text";

  if (value.includes("voice"))
    return "source-voice";

  return "source-other";
}

function getSourceIcon(source: string) {
  const value = source.toLowerCase();

  if (value.includes("pdf"))
    return <FileIcon />;

  if (
    value.includes("website") ||
    value.includes("link")
  )
    return <GlobeIcon />;

  if (value.includes("voice"))
    return <MicIcon />;

  if (value.includes("screenshot"))
    return <ImageIcon />;

  return <FileIcon />;
}

/* =========================================================
   ICONS
========================================================= */

function StarIcon({
  filled = false,
}: {
  filled?: boolean;
}) {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z"
        fill={
          filled
            ? "currentColor"
            : "none"
        }
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M7 3v4M17 3v4M3 10h18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M14 5h5v5M19 5l-8 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M6 3h8l4 4v14H6z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M14 3v5h4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="9"
        y="3"
        width="6"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="8"
        cy="9"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="m4 17 5-5 3 3 2-2 6 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}