import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAnalysisPrompt, getGeminiModelCandidates, normalizeAnalysisResult } from '../lib/ai-analysis.js';

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

