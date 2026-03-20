import { Campaign } from "@/types";

const KEY = "ad-tracker-campaigns";

export function getCampaigns(): Campaign[] {
  if (typeof window === "undefined") return [];
  const d = window.localStorage.getItem(KEY);
  if (!d) return [];
  try {
    return JSON.parse(d) as Campaign[];
  } catch {
    return [];
  }
}

export function saveCampaigns(campaigns: Campaign[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(campaigns));
}

export function getCampaign(id: string): Campaign | undefined {
  return getCampaigns().find((c) => c.id === id);
}

export function updateCampaign(campaign: Campaign) {
  const all = getCampaigns();
  const idx = all.findIndex((c) => c.id === campaign.id);
  if (idx !== -1) {
    all[idx] = campaign;
  } else {
    all.push(campaign);
  }
  saveCampaigns(all);
}

export function deleteCampaign(id: string) {
  const all = getCampaigns().filter((c) => c.id !== id);
  saveCampaigns(all);
}
