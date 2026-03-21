import type {
  Campaign,
  Ad,
  AwarenessLevel,
  TestFocus,
  FormatType,
} from "@/types";

async function api(action: string, params: any = {}) {
  const res = await fetch("/api/supabase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "API error");
  return json.data;
}

// ─── Campaign helpers ───

export async function getCampaigns(): Promise<Campaign[]> {
  const data = await api("getCampaigns");
  if (!data) return [];

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    niche: row.niche,
    ads: [],
    createdAt: row.created_at,
  }));
}

export async function saveCampaign(c: Campaign): Promise<Campaign> {
  const data = await api("saveCampaign", {
    payload: {
      name: c.name,
      niche: c.niche,
      created_at: c.createdAt,
    },
  });

  return {
    id: data.id,
    name: data.name,
    niche: data.niche,
    ads: [],
    createdAt: data.created_at,
  };
}

export async function saveCampaigns(
  campaigns: Campaign[]
): Promise<Campaign[]> {
  if (campaigns.length === 0) return campaigns;
  const last = campaigns[campaigns.length - 1];
  const saved = await saveCampaign(last);
  return [...campaigns.slice(0, -1), saved];
}

export async function deleteCampaign(id: string): Promise<void> {
  await api("rpc", { fn: "delete_campaign_cascade", args: { campaign_id: id } });
}

// ─── Ad helpers ───

export async function fetchCampaignWithAds(
  id: string
): Promise<Campaign | null> {
  let campaignRow: any;
  try {
    campaignRow = await api("fetchCampaign", { id });
  } catch {
    return null;
  }
  if (!campaignRow) return null;

  const adRows = await api("fetchAds", { id });

  const ads: Ad[] =
    adRows?.map((row: any) => ({
      id: row.id,
      name: row.name,
      desire: row.desire,
      angle: row.angle,
      awareness: row.awareness as AwarenessLevel,
      notes: row.notes ?? "",
      format: (row.format ?? "UGC") as FormatType,
      testFocus: (row.test_focus ?? "desire") as TestFocus,
      status: row.status,
      parentId: row.parent_id ?? undefined,
      createdAt: row.created_at,
      duration: row.duration ?? 7,
    })) ?? [];

  return {
    id: campaignRow.id,
    name: campaignRow.name,
    niche: campaignRow.niche,
    ads,
    createdAt: campaignRow.created_at,
  };
}

export async function insertAd(
  campaignId: string,
  ad: Omit<Ad, "id">
): Promise<Ad> {
  const data = await api("insertAd", {
    payload: {
      campaign_id: campaignId,
      name: ad.name,
      desire: ad.desire,
      angle: ad.angle,
      awareness: ad.awareness,
      notes: ad.notes,
      format: ad.format,
      test_focus: ad.testFocus,
      status: ad.status,
      parent_id: ad.parentId ?? null,
      created_at: ad.createdAt,
      duration: ad.duration,
    },
  });

  return {
    id: data.id,
    name: data.name,
    desire: data.desire,
    angle: data.angle,
    awareness: data.awareness as AwarenessLevel,
    notes: data.notes ?? "",
    format: (data.format ?? "UGC") as FormatType,
    testFocus: (data.test_focus ?? "desire") as TestFocus,
    status: data.status,
    parentId: data.parent_id ?? undefined,
    createdAt: data.created_at,
    duration: data.duration ?? 7,
  };
}

export async function updateAd(ad: Ad): Promise<void> {
  await api("rpc", {
    fn: "update_ad",
    args: {
      ad_id: ad.id,
      ad_name: ad.name,
      ad_desire: ad.desire,
      ad_angle: ad.angle,
      ad_awareness: ad.awareness,
      ad_notes: ad.notes,
      ad_format: ad.format,
      ad_test_focus: ad.testFocus,
      ad_status: ad.status,
      ad_parent_id: ad.parentId ?? null,
      ad_duration: ad.duration,
      ad_created_at: ad.createdAt,
    },
  });
}

export async function setAdStatus(adId: string, status: string): Promise<void> {
  await api("rpc", {
    fn: "set_ad_status",
    args: { ad_id: adId, new_status: status },
  });
}

export async function deleteAdWithVariants(adId: string): Promise<void> {
  await api("rpc", { fn: "delete_ad_with_variants", args: { ad_id: adId } });
}

export async function deleteSingleAd(adId: string): Promise<void> {
  await api("rpc", { fn: "delete_single_ad", args: { ad_id: adId } });
}
