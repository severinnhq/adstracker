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
  name: string;
  desire: string;
  angle: string;
  awareness: AwarenessLevel;
  notes: string;
  format: FormatType;
  testFocus: TestFocus;
  status: string;
  parentId?: string;
  createdAt: string;
  duration: number; // days
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
