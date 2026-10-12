
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

type CaptureType = "image" | "pdf" | "link" | "text" | "voice";

type Memory = {
  id: string;
  title: string | null;
  summary: string | null;
  content: string | null;
  category: string | null;
  source_type: string | null;
  source_url: string | null;
  created_at: string | null;
  deadline: string | null;
  is_favorite: boolean | null;
};

type CaptureOption = {
  type: CaptureType;
  icon: string;
  title: string;
  description: string;
  accept?: string;
};

const captureOptions: CaptureOption[] = [
  {
    type: "image",
    icon: "▧",
    title: "Screenshot",
    description: "Capture anything on screen",
    accept: "image/png,image/jpeg,image/webp",
  },
  {
    type: "pdf",
    icon: "▤",
    title: "PDF document",
    description: "Documents, reports and files",
    accept: "application/pdf",
  },
  {
    type: "link",
    icon: "↗",
    title: "Web link",
    description: "Websites, articles and posts",
  },
  {
    type: "text",
    icon: "T",
    title: "Text note",
    description: "Messages, ideas and notes",
  },
  {
    type: "voice",
    icon: "◉",
    title: "Voice note",
    description: "Record or upload audio",
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

function formatRecordingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function getFileExtension(file: File) {
  const nameExtension = file.name.split(".").pop();

  if (nameExtension && nameExtension !== file.name) {
    return nameExtension.toLowerCase();
  }

  const mime = file.type.toLowerCase();

  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mp4")) return "m4a";

  return "webm";
}

export default function CapturePage() {
  const router = useRouter();

  const [supabase] = useState(() => createClient());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [captureType, setCaptureType] =
    useState<CaptureType>("image");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [deadline, setDeadline] = useState("");
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [isImportant, setIsImportant] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [sessionChecked, setSessionChecked] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const activeOption =
    captureOptions.find((option) => option.type === captureType) ??
    captureOptions[0];

  const resetStatus = useCallback(() => {
    setStatus(null);
  }, []);

  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const stopMicrophoneTracks = useCallback(() => {
    recordingStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    recordingStreamRef.current = null;
  }, []);

  const clearAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setAudioUrl(null);
  }, []);

  const clearRecording = useCallback(() => {
    stopRecordingTimer();

    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.stop();
      } catch {
        // The recorder may already have stopped.
      }
    }

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];

    stopMicrophoneTracks();
    clearAudioUrl();

    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }

    setRecording(false);
    setRecordingTime(0);
    setAudioBlob(null);
  }, [clearAudioUrl, stopMicrophoneTracks, stopRecordingTimer]);

  useEffect(() => {
    mountedRef.current = true;

    let active = true;

    async function checkSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!active) return;

        if (error) {
          console.error("Capture session error:", error.message);
          setSignedIn(false);
        } else {
          setSignedIn(Boolean(session?.user));
        }
      } catch (error) {
        console.error("Could not check capture session:", error);

        if (active) {
          setSignedIn(false);
        }
      } finally {
        if (active) {
          setSessionChecked(true);
        }
      }
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT") {
        setSignedIn(false);
      } else if (session?.user) {
        setSignedIn(true);
      }
    });

    return () => {
      active = false;
      mountedRef.current = false;

      subscription.unsubscribe();
      stopRecordingTimer();
      stopMicrophoneTracks();

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Already stopped.
        }
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [supabase, stopMicrophoneTracks, stopRecordingTimer]);

  function changeType(type: CaptureType) {
    if (recording) {
      stopRecording();
    }

    clearRecording();

    setCaptureType(type);
    setFile(null);
    setLink("");
    setText("");
    setSummary("");
    setDeadline("");
    setAiTags([]);
    setIsImportant(false);
    resetStatus();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function selectFile(selected: File | null) {
    if (!selected) return;

    const validImage = selected.type.startsWith("image/");
    const validPdf = selected.type === "application/pdf";

    if (
      (captureType === "image" && !validImage) ||
      (captureType === "pdf" && !validPdf)
    ) {
      setStatus({
        type: "error",
        text:
          captureType === "pdf"
            ? "Choose a valid PDF document."
            : "Choose a PNG, JPEG or WebP image.",
      });

      return;
    }

    setFile(selected);
    resetStatus();

    if (!title.trim()) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
  }

  function handleAudioFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected = event.target.files?.[0] ?? null;

    if (!selected) return;

    const validAudio =
      selected.type.startsWith("audio/") ||
      /\.(mp3|wav|m4a|aac|ogg|webm|mp4)$/i.test(selected.name);

    if (!validAudio) {
      setStatus({
        type: "error",
        text: "Choose an MP3, WAV, M4A, AAC, OGG or WebM audio file.",
      });

      return;
    }

    const objectUrl = URL.createObjectURL(selected);

    clearAudioUrl();

    audioUrlRef.current = objectUrl;

    setAudioBlob(selected);
    setAudioUrl(objectUrl);
    setRecording(false);
    stopRecordingTimer();
    stopMicrophoneTracks();
    resetStatus();

    if (!title.trim()) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    const dropped = event.dataTransfer.files?.[0];

    if (dropped) {
      selectFile(dropped);
    }
  }

  async function startRecording() {
    resetStatus();

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus({
        type: "error",
        text: "Voice recording requires a supported browser and a secure connection. Try localhost or HTTPS.",
      });

      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setStatus({
        type: "error",
        text: "Your browser does not support voice recording.",
      });

      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      recordingStreamRef.current = stream;

      let mimeType = "";

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];

      for (const candidate of preferredTypes) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          mimeType = candidate;
          break;
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        stopMicrophoneTracks();
        stopRecordingTimer();

        if (blob.size === 0) {
          setStatus({
            type: "error",
            text: "The recording is empty. Please record again.",
          });

          setRecording(false);
          mediaRecorderRef.current = null;

          return;
        }

        clearAudioUrl();

        const objectUrl = URL.createObjectURL(blob);

        audioUrlRef.current = objectUrl;

        setAudioBlob(blob);
        setAudioUrl(objectUrl);
        setRecording(false);
        mediaRecorderRef.current = null;

        if (!title.trim()) {
          setTitle(`Voice note ${new Date().toLocaleDateString()}`);
        }
      };

      recorder.onerror = () => {
        stopMicrophoneTracks();
        stopRecordingTimer();

        setRecording(false);

        setStatus({
          type: "error",
          text: "Recording failed. Please check your microphone and try again.",
        });
      };

      recorder.start();

      mediaRecorderRef.current = recorder;

      setRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((previous) => previous + 1);
      }, 1000);
    } catch (error) {
      const err = error as DOMException;

      let message = "Could not access your microphone.";

      if (err?.name === "NotAllowedError") {
        message =
          "Microphone permission was denied. Allow microphone access in your browser settings.";
      } else if (err?.name === "NotFoundError") {
        message = "No microphone was found on this device.";
      } else if (err?.name === "NotReadableError") {
        message =
          "Your microphone may be in use by another application.";
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }

      stopMicrophoneTracks();
      stopRecordingTimer();

      setStatus({
        type: "error",
        text: message,
      });
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    stopRecordingTimer();

    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        setRecording(false);
        stopMicrophoneTracks();
      }
    } else {
      setRecording(false);
      stopMicrophoneTracks();
    }
  }

  async function getAuthenticatedUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw new Error(
        `Could not verify your login session: ${error.message}`
      );
    }

    if (!user) {
      throw new Error(
        "Your TraceMind session has expired. Please sign in again."
      );
    }

    return user;
  }

  function createSourceFile(): File | null {
    if (file) return file;
    if (!audioBlob) return null;

    if (audioBlob instanceof File) {
      return audioBlob;
    }

    return new File(
      [audioBlob],
      `voice-${Date.now()}.${audioBlob.type.includes("mp4") ? "m4a" : "webm"}`,
      {
        type: audioBlob.type || "audio/webm",
      }
    );
  }

  async function analyzeWithAI() {
    if (aiLoading || loading) return;

    resetStatus();

    const originalText = text;
    const originalLink = link;

    if (
      !file &&
      !originalText.trim() &&
      !originalLink.trim() &&
      !audioBlob
    ) {
      setStatus({
        type: "error",
        text: "Add text, a link, an image, a PDF or a voice note before using AI analysis.",
      });

      return;
    }

    const sourceFile = createSourceFile();

    if (sourceFile && sourceFile.size > 8 * 1024 * 1024) {
      setStatus({
        type: "error",
        text: "For AI analysis, choose a file smaller than 8 MB. You can still save it without AI analysis.",
      });

      return;
    }

    setAiLoading(true);

    try {
      let fileBase64 = "";
      let mimeType = "";

      if (sourceFile) {
        mimeType = (sourceFile.type || "application/octet-stream")
          .split(";")[0]
          .trim();

        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            const result = String(reader.result ?? "");

            resolve(
              result.includes(",")
                ? result.slice(result.indexOf(",") + 1)
                : result
            );
          };

          reader.onerror = () => {
            reject(new Error("Could not read the selected file."));
          };

          reader.readAsDataURL(sourceFile);
        });
      }

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          captureType,
          text: originalText,
          link: originalLink,
          fileBase64,
          mimeType,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `AI analysis failed with status ${response.status}.`
        );
      }

      if (result.title) setTitle(result.title);
      if (result.category) {
        const matchingCategory = categories.find(
          (item) =>
            item.toLowerCase() ===
            String(result.category).toLowerCase()
        );

        setCategory(matchingCategory ?? "Other");
      }

      if (result.summary) setSummary(result.summary);

      if (Array.isArray(result.tags)) {
        setAiTags(
          result.tags.filter(
            (tag: unknown): tag is string =>
              typeof tag === "string"
          )
        );
      }

      if (typeof result.isImportant === "boolean") {
        setIsImportant(result.isImportant);
      }

      if (result.deadlineISO) {
        const date = new Date(result.deadlineISO);

        if (!Number.isNaN(date.getTime())) {
          const local = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
          );

          setDeadline(local.toISOString().slice(0, 16));
        }
      }

      if (
        !originalText.trim() &&
        captureType !== "text" &&
        typeof result.extractedText === "string" &&
        result.extractedText.trim()
      ) {
        setText(result.extractedText);
      }

      setStatus({
        type: "success",
        text: "AI analysis is complete. Review the suggestions before saving your memory.",
      });
    } catch (error) {
      console.error("TraceMind AI analysis error:", error);

      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "AI analysis failed. Please try again.",
      });
    } finally {
      setAiLoading(false);
    }
  }

  async function saveMemory() {
    if (loading || aiLoading) return;

    resetStatus();

    if (!title.trim()) {
      setStatus({
        type: "error",
        text: "Give this memory a title before saving.",
      });

      return;
    }

    if (
      (captureType === "image" || captureType === "pdf") &&
      !file
    ) {
      setStatus({
        type: "error",
        text: "Choose a file before saving.",
      });

      return;
    }

    if (
      captureType === "link" &&
      !link.trim()
    ) {
      setStatus({
        type: "error",
        text: "Paste the link you want TraceMind to remember.",
      });

      return;
    }

    if (
      captureType === "link" &&
      !/^https?:\/\/\S+/i.test(link.trim())
    ) {
      setStatus({
        type: "error",
        text: "Enter a valid website URL beginning with http:// or https://.",
      });

      return;
    }

    if (captureType === "text" && !text.trim()) {
      setStatus({
        type: "error",
        text: "Add some text before saving.",
      });

      return;
    }

    if (captureType === "voice" && !audioBlob) {
      setStatus({
        type: "error",
        text: "Record a voice note or upload an audio file before saving.",
      });

      return;
    }

    setLoading(true);

    let createdMemoryId: string | null = null;
    let uploadedStoragePath: string | null = null;

    try {
      const user = await getAuthenticatedUser();

      const { data: memory, error: memoryError } = await supabase
        .from("memories")
        .insert({
          user_id: user.id,
          title: title.trim(),
          category,
          source_type: captureType,
          source_url: captureType === "link" ? link.trim() : null,
          content: text.trim() || null,
          summary: summary.trim() || null,
          deadline: deadline
            ? new Date(deadline).toISOString()
            : null,
          is_favorite: isImportant,
          metadata: {
            capture_type: captureType,
            processing_status: summary.trim()
              ? "ai_analyzed"
              : captureType === "text"
                ? "saved_without_ai"
                : "pending_analysis",
            ai_tags: aiTags,
            is_important: isImportant,
          },
        })
        .select("id")
        .single();

      if (memoryError) {
        throw new Error(
          `Could not save the memory: ${memoryError.message}`
        );
      }

      if (!memory) {
        throw new Error("TraceMind could not create the memory record.");
      }

      createdMemoryId = memory.id;

      const uploadFile = createSourceFile();

      if (uploadFile) {
        const cleanName = uploadFile.name
          .replace(/[^a-zA-Z0-9._-]/g, "-")
          .slice(0, 150);

        const storagePath =
          `${user.id}/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("memory-assets")
          .upload(storagePath, uploadFile, {
            contentType:
              uploadFile.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Memory created, but the file upload failed: ${uploadError.message}`
          );
        }

        uploadedStoragePath = storagePath;

        const { error: assetError } = await supabase
          .from("memory_assets")
          .insert({
            memory_id: memory.id,
            user_id: user.id,
            storage_path: storagePath,
            file_name: uploadFile.name,
            mime_type: uploadFile.type,
            file_size: uploadFile.size,
          });

        if (assetError) {
          throw new Error(
            `The file uploaded, but its database record failed: ${assetError.message}`
          );
        }
      }

      setStatus({
        type: "success",
        text: "Your memory has been saved successfully.",
      });

      setTitle("");
      setCategory("Other");
      setLink("");
      setText("");
      setSummary("");
      setDeadline("");
      setAiTags([]);
      setIsImportant(false);
      setFile(null);
      clearRecording();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (audioInputRef.current) {
        audioInputRef.current.value = "";
      }
    } catch (error) {
      console.error("TraceMind save error:", error);

      // Attempt cleanup if a file upload or asset record failed.
      if (createdMemoryId) {
        if (uploadedStoragePath) {
          const { error: removeError } = await supabase.storage
            .from("memory-assets")
            .remove([uploadedStoragePath]);

          if (removeError) {
            console.error(
              "Could not remove the uploaded file:",
              removeError.message
            );
          }
        }

        const { error: deleteError } = await supabase
          .from("memories")
          .delete()
          .eq("id", createdMemoryId);

        if (deleteError) {
          console.error(
            "Could not roll back the memory:",
            deleteError.message
          );
        }
      }

      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong while saving your memory.",
      });
    } finally {
      setLoading(false);
    }
  }

  function downloadRecording() {
    if (!audioBlob || !audioUrl) return;

    const safeTitle = (title.trim() || "TraceMind-Recording")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const date = new Date().toISOString().slice(0, 10);
    const extension = getFileExtension(
      audioBlob instanceof File
        ? audioBlob
        : new File([audioBlob], "recording.webm", {
            type: audioBlob.type,
          })
    );

    const downloadUrl = URL.createObjectURL(audioBlob);
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = `${safeTitle}-${date}.${extension}`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  const canAnalyze =
    Boolean(
      file ||
        text.trim() ||
        link.trim() ||
        audioBlob
    ) &&
    !aiLoading &&
    !loading &&
    !recording;

  const canSave = !loading && !aiLoading && !recording;

  if (!sessionChecked) {
    return (
      <main className="capture-page">
        <div className="capture-loading">
          <div className="capture-spinner" />
          <h2>Preparing your workspace</h2>
          <p>Checking your TraceMind session…</p>
        </div>

        <style jsx>{`
          .capture-page {
            min-height: 100vh;
            padding: 60px 24px;
            background: #f7f8fc;
            color: #20213a;
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          }

          .capture-loading {
            display: flex;
            min-height: 60vh;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .capture-spinner {
            width: 34px;
            height: 34px;
            margin-bottom: 18px;
            border: 3px solid #e4e1ff;
            border-top-color: #6b5ce7;
            border-radius: 50%;
            animation: capture-spin 0.8s linear infinite;
          }

          h2 {
            margin: 0;
            font-size: 20px;
          }

          p {
            color: #777e91;
            font-size: 13px;
          }

          @keyframes capture-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }
if (!signedIn) {
  return (
    <main className="capture-auth-page">
      <div className="auth-background">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="auth-grid" />
      </div>

      <div className="auth-content">
        <header className="auth-header">
          <div className="auth-brand">
  <div className="auth-logo">
    <span>T</span>
  </div>

  <div className="auth-brand-copy">
    <strong>
      <span className="brand-trace">Trace</span>
      <span className="brand-mind">Mind</span>
    </strong>
  </div>
</div>
          <div className="auth-secure-badge">
            <span className="auth-live-dot" />
            Your personal memory space
          </div>
        </header>

        <section className="auth-hero">
          <div className="auth-copy">
            <div className="auth-eyebrow">
              <span className="auth-sparkle">✳</span>
              YOUR MIND, WITHOUT THE CLUTTER
            </div>

            <h1>
              Everything worth
              <br />
              remembering,
              <br />
              <span className="auth-gradient-text">
                all in one place.
              </span>
            </h1>

            <p className="auth-description">
              That screenshot you saved. That link you loved.
              That idea you almost forgot.
              <br className="desktop-break" />
              Give every little thing a place to live.
            </p>

            <div className="auth-actions">
              <button
                type="button"
                className="auth-primary-button"
                onClick={() => router.push("/login?next=/capture")}
              >
                <span>Continue to login</span>
                <span className="auth-button-arrow">→</span>
              </button>

              <div className="auth-no-setup">
                <span>✦</span>
                Your memories, organized in one space
              </div>
            </div>

            <div className="auth-trust-row">
              <div className="auth-trust-icon">◈</div>

              <div>
                <strong>Your space. Your memories.</strong>
                <span>
                  Sign in to save and revisit your personal collection.
                </span>
              </div>
            </div>
          </div>

          <div className="auth-visual">
            <div className="auth-visual-glow" />

            <div className="auth-visual-label">
              <span className="auth-visual-label-dot" />
              YOUR MEMORY UNIVERSE
            </div>

            <div className="memory-orbit orbit-outer" />
            <div className="memory-orbit orbit-inner" />

            <div className="memory-center">
<div className="memory-center-logo">
  <span>T</span>
</div>              <span>TraceMind</span>
              <small>REMEMBER MORE</small>
            </div>

            <div className="memory-float memory-note">
              <div className="memory-icon note-icon">T</div>
              <div className="memory-float-copy">
                <strong>Quick notes</strong>
                <span>Ideas worth keeping</span>
              </div>
              <span className="memory-status">↗</span>
            </div>

            <div className="memory-float memory-image">
              <div className="memory-icon image-icon">▧</div>
              <div className="memory-float-copy">
                <strong>Screenshots</strong>
                <span>Found when needed</span>
              </div>
            </div>

            <div className="memory-float memory-pdf">
              <div className="memory-icon pdf-icon">▤</div>
              <div className="memory-float-copy">
                <strong>Documents</strong>
                <span>All the useful details</span>
              </div>
            </div>

            <div className="memory-float memory-voice">
              <div className="memory-icon voice-icon">♫</div>
              <div className="memory-float-copy">
                <strong>Voice notes</strong>
                <span>Capture it your way</span>
              </div>
            </div>

            <div className="auth-visual-caption">
              <span className="caption-sparkle">✦</span>
              One place for all the things that matter.
            </div>
          </div>
        </section>

        <section className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">↗</div>
            <div>
              <strong>Capture anything</strong>
              <span>Notes, links, files and audio</span>
            </div>
          </div>

          <div className="auth-feature-divider" />

          <div className="auth-feature">
            <div className="auth-feature-icon">✳</div>
            <div>
              <strong>Make sense of it</strong>
              <span>Use AI to organize information</span>
            </div>
          </div>

          <div className="auth-feature-divider" />

          <div className="auth-feature">
            <div className="auth-feature-icon">⌕</div>
            <div>
              <strong>Find it again</strong>
              <span>Return to what you remember</span>
            </div>
          </div>
        </section>

        <footer className="auth-footer">
          <span>© TraceMind</span>
          <span className="auth-footer-message">
            Capture today. Remember tomorrow.
          </span>
          <span className="auth-footer-status">
            <span className="auth-live-dot" />
            YOUR PERSONAL KNOWLEDGE SPACE
          </span>
        </footer>
      </div>

      <style jsx>{`
        .capture-auth-page {
          --auth-purple: #7258f5;
          --auth-purple-dark: #5941d8;
          --auth-ink: #20203b;
          --auth-muted: #85869d;

          position: relative;
          display: flex;
          min-height: 100vh;
          flex-direction: column;
          overflow: hidden;
          padding: 0 6%;
          background: #f8f8fd;
          color: var(--auth-ink);
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          isolation: isolate;
        }

        .capture-auth-page *,
        .capture-auth-page *::before,
        .capture-auth-page *::after {
          box-sizing: border-box;
        }

        .auth-background {
          position: absolute;
          z-index: -1;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .auth-grid {
          position: absolute;
          inset: 0;
          opacity: 0.3;
          background-image: radial-gradient(
            #c7c1ed 0.7px,
            transparent 0.7px
          );
          background-size: 24px 24px;
          mask-image: linear-gradient(
            to bottom,
            transparent,
            black 20%,
            black 75%,
            transparent
          );
        }

        .auth-orb {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          filter: blur(100px);
          animation: auth-drift 12s ease-in-out infinite alternate;
        }

        .auth-orb-one {
          top: 10%;
          left: -240px;
          background: rgba(140, 117, 255, 0.15);
        }

        .auth-orb-two {
          right: -200px;
          bottom: 0;
          background: rgba(167, 139, 250, 0.18);
          animation-delay: -5s;
        }

        .auth-content {
          width: 100%;
          max-width: 1320px;
          margin: 0 auto;
        }

        .auth-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 27px 0;
          border-bottom: 1px solid rgba(222, 220, 239, 0.8);
          animation: auth-enter 0.7s ease both;
        }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .auth-logo,
.memory-center-logo {
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #7048e8;
  color: #ffffff;
  font-weight: 900;
  box-shadow: 0 6px 18px rgba(112, 72, 232, 0.22);
}

.auth-logo span {
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
}

        .auth-logo {
  display: grid;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 11px;
  background: #6c5af0;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(103, 88, 232, 0.22);
}

.auth-logo span {
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
}

        .auth-brand-copy {
          display: grid;
          gap: 4px;
        }

        .auth-brand-copy strong {
  display: flex;
  align-items: center;
  font-size: 19px;
  font-weight: 850;
  letter-spacing: -0.7px;
}

.brand-trace {
  color: #171717;
}

.brand-mind {
  color: #6758e8;
}
        .auth-brand-copy > span {
          color: #9693b3;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 1.8px;
        }

        .auth-secure-badge {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 14px;
          border: 1px solid #e8e6f5;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.75);
          color: #77748f;
          font-size: 11px;
          font-weight: 650;
        }

        .auth-live-dot,
        .auth-visual-label-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #43c69a;
          box-shadow: 0 0 0 4px rgba(67, 198, 154, 0.12);
        }

        .auth-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
          gap: 36px;
          padding: 56px 0 42px;
        }

        .auth-copy {
          position: relative;
          z-index: 2;
          animation: auth-enter 0.8s 0.1s ease both;
        }

        .auth-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 24px;
          padding: 9px 12px;
          border: 1px solid #e7e1ff;
          border-radius: 8px;
          background: rgba(243, 240, 255, 0.8);
          color: #6c56dd;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.4px;
        }

        .auth-sparkle {
          font-size: 14px;
        }

        .auth-copy h1 {
          margin: 0;
          font-size: clamp(39px, 4.6vw, 64px);
          font-weight: 850;
          letter-spacing: -3.6px;
          line-height: 1.08;
        }

        .auth-gradient-text {
          color: #7056eb;
          background: linear-gradient(
            100deg,
            #6348e5,
            #9675ff 65%,
            #b17cf5
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-description {
          max-width: 485px;
          margin: 24px 0 0;
          color: #85869c;
          font-size: 14px;
          line-height: 1.95;
        }

        .auth-actions {
          display: flex;
          align-items: flex-start;
          flex-direction: column;
          gap: 17px;
          margin-top: 29px;
        }

        .auth-primary-button {
          position: relative;
          display: inline-flex;
          min-height: 54px;
          align-items: center;
          justify-content: center;
          gap: 25px;
          overflow: hidden;
          padding: 0 22px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 13px;
          background: linear-gradient(120deg, #7860f5, #6248e2);
          color: white;
          font-family: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 9px 24px rgba(108, 83, 230, 0.22);
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .auth-primary-button::before {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent 20%,
            rgba(255, 255, 255, 0.2) 50%,
            transparent 80%
          );
          content: "";
          transform: translateX(-120%);
          transition: transform 0.65s ease;
        }

        .auth-primary-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 30px rgba(108, 83, 230, 0.3);
        }

        .auth-primary-button:hover::before {
          transform: translateX(120%);
        }

        .auth-button-arrow {
          position: relative;
          font-size: 19px;
          transition: transform 0.25s ease;
        }

        .auth-primary-button:hover .auth-button-arrow {
          transform: translateX(4px);
        }

        .auth-primary-button:focus-visible {
          outline: 3px solid rgba(112, 86, 235, 0.4);
          outline-offset: 4px;
        }

        .auth-no-setup {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #85859a;
          font-size: 11px;
        }

        .auth-no-setup > span {
          color: #8067ed;
        }

        .auth-trust-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 35px;
          padding-top: 24px;
          border-top: 1px solid #e8e7f1;
        }

        .auth-trust-icon {
          display: grid;
          width: 39px;
          height: 39px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid #e5e0ff;
          border-radius: 12px;
          background: #f0edff;
          color: #7159e8;
          font-size: 20px;
        }

        .auth-trust-row > div:last-child {
          display: grid;
          gap: 5px;
        }

        .auth-trust-row strong {
          font-size: 11px;
          font-weight: 800;
        }

        .auth-trust-row span {
          color: #8b8ca0;
          font-size: 10px;
          line-height: 1.6;
        }

        .auth-visual {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 420px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(225, 221, 250, 0.9);
          border-radius: 28px;
          background:
            radial-gradient(
              ellipse at 50% 48%,
              rgba(137, 113, 255, 0.12),
              transparent 48%
            ),
            rgba(255, 255, 255, 0.63);
          box-shadow:
            0 25px 70px rgba(71, 54, 140, 0.055),
            inset 0 1px rgba(255, 255, 255, 0.9);
          animation: auth-enter 0.9s 0.2s ease both;
        }

        .auth-visual-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: rgba(125, 100, 255, 0.13);
          filter: blur(55px);
          transform: translate(-50%, -50%);
          animation: auth-glow 5s ease-in-out infinite alternate;
        }

        .auth-visual-label {
          position: absolute;
          top: 23px;
          left: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #9290ab;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.5px;
        }

        .auth-visual-label-dot {
          width: 6px;
          height: 6px;
        }

        .memory-orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          border: 1px dashed rgba(126, 105, 225, 0.22);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .orbit-outer {
          width: 330px;
          height: 330px;
          animation: orbit-rotate 70s linear infinite;
        }

        .orbit-inner {
          width: 225px;
          height: 225px;
          border-style: solid;
          border-color: rgba(126, 105, 225, 0.13);
        }

        .memory-center {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          flex-direction: column;
          gap: 10px;
          animation: memory-float 5s ease-in-out infinite;
        }

        .memory-center-logo {
          width: 65px;
          height: 65px;
          border-radius: 21px;
          font-size: 34px;
          box-shadow:
            0 12px 30px rgba(107, 82, 231, 0.24),
            0 0 0 10px rgba(126, 105, 225, 0.07);
        }

        .memory-center > span {
          margin-top: 4px;
          font-size: 18px;
          font-weight: 850;
          letter-spacing: -0.7px;
        }

        .memory-center > small {
          color: #9692b3;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 2px;
        }

        .memory-float {
          position: absolute;
          z-index: 2;
          display: flex;
          min-width: 180px;
          align-items: center;
          gap: 11px;
          padding: 13px;
          border: 1px solid rgba(228, 225, 244, 0.95);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.91);
          box-shadow: 0 12px 30px rgba(52, 45, 107, 0.07);
          backdrop-filter: blur(15px);
          animation: memory-float 5s ease-in-out infinite;
          transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease;
        }

        .memory-float:hover {
          border-color: #c4b8ff;
          box-shadow: 0 16px 35px rgba(91, 68, 199, 0.12);
        }

        .memory-icon {
          display: grid;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 11px;
          font-size: 18px;
          font-weight: 850;
        }

        .note-icon {
          background: #f0edff;
          color: #7258eb;
        }

        .image-icon {
          background: #e8f7f0;
          color: #329b74;
        }

        .pdf-icon {
          background: #fff0eb;
          color: #e77b59;
        }

        .voice-icon {
          background: #eaf0ff;
          color: #5576e8;
        }

        .memory-float-copy {
          display: grid;
          min-width: 0;
          gap: 5px;
        }

        .memory-float-copy strong {
          color: #33334b;
          font-size: 11px;
          font-weight: 850;
          white-space: nowrap;
        }

        .memory-float-copy span {
          color: #9493a7;
          font-size: 9px;
          white-space: nowrap;
        }

        .memory-status {
          margin-left: auto;
          color: #9c91ed;
        }

        .memory-note {
          top: 18%;
          right: 7%;
          animation-delay: -1s;
        }

        .memory-image {
          top: 38%;
          left: 4%;
          animation-delay: -2.5s;
        }

        .memory-pdf {
          right: 4%;
          bottom: 24%;
          animation-delay: -3.5s;
        }

        .memory-voice {
          bottom: 11%;
          left: 9%;
          animation-delay: -1.8s;
        }

        .auth-visual-caption {
          position: absolute;
          right: 15px;
          bottom: 17px;
          left: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #9692ad;
          font-size: 10px;
          text-align: center;
        }

        .caption-sparkle {
          color: #8068eb;
        }

        .auth-features {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          gap: 20px;
          padding: 22px 25px;
          border: 1px solid #e8e6f3;
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.7);
          animation: auth-enter 0.9s 0.35s ease both;
        }

        .auth-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .auth-feature-icon {
          display: grid;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid #e8e2ff;
          border-radius: 12px;
          background: #f3f0ff;
          color: #735be7;
          font-size: 18px;
          font-weight: 800;
        }

        .auth-feature > div:last-child {
          display: grid;
          gap: 5px;
          min-width: 0;
        }

        .auth-feature strong {
          color: #393950;
          font-size: 11px;
          font-weight: 850;
        }

        .auth-feature span {
          color: #9695a8;
          font-size: 10px;
          line-height: 1.6;
        }

        .auth-feature-divider {
          display: none;
        }

        .auth-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 23px 0;
          color: #9694aa;
          font-size: 10px;
        }

        .auth-footer > span:first-child {
          color: #65627e;
          font-weight: 850;
        }

        .auth-footer-status {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        @keyframes auth-enter {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes auth-drift {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(30px, -25px, 0);
          }
        }

        @keyframes auth-glow {
          from {
            opacity: 0.55;
            scale: 0.85;
          }

          to {
            opacity: 1;
            scale: 1.2;
          }
        }

        @keyframes memory-float {
          0%,
          100% {
            translate: 0 0;
          }

          50% {
            translate: 0 -8px;
          }
        }

        @keyframes orbit-rotate {
          to {
            rotate: 360deg;
          }
        }

        @media (min-width: 1100px) and (min-height: 900px) {
          .auth-hero {
            padding-top: 70px;
            padding-bottom: 55px;
          }

          .auth-visual {
            min-height: 460px;
          }
        }

        @media (max-width: 950px) {
          .capture-auth-page {
            padding-right: 4%;
            padding-left: 4%;
          }

          .auth-hero {
            grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
            gap: 20px;
            padding-top: 45px;
          }

          .auth-copy h1 {
            font-size: clamp(35px, 5vw, 49px);
            letter-spacing: -2.4px;
          }

          .auth-visual {
            min-height: 370px;
          }

          .memory-float {
            min-width: 158px;
            padding: 10px;
            gap: 8px;
          }

          .memory-icon {
            width: 33px;
            height: 33px;
          }

          .memory-note {
            right: 3%;
          }

          .memory-image {
            left: 2%;
          }

          .memory-pdf {
            right: 2%;
          }

          .memory-voice {
            left: 4%;
          }

          .orbit-outer {
            width: 280px;
            height: 280px;
          }

          .orbit-inner {
            width: 200px;
            height: 200px;
          }
        }

        @media (max-width: 700px) {
          .capture-auth-page {
            padding: 0 20px;
          }

          .auth-header {
            padding: 20px 0;
          }

          .auth-secure-badge {
            padding: 9px;
            font-size: 0;
          }

          .auth-secure-badge .auth-live-dot {
            width: 7px;
            height: 7px;
          }

          .auth-hero {
            grid-template-columns: minmax(0, 1fr);
            gap: 34px;
            padding: 43px 0 30px;
          }

          .auth-copy h1 {
            font-size: clamp(38px, 9vw, 55px);
            letter-spacing: -2.8px;
          }

          .auth-description {
            font-size: 13px;
          }

          .desktop-break {
            display: none;
          }

          .auth-visual {
            min-height: 400px;
          }

          .auth-features {
            grid-template-columns: minmax(0, 1fr);
            gap: 18px;
            padding: 20px;
          }

          .auth-feature-divider {
            display: block;
            height: 1px;
            background: #efedf7;
          }

          .auth-feature strong {
            font-size: 12px;
          }

          .auth-feature span {
            font-size: 10px;
          }

          .auth-footer {
            flex-wrap: wrap;
            padding: 20px 0;
          }

          .auth-footer-message {
            display: none;
          }
        }

        @media (max-width: 390px) {
          .capture-auth-page {
            padding-right: 14px;
            padding-left: 14px;
          }

          .auth-brand-copy strong {
            font-size: 16px;
          }

          .auth-copy h1 {
            font-size: 37px;
            letter-spacing: -2px;
          }

          .auth-visual {
            min-height: 360px;
          }

          .memory-float {
            min-width: 145px;
          }

          .memory-float-copy strong {
            font-size: 10px;
          }

          .memory-float-copy span {
            font-size: 8px;
          }

          .orbit-outer {
            width: 250px;
            height: 250px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .capture-auth-page *,
          .capture-auth-page *::before,
          .capture-auth-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}

  return (
    <main className="capture-page">
      <div className="capture-container">
        <header className="capture-header">
          <div className="capture-heading-copy">
            <div className="capture-breadcrumb">
              <span className="breadcrumb-dot" />
              PERSONAL KNOWLEDGE SPACE
            </div>

            <h1>
              Capture a thought.
              <br />
              <span>Keep it forever.</span>
            </h1>

            <p>
              Save the things that matter today, so you can find them
              exactly when you need them.
            </p>
          </div>

          <div className="header-actions">
            <div className="private-badge">
              <span>◈</span>
              Private workspace
            </div>

            <button
              type="button"
              className="header-secondary"
              onClick={() => router.push("/memories")}
            >
              View memories <span aria-hidden="true">↗</span>
            </button>
          </div>
        </header>

        <div className="capture-layout">
          <section className="capture-panel">
            <div className="panel-topline">
              <div>
                <span className="step-number">01</span>
                <h2>Choose your source</h2>
              </div>

              <span className="step-caption">START HERE</span>
            </div>

            <div className="capture-options">
              {captureOptions.map((option) => {
                const active = captureType === option.type;

                return (
                  <button
                    key={option.type}
                    type="button"
                    className={`capture-option ${active ? "selected" : ""}`}
                    onClick={() => changeType(option.type)}
                    aria-pressed={active}
                  >
                    <span className="option-icon">{option.icon}</span>

                    <span className="option-text">
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                    </span>

                    <span className="option-check">
                      {active ? "✓" : "↗"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="form-divider" />

            <div className="panel-topline details-heading">
              <div>
                <span className="step-number">02</span>
                <h2>Add the details</h2>
              </div>

              <span className="step-caption">MAKE IT SEARCHABLE</span>
            </div>

            <div className="form-grid">
              <label className="field full">
                <span>Memory title <b>*</b></span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. React interview preparation"
                  maxLength={200}
                />
              </label>

              <label className="field">
                <span>Category</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field">
                <span>Source format</span>
                <div className="format-pill">
                  <span>{activeOption.icon}</span>
                  {activeOption.title}
                  <span className="format-ready">Selected</span>
                </div>
              </div>
            </div>

            {(captureType === "image" || captureType === "pdf") && (
              <div
                className={`dropzone ${dragging ? "dragging" : ""} ${
                  file ? "has-file" : ""
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Choose a file or drop it here"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept={activeOption.accept}
                  onChange={handleFileChange}
                />

                {file ? (
                  <>
                    <div className="upload-icon file-selected">✓</div>
                    <strong className="uploaded-name">{file.name}</strong>
                    <small>
                      {(file.size / 1024 / 1024).toFixed(2)} MB · Ready
                      to save
                    </small>
                    <button
                      type="button"
                      className="file-change"
                      onClick={(event) => {
                        event.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Choose another file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">↑</div>
                    <strong>
                      Drop your {captureType === "pdf" ? "PDF" : "image"}{" "}
                      here
                    </strong>
                    <small>or browse files from your device</small>
                    <span className="file-limits">
                      {captureType === "pdf"
                        ? "PDF documents"
                        : "PNG, JPEG or WebP images"}
                    </span>
                  </>
                )}
              </div>
            )}

            {captureType === "link" && (
              <label className="field block">
                <span>Website or post URL <b>*</b></span>
                <div className="link-input">
                  <span>↗</span>
                  <input
                    type="url"
                    value={link}
                    onChange={(event) => setLink(event.target.value)}
                    placeholder="https://example.com/article"
                  />
                </div>
                <small className="field-help">
                  Save the original address so you can return to it later.
                </small>
              </label>
            )}

            {captureType === "text" && (
              <label className="field block">
                <span>Content <b>*</b></span>
                <textarea
                  rows={8}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Paste a message, a useful quote, meeting notes, an idea or anything worth remembering..."
                />
                <small className="field-help">
                  Include the details you might search for in the future.
                </small>
              </label>
            )}

            {captureType === "voice" && (
              <div className="voice-card">
                <div className={`voice-orb ${recording ? "recording" : ""}`}>
                  {recording ? "●" : "♫"}
                </div>

                <div className="voice-time">
                  {formatRecordingTime(recordingTime)}
                </div>

                <h3>
                  {recording
                    ? "Recording in progress"
                    : audioUrl
                      ? "Your recording is ready"
                      : "Capture it in your own words"}
                </h3>

                <p>
                  {recording
                    ? "Speak naturally. Stop when you've finished."
                    : audioUrl
                      ? "Listen to your audio before saving it."
                      : "Record a new note or upload an existing audio file."}
                </p>

                {recording ? (
                  <button
                    type="button"
                    className="record-button stop-recording"
                    onClick={stopRecording}
                  >
                    <span>■</span> Stop recording
                  </button>
                ) : !audioUrl ? (
                  <button
                    type="button"
                    className="record-button"
                    onClick={() => void startRecording()}
                  >
                    <span>●</span> Start recording
                  </button>
                ) : (
                  <>
                  <audio
  className="voice-player"
  controls
  controlsList="nodownload"
  preload="metadata"
  src={audioUrl}
/>

                    <div className="voice-actions">
                      <button
                        type="button"
                        className="voice-secondary"
                        onClick={downloadRecording}
                      >
                        ↓ Download
                      </button>

                      <button
                        type="button"
                        className="voice-secondary"
                        onClick={clearRecording}
                      >
                        ↻ Record again
                      </button>
                    </div>
                  </>
                )}

                {!recording && (
                  <>
                    <div className="voice-or">OR</div>

                    <input
                      ref={audioInputRef}
                      type="file"
                      hidden
                      accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.mp4"
                      onChange={handleAudioFileChange}
                    />

                    <button
                      type="button"
                      className="upload-audio-button"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      ↑ Upload an audio file
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="form-divider details-divider" />

            <div className="panel-topline optional-heading">
              <div>
                <span className="step-number">03</span>
                <h2>Make it easier to find</h2>
              </div>

              <span className="optional-label">OPTIONAL</span>
            </div>

            <label className="field block">
              <span>Summary</span>
              <textarea
                rows={3}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Add a short summary or generate one with AI..."
              />
            </label>

            <label className="field block deadline-field">
              <span>Deadline or reminder date</span>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
              <small className="field-help">
                AI may suggest a date from the content. Verify it before
                saving.
              </small>
            </label>

            {aiTags.length > 0 && (
              <div className="field block tags-field">
                <span>AI-suggested tags</span>
                <div className="tags-list">
                  {aiTags.map((tag, index) => (
                    <span className="tag-chip" key={`${tag}-${index}`}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <label className="important-toggle">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(event) => setIsImportant(event.target.checked)}
              />

              <span className="important-checkbox">★</span>

              <span className="important-copy">
                <strong>Mark as important</strong>
                <small>Keep this memory easy to spot later.</small>
              </span>
            </label>

            {status && (
              <div
                className={`status-message ${status.type}`}
                role={status.type === "error" ? "alert" : "status"}
              >
                <span className="status-icon">
                  {status.type === "success" ? "✓" : "!"}
                </span>
                <span>{status.text}</span>
              </div>
            )}

            <div className="save-actions">
              <div className="save-note">
                <span>◈</span>
                <span>
                  <strong>Your memory, your space.</strong>
                  <small>Saved to your TraceMind account.</small>
                </span>
              </div>

              <div className="save-buttons">
                <button
                  type="button"
                  className="ai-button"
                  onClick={() => void analyzeWithAI()}
                  disabled={!canAnalyze}
                >
                  {aiLoading ? (
                    <>
                      <span className="button-spinner" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <span className="ai-sparkle">✳</span>
                      Analyze with AI
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="save-button"
                  onClick={() => void saveMemory()}
                  disabled={!canSave}
                >
                  {loading ? (
                    <>
                      <span className="button-spinner" />
                      Saving…
                    </>
                  ) : (
                    <>
                      Save memory
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          <aside className="capture-sidebar">
            <div className="sidebar-glow" />

            <div className="sidebar-brand">
             <span className="sidebar-brand-icon">T</span>

<span className="sidebar-brand-name">
  <span>Trace</span>
  <span>Mind</span>
</span>
              <span className="sidebar-version">YOUR SECOND BRAIN</span>
            </div>

            <div className="sidebar-intro">
              <span className="sidebar-eyebrow">A LITTLE MORE CLARITY</span>
              <h2>
                Remember
                <br />
                <em>what matters.</em>
              </h2>
              <p>
                Collect information now. Find the right detail when it
                counts.
              </p>
            </div>

            <div className="sidebar-steps">
              <div className="sidebar-step">
                <span className="sidebar-step-icon">01</span>
                <div>
                  <strong>Capture anything</strong>
                  <p>Keep links, screenshots, files, notes and audio together.</p>
                </div>
              </div>

              <div className="sidebar-step">
                <span className="sidebar-step-icon">02</span>
                <div>
                  <strong>Understand it with AI</strong>
                  <p>Generate summaries, useful tags and possible dates.</p>
                </div>
              </div>

              <div className="sidebar-step">
                <span className="sidebar-step-icon">03</span>
                <div>
                  <strong>Find it again</strong>
                  <p>Build a personal library of information you value.</p>
                </div>
              </div>
            </div>

            <div className="sidebar-privacy">
              <span className="privacy-icon">◈</span>
              <div>
                <strong>Made for your memories</strong>
                <p>
                  Your saved content is associated with your account.
                  Storage privacy also depends on your Supabase policies.
                </p>
              </div>
            </div>

            <div className="sidebar-bottom">
              <span className="sidebar-bottom-dot" />
              YOUR PERSONAL KNOWLEDGE SPACE
            </div>
          </aside>
        </div>

        <footer className="capture-footer">
          <span>© TraceMind</span>
          <span>Capture today. Remember tomorrow.</span>
          <button
            type="button"
            onClick={() => router.push("/memories")}
          >
            Browse your memories →
          </button>
        </footer>
      </div>

      <style jsx>{`
        .capture-page {
          --capture-bg: #f6f7fb;
          --capture-card: #ffffff;
          --capture-text: #20213a;
          --capture-muted: #7c8297;
          --capture-border: #e7e9f1;
          --capture-accent: #6b5ce7;
          --capture-accent-light: #f0edff;

          min-height: 100vh;
          padding: 38px 24px 28px;
          background: var(--capture-bg);
          color: var(--capture-text);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .capture-page *,
        .capture-page *::before,
        .capture-page *::after {
          box-sizing: border-box;
        }

        .capture-container {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        .capture-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 30px;
        }

        .capture-breadcrumb {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 18px;
          color: #7b7d96;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.9px;
        }

        .breadcrumb-dot,
        .sidebar-bottom-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #6b5ce7;
          box-shadow: 0 0 0 4px rgba(107, 92, 231, 0.1);
        }

        .capture-heading-copy h1 {
          margin: 0;
          font-size: clamp(36px, 4.5vw, 53px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -2.5px;
        }

        .capture-heading-copy h1 span {
          color: var(--capture-accent);
        }

        .capture-heading-copy > p {
          max-width: 600px;
          margin: 17px 0 0;
          color: var(--capture-muted);
          font-size: 14px;
          line-height: 1.8;
        }

        .header-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          padding-top: 5px;
        }

        .private-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          border: 1px solid #e5e8ef;
          border-radius: 999px;
          background: white;
          color: #5e6579;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .private-badge span {
          color: #2e9b72;
          font-size: 15px;
        }

        .header-secondary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 11px 15px;
          border: 1px solid var(--capture-border);
          border-radius: 11px;
          background: white;
          color: #555d73;
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .header-secondary:hover {
          border-color: #c8c1ff;
          color: var(--capture-accent);
          transform: translateY(-1px);
        }

        .capture-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          align-items: start;
          gap: 22px;
        }

        .capture-panel {
          min-width: 0;
          padding: 30px;
          border: 1px solid var(--capture-border);
          border-radius: 21px;
          background: var(--capture-card);
          box-shadow: 0 7px 28px rgba(39, 42, 82, 0.025);
        }

        .panel-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 17px;
        }

        .panel-topline > div {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .step-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 29px;
          height: 29px;
          flex-shrink: 0;
          border-radius: 9px;
          background: var(--capture-accent-light);
          color: var(--capture-accent);
          font-size: 10px;
          font-weight: 850;
        }

        .panel-topline h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.45px;
        }

        .step-caption,
        .optional-label {
          color: #a0a4b5;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .capture-options {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .capture-option {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
          padding: 13px;
          border: 1px solid #e8eaf2;
          border-radius: 13px;
          background: #fcfcfe;
          color: var(--capture-text);
          text-align: left;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .capture-option:hover {
          transform: translateY(-1px);
          border-color: #c9c2ff;
        }

        .capture-option.selected {
          border-color: #a79bff;
          background: #f5f3ff;
          box-shadow: 0 0 0 2px rgba(107, 92, 231, 0.06);
        }

        .option-icon {
          display: grid;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid #e8e7f5;
          border-radius: 12px;
          background: white;
          color: var(--capture-accent);
          font-size: 18px;
          font-weight: 800;
        }

        .option-text {
          display: grid;
          min-width: 0;
          flex: 1;
          gap: 5px;
        }

        .option-text strong {
          overflow: hidden;
          font-size: 12px;
          font-weight: 800;
          text-overflow: ellipsis;
        }

        .option-text small {
          overflow: hidden;
          color: #888da0;
          font-size: 10px;
          line-height: 1.45;
          text-overflow: ellipsis;
        }

        .option-check {
          color: #a3a5b5;
          font-size: 13px;
        }

        .capture-option.selected .option-check {
          color: var(--capture-accent);
          font-weight: 900;
        }

        .form-divider {
          height: 1px;
          margin: 27px 0;
          background: #eceef4;
        }

        .details-heading {
          margin-bottom: 18px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .field {
          display: grid;
          min-width: 0;
          gap: 8px;
        }

        .field.full,
        .field.block {
          grid-column: 1 / -1;
        }

        .field > span {
          color: #4c5269;
          font-size: 12px;
          font-weight: 750;
          letter-spacing: -0.1px;
        }

        .field > span b {
          color: #e25c67;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          min-width: 0;
          border: 1px solid #e0e3ed;
          border-radius: 11px;
          outline: none;
          background: #fff;
          color: #272940;
          font-family: inherit;
          font-size: 13px;
          font-weight: 450;
          line-height: 1.65;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .field input,
        .field select {
          min-height: 45px;
          padding: 10px 12px;
        }

        .field textarea {
          min-height: 90px;
          padding: 13px 14px;
          resize: vertical;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #a0a5b6;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #9b8eff;
          box-shadow: 0 0 0 3px rgba(107, 92, 231, 0.1);
        }

        .format-pill {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 45px;
          padding: 10px 12px;
          border: 1px solid #e4e5ef;
          border-radius: 11px;
          background: #fafafe;
          color: #555c72;
          font-size: 12px;
          font-weight: 700;
        }

        .format-pill > span:first-child {
          color: var(--capture-accent);
          font-size: 16px;
        }

        .format-ready {
          margin-left: auto;
          color: #9297a8;
          font-size: 10px;
          font-weight: 500;
        }

        .dropzone {
          display: flex;
          min-height: 195px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-top: 18px;
          padding: 24px;
          border: 1.5px dashed #d5d6e6;
          border-radius: 16px;
          background: #fbfbfe;
          text-align: center;
          cursor: pointer;
          transition:
            background 0.2s ease,
            border-color 0.2s ease;
        }

        .dropzone:hover,
        .dropzone.dragging {
          border-color: #9485ff;
          background: #f5f3ff;
        }

        .dropzone.has-file {
          border-color: #9dd9bd;
          background: #f6fcf8;
        }

        .upload-icon {
          display: grid;
          width: 48px;
          height: 48px;
          place-items: center;
          margin-bottom: 13px;
          border: 1px solid #e5e0ff;
          border-radius: 15px;
          background: #f0edff;
          color: var(--capture-accent);
          font-size: 24px;
          font-weight: 600;
        }

        .upload-icon.file-selected {
          border-color: #d3efdf;
          background: #eaf8f0;
          color: #218357;
        }

        .dropzone > strong {
          max-width: 100%;
          overflow-wrap: anywhere;
          color: #30334a;
          font-size: 13px;
          font-weight: 800;
        }

        .dropzone > small {
          margin-top: 7px;
          color: #898fa2;
          font-size: 11px;
        }

        .file-limits {
          margin-top: 17px;
          padding: 6px 10px;
          border: 1px solid #e8e9f1;
          border-radius: 7px;
          background: white;
          color: #777e92;
          font-size: 10px;
          font-weight: 650;
        }

        .file-change {
          margin-top: 13px;
          border: none;
          background: transparent;
          color: var(--capture-accent);
          font-family: inherit;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .link-input {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 0 12px;
          border: 1px solid #e0e3ed;
          border-radius: 11px;
          background: white;
        }

        .link-input:focus-within {
          border-color: #9b8eff;
          box-shadow: 0 0 0 3px rgba(107, 92, 231, 0.1);
        }

        .link-input > span {
          color: var(--capture-accent);
          font-size: 17px;
        }

        .link-input input {
          min-width: 0;
          border: none;
          box-shadow: none !important;
        }

        .field-help {
          color: #9298a9;
          font-size: 11px;
          line-height: 1.65;
        }

        .voice-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 18px;
          padding: 30px 22px;
          border: 1px solid #e7e7f1;
          border-radius: 18px;
          background:
            radial-gradient(circle at 50% 0%, #f2efff 0, transparent 52%),
            #fcfcff;
          text-align: center;
        }

        .voice-orb {
          display: grid;
          width: 69px;
          height: 69px;
          place-items: center;
          margin-bottom: 17px;
          border: 1px solid #e5dfff;
          border-radius: 50%;
          background: #f0edff;
          color: var(--capture-accent);
          font-size: 27px;
          box-shadow: 0 0 0 8px rgba(107, 92, 231, 0.045);
        }

        .voice-orb.recording {
          border-color: #ffcaca;
          background: #fff0f0;
          color: #d64755;
          animation: voice-pulse 1.6s infinite;
        }

        .voice-time {
          margin-bottom: 8px;
          color: #272940;
          font-size: 27px;
          font-weight: 800;
          letter-spacing: 1px;
          font-variant-numeric: tabular-nums;
        }

        .voice-card h3 {
          margin: 0;
          color: #30334a;
          font-size: 15px;
          font-weight: 800;
        }

        .voice-card > p {
          max-width: 350px;
          margin: 9px 0 18px;
          color: #868ca0;
          font-size: 12px;
          line-height: 1.75;
        }

        .record-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 43px;
          padding: 0 18px;
          border: none;
          border-radius: 11px;
          background: #6b5ce7;
          color: white;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .record-button:hover {
          transform: translateY(-1px);
        }

        .record-button.stop-recording {
          background: #c93f4d;
        }

        .audio-player {
          width: 100%;
          max-width: 430px;
          margin: 6px 0 12px;
        }

        .voice-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 9px;
        }

        .voice-secondary {
          padding: 9px 13px;
          border: 1px solid #e0dafa;
          border-radius: 9px;
          background: white;
          color: #6356cf;
          font-family: inherit;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .voice-or {
          margin: 21px 0 13px;
          color: #a1a5b5;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .upload-audio-button {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 11px 14px;
          border: 1px solid #e3e3ef;
          border-radius: 10px;
          background: white;
          color: #5d6379;
          font-family: inherit;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .upload-audio-button:hover {
          border-color: #c6bfff;
          color: var(--capture-accent);
        }

        .details-divider {
          margin-top: 29px;
        }

        .optional-heading {
          margin-bottom: 19px;
        }

        .deadline-field {
          margin-top: 19px;
        }

        .tags-field {
          margin-top: 19px;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-chip {
          padding: 7px 10px;
          border: 1px solid #e4dfff;
          border-radius: 8px;
          background: #f7f5ff;
          color: #6758d5;
          font-size: 11px;
          font-weight: 700;
        }

        .important-toggle {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 21px;
          padding: 14px;
          border: 1px solid #e8e8f1;
          border-radius: 12px;
          background: #fcfcfe;
          cursor: pointer;
        }

        .important-toggle input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
        }

        .important-checkbox {
          display: grid;
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 10px;
          background: #fff3d9;
          color: #c58a22;
          font-size: 15px;
          transition: all 0.2s ease;
        }

        .important-toggle input:checked + .important-checkbox {
          background: #ffdf8c;
          color: #80510a;
        }

        .important-toggle input:focus-visible + .important-checkbox {
          outline: 3px solid rgba(107, 92, 231, 0.25);
          outline-offset: 3px;
        }

        .important-copy {
          display: grid;
          gap: 4px;
        }

        .important-copy strong {
          color: #42465c;
          font-size: 12px;
          font-weight: 800;
        }

        .important-copy small {
          color: #9297a9;
          font-size: 10px;
        }

        .status-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 18px;
          padding: 13px 14px;
          border: 1px solid transparent;
          border-radius: 12px;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .status-icon {
          display: grid;
          width: 21px;
          height: 21px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
          font-size: 11px;
          font-weight: 900;
        }

        .status-message.success {
          border-color: #d5f0df;
          background: #f0fbf5;
          color: #18794e;
        }

        .status-message.error {
          border-color: #f3d7d9;
          background: #fff4f4;
          color: #ae343f;
        }

        .save-actions {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-top: 24px;
          padding-top: 21px;
          border-top: 1px solid #eceef4;
        }

        .save-note {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .save-note > span:first-child {
          display: grid;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid #e1dcff;
          border-radius: 10px;
          background: #f3f0ff;
          color: #6b5ce7;
          font-size: 17px;
        }

        .save-note > span:last-child {
          display: grid;
          gap: 4px;
        }

        .save-note strong {
          color: #4a4f65;
          font-size: 11px;
          font-weight: 800;
        }

        .save-note small {
          color: #9297a9;
          font-size: 10px;
        }

        .save-buttons {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 11px;
        }

        .ai-button,
        .save-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 48px;
          padding: 12px 14px;
          border: 1px solid transparent;
          border-radius: 12px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .ai-button {
          border-color: #ded9ff;
          background: #f3f0ff;
          color: #6354d5;
        }

        .ai-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(107, 92, 231, 0.1);
        }

        .ai-sparkle {
          font-size: 17px;
        }

        .save-button {
          background: #6b5ce7;
          color: white;
          box-shadow: 0 5px 14px rgba(107, 92, 231, 0.17);
        }

        .save-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(107, 92, 231, 0.23);
        }

        .ai-button:disabled,
        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .button-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: capture-spin 0.7s linear infinite;
        }

        .capture-sidebar {
          position: sticky;
          top: 24px;
          overflow: hidden;
          padding: 25px;
          border: 1px solid #292842;
          border-radius: 21px;
          background: linear-gradient(155deg, #24223b, #191929 85%);
          color: white;
        }

        .sidebar-glow {
          position: absolute;
          top: -100px;
          right: -110px;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: rgba(128, 109, 255, 0.16);
          filter: blur(4px);
          pointer-events: none;
        }

        .sidebar-brand,
        .sidebar-intro,
        .sidebar-steps,
        .sidebar-privacy,
        .sidebar-bottom {
          position: relative;
          z-index: 1;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          color: #e8e6ff;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.5px;
        }
          .sidebar-brand-name {
  display: inline-flex;
  align-items: center;
  gap: 0;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: -0.4px;
}

.sidebar-brand-name span:first-child {
  color: #ffffff;
}

.sidebar-brand-name span:last-child {
  color: #aa9aff;
}

        .sidebar-brand-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: #7048e8;
  color: #ffffff;
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 0;
  box-shadow: 0 5px 15px rgba(112, 72, 232, 0.3);
}

        .sidebar-version {
          width: 100%;
          margin-left: 40px;
          margin-top: -5px;
          color: #85839f;
          font-size: 8px;
          letter-spacing: 1.1px;
        }

        .sidebar-intro {
          margin-top: 42px;
        }

        .sidebar-eyebrow {
          color: #aaa0ff;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.7px;
        }

        .sidebar-intro h2 {
          margin: 14px 0 14px;
          color: #fff;
          font-size: 31px;
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -1.5px;
        }

        .sidebar-intro h2 em {
          color: #aaa0ff;
          font-style: normal;
        }

        .sidebar-intro p {
          margin: 0;
          color: #aaa9c0;
          font-size: 12px;
          line-height: 1.85;
        }

        .sidebar-steps {
          display: grid;
          gap: 23px;
          margin-top: 35px;
        }

        .sidebar-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .sidebar-step-icon {
          display: grid;
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid rgba(173, 161, 255, 0.18);
          border-radius: 10px;
          background: rgba(141, 123, 255, 0.09);
          color: #b6adff;
          font-size: 10px;
          font-weight: 850;
        }

        .sidebar-step > div {
          min-width: 0;
          padding-top: 2px;
        }

        .sidebar-step strong {
          color: #f0effa;
          font-size: 11px;
          font-weight: 800;
        }

        .sidebar-step p {
          margin: 5px 0 0;
          color: #9a99b0;
          font-size: 10px;
          line-height: 1.7;
        }

        .sidebar-privacy {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 34px;
          padding: 14px 12px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.035);
        }

        .privacy-icon {
          color: #9de0be;
          font-size: 18px;
        }

        .sidebar-privacy strong {
          color: #e8e7f4;
          font-size: 10px;
          font-weight: 800;
        }

        .sidebar-privacy p {
          margin: 5px 0 0;
          color: #a09fb5;
          font-size: 9px;
          line-height: 1.75;
        }

        .sidebar-bottom {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 27px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.09);
          color: #9998b0;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.1px;
        }

        .sidebar-bottom-dot {
          width: 6px;
          height: 6px;
          background: #7fdfb1;
          box-shadow: none;
        }

        .capture-footer {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 26px;
          padding: 20px 2px 0;
          border-top: 1px solid #e5e8f0;
          color: #9197a8;
          font-size: 10px;
        }

        .capture-footer > span:first-child {
          color: #5b6177;
          font-weight: 850;
        }

        .capture-footer button {
          margin-left: auto;
          border: none;
          background: transparent;
          color: #6b5ce7;
          font-family: inherit;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        @keyframes capture-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes voice-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(214, 71, 85, 0.15);
          }

          70% {
            box-shadow: 0 0 0 11px rgba(214, 71, 85, 0);
          }

          100% {
            box-shadow: 0 0 0 0 rgba(214, 71, 85, 0);
          }
        }

        @media (max-width: 1050px) {
          .capture-layout {
            grid-template-columns: minmax(0, 1fr) 285px;
            gap: 16px;
          }

          .capture-panel {
            padding: 23px;
          }

          .capture-sidebar {
            padding: 21px;
          }

          .capture-options {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 820px) {
          .capture-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .capture-sidebar {
            position: relative;
            top: auto;
          }

          .sidebar-intro {
            margin-top: 28px;
          }

          .sidebar-intro h2 {
            font-size: 28px;
          }

          .sidebar-steps {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }

          .sidebar-step {
            flex-direction: column;
          }

          .sidebar-privacy {
            margin-top: 25px;
          }
        }

        @media (max-width: 600px) {
          .capture-page {
            padding: 25px 14px 20px;
          }

          .capture-header {
            flex-direction: column;
            gap: 20px;
            margin-bottom: 24px;
          }

          .capture-heading-copy h1 {
            font-size: clamp(34px, 9vw, 43px);
            letter-spacing: -1.9px;
          }

          .capture-heading-copy > p {
            font-size: 13px;
          }

          .header-actions {
            width: 100%;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .private-badge {
            font-size: 10px;
          }

          .capture-panel {
            padding: 19px 15px;
            border-radius: 17px;
          }

          .panel-topline {
            align-items: flex-start;
          }

          .panel-topline h2 {
            font-size: 14px;
          }

          .step-caption,
          .optional-label {
            padding-top: 7px;
            font-size: 8px;
          }

          .capture-options {
            grid-template-columns: minmax(0, 1fr);
          }

          .capture-option {
            padding: 12px;
          }

          .form-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 15px;
          }

          .field.full,
          .field.block {
            grid-column: auto;
          }

          .dropzone {
            min-height: 175px;
            padding: 18px 12px;
          }

          .voice-card {
            padding: 25px 15px;
          }

          .details-divider {
            margin-top: 24px;
          }

          .save-buttons {
            grid-template-columns: minmax(0, 1fr);
          }

          .ai-button,
          .save-button {
            min-height: 48px;
          }

          .capture-sidebar {
            padding: 22px 19px;
          }

          .sidebar-steps {
            grid-template-columns: minmax(0, 1fr);
            gap: 18px;
          }

          .sidebar-step {
            flex-direction: row;
          }

          .capture-footer {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }

          .capture-footer button {
            margin-left: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .capture-page *,
          .capture-page *::before,
          .capture-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}

