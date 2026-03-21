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
