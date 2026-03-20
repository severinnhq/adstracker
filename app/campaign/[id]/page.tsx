"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Campaign,
  Ad,
  AwarenessLevel,
  TestFocus,
  FormatType,
} from "@/types";
import { getCampaign, updateCampaign } from "@/lib/storage";
import Link from "next/link";

const AWARENESS_OPTIONS: AwarenessLevel[] = [
  "Unaware",
  "Problem aware",
  "Solution aware",
  "Product aware",
  "Most aware",
  "Other",
];


const TEST_FOCUS_OPTIONS: { id: TestFocus; label: string; color: string }[] = [
  { id: "desire", label: "Desire", color: "border-orange-500 bg-orange-500/15" },
  { id: "angle", label: "Angle", color: "border-amber-500 bg-amber-500/15" },
  {
    id: "awareness",
    label: "Awareness",
    color: "border-yellow-500 bg-yellow-500/15",
  },
  {
    id: "advertorial",
    label: "Advertorial",
    color: "border-emerald-500 bg-emerald-500/15",
  },
  { id: "format", label: "Format", color: "border-fuchsia-500 bg-fuchsia-500/15" },
];

const FORMAT_OPTIONS: FormatType[] = [
  "UGC",
  "AI Vid",
  "VSL",
  "Slideshow",
  "Static",
  "Native Image",
  "Carousel",
  "Story",
  "Other",
];


function focusColor(f: TestFocus): string {
  switch (f) {
    case "desire":
      return "border-orange-500 bg-orange-500/20 text-orange-200";
    case "angle":
      return "border-amber-500 bg-amber-500/20 text-amber-200";
    case "awareness":
      return "border-yellow-500 bg-yellow-500/20 text-yellow-200";
    case "advertorial":
      return "border-emerald-500 bg-emerald-500/20 text-emerald-200";
    case "format":
      return "border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-200";
    default:
      return "border-zinc-700 bg-zinc-800 text-zinc-300";
  }
}

export default function CampaignPage() {
  const params = useParams() as { id?: string };
  const id = params?.id as string | undefined;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [mounted, setMounted] = useState(false);

  // form state
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [variantParentId, setVariantParentId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState<string>("");
  const [desire, setDesire] = useState<string>("");
  const [angle, setAngle] = useState<string>("");
  const [awareness, setAwareness] = useState<AwarenessLevel>("Problem aware");
  const [notes, setNotes] = useState<string>("");
  const [format, setFormat] = useState<FormatType>("UGC");
  const [formTestFocus, setFormTestFocus] = useState<TestFocus>("desire");

  // global focus filter
  const [globalFocus, setGlobalFocus] = useState<TestFocus | "all">("all");

  // filters
  const [filterDesire, setFilterDesire] = useState<string>("");
  const [filterAngle, setFilterAngle] = useState<string>("");
  const [filterAwareness, setFilterAwareness] =
    useState<AwarenessLevel | "All">("All");
  const [showOnlyWinners, setShowOnlyWinners] = useState(false);

  // delete confirmations
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmVariantDeleteId, setConfirmVariantDeleteId] =
    useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const c = getCampaign(id);
    if (c) setCampaign(c);
    setMounted(true);
  }, [id]);

  if (!mounted) return <div className="min-h-screen bg-zinc-950" />;
  if (!campaign || !id) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Campaign not found</p>
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  const saveCampaign = (c: Campaign) => {
    const copy: Campaign = { ...c, ads: [...c.ads] };
    setCampaign(copy);
    updateCampaign(copy);
  };

  const openNewForm = () => {
    setEditingAd(null);
    setVariantParentId(null);
    setName("");
    setDesire("");
    setAngle("");
    setAwareness("Problem aware");
    setNotes("");
    setFormat("UGC");
    setFormTestFocus("desire");
    setShowForm(true);
  };

  const openVariantForm = (parent: Ad) => {
    setEditingAd(null);
    setVariantParentId(parent.id);
    setName((parent.name || "") + " / Variant");
    setDesire(parent.desire || "");
    setAngle(parent.angle || "");
    setAwareness(parent.awareness || "Problem aware");
    setNotes("");
    setFormat(parent.format || "UGC");
    setFormTestFocus(parent.testFocus || "desire");
    setShowForm(true);
  };

  const openEditForm = (ad: Ad) => {
    setEditingAd(ad);
    setVariantParentId(ad.parentId || null);
    setName(ad.name || "");
    setDesire(ad.desire || "");
    setAngle(ad.angle || "");
    setAwareness(ad.awareness || "Problem aware");
    setNotes(ad.notes || "");
    setFormat(ad.format || "UGC");
    setFormTestFocus(ad.testFocus || "desire");
    setShowForm(true);
  };

  const handleSaveAd = () => {
    const nameTrim = String(name || "").trim();
    const desireTrim = String(desire || "").trim();
    const angleTrim = String(angle || "").trim();
    if (!nameTrim || !desireTrim || !angleTrim) return;

    if (editingAd) {
      const idx = campaign.ads.findIndex((a: Ad) => a.id === editingAd.id);
      if (idx !== -1) {
        const updated: Ad = {
          ...campaign.ads[idx],
          name: nameTrim,
          desire: desireTrim,
          angle: angleTrim,
          awareness,
          notes,
          format,
          testFocus: formTestFocus,
        };
        const copyAds = [...campaign.ads];
        copyAds[idx] = updated;
        saveCampaign({ ...campaign, ads: copyAds });
      }
    } else {
      const newAd: Ad = {
        id:
          Math.random().toString(36).substring(2, 9) +
          "-" +
          Math.random().toString(36).substring(2, 9),
        name: nameTrim,
        desire: desireTrim,
        angle: angleTrim,
        awareness,
        notes,
        format,
        testFocus: formTestFocus,
        status: "testing",
        parentId: variantParentId || undefined,
        createdAt: new Date().toISOString(),
      };
      saveCampaign({ ...campaign, ads: [...campaign.ads, newAd] });
    }

    setShowForm(false);
    setEditingAd(null);
    setVariantParentId(null);
  };

  const setStatus = (adId: string, status: Ad["status"]) => {
    const idx = campaign.ads.findIndex((a: Ad) => a.id === adId);
    if (idx === -1) return;
    const copyAds = [...campaign.ads];
    copyAds[idx] = { ...copyAds[idx], status };
    saveCampaign({ ...campaign, ads: copyAds });
  };

  const actuallyDelete = (parentId: string) => {
    const kept = campaign.ads.filter(
      (a: Ad) => a.id !== parentId && a.parentId !== parentId
    );
    saveCampaign({ ...campaign, ads: kept });
    setConfirmDeleteId(null);
  };

  const deleteVariantOnly = (idToDelete: string) => {
    const kept = campaign.ads.filter((a: Ad) => a.id !== idToDelete);
    saveCampaign({ ...campaign, ads: kept });
    setConfirmVariantDeleteId(null);
  };

  const allAds: Ad[] = campaign.ads || [];

  const filteredAds = allAds.filter((ad: Ad) => {
    if (showOnlyWinners && ad.status !== "winner") return false;
    if (
      filterDesire &&
      !(ad.desire || "")
        .toLowerCase()
        .includes(filterDesire.toLowerCase())
    )
      return false;
    if (
      filterAngle &&
      !(ad.angle || "")
        .toLowerCase()
        .includes(filterAngle.toLowerCase())
    )
      return false;
    if (filterAwareness !== "All" && ad.awareness !== filterAwareness)
      return false;
    // filter by global focus
    if (globalFocus !== "all" && ad.testFocus !== globalFocus) return false;
    return true;
  });

  const mainAds = filteredAds.filter((a: Ad) => !a.parentId);
  const variantsFor = (parentId: string) =>
    filteredAds.filter((a: Ad) => a.parentId === parentId);

  const isGlobalFocus = (key: TestFocus) => globalFocus === key;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* New / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-lg">
            <h2 className="font-bold mb-4">
              {editingAd ? "Edit Ad" : variantParentId ? "New Variant" : "New Ad"}
            </h2>

            <div className="space-y-3 mb-4">
              <input
                value={name || ""}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ad name / label"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                value={desire || ""}
                onChange={(e) => setDesire(e.target.value)}
                placeholder="Desire (e.g. Fear of aging)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                value={angle || ""}
                onChange={(e) => setAngle(e.target.value)}
                placeholder="Angle (e.g. Doctor-proof angle)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Awareness:</span>
                  <select
                    value={awareness}
                    onChange={(e) =>
                      setAwareness(e.target.value as AwarenessLevel)
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {AWARENESS_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Format:</span>
                  <select
                    value={format}
                    onChange={(e) =>
                      setFormat(e.target.value as FormatType)
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {FORMAT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-400">Test focus:</span>
                  <select
                    value={formTestFocus}
                    onChange={(e) =>
                      setFormTestFocus(e.target.value as TestFocus)
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {TEST_FOCUS_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea
                value={notes || ""}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (hooks, copy ideas, etc.)"
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingAd(null);
                  setVariantParentId(null);
                }}
                className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAd}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-sm font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-zinc-500 hover:text-white">
              ← Back
            </Link>
            <h1 className="text-xl font-bold mt-1">{campaign.name}</h1>
          </div>
          <button
            onClick={openNewForm}
            className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium hover:bg-blue-500"
          >
            + New Ad
          </button>
        </div>
      </header>

      {/* Filters + nested list */}
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-wrap gap-3 items-center text-xs">
          <input
            value={filterDesire}
            onChange={(e) => setFilterDesire(e.target.value)}
            placeholder="Filter by desire"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 flex-1 min-w-[140px]"
          />
          <input
            value={filterAngle}
            onChange={(e) => setFilterAngle(e.target.value)}
            placeholder="Filter by angle"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 flex-1 min-w-[140px]"
          />
          <select
            value={filterAwareness}
            onChange={(e) =>
              setFilterAwareness(e.target.value as AwarenessLevel | "All")
            }
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1"
          >
            <option value="All">All awareness</option>
            {AWARENESS_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-zinc-400">
            <input
              type="checkbox"
              checked={showOnlyWinners}
              onChange={(e) => setShowOnlyWinners(e.target.checked)}
              className="accent-blue-500"
            />
            Winners only
          </label>
        </div>

        {/* Global test focus selector (also filters) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-zinc-500 mr-1">
            Show test focus:
          </span>
          <button
            onClick={() => setGlobalFocus("all")}
            className={`px-3 py-1 rounded-full border text-[11px] transition-colors ${
              globalFocus === "all"
                ? "border-white bg-white/10 text-white shadow-sm"
                : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            All
          </button>
          {TEST_FOCUS_OPTIONS.map((opt) => {
            const active = globalFocus === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() =>
                  setGlobalFocus(globalFocus === opt.id ? "all" : opt.id)
                }
                className={`px-3 py-1 rounded-full border text-[11px] transition-colors ${
                  active
                    ? `${opt.color} text-white shadow-sm`
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Nested parent + variants */}
        {mainAds.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-10">
            No ads match the current filters.
          </div>
        ) : (
          <div className="space-y-4">
            {mainAds.map((ad) => {
              const variants = variantsFor(ad.id);

              const statusClass =
                ad.status === "winner"
                  ? "border-green-500/40 bg-green-500/5"
                  : ad.status === "loser"
                  ? "border-red-500/40 bg-red-500/5"
                  : "border-blue-500/30 bg-blue-500/5";

              const barClass =
                ad.status === "winner"
                  ? "bg-green-500"
                  : ad.status === "loser"
                  ? "bg-red-500"
                  : "bg-blue-500";

              const awarenessColor =
                ad.awareness === "Problem aware"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                  : ad.awareness === "Solution aware"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                  : ad.awareness === "Product aware"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                  : ad.awareness === "Most aware"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                  : "border-zinc-600 bg-zinc-800 text-zinc-200";

              return (
                <div
                  key={ad.id}
                  className={`relative border rounded-lg px-4 py-3 ${statusClass}`}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${barClass}`}
                  />
                  <div className="pl-3">
                    {/* parent row */}
                    <div className="flex flex-col md:flex-row md:items-start md:gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* name + focus + status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {ad.status === "winner" && (
                              <span className="text-green-400 text-xs">
                                🏆 Winner
                              </span>
                            )}
                            {ad.status === "loser" && (
                              <span className="text-red-400 text-xs">
                                ✖ Loser
                              </span>
                            )}
                            <span className="font-semibold text-sm break-words">
                              {ad.name}
                            </span>
                          </div>
                          {/* test focus badge - always colorful */}
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${focusColor(
                              ad.testFocus
                            )}`}
                          >
                            ⚡ {ad.testFocus}
                          </span>
                        </div>

                        {/* desire */}
                        <div
                          className={`rounded-md p-3 border ${
                            isGlobalFocus("desire")
                              ? "border-orange-500 bg-orange-500/10"
                              : "border-zinc-800 bg-zinc-900/80"
                          }`}
                        >
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-orange-300 mb-1">
                            Desire
                          </div>
                          <div className="text-xs text-zinc-100 break-words">
                            {ad.desire}
                          </div>
                        </div>

                        {/* angle */}
                        <div
                          className={`rounded-md p-3 border ${
                            isGlobalFocus("angle")
                              ? "border-amber-500 bg-amber-500/10"
                              : "border-zinc-800 bg-zinc-900/80"
                          }`}
                        >
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300 mb-1">
                            Angle
                          </div>
                          <div className="text-xs text-zinc-100 break-words">
                            {ad.angle}
                          </div>
                        </div>

                        {/* awareness + format pills below */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div
                            className={`px-2.5 py-1 rounded-md text-[11px] border ${
                              isGlobalFocus("awareness")
                                ? "border-yellow-500 bg-yellow-500/10 text-yellow-100"
                                : awarenessColor
                            }`}
                          >
                            <span className="font-semibold">Awareness:</span>{" "}
                            {ad.awareness}
                          </div>
                          <div
                            className={`px-2.5 py-1 rounded-md text-[11px] border ${
                              isGlobalFocus("format")
                                ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-100"
                                : "border-zinc-600 bg-zinc-800 text-zinc-200"
                            }`}
                          >
                            <span className="font-semibold">Format:</span>{" "}
                            {ad.format}
                          </div>
                        </div>

                        {/* notes */}
                        {ad.notes && (
                          <div className="rounded-md bg-zinc-900/60 p-2 border border-dashed border-zinc-800">
                            <div className="text-[11px] uppercase text-zinc-500 mb-1">
                              Notes
                            </div>
                            <div className="text-[11px] text-zinc-300 break-words">
                              {ad.notes}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* right column: status + actions */}
                      <div className="mt-3 md:mt-0 flex items-center md:flex-col md:items-end gap-2 flex-shrink-0">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setStatus(ad.id, "winner")}
                            className={`px-2 py-1 rounded text-[11px] ${
                              ad.status === "winner"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-zinc-800 text-zinc-500 hover:text-green-400"
                            }`}
                          >
                            W
                          </button>
                          <button
                            onClick={() => setStatus(ad.id, "loser")}
                            className={`px-2 py-1 rounded text-[11px] ${
                              ad.status === "loser"
                                ? "bg-red-500/30 text-red-300"
                                : "bg-zinc-800 text-zinc-500 hover:text-red-400"
                            }`}
                          >
                            L
                          </button>
                          <button
                            onClick={() => setStatus(ad.id, "testing")}
                            className={`px-2 py-1 rounded text-[11px] ${
                              ad.status === "testing"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-zinc-800 text-zinc-500 hover:text-blue-400"
                            }`}
                          >
                            T
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openVariantForm(ad)}
                            className="px-2 py-1 rounded text-[11px] bg-zinc-800 text-zinc-300 hover:text-white"
                          >
                            + Var
                          </button>
                          <button
                            onClick={() => openEditForm(ad)}
                            className="px-2 py-1 rounded text-[11px] bg-zinc-800 text-zinc-300 hover:text-white"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() =>
                              confirmDeleteId === ad.id
                                ? actuallyDelete(ad.id)
                                : setConfirmDeleteId(ad.id)
                            }
                            className={`px-2 py-1 rounded text-[11px] ${
                              confirmDeleteId === ad.id
                                ? "bg-red-600 text-white"
                                : "bg-zinc-800 text-zinc-500 hover:text-red-400"
                            }`}
                          >
                            {confirmDeleteId === ad.id ? "OK?" : "Del"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* variants: indented to the right */}
                    {variants.length > 0 && (
                      <div className="mt-3 space-y-2 pl-6 md:pl-10">
                        {variants.map((v) => (
                          <div
                            key={v.id}
                            className="flex flex-col md:flex-row md:items-start md:gap-3 text-xs bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                                  Variant
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${focusColor(
                                    v.testFocus
                                  )}`}
                                >
                                  ⚡ {v.testFocus}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] border border-sky-500/60 bg-sky-500/10 text-sky-100">
                                  {v.format}
                                </span>
                                {v.status === "winner" && (
                                  <span className="text-green-400 text-[11px]">
                                    🏆
                                  </span>
                                )}
                                {v.status === "loser" && (
                                  <span className="text-red-400 text-[11px]">
                                    ✖
                                  </span>
                                )}
                                <span className="font-medium break-words">
                                  {v.name}
                                </span>
                              </div>
                              {v.notes && (
                                <div className="text-[11px] text-zinc-300 break-words">
                                  {v.notes}
                                </div>
                              )}
                            </div>
                            <div className="mt-1 md:mt-0 flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => setStatus(v.id, "winner")}
                                className={`px-2 py-1 rounded text-[11px] ${
                                  v.status === "winner"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-zinc-800 text-zinc-500 hover:text-green-400"
                                }`}
                              >
                                W
                              </button>
                              <button
                                onClick={() => setStatus(v.id, "loser")}
                                className={`px-2 py-1 rounded text-[11px] ${
                                  v.status === "loser"
                                    ? "bg-red-500/30 text-red-300"
                                    : "bg-zinc-800 text-zinc-500 hover:text-red-400"
                                }`}
                              >
                                L
                              </button>
                              <button
                                onClick={() => setStatus(v.id, "testing")}
                                className={`px-2 py-1 rounded text-[11px] ${
                                  v.status === "testing"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-zinc-800 text-zinc-500 hover:text-blue-400"
                                }`}
                              >
                                T
                              </button>
                              <button
                                onClick={() => openEditForm(v)}
                                className="px-2 py-1 rounded text-[11px] bg-zinc-800 text-zinc-500 hover:text-white"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() =>
                                  confirmVariantDeleteId === v.id
                                    ? deleteVariantOnly(v.id)
                                    : setConfirmVariantDeleteId(v.id)
                                }
                                className={`px-2 py-1 rounded text-[11px] ${
                                  confirmVariantDeleteId === v.id
                                    ? "bg-red-600 text-white"
                                    : "bg-zinc-800 text-zinc-500 hover:text-red-400"
                                }`}
                              >
                                {confirmVariantDeleteId === v.id ? "OK?" : "✕"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
