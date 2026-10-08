"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createClient } from "../../lib/supabase";

type CaptureType = "image" | "pdf" | "link" | "text" | "voice";

const captureOptions: Array<{
  type: CaptureType;
  icon: string;
  title: string;
  description: string;
  accept?: string;
}> = [
  {
    type: "image",
    icon: "⌁",
    title: "Screenshot",
    description: "Images from anywhere",
    accept: "image/png,image/jpeg,image/webp",
  },
  {
    type: "pdf",
    icon: "▤",
    title: "PDF",
    description: "Documents & files",
    accept: "application/pdf",
  },
  {
    type: "link",
    icon: "↗",
    title: "Link",
    description: "Websites & posts",
  },
  {
    type: "text",
    icon: "T",
    title: "Text",
    description: "Notes & messages",
  },
  {
    type: "voice",
    icon: "◉",
    title: "Voice",
    description: "Record a voice note",
  },
];

const categories = [
  "Tech",
  "Hackathons",
  "Jobs",
  "Courses",
  "Events",
  "Articles",
  "Scholarships",
  "Messages",
  "Other",
];

export default function Capture() {
  const supabase = createClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);

  const [captureType, setCaptureType] =
    useState<CaptureType>("image");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  function resetStatus() {
    setStatus(null);
  }

  function stopRecordingTimer() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  function clearRecording() {
    stopRecordingTimer();

    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // Recorder may already have stopped.
      }
    }

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setRecording(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
  }

  function changeType(type: CaptureType) {
    if (recording) {
      stopRecording();
    }

    setCaptureType(type);
    setFile(null);
    setLink("");
    setText("");
    clearRecording();
    resetStatus();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function selectFile(selected: File | null) {
    if (!selected) return;

    setFile(selected);
    resetStatus();

    if (!title.trim()) {
      setTitle(
        selected.name.replace(/\.[^/.]+$/, "")
      );
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    selectFile(event.target.files?.[0] ?? null);
  }

  function isValidFile(selected: File) {
    if (captureType === "image") {
      return selected.type.startsWith("image/");
    }

    if (captureType === "pdf") {
      return selected.type === "application/pdf";
    }

    return false;
  }

  async function startRecording() {
    resetStatus();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Voice recording is not supported by this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mimeType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
      });

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(
          audioChunksRef.current,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        const newAudioUrl =
          URL.createObjectURL(blob);

        if (audioUrlRef.current) {
          URL.revokeObjectURL(
            audioUrlRef.current
          );
        }

        audioUrlRef.current =
          newAudioUrl;

        setAudioBlob(blob);
        setAudioUrl(newAudioUrl);
        setRecording(false);

        stream
          .getTracks()
          .forEach((track) => track.stop());

        stopRecordingTimer();
        mediaRecorderRef.current = null;
      };

      recorder.onerror = () => {
        stream
          .getTracks()
          .forEach((track) => track.stop());

        stopRecordingTimer();

        setRecording(false);

        setStatus({
          type: "error",
          text: "The recording could not be started. Please try again.",
        });
      };

      recorder.start();

      mediaRecorderRef.current = recorder;

      setRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingTime(
            (previous) => previous + 1
          );
        }, 1000);
    } catch (error) {
      const err =
        error as DOMException;

      let message =
        "Could not access your microphone.";

      if (
        err?.name ===
        "NotAllowedError"
      ) {
        message =
          "Microphone permission was denied. Allow microphone access for localhost and try again.";
      } else if (
        err?.name ===
        "NotFoundError"
      ) {
        message =
          "No microphone was found on this device.";
      } else if (
        err?.name ===
        "NotReadableError"
      ) {
        message =
          "Your microphone is being used by another application.";
      } else if (
        error instanceof Error &&
        error.message
      ) {
        message = error.message;
      }

      setStatus({
        type: "error",
        text: message,
      });
    }
  }

  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;

    stopRecordingTimer();

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    } else {
      setRecording(false);
    }
  }

  function formatRecordingTime(
    seconds: number
  ) {
    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  /**
   * Get the authenticated user safely.
   *
   * First use the existing browser session.
   * If the session is not available, ask Supabase
   * to refresh it.
   */
  async function getAuthenticatedUser() {
    const {
      data: sessionData,
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (
      sessionData?.session?.user
    ) {
      return sessionData.session.user;
    }

    const {
      data: refreshData,
      error: refreshError,
    } =
      await supabase.auth.refreshSession();

    if (
      refreshData?.session?.user
    ) {
      return refreshData.session.user;
    }

    if (refreshError) {
      throw new Error(
        `Your login session could not be restored. ${refreshError.message}`
      );
    }

    if (sessionError) {
      throw new Error(
        `Your login session could not be read. ${sessionError.message}`
      );
    }

    throw new Error(
      "Your TraceMind login session is missing. Please log in again."
    );
  }

  async function saveMemory() {
    resetStatus();

    if (!title.trim()) {
      setStatus({
        type: "error",
        text: "Give this memory a short title first.",
      });
      return;
    }

    if (
      (captureType === "image" ||
        captureType === "pdf") &&
      !file
    ) {
      setStatus({
        type: "error",
        text: "Choose a file before saving.",
      });
      return;
    }

    if (
      file &&
      !isValidFile(file)
    ) {
      setStatus({
        type: "error",
        text:
          captureType === "pdf"
            ? "Please choose a PDF file."
            : "Please choose an image file.",
      });
      return;
    }

    if (
      captureType === "link" &&
      !link.trim()
    ) {
      setStatus({
        type: "error",
        text:
          "Paste the link you want TraceMind to remember.",
      });
      return;
    }

    if (
      captureType === "text" &&
      !text.trim()
    ) {
      setStatus({
        type: "error",
        text:
          "Add some text before saving.",
      });
      return;
    }

    if (
      captureType === "voice" &&
      !audioBlob
    ) {
      setStatus({
        type: "error",
        text:
          "Record a voice note before saving.",
      });
      return;
    }

    setLoading(true);

    try {
      /*
       * IMPORTANT:
       * Get the user from the current Supabase
       * session before inserting anything.
       */
      const user =
        await getAuthenticatedUser();

      /*
       * Create the memory record.
       */
      const {
        data: memory,
        error: memoryError,
      } =
        await supabase
          .from("memories")
          .insert({
            user_id: user.id,
            title: title.trim(),
            category,
            source_type: captureType,

            source_url:
              captureType === "link"
                ? link.trim()
                : null,

            content:
              captureType === "text"
                ? text.trim()
                : null,

            summary: null,

            metadata: {
              capture_type:
                captureType,

              processing_status:
                captureType ===
                  "text" ||
                captureType ===
                  "link"
                  ? "ready"
                  : "pending",
            },
          })
          .select("id")
          .single();

      if (memoryError) {
        throw new Error(
          memoryError.message
        );
      }

      if (!memory) {
        throw new Error(
          "TraceMind could not create the memory record."
        );
      }

      /*
       * Screenshot / PDF / Voice upload.
       */
      if (
        file ||
        audioBlob
      ) {
        const uploadFile =
          file ??
          new File(
            [audioBlob!],
            `voice-${Date.now()}.webm`,
            {
              type:
                audioBlob!.type ||
                "audio/webm",
            }
          );

        const cleanName =
          uploadFile.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          );

        const storagePath =
          `${user.id}/${Date.now()}-${cleanName}`;

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              "memory-assets"
            )
            .upload(
              storagePath,
              uploadFile,
              {
                contentType:
                  uploadFile.type ||
                  "application/octet-stream",
                upsert: false,
              }
            );

        if (uploadError) {
          await supabase
            .from("memories")
            .delete()
            .eq(
              "id",
              memory.id
            );

          const raw =
            uploadError.message.toLowerCase();

          if (
            raw.includes("bucket") &&
            raw.includes("not found")
          ) {
            throw new Error(
              "The memory-assets storage bucket could not be found."
            );
          }

          throw new Error(
            `Upload failed: ${uploadError.message}`
          );
        }

        /*
         * Save the uploaded file information.
         */
        const {
          error: assetError,
        } =
          await supabase
            .from("memory_assets")
            .insert({
              memory_id:
                memory.id,

              user_id:
                user.id,

              storage_path:
                storagePath,

              file_name:
                uploadFile.name,

              mime_type:
                uploadFile.type,

              file_size:
                uploadFile.size,
            });

        if (assetError) {
          await supabase.storage
            .from(
              "memory-assets"
            )
            .remove([
              storagePath,
            ]);

          await supabase
            .from("memories")
            .delete()
            .eq(
              "id",
              memory.id
            );

          throw new Error(
            `File record could not be saved: ${assetError.message}`
          );
        }
      }

      /*
       * Success.
       */
      setStatus({
        type: "success",
        text:
          "Saved. This memory is now part of your TraceMind library.",
      });

      setTitle("");
      setCategory("Other");
      setLink("");
      setText("");
      setFile(null);

      clearRecording();

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong while saving.",
      });
    } finally {
      setLoading(false);
    }
  }

  /*
   * Cleanup only when the Capture page
   * actually unmounts.
   */
  useEffect(() => {
    return () => {
      stopRecordingTimer();

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state !==
          "inactive"
      ) {
        try {
          recorder.stop();
        } catch {
          // Already stopped.
        }
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(
          audioUrlRef.current
        );
      }
    };
  }, []);

  const activeOption =
    captureOptions.find(
      (option) =>
        option.type === captureType
    )!;

  return (
      <div className="capture-page">
        <header className="capture-hero">
          <div>
            <div className="capture-kicker">
              CAPTURE
            </div>

            <h1>
              Save it before you forget it.
            </h1>

            <p>
              Bring information into
              TraceMind. We'll keep the
              original and make it easier
              to find later.
            </p>
          </div>

          <div className="capture-badge">
            <span>●</span>
            Private by default
          </div>
        </header>

        <section className="capture-workspace">
          <div className="capture-main">
            <div className="section-heading">
              <div>
                <span>01</span>

                <h2>
                  Choose what you're saving
                </h2>
              </div>

              <p>
                Start with the format that
                matches what you have.
              </p>
            </div>

            <div className="capture-options">
              {captureOptions.map(
                (option) => (
                  <button
                    key={option.type}
                    type="button"
                    className={`capture-option ${
                      captureType ===
                      option.type
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      changeType(
                        option.type
                      )
                    }
                  >
                    <span className="option-icon">
                      {option.icon}
                    </span>

                    <span className="option-copy">
                      <strong>
                        {option.title}
                      </strong>

                      <small>
                        {option.description}
                      </small>
                    </span>

                    <span className="option-arrow">
                      →
                    </span>
                  </button>
                )
              )}
            </div>

            <div className="section-heading second">
              <div>
                <span>02</span>

                <h2>
                  Add the memory
                </h2>
              </div>

              <p>
                A little context makes
                future search much smarter.
              </p>
            </div>

            <div className="form-grid">
              <label className="field full">
                <span>
                  Memory title
                </span>

                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  placeholder="Give it a name you'll recognize later"
                />
              </label>

              <label className="field">
                <span>
                  Category
                </span>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                >
                  {categories.map(
                    (item) => (
                      <option
                        key={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="field">
                <span>
                  Format
                </span>

                <div className="format-pill">
                  <span>
                    {
                      activeOption.icon
                    }
                  </span>

                  {
                    activeOption.title
                  }
                </div>
              </div>
            </div>

            {(captureType ===
              "image" ||
              captureType ===
                "pdf") && (
              <div
                className={`dropzone ${
                  dragging
                    ? "dragging"
                    : ""
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() =>
                  setDragging(false)
                }
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);

                  const dropped =
                    e.dataTransfer.files?.[0];

                  if (
                    dropped &&
                    isValidFile(
                      dropped
                    )
                  ) {
                    selectFile(
                      dropped
                    );
                  } else {
                    setStatus({
                      type: "error",
                      text:
                        captureType ===
                        "pdf"
                          ? "Drop a PDF file here."
                          : "Drop an image file here.",
                    });
                  }
                }}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept={
                    activeOption.accept
                  }
                  onChange={
                    handleFileChange
                  }
                />

                {file ? (
                  <>
                    <div className="file-mark">
                      ✓
                    </div>

                    <strong>
                      {file.name}
                    </strong>

                    <small>
                      {(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB · Ready to
                      save
                    </small>

                    <button
                      type="button"
                      className="change-file"
                      onClick={(e) => {
                        e.stopPropagation();

                        fileInputRef.current?.click();
                      }}
                    >
                      Choose another
                    </button>
                  </>
                ) : (
                  <>
                    <div className="upload-mark">
                      ↑
                    </div>

                    <strong>
                      Drop your{" "}
                      {captureType ===
                      "pdf"
                        ? "PDF"
                        : "image"}{" "}
                      here
                    </strong>

                    <small>
                      or click to browse
                      your device
                    </small>
                  </>
                )}
              </div>
            )}

            {captureType ===
              "link" && (
              <label className="field block">
                <span>
                  Website or post URL
                </span>

                <input
                  type="url"
                  value={link}
                  onChange={(e) =>
                    setLink(
                      e.target.value
                    )
                  }
                  placeholder="https://..."
                />
              </label>
            )}

            {captureType ===
              "text" && (
              <label className="field block">
                <span>
                  Information
                </span>

                <textarea
                  rows={8}
                  value={text}
                  onChange={(e) =>
                    setText(
                      e.target.value
                    )
                  }
                  placeholder="Paste the message, note, quote or details you want to remember..."
                />
              </label>
            )}

            {captureType ===
              "voice" && (
              <div className="voice-recorder">
                <div
                  className={`voice-orb ${
                    recording
                      ? "recording"
                      : ""
                  }`}
                >
                  {recording
                    ? "●"
                    : "🎙"}
                </div>

                <div className="voice-time">
                  {formatRecordingTime(
                    recordingTime
                  )}
                </div>

                {!recording &&
                  !audioUrl && (
                    <>
                      <strong>
                        Record a voice note
                      </strong>

                      <small>
                        Speak naturally.
                        You can review it
                        before saving.
                      </small>

                      <button
                        type="button"
                        className="voice-button"
                        onClick={
                          startRecording
                        }
                      >
                        ● Start recording
                      </button>
                    </>
                  )}

                {recording && (
                  <>
                    <strong>
                      Recording…
                    </strong>

                    <small>
                      TraceMind is
                      listening.
                    </small>

                    <button
                      type="button"
                      className="voice-button stop"
                      onClick={
                        stopRecording
                      }
                    >
                      ■ Stop recording
                    </button>
                  </>
                )}

                {audioUrl &&
                  !recording && (
                    <>
                      <strong>
                        Voice note ready
                      </strong>

                      <small>
                        Listen before
                        saving.
                      </small>

                      <audio
                        className="voice-player"
                        controls
                        src={audioUrl}
                      />

                      <button
                        type="button"
                        className="voice-again"
                        onClick={
                          clearRecording
                        }
                      >
                        Record again
                      </button>
                    </>
                  )}
              </div>
            )}

            {status && (
              <div
                className={`status ${status.type}`}
              >
                {status.type ===
                "success"
                  ? "✓"
                  : "!"}

                <span>
                  {status.text}
                </span>
              </div>
            )}

            <div className="save-row">
              <p>
                Your original file stays
                private to your account.
              </p>

              <button
                type="button"
                onClick={
                  saveMemory
                }
                disabled={
                  loading ||
                  recording
                }
              >
                {loading
                  ? "Saving…"
                  : "Save memory →"}
              </button>
            </div>
          </div>

          <aside className="capture-side">
            <div className="side-top">
              <span className="spark">
                ✦
              </span>

              <span>
                TRACE MIND
              </span>
            </div>

            <h3>
              Capture once.
              <br />
              <em>
                Find it when you need it.
              </em>
            </h3>

            <p>
              Every memory keeps its
              original source while becoming
              ready for smarter search and AI
              understanding.
            </p>

            <div className="side-list">
              <div>
                <b>01</b>

                <span>
                  <strong>
                    Keep the original
                  </strong>

                  <small>
                    Your source stays
                    attached to the memory.
                  </small>
                </span>
              </div>

              <div>
                <b>02</b>

                <span>
                  <strong>
                    Understand the details
                  </strong>

                  <small>
                    AI can extract names,
                    dates, topics and more.
                  </small>
                </span>
              </div>

              <div>
                <b>03</b>

                <span>
                  <strong>
                    Search by what you
                    remember
                  </strong>

                  <small>
                    You don't need the exact
                    words.
                  </small>
                </span>
              </div>
            </div>

            <div className="privacy-note">
              <span>◉</span>

              <div>
                <strong>
                  Private by default
                </strong>

                <small>
                  Your files are stored in
                  your account's private
                  space.
                </small>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <style jsx>{`
        .capture-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 36px 28px 70px;
          color: #171827;
        }

        .capture-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 30px;
          margin-bottom: 28px;
        }

        .capture-kicker {
          font-size: 11px;
          letter-spacing: 0.18em;
          font-weight: 800;
          color: #6c5ce7;
          margin-bottom: 9px;
        }

        .capture-hero h1 {
          font-size: 42px;
          line-height: 1.06;
          letter-spacing: -0.045em;
          margin: 0 0 10px;
        }

        .capture-hero p {
          margin: 0;
          max-width: 650px;
          color: #72758a;
          line-height: 1.6;
          font-size: 15px;
        }

        .capture-badge {
          border: 1px solid #e7e7ee;
          background: #fff;
          border-radius: 999px;
          padding: 9px 13px;
          font-size: 12px;
          color: #606275;
          white-space: nowrap;
        }

        .capture-badge span {
          color: #2e9b72;
          margin-right: 6px;
        }

        .capture-workspace {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 22px;
        }

        .capture-main,
        .capture-side {
          background: #fff;
          border: 1px solid #e7e7ee;
          border-radius: 22px;
        }

        .capture-main {
          padding: 28px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-end;
          margin-bottom: 15px;
        }

        .section-heading > div {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .section-heading span {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #8b8da0;
        }

        .section-heading h2 {
          font-size: 16px;
          margin: 0;
        }

        .section-heading > p {
          font-size: 12px;
          color: #9698a7;
          margin: 0;
        }

        .section-heading.second {
          margin-top: 31px;
        }

        .capture-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .capture-option {
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          border: 1px solid #e8e8ef;
          background: #fbfbfd;
          border-radius: 15px;
          padding: 14px;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .capture-option:hover {
          border-color: #c9c4fa;
          transform: translateY(-1px);
        }

        .capture-option.selected {
          border-color: #8b7df0;
          background: #f7f5ff;
          box-shadow: 0 0 0 3px #eeeaff;
        }

        .option-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #fff;
          border: 1px solid #ececf2;
          font-weight: 700;
          color: #6556d9;
          flex-shrink: 0;
        }

        .option-copy {
          display: grid;
          gap: 3px;
          flex: 1;
        }

        .option-copy strong {
          font-size: 13px;
        }

        .option-copy small {
          font-size: 11px;
          color: #8a8c9b;
        }

        .option-arrow {
          color: #aaa;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .field {
          display: grid;
          gap: 7px;
        }

        .field.full,
        .field.block {
          grid-column: 1 / -1;
        }

        .field > span {
          font-size: 11px;
          font-weight: 700;
          color: #515366;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #e2e2ea;
          background: #fff;
          border-radius: 11px;
          padding: 12px 13px;
          font: inherit;
          font-size: 13px;
          color: #222334;
          outline: none;
        }

        .field textarea {
          resize: vertical;
          line-height: 1.55;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #9a90ed;
          box-shadow: 0 0 0 3px #f0eeff;
        }

        .format-pill {
          height: 42px;
          box-sizing: border-box;
          border: 1px solid #e7e7ee;
          border-radius: 11px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 13px;
          font-size: 13px;
          color: #55576a;
          background: #fafafd;
        }

        .format-pill span {
          color: #6758db;
        }

        .dropzone {
          margin-top: 14px;
          border: 1.5px dashed #d7d6e4;
          background: #fbfbfe;
          border-radius: 16px;
          min-height: 178px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .dropzone.dragging {
          border-color: #7769df;
          background: #f5f3ff;
        }

        .upload-mark,
        .file-mark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #f0eeff;
          color: #6758dc;
          font-size: 20px;
          margin-bottom: 10px;
        }

        .file-mark {
          background: #eaf8f2;
          color: #2e9b72;
        }

        .dropzone strong {
          font-size: 13px;
        }

        .dropzone small {
          font-size: 11px;
          color: #8d8f9e;
          margin-top: 5px;
        }

        .change-file {
          border: 0;
          background: none;
          color: #6658d9;
          font-size: 11px;
          font-weight: 700;
          margin-top: 9px;
          cursor: pointer;
        }

        .voice-recorder {
          margin-top: 14px;
          border: 1px solid #e3e3eb;
          background: #fbfbfe;
          border-radius: 18px;
          min-height: 260px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .voice-orb {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #f0eeff;
          color: #6758dc;
          font-size: 25px;
          margin-bottom: 15px;
          transition: 0.2s ease;
        }

        .voice-orb.recording {
          background: #fff0f0;
          color: #d64545;
          box-shadow: 0 0 0 10px rgba(214, 69, 69, 0.08);
          animation: recordingPulse 1.5s infinite;
        }

        @keyframes recordingPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(214, 69, 69, 0.18);
          }

          70% {
            box-shadow: 0 0 0 12px rgba(214, 69, 69, 0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(214, 69, 69, 0);
          }
        }

        .voice-time {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: 0.04em;
          margin-bottom: 10px;
          color: #171827;
        }

        .voice-recorder strong {
          font-size: 14px;
        }

        .voice-recorder small {
          color: #8d8f9e;
          font-size: 11px;
          margin-top: 5px;
        }

        .voice-button {
          margin-top: 18px;
          border: 0;
          background: #171827;
          color: #fff;
          border-radius: 11px;
          padding: 12px 20px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .voice-button:hover {
          opacity: 0.9;
        }

        .voice-button.stop {
          background: #c93f3f;
        }

        .voice-player {
          width: min(100%, 420px);
          margin-top: 18px;
        }

        .voice-again {
          margin-top: 12px;
          border: 1px solid #dedee7;
          background: #fff;
          color: #55576a;
          border-radius: 10px;
          padding: 9px 14px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .voice-again:hover {
          background: #f7f7fa;
        }

        .status {
          margin-top: 14px;
          padding: 11px 13px;
          border-radius: 11px;
          display: flex;
          gap: 9px;
          align-items: flex-start;
          font-size: 12px;
          line-height: 1.5;
        }

        .status.success {
          background: #edf9f3;
          color: #207a58;
        }

        .status.error {
          background: #fff2f2;
          color: #ae3434;
        }

        .save-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #ededf2;
        }

        .save-row p {
          font-size: 11px;
          color: #9092a1;
          margin: 0;
        }

        .save-row button {
          border: 0;
          background: #171827;
          color: #fff;
          border-radius: 11px;
          padding: 12px 18px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .save-row button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .capture-side {
          padding: 25px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            145deg,
            #1a1a2a,
            #202034
          );
        }

        .capture-side:after {
          content: "";
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          right: -120px;
          top: -90px;
          background: rgba(
            131,
            115,
            244,
            0.13
          );
        }

        .side-top {
          display: flex;
          gap: 8px;
          align-items: center;
          color: #a9a6bb;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.15em;
        }

        .spark {
          color: #aaa0ff;
          font-size: 14px;
        }

        .capture-side h3 {
          color: #fff;
          font-size: 25px;
          line-height: 1.12;
          letter-spacing: -0.035em;
          margin: 45px 0 13px;
        }

        .capture-side h3 em {
          font-style: normal;
          color: #aaa0ff;
        }

        .capture-side > p {
          color: #aaaaba;
          font-size: 12px;
          line-height: 1.6;
          margin: 0;
        }

        .side-list {
          margin-top: 31px;
          display: grid;
          gap: 19px;
        }

        .side-list > div {
          display: flex;
          gap: 12px;
        }

        .side-list b {
          font-size: 10px;
          color: #7f77bd;
          padding-top: 2px;
        }

        .side-list span {
          display: grid;
          gap: 3px;
        }

        .side-list strong {
          color: #eeeef4;
          font-size: 11px;
        }

        .side-list small {
          color: #9292a5;
          font-size: 10px;
          line-height: 1.45;
        }

        .privacy-note {
          margin-top: 30px;
          border: 1px solid rgba(
            255,
            255,
            255,
            0.08
          );
          background: rgba(
            255,
            255,
            255,
            0.035
          );
          border-radius: 12px;
          padding: 11px;
          display: flex;
          gap: 9px;
        }

        .privacy-note > span {
          color: #83d2ae;
          font-size: 12px;
        }

        .privacy-note div {
          display: grid;
          gap: 3px;
        }

        .privacy-note strong {
          color: #e8e8ef;
          font-size: 10px;
        }

        .privacy-note small {
          color: #88899a;
          font-size: 9px;
          line-height: 1.4;
        }

        @media (max-width: 900px) {
          .capture-workspace {
            grid-template-columns: 1fr;
          }

          .capture-side {
            min-height: 350px;
          }
        }

        @media (max-width: 620px) {
          .capture-page {
            padding: 24px 15px 50px;
          }

          .capture-hero {
            display: block;
          }

          .capture-badge {
            display: inline-block;
            margin-top: 16px;
          }

          .capture-hero h1 {
            font-size: 34px;
          }

          .capture-main {
            padding: 19px;
          }

          .capture-options {
            grid-template-columns: 1fr;
          }

          .section-heading {
            display: block;
          }

          .section-heading > p {
            margin-top: 5px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .capture-side {
            padding: 22px;
          }

          .voice-recorder {
            padding: 22px;
          }
        }
      `}</style>
  );
}