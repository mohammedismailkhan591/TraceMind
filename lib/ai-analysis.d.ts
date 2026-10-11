export const allowedMimeTypes: Set<string>;
export const allowedAudioMimeTypes: Set<string>;

export function normalizeMimeType(mimeType: string | undefined): string;
export function isAudioMimeType(mimeType: string | undefined): boolean;
export function validateMediaNotMisclassified(
  fileBase64: string,
  declaredMime: string
): { valid: boolean; error?: string };
export function isRetryableModelError(status: number | undefined, providerMessage: string): boolean;
export function getGeminiModelCandidates(): string[];

export interface BuildAnalysisPromptOptions {
  captureType?: string;
  text?: string;
  link?: string;
  fileBase64?: string;
  mimeType?: string;
}

export function buildAnalysisPrompt(options: BuildAnalysisPromptOptions): string;

export interface AnalysisResult {
  title: string;
  category: string;
  summary: string;
  extractedText: string;
  deadlineISO: string | null;
  tags: string[];
  isImportant: boolean;
}

export function normalizeAnalysisResult(result?: Record<string, unknown>): AnalysisResult;
