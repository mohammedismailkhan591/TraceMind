type Attachment = {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  kind: "pdf" | "image" | "audio" | "file";
  viewUrl: string | null;
  downloadUrl: string | null;
};

function formatFileSize(bytes: number | null) {
  if (!bytes || !Number.isFinite(bytes)) return "File size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MemoryAttachments({
  attachments,
  unavailable,
}: {
  attachments: Attachment[];
  unavailable: boolean;
}) {
  return (
    <section className="detail-panel attachments-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SAVED FILES</span>
          <h2>Attachments</h2>
          <p className="section-subtitle">Private files saved with this memory.</p>
        </div>
        <span className="timeline-count">
          {attachments.length} {attachments.length === 1 ? "file" : "files"}
        </span>
      </div>
      {unavailable ? (
        <div className="attachment-empty">
          <strong>Files are unavailable right now</strong>
          <p>TraceMind could not load the saved file list. Please try again later.</p>
        </div>
      ) : attachments.length === 0 ? (
        <div className="attachment-empty">
          <strong>No files attached</strong>
          <p>This memory was saved without an uploaded file.</p>
        </div>
      ) : (
        <div className="attachment-list">
          {attachments.map((attachment) => (
            <article className="attachment-card" key={attachment.id}>
              <div className="attachment-heading">
                <span className={`attachment-icon ${attachment.kind}`}>
                  {attachment.kind === "pdf" ? "PDF" : attachment.kind === "image" ? "IMG" : attachment.kind === "audio" ? "♪" : "FILE"}
                </span>
                <div className="attachment-file-copy">
                  <h3 title={attachment.fileName}>{attachment.fileName}</h3>
                  <p>{attachment.mimeType || "Unknown file type"} · {formatFileSize(attachment.fileSize)}</p>
                </div>
              </div>
              {!attachment.viewUrl ? (
                <div className="file-unavailable">
                  <strong>File unavailable</strong>
                  <p>The saved file could not be accessed. It may have been removed from storage.</p>
                </div>
              ) : (
                <>
                  {attachment.kind === "pdf" && (
                    <iframe className="pdf-preview" src={`${attachment.viewUrl}#toolbar=0`} title={`PDF preview: ${attachment.fileName}`} />
                  )}
                  {attachment.kind === "image" && (
                    <a className="image-preview" href={attachment.viewUrl} target="_blank" rel="noreferrer" aria-label={`Open full-size preview of ${attachment.fileName}`}>
                      <img src={attachment.viewUrl} alt={attachment.fileName} />
                    </a>
                  )}
                  {attachment.kind === "audio" && (
                    <audio className="audio-player" controls preload="metadata" src={attachment.viewUrl}>
                      Your browser does not support audio playback.
                    </audio>
                  )}
                  <div className="attachment-actions">
                    {attachment.kind === "pdf" && <a className="file-button secondary" href={attachment.viewUrl} target="_blank" rel="noreferrer">Open PDF</a>}
                    {attachment.kind === "image" && <a className="file-button secondary" href={attachment.viewUrl} target="_blank" rel="noreferrer">Full-size preview</a>}
                    {attachment.kind === "file" && <a className="file-button secondary" href={attachment.viewUrl} target="_blank" rel="noreferrer">Open file</a>}
                    {attachment.downloadUrl && <a className="file-button" href={attachment.downloadUrl} download={attachment.fileName}>Download</a>}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
      <style>{`
        .attachment-list{display:grid;gap:14px}.attachment-card{min-width:0;padding:16px;border:1px solid #e5e9f2;border-radius:14px;background:#fff}.attachment-heading{display:flex;align-items:center;gap:12px;margin-bottom:13px}.attachment-icon{width:42px;height:42px;flex:none;display:grid;place-items:center;border-radius:12px;background:#f0edff;color:#6958d8;font-size:10px;font-weight:850;letter-spacing:.03em}.attachment-icon.image{background:#f1eaff;color:#7847c5}.attachment-icon.audio{background:#f7efff;color:#7953bc;font-size:19px}.attachment-icon.pdf{background:#fff0f0;color:#bf3f4e}.attachment-file-copy{min-width:0}.attachment-file-copy h3{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#253653;font-size:12px;font-weight:800}.attachment-file-copy p{margin-top:5px;color:#8995a9;font-size:10px;overflow-wrap:anywhere}.pdf-preview{display:block;width:100%;height:min(68vh,680px);min-height:300px;border:1px solid #e6eaf1;border-radius:10px;background:#f7f8fb}.image-preview{display:flex;justify-content:center;align-items:center;max-height:600px;min-height:120px;overflow:hidden;padding:10px;border:1px solid #edf0f5;border-radius:10px;background:#f8f9fc}.image-preview img{display:block;max-width:100%;max-height:560px;width:auto;height:auto;object-fit:contain}.audio-player{display:block;width:100%;margin:12px 0}.attachment-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:13px}.file-button{display:inline-flex;min-height:38px;align-items:center;justify-content:center;padding:0 14px;border:1px solid #6857df;border-radius:9px;background:#6654e9;color:#fff;text-decoration:none;font-size:11px;font-weight:800}.file-button:hover{background:#5141cc}.file-button.secondary{border-color:#e3e6ef;background:#fff;color:#26334d}.file-button.secondary:hover{border-color:#c9c2f4;background:#f8f6ff}.attachment-empty,.file-unavailable{padding:15px;border:1px dashed #dbe2ef;border-radius:11px;background:#fbfcff}.attachment-empty strong,.file-unavailable strong{color:#425773;font-size:12px}.attachment-empty p,.file-unavailable p{margin-top:6px;color:#8794a9;font-size:11px;line-height:1.65}.file-unavailable{margin-top:10px;border-color:#f0d9d9;background:#fffafa}.file-unavailable strong{color:#9b3e45}
        @media(max-width:600px){.attachment-card{padding:12px}.pdf-preview{height:58vh;min-height:250px}.file-button{flex:1}.image-preview{padding:6px}}
      `}</style>
    </section>
  );
}
