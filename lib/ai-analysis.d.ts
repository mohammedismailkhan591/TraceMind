export const allowedMimeTypes: Set<string>;
export const allowedAudioMimeTypes: Set<string>;

export function getGeminiModelCandidates(): string[];
export function isAudioMimeType(mimeType: string | undefined): boolean;
export function buildAnalysisPrompt(options: {
  captureType?: string;
  text?: string;
  link?: string;
  fileBase64?: string;
  mimeType?: string;
}): string;
export function normalizeAnalysisResult(result?: Record<string, unknown>): {
  title: string;
  category: string;
  summary: string;
  extractedText: string;
  deadlineISO: string | null;
  tags: string[];
  isImportant: boolean;
};
