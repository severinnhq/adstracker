export type Niche = "Pet" | "Health" | "Beauty" | "Babies" | "Tech Gadgets";
export const NICHES: Niche[] = ["Pet", "Health", "Beauty", "Babies", "Tech Gadgets"];

export type AwarenessLevel =
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

export type FormatType = "UGC" | "Static" | "Carousel" | "Story" | "Other";

export interface Ad {
  id: string;
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
}

export interface Campaign {
  id: string;
  name: string;
  niche: Niche;
  ads: Ad[];
  createdAt: string;
}
