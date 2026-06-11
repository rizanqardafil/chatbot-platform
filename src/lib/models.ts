export const SUPPORTED_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Affordable)' },
  { id: 'gpt-4o', label: 'GPT-4o (Most Capable)' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Legacy)' },
] as const;

export type ModelId = (typeof SUPPORTED_MODELS)[number]['id'];
