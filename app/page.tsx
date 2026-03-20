"use client";

import { useState, useEffect } from "react";
import { Campaign, NICHES, Niche } from "@/types";
import { getCampaigns, saveCampaigns, deleteCampaign } from "@/lib/storage";
import { generateId, nicheEmojis } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState<Niche>("Health");
  const [filter, setFilter] = useState<Niche | "All">("All");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCampaigns(getCampaigns());
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-zinc-950" />;

  const filtered =
    filter === "All" ? campaigns : campaigns.filter((c) => c.niche === filter);

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const c: Campaign = {
      id: generateId(),
      name: trimmed,
      niche,
      ads: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...campaigns, c];
    setCampaigns(updated);
    saveCampaigns(updated);
    setName("");
    setShowNew(false);
  };

  const remove = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!window.confirm("Delete this campaign?")) return;
    deleteCampaign(id);
    setCampaigns(getCampaigns());
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">🎯 Ad Tracker</h1>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium hover:bg-blue-500"
          >
            + New Campaign
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter("All")}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === "All"
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            All
          </button>
          {NICHES.map((n) => (
            <button
              key={n}
              onClick={() => setFilter(filter === n ? "All" : n)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                filter === n
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {nicheEmojis[n]} {n}
            </button>
          ))}
        </div>

        {showNew && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-sm">
              <h2 className="font-bold mb-4">New Campaign</h2>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Campaign name"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-3 gap-2 mb-4">
                {NICHES.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNiche(n)}
                    className={`px-2 py-1.5 rounded-lg text-xs border ${
                      niche === n
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    {nicheEmojis[n]} {n}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNew(false)}
                  className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  onClick={create}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-sm font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-4xl mb-3">📊</p>
            <p>No campaigns yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const ads = c.ads || [];
              const winners = ads.filter((a) => a.status === "winner").length;
              const testing = ads.filter((a) => a.status === "testing").length;
              return (
                <Link
                  key={c.id}
                  href={`/campaign/${c.id}`}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 hover:border-zinc-600 transition-all group"
                >
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">
                      {nicheEmojis[c.niche]} {c.niche}
                    </div>
                    <div className="font-semibold group-hover:text-blue-400 transition-colors">
                      {c.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-zinc-500">
                      <div>{ads.length} ads</div>
                      {winners > 0 && (
                        <div className="text-green-400">{winners} winners</div>
                      )}
                      {testing > 0 && (
                        <div className="text-blue-400">{testing} testing</div>
                      )}
                    </div>
                    <button
                      onClick={(e) => remove(c.id, e)}
                      className="text-zinc-600 hover:text-red-400 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
