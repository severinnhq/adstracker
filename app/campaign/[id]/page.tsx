"use client";

export const dynamic = "force-dynamic";
import { fetchAdCopies } from "@/lib/storage";





import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Campaign, Ad, AwarenessLevel, TestFocus, FormatType,
  CboWave, CboPhase, CboFolder, CboItemCopy
} from "@/types";
import {
  fetchCampaignWithAds, insertAd, updateAd, setAdStatus,
  deleteAdWithVariants, deleteSingleAd, fetchWaves, createWave,
  updatePhase, deleteWave, updateWaveStatus, fetchFolders,
} from "@/lib/storage";
import Link from "next/link";

const AWARENESS_OPTIONS: AwarenessLevel[] = [
  "Unaware","Problem aware","Solution aware","Product aware","Most aware","Other",
];
const TEST_FOCUS_OPTIONS: { id: TestFocus; label: string; color: string }[] = [
  { id: "desire", label: "Desire", color: "border-orange-500 bg-orange-500/15" },
  { id: "angle", label: "Angle", color: "border-amber-500 bg-amber-500/15" },
  { id: "awareness", label: "Awareness", color: "border-yellow-500 bg-yellow-500/15" },
  { id: "advertorial", label: "Advertorial", color: "border-emerald-500 bg-emerald-500/15" },
  { id: "format", label: "Format", color: "border-fuchsia-500 bg-fuchsia-500/15" },
];
const FORMAT_OPTIONS: FormatType[] = [
  "UGC","AI Vid","VSL","Slideshow","Static","Native Image","Carousel","Story","Other",
];
const DURATION_OPTIONS = [3, 5, 7, 10, 14, 21, 30];
const PHASE_LABELS: Record<string, string> = {
  desire: "🎯 Desire", angle: "📐 Angle", awareness: "👁 Awareness",
  advertorial: "📰 Advertorial", format: "🎬 Format",
};
const PHASE_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  desire: { border: "border-orange-500", bg: "bg-orange-500", text: "text-orange-300" },
  angle: { border: "border-amber-500", bg: "bg-amber-500", text: "text-amber-300" },
  awareness: { border: "border-yellow-500", bg: "bg-yellow-500", text: "text-yellow-300" },
  advertorial: { border: "border-emerald-500", bg: "bg-emerald-500", text: "text-emerald-300" },
  format: { border: "border-fuchsia-500", bg: "bg-fuchsia-500", text: "text-fuchsia-300" },
};

function focusColor(f: TestFocus): string {
  switch (f) {
    case "desire": return "border-orange-500 bg-orange-500/20 text-orange-200";
    case "angle": return "border-amber-500 bg-amber-500/20 text-amber-200";
    case "awareness": return "border-yellow-500 bg-yellow-500/20 text-yellow-200";
    case "advertorial": return "border-emerald-500 bg-emerald-500/20 text-emerald-200";
    case "format": return "border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-200";
    default: return "border-zinc-700 bg-zinc-800 text-zinc-300";
  }
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getAdProgress(ad: Ad) {
  const start = new Date(ad.createdAt).getTime();
  const now = Date.now();
  const elapsedMs = now - start;
  const totalMs = ad.duration * 24 * 60 * 60 * 1000;
  const totalHoursElapsed = Math.floor(elapsedMs / (1000 * 60 * 60));
  const rawRemainingHours = Math.max(ad.duration * 24 - totalHoursElapsed, 0);
  const daysLeft = rawRemainingHours > 48 ? 3 : rawRemainingHours > 24 ? 2 : rawRemainingHours > 0 ? 1 : 0;
  const percent = Math.min(Math.round((elapsedMs / totalMs) * 100), 100);
  const daysPassed = Math.min(ad.duration, Math.floor(totalHoursElapsed / 24));
  return { daysPassed, totalHoursElapsed, daysLeft, hoursLeft: rawRemainingHours, percent, isComplete: rawRemainingHours === 0 };
}

function ProgressBar({ ad }: { ad: Ad }) {
  const { daysPassed, totalHoursElapsed, daysLeft, hoursLeft, percent, isComplete } = getAdProgress(ad);
  const barColor = isComplete ? "bg-green-500" : percent > 66 ? "bg-yellow-500" : "bg-blue-500";
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
        <span>Day {daysPassed}/{ad.duration} · {totalHoursElapsed}h elapsed</span>
        <span>{isComplete ? <span className="text-green-400 font-semibold">✓ Complete</span> : <span>{daysLeft}d · {hoursLeft}h left</span>}</span>
      </div>
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        {Array.from({ length: ad.duration }, (_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < daysPassed ? barColor : "bg-zinc-700"}`} title={`Day ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

function PhaseBlock({ phase, allAds, onUpdate }: { phase: CboPhase; allAds: Ad[]; onUpdate: (phaseId: string, status: string, winnerAds: string[], notes: string) => void }) {
  const [expanded, setExpanded] = useState(phase.status === "running");
  const [selectedWinners, setSelectedWinners] = useState<string[]>(phase.winnerAds);
  const [phaseNotes, setPhaseNotes] = useState(phase.notes);
  const [customWinner, setCustomWinner] = useState("");
  const colors = PHASE_COLORS[phase.type] || PHASE_COLORS.desire;
  const statusBg = phase.status === "done" ? "bg-green-500/20 border-green-500/40" : phase.status === "running" ? `bg-blue-500/20 ${colors.border}` : "bg-zinc-800/50 border-zinc-700";
  const toggleWinner = (adId: string) => setSelectedWinners((prev) => prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId]);
  const addCustomWinner = () => { const t = customWinner.trim(); if (t && !selectedWinners.includes(t)) { setSelectedWinners((p) => [...p, t]); setCustomWinner(""); } };
  const removeWinner = (w: string) => setSelectedWinners((p) => p.filter((id) => id !== w));
  const getAdName = (id: string) => { const ad = allAds.find((a) => a.id === id); return ad ? ad.name : id; };

  return (
    <div className={`border rounded-lg p-3 ${statusBg} transition-all`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${colors.text}`}>{PHASE_LABELS[phase.type]}</span>
          {phase.status === "done" && <span className="text-[10px] text-green-400 font-semibold">✓ Done</span>}
          {phase.status === "running" && <span className="text-[10px] text-blue-400 font-semibold animate-pulse">● Running</span>}
          {phase.status === "pending" && <span className="text-[10px] text-zinc-500">Pending</span>}
        </div>
        <div className="flex items-center gap-2">
          {phase.winnerAds.length > 0 && <span className="text-[10px] text-green-400">🏆 {phase.winnerAds.length} winner{phase.winnerAds.length > 1 ? "s" : ""}</span>}
          <span className="text-zinc-500 text-xs">{expanded ? "▼" : "▶"}</span>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            {["pending", "running", "done"].map((s) => (
              <button key={s} onClick={() => onUpdate(phase.id, s, selectedWinners, phaseNotes)}
                className={`px-3 py-1 rounded text-[11px] border ${phase.status === s ? (s === "done" ? "bg-green-600 text-white border-green-500" : s === "running" ? "bg-blue-600 text-white border-blue-500" : "bg-zinc-700 text-white border-zinc-500") : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white"}`}>
                {s === "pending" ? "Pending" : s === "running" ? "▶ Start" : "✓ Complete"}
              </button>
            ))}
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block mb-1">Pick winners from ads:</span>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {allAds.map((ad) => (
                <label key={ad.id} className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer ${selectedWinners.includes(ad.id) ? "bg-green-500/15 text-green-300" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
                  <input type="checkbox" checked={selectedWinners.includes(ad.id)} onChange={() => toggleWinner(ad.id)} className="accent-green-500" />
                  {ad.name}<span className="text-[10px] text-zinc-600 ml-auto">{ad.testFocus}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 block mb-1">Or type a custom winner:</span>
            <div className="flex gap-2">
              <input value={customWinner} onChange={(e) => setCustomWinner(e.target.value)} placeholder="Ad name or ID..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500" onKeyDown={(e) => { if (e.key === "Enter") addCustomWinner(); }} />
              <button onClick={addCustomWinner} className="px-3 py-1 rounded-lg bg-zinc-700 text-xs text-zinc-300 hover:text-white">Add</button>
            </div>
          </div>
          {selectedWinners.length > 0 && (
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Selected winners:</span>
              <div className="flex flex-wrap gap-1">
                {selectedWinners.map((w) => (
                  <span key={w} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-300 border border-green-500/30">
                    🏆 {getAdName(w)}<button onClick={() => removeWinner(w)} className="text-green-400 hover:text-red-400 ml-0.5">✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <textarea value={phaseNotes} onChange={(e) => setPhaseNotes(e.target.value)} placeholder="Phase notes / learnings..." rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 resize-none" />
          <button onClick={() => onUpdate(phase.id, phase.status, selectedWinners, phaseNotes)} className="w-full py-1.5 rounded-lg bg-blue-600 text-xs font-medium hover:bg-blue-500">Save Phase</button>
        </div>
      )}
    </div>
  );
}

function WaveCard({ wave, allAds, onUpdatePhase, onDeleteWave, onCompleteWave }: { wave: CboWave; allAds: Ad[]; onUpdatePhase: (pid: string, s: string, w: string[], n: string) => void; onDeleteWave: (wid: string) => void; onCompleteWave: (wid: string) => void }) {
  const [expanded, setExpanded] = useState(wave.status === "active");
  const currentPhaseIdx = wave.phases.findIndex((p) => p.status === "running");
  const nextPendingIdx = wave.phases.findIndex((p) => p.status === "pending");
  const allDone = wave.phases.every((p) => p.status === "done");
  const doneCount = wave.phases.filter((p) => p.status === "done").length;

  return (
    <div className={`border rounded-xl p-4 ${wave.status === "completed" ? "border-green-500/30 bg-green-500/5" : wave.status === "archived" ? "border-zinc-700 bg-zinc-800/30 opacity-60" : "border-zinc-700 bg-zinc-900"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpanded(!expanded)}>
          <span className="text-sm font-bold">{wave.name}</span>
          {wave.status === "completed" && <span className="text-[10px] text-green-400 font-semibold">✓ Completed</span>}
          <span className="text-[10px] text-zinc-500">{doneCount}/{wave.phases.length} phases done</span>
        </div>
        <div className="flex items-center gap-2">
          {allDone && wave.status === "active" && <button onClick={() => onCompleteWave(wave.id)} className="px-3 py-1 rounded text-[11px] bg-green-600 text-white hover:bg-green-500">✓ Complete Wave</button>}
          <span className="text-zinc-500 text-xs cursor-pointer" onClick={() => setExpanded(!expanded)}>{expanded ? "▼" : "▶"}</span>
        </div>
      </div>
      <div className="flex gap-1 mb-3">
        {wave.phases.map((p, i) => {
          const colors = PHASE_COLORS[p.type];
          const bg = p.status === "done" ? "bg-green-500" : p.status === "running" ? colors.bg : "bg-zinc-700";
          const isNext = i === nextPendingIdx && currentPhaseIdx === -1;
          return (
            <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-2 rounded-full ${bg} ${isNext ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-zinc-900" : ""}`} />
              <span className={`text-[9px] ${p.status === "done" ? "text-green-400" : p.status === "running" ? colors.text : isNext ? "text-blue-400" : "text-zinc-600"}`}>{p.type.charAt(0).toUpperCase() + p.type.slice(1)}</span>
            </div>
          );
        })}
      </div>
      {!allDone && currentPhaseIdx === -1 && nextPendingIdx >= 0 && <div className="text-[11px] text-blue-400 mb-2">⏭ Next: {PHASE_LABELS[wave.phases[nextPendingIdx].type]}</div>}
      {currentPhaseIdx >= 0 && currentPhaseIdx < wave.phases.length - 1 && <div className="text-[11px] text-zinc-400 mb-2">⏭ After this: {PHASE_LABELS[wave.phases[currentPhaseIdx + 1].type]}</div>}
      {expanded && <div className="space-y-2 mt-2">{wave.phases.map((phase) => <PhaseBlock key={phase.id} phase={phase} allAds={allAds} onUpdate={onUpdatePhase} />)}</div>}
    </div>
  );
}

function WaveVaultPreview({ waveId, campaignId }: { waveId: string; campaignId: string }) {
  const [folders, setFolders] = useState<CboFolder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchFolders(waveId)
      .then((d) => { setFolders(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [waveId]);

  const root = folders.find((f) => f.type === "root");
  const sectionFor = (t: string) =>
    folders.find((f) => f.type === t && f.parentId === root?.id);
  const childrenOf = (sid: string) =>
    folders.filter((f) => f.parentId === sid);

  const sections = [
    { type: "desire",    label: "Desires",   icon: "🎯", color: "text-orange-300", border: "border-orange-500/20", bg: "bg-orange-500/5" },
    { type: "angle",     label: "Angles",    icon: "📐", color: "text-amber-300",  border: "border-amber-500/20",  bg: "bg-amber-500/5" },
    { type: "awareness", label: "Awareness", icon: "👁", color: "text-yellow-300", border: "border-yellow-500/20", bg: "bg-yellow-500/5" },
    { type: "copy",      label: "Copies",    icon: "📝", color: "text-sky-300",    border: "border-sky-500/20",    bg: "bg-sky-500/5" },
    { type: "combo",     label: "Combos",    icon: "🧩", color: "text-purple-300", border: "border-purple-500/20", bg: "bg-purple-500/5" },
  ];

  const totalItems = sections.reduce((sum, s) => {
    const sec = sectionFor(s.type);
    return sum + (sec ? childrenOf(sec.id).length : 0);
  }, 0);

  const handleCopy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  if (!loaded || !root) return null;
  if (totalItems === 0)
    return (
      <div className="border border-zinc-800 rounded-lg p-4 text-center">
        <p className="text-[11px] text-zinc-500">
          No vault items yet.{" "}
          <Link href={`/campaign/${campaignId}/wave/${waveId}`} className="text-purple-400 hover:text-purple-300">
            Open vault →
          </Link>
        </p>
      </div>
    );

  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-zinc-300">
          📂 Vault — {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>
        <Link
          href={`/campaign/${campaignId}/wave/${waveId}`}
          className="text-[11px] text-purple-400 hover:text-purple-300"
        >
          Open full vault →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {sections.map((s) => {
          const sec = sectionFor(s.type);
          const items = sec ? childrenOf(sec.id) : [];
          if (items.length === 0) return null;
          return (
            <div key={s.type} className={`border ${s.border} ${s.bg} rounded-lg p-3`}>
              <div className={`text-[10px] font-semibold ${s.color} mb-2`}>
                {s.icon} {s.label}
                <span className="ml-1 text-zinc-500">({items.length})</span>
              </div>
              <div className="space-y-1.5">
                {items.slice(0, 5).map((item) => {
                  const text =
                    s.type === "desire"    ? item.desire || item.name :
                    s.type === "angle"     ? item.angle || item.name :
                    s.type === "awareness" ? item.awareness || item.name :
                    s.type === "copy"      ? item.content?.slice(0, 80) || item.name :
                    item.name;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 text-[11px] text-zinc-300"
                    >
                      <span className="flex-1 truncate">{text}</span>
                      <button
                        onClick={() => handleCopy(text || "")}
                        className="text-[9px] text-zinc-600 hover:text-white px-1"
                        title="Copy"
                      >
                        📋
                      </button>
                    </div>
                  );
                })}
                {items.length > 5 && (
                  <div className="text-[10px] text-zinc-600">
                    +{items.length - 5} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdCopies({ adId }: { adId: string }) {
  const [copies, setCopies] = useState<CboItemCopy[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdCopies(adId)
      .then((d) => { setCopies(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [adId]);

  if (!loaded || copies.length === 0) return null;

  return (
    <div className="mt-3 border-t border-zinc-800 pt-3">
      <div className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold mb-2">
        📝 Copies ({copies.length})
      </div>
      <div className="space-y-1.5">
        {copies.map((copy) => {
          const isOpen = expandedId === copy.id;
          return (
            <div key={copy.id} className="rounded-md border border-zinc-800 bg-zinc-900/60 overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : copy.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-[11px] font-medium text-sky-300 truncate flex-1">
                  {copy.title}
                </span>
                {!isOpen && (
                  <span className="text-[10px] text-zinc-500 truncate max-w-[250px]">
                    {copy.content.slice(0, 80)}…
                  </span>
                )}
                <span className="text-[10px] text-zinc-600 flex-shrink-0">
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 border-t border-zinc-800">
                  <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed mt-2 font-sans">
                    {copy.content}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



export default function CampaignPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [waves, setWaves] = useState<CboWave[]>([]);
  const [activeWaveId, setActiveWaveId] = useState<string | null>(null);
  const [showNewWave, setShowNewWave] = useState(false);
  const [newWaveName, setNewWaveName] = useState("");

  const [pendingDeleteWaveId, setPendingDeleteWaveId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [variantParentId, setVariantParentId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [desire, setDesire] = useState("");
  const [angle, setAngle] = useState("");
  const [awareness, setAwareness] = useState<AwarenessLevel>("Problem aware");
  const [notes, setNotes] = useState("");
  const [format, setFormat] = useState<FormatType>("UGC");
  const [formTestFocus, setFormTestFocus] = useState<TestFocus>("desire");
  const [duration, setDuration] = useState(7);
  const [startDate, setStartDate] = useState(new Date().toISOString());

  const [globalFocus, setGlobalFocus] = useState<TestFocus | "all">("all");
  const [filterDesire, setFilterDesire] = useState("");
  const [filterAngle, setFilterAngle] = useState("");
  const [filterAwareness, setFilterAwareness] = useState<AwarenessLevel | "All">("All");
  const [showOnlyWinners, setShowOnlyWinners] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmVariantDeleteId, setConfirmVariantDeleteId] = useState<string | null>(null);

  const reload = async () => {
    if (!id) return;
    try {
      const c = await fetchCampaignWithAds(id); if (c) setCampaign(c);
      const w = await fetchWaves(id); setWaves(w);
      if (w.length > 0 && !activeWaveId) setActiveWaveId(w[0].id);
    } catch (err: any) { console.error("reload error:", err); }
  };

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true); setError(null);
      try {
        const c = await fetchCampaignWithAds(id!); setCampaign(c);
        const w = await fetchWaves(id!); setWaves(w);
        if (w.length > 0) setActiveWaveId(w[0].id);
      } catch (err: any) { setError(err?.message || "Unknown error"); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center">Loading…</div>;
  if (error) return <div className="min-h-screen bg-zinc-950 text-red-400 flex items-center justify-center"><div className="text-center"><p className="mb-2">Error: {error}</p><Link href="/" className="text-blue-400 hover:underline">← Back</Link></div></div>;
  if (!campaign || !id) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center"><div className="text-center"><p className="text-zinc-400 mb-4">Campaign not found</p><Link href="/" className="text-blue-400 hover:underline">← Back</Link></div></div>;

  const openNewForm = () => { setEditingAd(null); setVariantParentId(null); setName(""); setDesire(""); setAngle(""); setAwareness("Problem aware"); setNotes(""); setFormat("UGC"); setFormTestFocus("desire"); setDuration(7); setStartDate(new Date().toISOString()); setShowForm(true); };
  const openVariantForm = (parent: Ad) => { setEditingAd(null); setVariantParentId(parent.id); setName((parent.name || "") + " / Variant"); setDesire(parent.desire || ""); setAngle(parent.angle || ""); setAwareness(parent.awareness || "Problem aware"); setNotes(""); setFormat(parent.format || "UGC"); setFormTestFocus(parent.testFocus || "desire"); setDuration(parent.duration || 7); setStartDate(new Date().toISOString()); setShowForm(true); };
  const openEditForm = (ad: Ad) => { setEditingAd(ad); setVariantParentId(ad.parentId || null); setName(ad.name || ""); setDesire(ad.desire || ""); setAngle(ad.angle || ""); setAwareness(ad.awareness || "Problem aware"); setNotes(ad.notes || ""); setFormat(ad.format || "UGC"); setFormTestFocus(ad.testFocus || "desire"); setDuration(ad.duration || 7); setStartDate(ad.createdAt); setShowForm(true); };

const handleSaveAd = async () => {
  const nt = name.trim(), dt = desire.trim(), at = angle.trim();
  if (!nt || !dt || !at) return;
  try {
    if (editingAd) {
      await updateAd({ ...editingAd, name: nt, desire: dt, angle: at, awareness, notes, format, testFocus: formTestFocus, duration, createdAt: startDate });
    } else {
      await insertAd(campaign.id, {
        name: nt, desire: dt, angle: at, awareness, notes, format,
        testFocus: formTestFocus, status: "testing",
        parentId: variantParentId || undefined,
        createdAt: startDate, duration,
        waveId: activeWaveId,  // ← THIS LINE ties the ad to the selected wave
      });
    }
    await reload(); setShowForm(false); setEditingAd(null); setVariantParentId(null);
  } catch (err: any) { alert("Failed to save ad: " + (err?.message || "Unknown error")); }
};

  const handleSetStatus = async (adId: string, status: Ad["status"]) => { try { await setAdStatus(adId, status); await reload(); } catch {} };
  const actuallyDelete = async (parentId: string) => { try { await deleteAdWithVariants(parentId); await reload(); } catch {} setConfirmDeleteId(null); };
  const deleteVariantOnly = async (id: string) => { try { await deleteSingleAd(id); await reload(); } catch {} setConfirmVariantDeleteId(null); };

  const handleCreateWave = async () => { const t = newWaveName.trim(); if (!t) return; try { await createWave(campaign.id, t); setNewWaveName(""); setShowNewWave(false); await reload(); } catch (err: any) { alert("Failed: " + (err?.message || "Unknown error")); } };
  const handleUpdatePhase = async (phaseId: string, status: string, winnerAds: string[], phaseNotes: string) => { try { await updatePhase(phaseId, status, winnerAds, phaseNotes); await reload(); } catch (err: any) { alert("Failed: " + (err?.message || "Unknown error")); } };
  const handleDeleteWave = async (waveId: string) => { try { await deleteWave(waveId); if (activeWaveId === waveId) setActiveWaveId(null); await reload(); } catch (err: any) { alert("Failed: " + (err?.message || "Unknown error")); } };
  const handleCompleteWave = async (waveId: string) => { try { await updateWaveStatus(waveId, "completed"); await reload(); } catch {} };

  const requestDeleteWave = (waveId: string) => { setPendingDeleteWaveId(waveId); setDeleteConfirmText(""); };
  const confirmDeleteWave = async () => { if (!pendingDeleteWaveId || deleteConfirmText !== "DELETE") return; await handleDeleteWave(pendingDeleteWaveId); setPendingDeleteWaveId(null); setDeleteConfirmText(""); };

  const allAds: Ad[] = campaign.ads || [];
// NEW — only show ads that belong to the active wave (or have no wave)
const filteredAds = allAds.filter((ad) => {
  // ✅ Wave scoping: if a wave is selected, only show that wave's ads
  if (activeWaveId && ad.waveId && ad.waveId !== activeWaveId) return false;
  // If no wave selected, show ads that have no wave assigned
  if (!activeWaveId && ad.waveId) return false;

  if (showOnlyWinners && ad.status !== "winner") return false;
  if (filterDesire && !(ad.desire || "").toLowerCase().includes(filterDesire.toLowerCase())) return false;
  if (filterAngle && !(ad.angle || "").toLowerCase().includes(filterAngle.toLowerCase())) return false;
  if (filterAwareness !== "All" && ad.awareness !== filterAwareness) return false;
  if (globalFocus !== "all" && ad.testFocus !== globalFocus) return false;
  return true;
});

  const mainAds = filteredAds.filter((a) => !a.parentId);
  const variantsFor = (parentId: string) => filteredAds.filter((a) => a.parentId === parentId);
  const isGlobalFocus = (key: TestFocus) => globalFocus === key;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Ad Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold mb-4">{editingAd ? "Edit Ad" : variantParentId ? "New Variant" : "New Ad"}</h2>
            <div className="space-y-3 mb-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad name / label" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              <input value={desire} onChange={(e) => setDesire(e.target.value)} placeholder="Desire" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              <input value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="Angle" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400">Start:</span>
                <input type="datetime-local" value={toLocalInputValue(startDate)} onChange={(e) => { const iso = new Date(e.target.value).toISOString(); setStartDate(iso); if (editingAd) setEditingAd({ ...editingAd, createdAt: iso }); }} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2"><span className="text-zinc-400">Awareness:</span><select value={awareness} onChange={(e) => setAwareness(e.target.value as AwarenessLevel)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs">{AWARENESS_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
                <div className="flex items-center gap-2"><span className="text-zinc-400">Format:</span><select value={format} onChange={(e) => setFormat(e.target.value as FormatType)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs">{FORMAT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
                <div className="flex items-center gap-2"><span className="text-zinc-400">Test focus:</span><select value={formTestFocus} onChange={(e) => setFormTestFocus(e.target.value as TestFocus)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs">{TEST_FOCUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block mb-1.5">Test duration:</span>
                <div className="flex gap-2 flex-wrap">
                  {DURATION_OPTIONS.map((d) => <button key={d} onClick={() => setDuration(d)} className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${duration === d ? "bg-blue-600 border-blue-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"}`}>{d}d</button>)}
                  <input type="number" min={1} max={90} value={duration} onChange={(e) => setDuration(Math.max(1, Math.min(90, parseInt(e.target.value) || 7)))} className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(false); setEditingAd(null); setVariantParentId(null); }} className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400">Cancel</button>
              <button onClick={handleSaveAd} className="flex-1 py-2 rounded-lg bg-blue-600 text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* New Wave Modal */}
      {showNewWave && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-sm">
            <h2 className="font-bold mb-4">New CBO Wave</h2>
            <input value={newWaveName} onChange={(e) => setNewWaveName(e.target.value)} placeholder="Wave name (e.g. Wave 1)" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-blue-500" onKeyDown={(e) => { if (e.key === "Enter") handleCreateWave(); }} />
            <div className="text-[11px] text-zinc-500 mb-4">Creates: Desire → Angle → Awareness → Advertorial → Format + Vault</div>
            <div className="flex gap-2">
              <button onClick={() => setShowNewWave(false)} className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400">Cancel</button>
              <button onClick={handleCreateWave} disabled={!newWaveName.trim()} className="flex-1 py-2 rounded-lg bg-blue-600 text-sm font-medium disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Delete Wave Modal */}
      {pendingDeleteWaveId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-red-700 rounded-xl p-5 w-full max-w-sm">
            <h3 className="text-sm font-bold text-red-400 mb-2">Delete vault and CBO wave?</h3>
            <p className="text-[11px] text-zinc-400 mb-3">This will permanently delete this wave, all vault items, and linked copies. Type <span className="font-mono text-red-300">DELETE</span> to confirm.</p>
            <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-red-500 font-mono" placeholder="DELETE" />
            <div className="flex gap-2">
              <button onClick={() => { setPendingDeleteWaveId(null); setDeleteConfirmText(""); }} className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400">Cancel</button>
              <button onClick={confirmDeleteWave} disabled={deleteConfirmText !== "DELETE"} className="flex-1 py-2 rounded-lg bg-red-600 text-sm font-medium disabled:opacity-40">Confirm delete</button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div><Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back</Link><h1 className="text-xl font-bold mt-1">{campaign.name}</h1></div>
          <div className="flex gap-2">
            <button onClick={() => setShowNewWave(true)} className="px-4 py-2 rounded-lg bg-purple-600 text-sm font-medium hover:bg-purple-500">+ CBO Wave</button>
            <button onClick={openNewForm} className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium hover:bg-blue-500">+ New Ad</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* CBO Waves */}
        {/* CBO Waves */}
{/* CBO Waves + Inline Vault */}
{waves.length > 0 && (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-bold text-purple-300">🧪 CBO Testing Waves</h2>
      <div className="text-[11px] text-zinc-500">
        {waves.length} wave{waves.length > 1 ? "s" : ""}
      </div>
    </div>

    {/* Wave tabs */}
    <div className="flex border-b border-zinc-800 mb-3 overflow-x-auto">
      {waves.map((wave) => {
        const isActive = wave.id === activeWaveId;
        const doneCount = wave.phases.filter((p) => p.status === "done").length;
        return (
          <div key={wave.id} className="flex items-center">
            <button
              onClick={() => setActiveWaveId(isActive ? null : wave.id)}
              className={`px-4 py-2 text-xs whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                isActive
                  ? "border-purple-500 text-purple-300 bg-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {wave.name}
              {wave.status === "completed" && <span className="text-green-400">✓</span>}
              <span className="text-[9px] text-zinc-600">
                {doneCount}/{wave.phases.length}
              </span>
            </button>
            <Link
              href={`/campaign/${id}/wave/${wave.id}`}
              className="px-1.5 py-2 text-[11px] text-zinc-500 hover:text-purple-300"
              title="Open vault"
            >
              📂
            </Link>
            <button
              onClick={() => requestDeleteWave(wave.id)}
              className="px-1.5 py-2 text-[11px] text-zinc-600 hover:text-red-400"
              title="Delete wave"
            >
              🗑
            </button>
          </div>
        );
      })}
    </div>

    {/* ONLY the selected wave's content renders here */}
    {activeWaveId &&
      (() => {
        const activeWave = waves.find((w) => w.id === activeWaveId);
        if (!activeWave) return null;
        return (
          <div className="space-y-3">
            <WaveCard
              wave={activeWave}
              allAds={allAds}
              onUpdatePhase={handleUpdatePhase}
              onDeleteWave={(wid) => requestDeleteWave(wid)}
              onCompleteWave={handleCompleteWave}
            />
            {/* ↓ This vault preview ONLY shows items from this wave ↓ */}
            <WaveVaultPreview waveId={activeWave.id} campaignId={id} />
          </div>
        );
      })()}
  </div>
)}

{/* ---- Filters start AFTER the wave section ---- */}



        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-wrap gap-3 items-center text-xs">
          <input value={filterDesire} onChange={(e) => setFilterDesire(e.target.value)} placeholder="Filter by desire" className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 flex-1 min-w-[140px]" />
          <input value={filterAngle} onChange={(e) => setFilterAngle(e.target.value)} placeholder="Filter by angle" className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 flex-1 min-w-[140px]" />
          <select value={filterAwareness} onChange={(e) => setFilterAwareness(e.target.value as AwarenessLevel | "All")} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1"><option value="All">All awareness</option>{AWARENESS_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select>
          <label className="flex items-center gap-1 text-zinc-400"><input type="checkbox" checked={showOnlyWinners} onChange={(e) => setShowOnlyWinners(e.target.checked)} className="accent-blue-500" />Winners only</label>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-zinc-500 mr-1">Show test focus:</span>
          <button onClick={() => setGlobalFocus("all")} className={`px-3 py-1 rounded-full border text-[11px] transition-colors ${globalFocus === "all" ? "border-white bg-white/10 text-white" : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"}`}>All</button>
          {TEST_FOCUS_OPTIONS.map((opt) => <button key={opt.id} onClick={() => setGlobalFocus(globalFocus === opt.id ? "all" : opt.id)} className={`px-3 py-1 rounded-full border text-[11px] transition-colors ${globalFocus === opt.id ? `${opt.color} text-white` : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"}`}>{opt.label}</button>)}
        </div>

        {/* Ad Cards */}
        {mainAds.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-10">No ads match the current filters.</div>
        ) : (
          <div className="space-y-4">
            {mainAds.map((ad) => {
              const variants = variantsFor(ad.id);
              const statusClass = ad.status === "winner" ? "border-green-500/40 bg-green-500/5" : ad.status === "loser" ? "border-red-500/40 bg-red-500/5" : "border-blue-500/30 bg-blue-500/5";
              const barClass = ad.status === "winner" ? "bg-green-500" : ad.status === "loser" ? "bg-red-500" : "bg-blue-500";
              return (
                <div key={ad.id} className={`relative border rounded-lg px-4 py-3 ${statusClass}`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${barClass}`} />
                  <div className="pl-3">
                    <div className="flex flex-col md:flex-row md:items-start md:gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {ad.status === "winner" && <span className="text-green-400 text-xs">🏆 Winner</span>}
                            {ad.status === "loser" && <span className="text-red-400 text-xs">✖ Loser</span>}
                            <span className="font-semibold text-sm break-words">{ad.name}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${focusColor(ad.testFocus)}`}>⚡ {ad.testFocus}</span>
                        </div>
                        <ProgressBar ad={ad} />
                        <div className={`rounded-md p-3 border ${isGlobalFocus("desire") ? "border-orange-500 bg-orange-500/10" : "border-zinc-800 bg-zinc-900/80"}`}>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-orange-300 mb-1">Desire</div>
                          <div className="text-xs text-zinc-100 break-words">{ad.desire}</div>
                        </div>
                        <div className={`rounded-md p-3 border ${isGlobalFocus("angle") ? "border-amber-500 bg-amber-500/10" : "border-zinc-800 bg-zinc-900/80"}`}>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300 mb-1">Angle</div>
                          <div className="text-xs text-zinc-100 break-words">{ad.angle}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className={`px-2.5 py-1 rounded-md text-[11px] border ${isGlobalFocus("awareness") ? "border-yellow-500 bg-yellow-500/10 text-yellow-100" : "border-zinc-600 bg-zinc-800 text-zinc-200"}`}><span className="font-semibold">Awareness:</span> {ad.awareness}</div>
                          <div className={`px-2.5 py-1 rounded-md text-[11px] border ${isGlobalFocus("format") ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-100" : "border-zinc-600 bg-zinc-800 text-zinc-200"}`}><span className="font-semibold">Format:</span> {ad.format}</div>
                        </div>
                        {ad.notes && <div className="rounded-md bg-zinc-900/60 p-2 border border-dashed border-zinc-800"><div className="text-[11px] uppercase text-zinc-500 mb-1">Notes</div><div className="text-[11px] text-zinc-300 break-words">{ad.notes}</div></div>}
                      </div>
                      <AdCopies adId={ad.id} />

                      <div className="mt-3 md:mt-0 flex items-center md:flex-col md:items-end gap-2 flex-shrink-0">
                        <div className="flex gap-1">
                          {(["winner","loser","testing"] as Ad["status"][]).map((s) => <button key={s} onClick={() => handleSetStatus(ad.id, s)} className={`px-2 py-1 rounded text-[11px] ${ad.status === s ? (s === "winner" ? "bg-green-500/20 text-green-400" : s === "loser" ? "bg-red-500/30 text-red-300" : "bg-blue-500/20 text-blue-400") : "bg-zinc-800 text-zinc-500 hover:text-white"}`}>{s === "winner" ? "W" : s === "loser" ? "L" : "T"}</button>)}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openVariantForm(ad)} className="px-2 py-1 rounded text-[11px] bg-zinc-800 text-zinc-300 hover:text-white">+ Var</button>
                          <button onClick={() => openEditForm(ad)} className="px-2 py-1 rounded text-[11px] bg-zinc-800 text-zinc-300 hover:text-white">✎</button>
                          <button onClick={() => confirmDeleteId === ad.id ? actuallyDelete(ad.id) : setConfirmDeleteId(ad.id)} className={`px-2 py-1 rounded text-[11px] ${confirmDeleteId === ad.id ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-500 hover:text-red-400"}`}>{confirmDeleteId === ad.id ? "OK?" : "Del"}</button>
                        </div>
                      </div>
                    </div>
                    {variants.length > 0 && (
                      <div className="mt-3 space-y-2 pl-6 md:pl-10">
                        {variants.map((v) => (
                          <div key={v.id} className="flex flex-col md:flex-row md:items-start md:gap-3 text-xs bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">Variant</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${focusColor(v.testFocus)}`}>⚡ {v.testFocus}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] border border-sky-500/60 bg-sky-500/10 text-sky-100">{v.format}</span>
                                {v.status === "winner" && <span className="text-green-400 text-[11px]">🏆</span>}
                                {v.status === "loser" && <span className="text-red-400 text-[11px]">✖</span>}
                                <span className="font-medium break-words">{v.name}</span>
                              </div>
                              <div className="my-2"><ProgressBar ad={v} /></div>
                              {v.notes && <div className="text-[11px] text-zinc-300 break-words">{v.notes}</div>}
                            </div>
                            <AdCopies adId={v.id} />

                            <div className="mt-1 md:mt-0 flex items-center gap-1 flex-shrink-0">
                              {(["winner","loser","testing"] as Ad["status"][]).map((s) => <button key={s} onClick={() => handleSetStatus(v.id, s)} className={`px-2 py-1 rounded text-[11px] ${v.status === s ? (s === "winner" ? "bg-green-500/20 text-green-400" : s === "loser" ? "bg-red-500/30 text-red-300" : "bg-blue-500/20 text-blue-400") : "bg-zinc-800 text-zinc-500 hover:text-white"}`}>{s === "winner" ? "W" : s === "loser" ? "L" : "T"}</button>)}
                              <button onClick={() => openEditForm(v)} className="px-2 py-1 rounded text-[11px] bg-zinc-800 text-zinc-500 hover:text-white">✎</button>
                              <button onClick={() => confirmVariantDeleteId === v.id ? deleteVariantOnly(v.id) : setConfirmVariantDeleteId(v.id)} className={`px-2 py-1 rounded text-[11px] ${confirmVariantDeleteId === v.id ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-500 hover:text-red-400"}`}>{confirmVariantDeleteId === v.id ? "OK?" : "✕"}</button>
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
