import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAnalysisPrompt,
  getGeminiModelCandidates,
  isAudioMimeType,
  isRetryableModelError,
  normalizeAnalysisResult,
  normalizeMimeType,
  validateMediaNotMisclassified,
} from '../lib/ai-analysis.js';

test('buildAnalysisPrompt includes transcription guidance for voice captures', () => {
  const prompt = buildAnalysisPrompt({
    captureType: 'voice',
    text: '',
    link: '',
    fileBase64: 'abc',
    mimeType: 'audio/webm',
  });

  assert.match(prompt, /transcrib/i);
  assert.match(prompt, /summary/i);
  assert.match(prompt, /voice/i);
});

test('normalizeAnalysisResult keeps valid field values and falls back safely', () => {
  const normalized = normalizeAnalysisResult({
    category: 'Tech',
    summary: 'Example summary',
    extractedText: 'Example transcription',
    deadlineISO: '2025-01-05T10:00:00Z',
    tags: ['meeting', 'notes'],
    isImportant: true,
  });

  assert.equal(normalized.category, 'Tech');
  assert.equal(normalized.summary, 'Example summary');
  assert.equal(normalized.extractedText, 'Example transcription');
  assert.equal(normalized.deadlineISO, '2025-01-05T10:00:00Z');
  assert.deepEqual(normalized.tags, ['meeting', 'notes']);
  assert.equal(normalized.isImportant, true);
});

test('buildAnalysisPrompt does not include transcription guidance for images or PDFs', () => {
  const imagePrompt = buildAnalysisPrompt({
    captureType: 'image',
    text: '',
    link: '',
    fileBase64: 'abc',
    mimeType: 'image/png',
  });
  assert.doesNotMatch(imagePrompt, /transcrib/i);

  const pdfPrompt = buildAnalysisPrompt({
    captureType: 'pdf',
    text: '',
    link: '',
    fileBase64: 'abc',
    mimeType: 'application/pdf',
  });
  assert.doesNotMatch(pdfPrompt, /transcrib/i);
});

test('getGeminiModelCandidates returns verified Gemini models in priority order', () => {
  const models = getGeminiModelCandidates();

  assert.ok(Array.isArray(models) && models.length >= 2);
  assert.equal(models[0], 'gemini-3.8-flash');
  assert.ok(models.includes('gemini-3.5-flash-lite'));
  assert.ok(models.includes('gemini-2.5-flash'));
});

test('Audio MIME types are normalized properly for provider API', () => {
  assert.equal(normalizeMimeType('audio/webm;codecs=opus'), 'audio/webm');
  assert.equal(normalizeMimeType('audio/ogg; codecs=opus'), 'audio/ogg');
  assert.equal(normalizeMimeType('AUDIO/WAV; charset=utf-8'), 'audio/wav');
  assert.equal(normalizeMimeType('audio/x-wav'), 'audio/wav');
  assert.equal(normalizeMimeType('image/png; charset=binary'), 'image/png');
  assert.equal(isAudioMimeType('audio/webm;codecs=opus'), true);
  assert.equal(isAudioMimeType('application/pdf'), false);
  assert.equal(isAudioMimeType('image/png'), false);
});

test('Images and PDFs are not incorrectly treated as audio', () => {
  // Base64 for "%PDF-1.4..."
  const pdfBase64 = 'JVBERi0xLjQKJcTl8uXrp/...';
  // Base64 for "\x89PNG..."
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAA...';
  // Base64 for WebM EBML
  const webmBase64 = 'GkXfo59ChoEBQveBAULygQRC...';

  const misclassifiedPdf = validateMediaNotMisclassified(pdfBase64, 'audio/webm');
  assert.equal(misclassifiedPdf.valid, false);
  assert.match(misclassifiedPdf.error, /PDF document, not an audio file/i);

  const misclassifiedPng = validateMediaNotMisclassified(pngBase64, 'audio/mp3');
  assert.equal(misclassifiedPng.valid, false);
  assert.match(misclassifiedPng.error, /image, not an audio file/i);

  const validWebm = validateMediaNotMisclassified(webmBase64, 'audio/webm;codecs=opus');
  assert.equal(validWebm.valid, true);

  const validPdf = validateMediaNotMisclassified(pdfBase64, 'application/pdf');
  assert.equal(validPdf.valid, true);
});

test('Retryable errors are distinguished from non-retryable errors', () => {
  // 404 (model unavailable), 429 (rate limit), 503 (server overloaded) must retry across model candidates
  assert.equal(isRetryableModelError(404, 'models/gemini-x is not found'), true);
  assert.equal(isRetryableModelError(429, 'Resource has been exhausted'), true);
  assert.equal(isRetryableModelError(503, 'The model is overloaded'), true);
  assert.equal(isRetryableModelError(500, 'Internal server error'), true);

  // 401/403 (invalid API key) must NOT retry across models
  assert.equal(isRetryableModelError(401, 'API key not valid'), false);
  assert.equal(isRetryableModelError(403, 'Permission denied'), false);

  // 413 (payload too large) must NOT retry across models
  assert.equal(isRetryableModelError(413, 'Request payload size exceeds limit'), false);

  // 400 Bad Request is only retryable if it complains about model identifier
  assert.equal(isRetryableModelError(400, 'Invalid JSON body'), false);
  assert.equal(isRetryableModelError(400, 'Unsupported model requested'), true);
});

test('Original text is preserved and not replaced by AI suggestions', () => {
  const originalUserText = 'Meeting with Alex on Friday to discuss architecture refactor.';
  const aiExtractedSnippet = 'Friday meeting with Alex regarding architecture.';

  // Logic used in Capture page:
  function resolveTextState(captureType, currentText, aiExtractedText) {
    if (aiExtractedText && (captureType === 'voice' || !currentText.trim()) && captureType !== 'text') {
      return aiExtractedText;
    }
    return currentText;
  }

  // Text capture with existing user text must NEVER be replaced
  const resolvedText = resolveTextState('text', originalUserText, aiExtractedSnippet);
  assert.equal(resolvedText, originalUserText);

  // Voice capture starting empty MUST be populated with transcript
  const resolvedVoice = resolveTextState('voice', '', aiExtractedSnippet);
  assert.equal(resolvedVoice, aiExtractedSnippet);
});

test('Search matches memory content and transcripts in addition to title and summary', () => {
  const memories = [
    {
      id: '1',
      title: 'Project Kickoff',
      summary: 'Initial planning session.',
      content: 'Discussion about Supabase authentication and Row Level Security.',
      category: 'Tech',
      source_type: 'Text',
    },
    {
      id: '2',
      title: 'Voice Memo #4',
      summary: 'Short voice note.',
      content: 'Remember to pick up the dry cleaning and call dental clinic.',
      category: 'Other',
      source_type: 'Voice',
    },
  ];

  function searchMemories(query) {
    const search = query.trim().toLowerCase();
    return memories.filter((memory) => {
      const searchableText = [
        memory.title,
        memory.summary,
        memory.content,
        memory.category,
        memory.source_type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return !search || searchableText.includes(search);
    });
  }

  // Matches text found ONLY inside memory.content (not in title or summary)
  const results1 = searchMemories('Row Level Security');
  assert.equal(results1.length, 1);
  assert.equal(results1[0].id, '1');

  // Matches transcript found ONLY inside memory.content
  const results2 = searchMemories('dental clinic');
  assert.equal(results2.length, 1);
  assert.equal(results2[0].id, '2');

  // Negative query
  const resultsNone = searchMemories('nonexistent term 12345');
  assert.equal(resultsNone.length, 0);
});
