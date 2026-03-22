import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, params } = body;

  try {
    let result: any;

    switch (action) {
      case "getCampaigns":
        result = await supabase
          .from("campaigns")
          .select("*")
          .order("created_at", { ascending: true });
        break;

      case "fetchFolders":
        result = await supabase
          .from("cbo_folders")
          .select("*")
          .eq("wave_id", params.waveId)
          .order("created_at", { ascending: true });
        break;

      case "insertFolder":
        result = await supabase
          .from("cbo_folders")
          .insert(params.payload)
          .select()
          .single();
        break;

      case "deleteFolder":
        result = await supabase
          .from("cbo_folders")
          .delete()
          .eq("id", params.id);
        break;

      case "saveCampaign":
        result = await supabase
          .from("campaigns")
          .insert(params.payload)
          .select()
          .single();
        break;

      case "fetchCampaign":
        result = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", params.id)
          .single();
        break;

      case "fetchAds":
        result = await supabase
          .from("ads")
          .select("*")
          .eq("campaign_id", params.id)
          .order("created_at", { ascending: true });
        break;

      case "insertAd":
        result = await supabase
          .from("ads")
          .insert(params.payload)
          .select()
          .single();
        break;

      case "fetchWaves":
        result = await supabase
          .from("cbo_waves")
          .select("*")
          .eq("campaign_id", params.campaignId)
          .order("created_at", { ascending: true });
        break;

      case "fetchPhases":
        result = await supabase
          .from("cbo_phases")
          .select("*")
          .eq("wave_id", params.waveId)
          .order("position", { ascending: true });
        break;

      case "fetchAllPhases":
        result = await supabase
          .from("cbo_phases")
          .select("*")
          .in("wave_id", params.waveIds)
          .order("position", { ascending: true });
        break;

      case "updateFolder":
        result = await supabase
          .from("cbo_folders")
          .update(params.payload)
          .eq("id", params.id)
          .select()
          .single();
        break;

      case "fetchItemCopies":
        result = await supabase
          .from("cbo_item_copies")
          .select("*")
          .eq("folder_id", params.folderId)
          .order("created_at", { ascending: true });
        break;

      case "insertItemCopy":
        result = await supabase
          .from("cbo_item_copies")
          .insert(params.payload)
          .select()
          .single();
        break;

      case "updateItemCopy":
        result = await supabase
          .from("cbo_item_copies")
          .update(params.payload)
          .eq("id", params.id)
          .select()
          .single();
        break;

      case "deleteItemCopy":
        result = await supabase
          .from("cbo_item_copies")
          .delete()
          .eq("id", params.id);
        break;

      case "insertAdCopies":
        result = await supabase
          .from("ad_copies")
          .insert(params.rows)
          .select();
        break;

      case "fetchAdCopies":
        result = await supabase
          .from("ad_copies")
          .select("copy_id")
          .eq("ad_id", params.adId);
        break;

      // NEW: deleteCampaignCascade – do the cascade delete in JS instead of RPC
      case "deleteCampaignCascade": {
        const campaignId = params.campaignId as string;

        // 1) Find all ads for this campaign
        const { data: ads, error: adsErr } = await supabase
          .from("ads")
          .select("id")
          .eq("campaign_id", campaignId);

        if (adsErr) throw adsErr;

        const adIds = (ads || []).map((a: any) => a.id);

        // 2) Delete ad_copies linked to those ads
        if (adIds.length > 0) {
          const { error: delCopiesErr } = await supabase
            .from("ad_copies")
            .delete()
            .in("ad_id", adIds);
          if (delCopiesErr) throw delCopiesErr;
        }

        // 3) Delete ads
        const { error: delAdsErr } = await supabase
          .from("ads")
          .delete()
          .eq("campaign_id", campaignId);
        if (delAdsErr) throw delAdsErr;

        // 4) Find all waves for this campaign
        const { data: waves, error: wavesErr } = await supabase
          .from("cbo_waves")
          .select("id")
          .eq("campaign_id", campaignId);
        if (wavesErr) throw wavesErr;

        const waveIds = (waves || []).map((w: any) => w.id);

        // 5) Delete phases for those waves
        if (waveIds.length > 0) {
          const { error: delPhasesErr } = await supabase
            .from("cbo_phases")
            .delete()
            .in("wave_id", waveIds);
          if (delPhasesErr) throw delPhasesErr;
        }

        // 6) Delete waves
        const { error: delWavesErr } = await supabase
          .from("cbo_waves")
          .delete()
          .eq("campaign_id", campaignId);
        if (delWavesErr) throw delWavesErr;

        // 7) Finally delete the campaign
        const { error: delCampErr } = await supabase
          .from("campaigns")
          .delete()
          .eq("id", campaignId);
        if (delCampErr) throw delCampErr;

        result = { data: null, error: null };
        break;
      }

      case "rpc":
        result = await supabase.rpc(params.fn, params.args);
        break;

      default:
        return NextResponse.json(
          { error: { message: "Unknown action" } },
          { status: 400 }
        );
    }

    return NextResponse.json({ data: result.data, error: result.error });
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { message: err.message } },
      { status: 500 }
    );
  }
}
