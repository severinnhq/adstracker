

export type Niche = "Pet" | "Health" | "Beauty" | "Babies" | "Tech Gadgets";
export const NICHES: Niche[] = ["Pet", "Health", "Beauty", "Babies", "Tech Gadgets"];

export type AwarenessLevel =
  | "Unaware"
  | "Problem aware"
  | "Solution aware"
  | "Product aware"
  | "Most aware"
  | "Other";

export type TestFocus =
  | "desire"
  | "angle"
  | "awareness"
  | "advertorial"
  | "pricing"
  | "format";

export type FormatType =
  | "UGC"
  | "AI Vid"
  | "VSL"
  | "Slideshow"
  | "Static"
  | "Native Image"
  | "Carousel"
  | "Story"
  | "Other";


export interface Ad {
  id: string;
  campaignId: string;
  waveId?: string | null;  // ← ADD THIS
  name: string;
  desire: string;
  angle: string;
  awareness: AwarenessLevel;
  notes: string;
  format: FormatType;
  testFocus: TestFocus;
  status: "testing" | "winner" | "loser";
  parentId?: string;
  createdAt: string;
  duration: number;
}


export interface Campaign {
  id: string;
  name: string;
  niche: Niche;
  ads: Ad[];
  createdAt: string;
}

export interface CboPhase {
  id: string;
  waveId: string;
  type: "desire" | "angle" | "awareness" | "advertorial" | "format";
  position: number;
  status: "pending" | "running" | "done";
  winnerAds: string[];
  notes: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CboWave {
  id: string;
  campaignId: string;
  name: string;
  status: "active" | "completed" | "archived";
  phases: CboPhase[];
  createdAt: string;
}

export interface CboFolder {
  id: string;
  waveId: string;
  parentId: string | null;
  name: string;
  type: "root" | "desire" | "angle" | "awareness" | "combo" | "copy" | "other";
  desire?: string | null;
  angle?: string | null;
  awareness?: string | null;
  format?: string | null;
  content?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CboItemCopy {
  id: string;
  folderId: string;
  title: string;
  content: string;
  createdAt: string;
}

