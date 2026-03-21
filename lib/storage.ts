import { supabase } from "@/lib/supabaseClient";
import type { Campaign, Ad, AwarenessLevel, TestFocus, FormatType } from "@/types";

// ─── Campaign helpers (homepage) ───

export async function getCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getCampaigns error:", error.message);
    return [];
  }
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
  const payload = {
    name: c.name,
    niche: c.niche,
    created_at: c.createdAt,
  };

  const { data, error } = await supabase
    .from("campaigns")
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    console.error("saveCampaign error:", error?.message);
    throw new Error(error?.message || "Failed to save campaign");
  }

  return {
    id: data.id,
    name: data.name,
    niche: data.niche,
    ads: [],
    createdAt: data.created_at,
  };
}

export async function saveCampaigns(campaigns: Campaign[]): Promise<Campaign[]> {
  if (campaigns.length === 0) return campaigns;
  const last = campaigns[campaigns.length - 1];
  const saved = await saveCampaign(last);
  return [...campaigns.slice(0, -1), saved];
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_campaign_cascade", {
    campaign_id: id,
  });

  if (error) {
    console.error("deleteCampaign error:", error.message);
    throw new Error(error.message);
  }
}

// ─── Ad helpers (campaign detail page) ───

export async function fetchCampaignWithAds(id: string): Promise<Campaign | null> {
  const { data: campaignRow, error: cErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (cErr || !campaignRow) {
    console.error("fetchCampaignWithAds error:", cErr?.message);
    return null;
  }

  const { data: adRows, error: aErr } = await supabase
    .from("ads")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  if (aErr) {
    console.error("fetchCampaignWithAds ads error:", aErr.message);
    throw new Error(aErr.message);
  }

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
    })) ?? [];

  return {
    id: campaignRow.id,
    name: campaignRow.name,
    niche: campaignRow.niche,
    ads,
    createdAt: campaignRow.created_at,
  };
}

export async function insertAd(campaignId: string, ad: Omit<Ad, "id">): Promise<Ad> {
  const payload = {
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
  };

  const { data, error } = await supabase
    .from("ads")
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    console.error("insertAd error:", error?.message);
    throw new Error(error?.message || "Failed to insert ad");
  }

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
  };
}

export async function updateAd(ad: Ad): Promise<void> {
  const payload = {
    name: ad.name,
    desire: ad.desire,
    angle: ad.angle,
    awareness: ad.awareness,
    notes: ad.notes,
    format: ad.format,
    test_focus: ad.testFocus,
    status: ad.status,
    parent_id: ad.parentId ?? null,
  };

  const { error } = await supabase
    .from("ads")
    .update(payload)
    .eq("id", ad.id);

  if (error) {
    console.error("updateAd error:", error.message);
    throw new Error(error.message);
  }
}

export async function setAdStatus(adId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("ads")
    .update({ status })
    .eq("id", adId);

  if (error) {
    console.error("setAdStatus error:", error.message);
    throw new Error(error.message);
  }
}

export async function deleteAdWithVariants(adId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_ad_with_variants", {
    ad_id: adId,
  });

  if (error) {
    console.error("deleteAdWithVariants error:", error.message);
    throw new Error(error.message);
  }
}

export async function deleteSingleAd(adId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_single_ad", {
    ad_id: adId,
  });

  if (error) {
    console.error("deleteSingleAd error:", error.message);
    throw new Error(error.message);
  }
}
