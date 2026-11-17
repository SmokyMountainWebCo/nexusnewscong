export const TOKENS: string[];
export const LOOKS: Record<string, {
  label: string;
  source: string[];
  fixed?: Record<string, string>;
  chromaMax?: number;
  light?: Record<string, unknown>;
  exposure?: number;
  post?: Record<string, number>;
}>;
export const GRADES: Record<string, {
  contrast: number;
  pivot: number;
  lift: number;
  shoulder: number;
  saturation: number;
  shadowTint: string;
  shadowAmt: number;
  highTint: string;
  highAmt: number;
}>;
