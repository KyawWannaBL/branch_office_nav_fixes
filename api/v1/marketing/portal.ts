import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/serverSupabase";

function send(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

type Row = Record<string, any>;

async function readTableSafe(table: string, warnings: string[], limit = 500, order = "updated_at"): Promise<Row[]> {
  try {
    let query = supabaseAdmin.from(table).select("*");
    if (order === "created_at") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("updated_at", { ascending: false });
    }
    const { data, error } = await query.limit(limit);
    if (error) {
      warnings.push(`${table}: ${error.message}`);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    warnings.push(`${table}: ${error?.message || "read failed"}`);
    return [];
  }
}

function countBy(rows: Row[], pick: (row: Row) => string) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const key = pick(row);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });

    const warnings: string[] = [];

    const [
      campaigns,
      leads,
      assets,
      broadcasts,
      walletCredits,
      pickups,
      parties,
    ] = await Promise.all([
      readTableSafe("marketing_campaigns", warnings, 300, "updated_at"),
      readTableSafe("marketing_leads", warnings, 300, "updated_at"),
      readTableSafe("marketing_assets", warnings, 300, "created_at"),
      readTableSafe("broadcast_jobs", warnings, 300, "created_at"),
      readTableSafe("merchant_wallet_credits", warnings, 300, "created_at"),
      readTableSafe("pickups", warnings, 1200, "created_at"),
      readTableSafe("parties", warnings, 1200, "created_at"),
    ]);

    let deliveries = await readTableSafe("delivery_orders", warnings, 2500, "created_at");
    if (!deliveries.length) {
      deliveries = await readTableSafe("deliveries", warnings, 2500, "created_at");
    }

    const activeCampaigns = campaigns.filter((x) => String(x.status || "").toUpperCase() === "ACTIVE").length;
    const openLeads = leads.filter((x) => !["ACTIVE_MERCHANT", "WON", "LOST"].includes(String(x.lead_status || "").toUpperCase())).length;
    const verifiedAssets = assets.filter((x) => !!x.is_verified).length;
    const queuedBroadcasts = broadcasts.filter((x) => String(x.status || "").toUpperCase() === "QUEUED").length;

    const originDensity = countBy(pickups, (row) => String(row.pickup_township || row.sender_township || ""));
    const destinationDensity = countBy(deliveries, (row) => String(row.receiver_township || row.township || ""));
    const merchantVolume = countBy(
      deliveries.map((row) => ({
        merchant_name: row.merchant_name || row.sender_name || row.customer_name || "",
      })),
      (row) => String(row.merchant_name || "")
    );

    const merchantWalletExposure = walletCredits.reduce((sum, row) => sum + Number(row.credit_amount || 0), 0);

    const campaignIdeas = [
      {
        title: "Bago Route Launch",
        rationale: "Top emerging origin focus from pickup distribution.",
        target: originDensity[0]?.name || "Bago",
      },
      {
        title: "East Dagon Density Push",
        rationale: "High inbound density suggests outbound pickup opportunity.",
        target: destinationDensity[0]?.name || "East Dagon",
      },
      {
        title: "Merchant Volume Cashback",
        rationale: "High-volume merchants can be retained with automatic wallet credits.",
        target: merchantVolume[0]?.name || "Top Merchant",
      },
    ];

    return send(res, 200, {
      ok: true,
      data: {
        kpis: {
          active_campaigns: activeCampaigns,
          open_leads: openLeads,
          verified_assets: verifiedAssets,
          queued_broadcasts: queuedBroadcasts,
          merchant_wallet_exposure: merchantWalletExposure,
        },
        campaigns,
        leads,
        assets,
        broadcasts,
        wallet_credits: walletCredits,
        analytics: {
          origin_density: originDensity,
          destination_density: destinationDensity,
          merchant_volume: merchantVolume,
          campaign_ideas: campaignIdeas,
        },
        merchants: parties.filter((x) =>
          ["MERCHANT", "ONLINE_STORE"].includes(String(x.party_type || "").toUpperCase())
        ),
        warnings,
      },
    });
  } catch (error: any) {
    return send(res, 500, { error: error?.message || "Marketing portal failed" });
  }
}
