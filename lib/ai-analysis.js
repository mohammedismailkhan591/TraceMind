export const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
]);

export const allowedAudioMimeTypes = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
  'audio/ogg; codecs=opus',
  'audio/webm',
  'audio/webm;codecs=opus',
]);

export function isAudioMimeType(mimeType) {
  if (!mimeType) return false;
  const normalized = mimeType.toLowerCase();
  return allowedAudioMimeTypes.has(normalized) || normalized.startsWith('audio/');
}

export function getGeminiModelCandidates() {
  return ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
}

export function buildAnalysisPrompt({ captureType, text, link, fileBase64, mimeType }) {
  const normalizedCaptureType = typeof captureType === 'string' ? captureType : 'text';
  const primaryText = typeof text === 'string' ? text : '';
  const primaryLink = typeof link === 'string' ? link : '';
  const hasAudio = normalizedCaptureType === 'voice' || isAudioMimeType(mimeType);

  return `You are TraceMind, a careful personal information organizer. Analyze the provided content and return ONLY valid JSON with this shape:
{"title":"short recognizable title","category":"one of Tech, Hackathons, Jobs, Courses, Events, Articles, Scholarships, Messages, Other","summary":"2-4 concise sentences grounded in the supplied content","extractedText":"important source text, key facts, names, amounts, dates and instructions; concise but useful","deadlineISO":null,"tags":["tag1","tag2"],"isImportant":false}
Rules: Never invent facts. If no deadline is clearly stated, deadlineISO must be null. If a date has no year, do not guess the year; use null. If only a URL is supplied without page content, do not pretend you opened it: create a cautious title based on the URL and state in summary that the page content has not been imported yet. Category must be one of the exact options. Use ISO 8601 with timezone only for a clearly specified full deadline. Return JSON only.
${hasAudio ? 'Important: If the input contains spoken audio, transcribe the spoken content as faithfully as possible before summarizing it. Capture type is voice/audio.' : ''}
Capture type: ${normalizedCaptureType}
URL (if supplied): ${primaryLink || 'none'}
User text (if supplied): ${primaryText || 'none'}
Audio metadata (if supplied): ${mimeType || 'none'}
`.trim();
}

export function normalizeAnalysisResult(result = {}) {
  const categories = ['Tech', 'Hackathons', 'Jobs', 'Courses', 'Events', 'Articles', 'Scholarships', 'Messages', 'Other'];
  const category = typeof result.category === 'string' && categories.includes(result.category) ? result.category : 'Other';
  const summary = typeof result.summary === 'string' ? result.summary.slice(0, 2000) : '';
  const extractedText = typeof result.extractedText === 'string' ? result.extractedText.slice(0, 12000) : '';
  const deadlineISO = typeof result.deadlineISO === 'string' && !Number.isNaN(Date.parse(result.deadlineISO)) ? result.deadlineISO : null;
  const tags = Array.isArray(result.tags)
    ? result.tags.filter((tag) => typeof tag === 'string').slice(0, 8)
    : [];

  return {
    title: typeof result.title === 'string' ? result.title.slice(0, 180) : 'Saved memory',
    category,
    summary,
    extractedText,
    deadlineISO,
    tags,
    isImportant: result.isImportant === true,
  };
}
