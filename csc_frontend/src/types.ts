export type { Case } from "./types/case";


export interface EvidenceMedia {
  id: number;
  evidence: number;
  file: string;
  file_type: "image" | "video" | "document";
  uploaded_at: string;
}

export interface Evidence {
  id: number;
  case: number;
  evidence_code: string;
  evidence_type: "physical" | "digital" | "document" | "biological" | "other";
  description: string;
  collector: number | null;
  collector_username: string | null;
  collected_at: string;
  created_at: string;
  media: EvidenceMedia[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
