import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ELEMENTAL_IMAGES, GAME_ASSETS } from "@/lib/assets";
import { useAnimationFrame } from "framer-motion";
import { Copy, Check, ExternalLink } from "lucide-react";

const TASKS = [
  {
    id: "follow", element: "FIRE", color: "#f97316", glow: "rgba(249,115,22,0.4)",
    img: ELEMENTAL_IMAGES.fire, label: "Follow Earnity",
    desc: "Follow @earnity_ on X", action: "FOLLOW →",
    url: "https://x.com/earnity_", needsProof: false,
  },
  {
    id: "like", element: "WATER", color: "#3b82f6", glow: "rgba(59,130,246,0.4)",
    img: ELEMENTAL_IMAGES.water, label: "Like the Post",
    desc: "Like our announcement post", action: "LIKE →",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20", needsProof: false,
  },
  {
    id: "quote", element: "NATURE", color: "#22c55e", glow: "rgba(34,197,94,0.4)",
    img: ELEMENTAL_IMAGES.nature, label: "Quote the Post",
    desc: "Quote our post with your thoughts", action: "QUOTE →",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20", needsProof: true,
  },
  {
    id: "comment", element: "LIGHTNING", color: "#facc15", glow: "rgba(250,204,21,0.4)",
    img: ELEMENTAL_IMAGES.lightning, label: "Comment on Post",
    desc: "Drop a comment on our post", action: "COMMENT →",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20", needsProof: true,
  },
];

const RING_POSITIONS = [{ angle: -90 }, { angle: 0 }, { angle: 90 }, { angle: 180 }];

const EVM_REGEX = /^0x[a-fA-F0-9]{40}$/;

const COUNTDOWN_END = new Date("2026-05-30T09:37:00");

const WHITELIST_CLOSED = true;

type Submission = {
  id?: string;
  session_id: string;
  follow_done: boolean;
  like_done: boolean;
  quote_done: boolean;
  quote_url: string | null;
  comment_done: boolean;
  comment_url: string | null;
  wallet: string | null;
  status: string;
  boost_tweet1: string | null;
  boost_tweet2: string | null;
  boost_tweet3: string | null;
  boost_submitted: boolean;
};

function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const diff = COUNTDOWN_END.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      setTimeLeft({
        hours: Math.floor(totalSec / 3600),
        minutes: Math.floor((totalSec % 3600) / 60),
        seconds: totalSec % 60,
        expired: false,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="w-full border-b border-orange-500/20 bg-black/60 backdrop-blur-sm py-3 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          <span className="text-[9px] tracking-[0.4em] text-orange-400/80 font-mono">WHITELIST CLOSES IN</span>
        </div>

        {timeLeft.expired ? (
          <span className="text-[10px] tracking-[0.4em] text-red-400 font-mono">WHITELIST CLOSED</span>
        ) : (
          <div className="flex items-center gap-1 font-mono">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black tabular-nums leading-none" style={{ color: "#f97316", textShadow: "0 0 18px rgba(249,115,22,0.6)" }}>
                {pad(timeLeft.hours)}
              </span>
              <span className="text-[7px] tracking-[0.3em] text-zinc-600 mt-0.5">HRS</span>
            </div>
            <span className="text-orange-500/60 text-xl font-black mb-3 mx-1">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black tabular-nums leading-none" style={{ color: "#f97316", textShadow: "0 0 18px rgba(249,115,22,0.6)" }}>
                {pad(timeLeft.minutes)}
              </span>
              <span className="text-[7px] tracking-[0.3em] text-zinc-600 mt-0.5">MIN</span>
            </div>
            <span className="text-orange-500/60 text-xl font-black mb-3 mx-1">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black tabular-nums leading-none" style={{ color: "#facc15", textShadow: "0 0 18px rgba(250,204,21,0.5)" }}>
                {pad(timeLeft.seconds)}
              </span>
              <span className="text-[7px] tracking-[0.3em] text-zinc-600 mt-0.5">SEC</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-white/40 hover:text-white"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function EarnityProfileCard({
  status,
  wallet,
}: {
  status: string;
  wallet: string | null;
}) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    approved: { label: "APPROVED", color: "#22c55e", bg: "bg-green-500/10", border: "border-green-500/30" },
    declined: { label: "DECLINED", color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/30" },
    pending:  { label: "PENDING",  color: "#facc15", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  };

  const cfg = statusConfig[status] ?? statusConfig.pending;
  const shortWallet = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : null;

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500" />

        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-orange-500/30">
              <img src="/logo.jpg" alt="Earnity" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-white/80">EARNITY</div>
              <div className="text-[8px] text-white/30 tracking-wider">WHITELIST PORTAL</div>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full border text-[9px] font-bold tracking-wider ${cfg.bg} ${cfg.border}`} style={{ color: cfg.color }}>
            {cfg.label}
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/10">
                <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white/60">T</span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0f]" style={{ background: cfg.color }} />
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight">Traveler</div>
              <div className="text-[10px] text-white/40 tracking-wider">Guest</div>
            </div>
          </div>

          {wallet && (
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[8px] text-white/30 tracking-wider mb-1">BOUND WALLET</div>
                  <div className="text-xs font-mono text-white/70">{shortWallet}</div>
                </div>
                <div className="flex items-center gap-1">
                  <CopyBtn text={wallet} />
                  <a href={`https://etherscan.io/address/${wallet}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] text-white/30 tracking-wider">EARNITY WL</span>
            <span className="text-[9px] text-white/30 tracking-wider">SEASON I</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ElementalRing4({ completedTasks }: { completedTasks: string[] }) {
  const angleRef = useRef(0);
  const [rotation, setRotation] = useState(0);

  useAnimationFrame((_, delta) => {
    angleRef.current += delta * 0.010;
    setRotation(angleRef.current % 360);
  });

  const radius = 72;
  const center = 96;

  return (
    <div className="relative mx-auto" style={{ width: 192, height: 192 }}>
      <div className="absolute inset-0 rounded-full border border-orange-500/15" />
      <div className="absolute inset-3 rounded-full border border-yellow-400/10" />

      <div className="absolute inset-0" style={{ transform: `rotate(${rotation}deg)` }}>
        {RING_POSITIONS.map((pos, i) => {
          const task = TASKS[i];
          const isDone = completedTasks.includes(task.id);
          const rad = (pos.angle * Math.PI) / 180;
          const x = center + radius * Math.cos(rad) - 18;
          const y = center + radius * Math.sin(rad) - 18;

          return (
            <div key={task.id} className="absolute"
              style={{ left: x, top: y, width: 36, height: 36, transform: `rotate(${-rotation}deg)` }}>
              {isDone && (
                <div className="absolute inset-0 rounded-full animate-pulse"
                  style={{ boxShadow: `0 0 12px 4px ${task.glow}`, border: `1.5px solid ${task.color}`, borderRadius: "50%" }} />
              )}
              <div className="w-full h-full rounded-full flex items-center justify-center border transition-all duration-500"
                style={{
                  background: isDone ? `radial-gradient(circle, ${task.color}20, rgba(10,10,10,0.95))` : "rgba(15,15,15,0.9)",
                  borderColor: isDone ? task.color : "#1e1e1e",
                }}>
                {isDone
                  ? <img src={task.img} alt={task.element} className="w-5 h-5 object-contain"
                      style={{ filter: `drop-shadow(0 0 4px ${task.color})` }} />
                  : <div className="text-white/20 text-[8px] font-mono">{task.element.slice(0, 2)}</div>
                }
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute flex items-center justify-center rounded-full border border-white/10"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 56, height: 56,
          background: "radial-gradient(circle, rgba(255,255,255,0.06), rgba(0,0,0,0.9))" }}>
        <img src={GAME_ASSETS.seal2} alt="Seal" className="w-8 h-8 object-contain opacity-70" />
      </div>
    </div>
  );
}

function PhaseClosedBanner() {
  return (
    <div className="relative overflow-hidden rounded-sm border border-orange-500/25 bg-gradient-to-br from-orange-500/[0.06] via-black to-yellow-400/[0.04] px-5 py-5 mb-5">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-full border border-orange-500/30 bg-orange-500/10 flex items-center justify-center mt-0.5">
          <span className="text-base leading-none">🜂</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black tracking-[0.35em] text-orange-400">PHASE I CLOSED</span>
            <span className="text-[8px] tracking-[0.2em] text-zinc-700 border border-zinc-800 px-1.5 py-0.5 rounded-sm">UNDER REVIEW</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Whitelist Phase I has come to an end. All applications are now under review.
          </p>
          <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed">
            Results will be announced via <a href="https://x.com/earnity_" target="_blank" rel="noreferrer" className="text-orange-400/70 hover:text-orange-400 transition-colors">@earnity_</a>. Stay tuned.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Whitelist() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [proofInputs, setProofInputs] = useState<Record<string, string>>({});
  const [pendingTask, setPendingTask] = useState<string | null>(null);
  const [wallet, setWallet] = useState("");
  const [walletError, setWalletError] = useState("");
  const [submittingWallet, setSubmittingWallet] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [boostLinks, setBoostLinks] = useState(["", "", ""]);
  const [submittingBoost, setSubmittingBoost] = useState<number | null>(null);
  const [boostDone, setBoostDone] = useState([false, false, false]);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      let session = data.session;
      if (!session) {
        const { data: anonData } = await supabase.auth.signInAnonymously();
        session = anonData.session;
      }
      if (session) {
        setSessionId(session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (sessionId) fetchSubmission();
  }, [sessionId]);

  const fetchSubmission = async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from("wl_submissions_quest")
      .select("*")
      .eq("session_id", sessionId)
      .single();
    if (data) {
      setSubmission(data);
      setWallet(data.wallet || "");
      setBoostDone([!!data.boost_tweet1, !!data.boost_tweet2, !!data.boost_tweet3]);
    }
  };

  const ensureSubmission = async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from("wl_submissions_quest")
      .select("id")
      .eq("session_id", sessionId)
      .single();
    if (!data) {
      await supabase.from("wl_submissions_quest").insert({ session_id: sessionId, status: "pending" });
    }
  };

  const done = (id: string) => {
    if (!submission) return false;
    return submission[`${id}_done` as keyof Submission] as boolean;
  };

  const completedTasks = TASKS.filter((t) => done(t.id)).map((t) => t.id);
  const completedCount = completedTasks.length;
  const isWL = completedCount >= 3;
  const walletSubmitted = !!submission?.wallet;

  const isUnlocked = (index: number) => {
    if (!sessionId) return false;
    if (index === 0) return true;
    return done(TASKS[index - 1].id);
  };

  const handleTask = async (task: typeof TASKS[0]) => {
    if (WHITELIST_CLOSED) return;
    if (!sessionId || !isUnlocked(TASKS.indexOf(task)) || done(task.id)) return;
    await ensureSubmission();
    window.open(task.url, "_blank");
    if (!task.needsProof) {
      setPendingTask(task.id);
      setTimeout(async () => {
        await supabase.from("wl_submissions_quest")
          .update({ [`${task.id}_done`]: true, updated_at: new Date().toISOString() })
          .eq("session_id", sessionId);
        await fetchSubmission();
        setPendingTask(null);
        toast({ title: `${task.element} awakened ✦`, description: `${task.label} complete.` });
      }, 1500);
    }
  };

  const submitProof = async (taskId: string) => {
    if (WHITELIST_CLOSED) return;
    if (!sessionId || !proofInputs[taskId]?.trim()) return;
    await ensureSubmission();
    setPendingTask(taskId);
    await supabase.from("wl_submissions_quest")
      .update({ [`${taskId}_done`]: true, [`${taskId}_url`]: proofInputs[taskId].trim(), updated_at: new Date().toISOString() })
      .eq("session_id", sessionId);
    await fetchSubmission();
    setPendingTask(null);
    const task = TASKS.find((t) => t.id === taskId)!;
    toast({ title: `${task.element} awakened ✦`, description: `${task.label} verified.` });
    if (completedCount + 1 === 4) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 3000);
    }
  };

  const handleWalletSubmit = async () => {
    if (!sessionId || !wallet.trim()) return;
    if (!EVM_REGEX.test(wallet.trim())) {
      setWalletError("Invalid EVM address. Must start with 0x and be 42 characters.");
      return;
    }
    setWalletError("");
    setSubmittingWallet(true);
    await ensureSubmission();
    await supabase.from("wl_submissions_quest")
      .update({ wallet: wallet.trim(), updated_at: new Date().toISOString() })
      .eq("session_id", sessionId);
    await fetchSubmission();
    setSubmittingWallet(false);
    toast({ title: "Wallet registered!", description: "Your application is under review." });
  };

  const handleBoostSubmit = async (index: number) => {
    const link = boostLinks[index].trim();
    if (!sessionId || !link) return;
    setSubmittingBoost(index);
    await ensureSubmission();
    const field = `boost_tweet${index + 1}`;
    await supabase.from("wl_submissions_quest")
      .update({ [field]: link, updated_at: new Date().toISOString() })
      .eq("session_id", sessionId);
    await fetchSubmission();
    setSubmittingBoost(null);
    const updated = [...boostDone];
    updated[index] = true;
    setBoostDone(updated);
    toast({ title: "Contribution submitted!", description: "We'll review your link manually." });
  };

  const BOOST_LABELS = ["TWEET / POST LINK", "ARTICLE / THREAD LINK", "CONTRIBUTION LINK"];

  return (
    <MainLayout>
      <CountdownBanner />

      {celebrating && (
        <div className="animate-fade-in-out fixed inset-0 bg-black/95 flex items-center justify-center z-[100] text-center">
          <div>
            <div className="text-4xl mb-6">🜂🜄✦⚡</div>
            <div className="font-serif text-2xl font-black tracking-[0.4em] text-white mb-3">ALL ELEMENTS AWAKENED</div>
            <div className="text-sm tracking-[0.3em] text-green-400">WHITELIST SECURED</div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.5em] text-orange-400/70 mb-4">WHITELIST PORTAL</p>
          <h1 className="font-serif text-4xl md:text-6xl font-black text-white tracking-widest mb-5">CLAIM YOUR SPOT</h1>
          <p className="text-xs text-zinc-500 leading-relaxed">Complete all 4 elemental tasks to secure your whitelist spot.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                <span className="text-[10px] tracking-[0.3em] text-zinc-600">ELEMENTAL TASKS</span>
                <span className="text-[10px] tracking-[0.2em] text-zinc-600">{completedCount}/4 COMPLETE</span>
              </div>

              {WHITELIST_CLOSED && <PhaseClosedBanner />}

              <div className="flex flex-col gap-3">
                {TASKS.map((task, index) => {
                  const isDone = done(task.id);
                  const unlocked = isUnlocked(index);
                  const isPending = pendingTask === task.id;
                  const showProof = !WHITELIST_CLOSED && unlocked && !isDone && task.needsProof;

                  return (
                    <div
                      key={task.id}
                      className="rounded-sm border transition-all duration-300 overflow-hidden"
                      style={{
                        borderColor: isDone ? task.color + "44" : "#1e1e1e",
                        background: isDone ? task.color + "08" : "#080808",
                        opacity: WHITELIST_CLOSED && !isDone ? 0.6 : 1,
                      }}
                    >
                      <div className="flex items-center gap-5 px-5 py-4">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center border flex-shrink-0 transition-all duration-300"
                          style={{
                            borderColor: isDone ? task.color : unlocked ? task.color + "44" : "#1e1e1e",
                            background: isDone ? task.color + "20" : "transparent",
                          }}
                        >
                          {isDone
                            ? <img src={task.img} alt={task.element} className="w-5 h-5 object-contain"
                                style={{ filter: `drop-shadow(0 0 4px ${task.color})` }} />
                            : <div className="text-[8px] font-mono" style={{ color: unlocked ? task.color + "88" : "#2a2a2a" }}>
                                {task.element.slice(0, 2)}
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold tracking-wider text-zinc-300 mb-0.5">{task.label}</div>
                          <div className="text-[10px] text-zinc-600 tracking-wide">{task.desc}</div>
                        </div>
                        <div className="flex-shrink-0">
                          {isDone ? (
                            <span className="text-[10px] font-bold tracking-[0.2em] border px-3 py-1.5 rounded-sm"
                              style={{ color: task.color, borderColor: task.color + "44" }}>
                              ✓ DONE
                            </span>
                          ) : WHITELIST_CLOSED ? (
                            <span className="text-[10px] font-bold tracking-[0.2em] border px-3 py-1.5 rounded-sm text-zinc-700 border-zinc-800/60">
                              CLOSED
                            </span>
                          ) : !unlocked ? (
                            <span className="text-[10px] text-zinc-800 tracking-widest px-3 py-1.5">🔒 LOCKED</span>
                          ) : (
                            <button
                              onClick={() => handleTask(task)}
                              disabled={!!isPending}
                              className="text-[10px] font-bold tracking-[0.2em] border px-3 py-1.5 rounded-sm bg-transparent cursor-pointer transition-all"
                              style={{ color: task.color, borderColor: task.color + "55" }}
                            >
                              {isPending ? "OPENING..." : task.action}
                            </button>
                          )}
                        </div>
                      </div>

                      {showProof && (
                        <div className="px-5 pb-4 border-t border-white/5 pt-3">
                          <div className="text-[9px] tracking-[0.3em] text-zinc-700 mb-2">PASTE YOUR {task.id.toUpperCase()} LINK</div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="https://x.com/..."
                              value={proofInputs[task.id] || ""}
                              onChange={(e) => setProofInputs((p) => ({ ...p, [task.id]: e.target.value }))}
                              className="flex-1 bg-black border border-zinc-800 text-white px-3 py-2 text-xs font-mono rounded-sm"
                            />
                            <button
                              onClick={() => submitProof(task.id)}
                              disabled={!proofInputs[task.id]?.trim() || isPending}
                              className="px-3 py-2 text-[10px] font-bold tracking-widest rounded-sm border cursor-pointer transition-all disabled:opacity-40"
                              style={{ color: task.color, borderColor: task.color + "55", background: "transparent" }}
                            >
                              {isPending ? "..." : "VERIFY"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {isWL && (
              <div className="bg-zinc-950 border border-green-400/20 rounded-sm p-5">
                <div className="text-[10px] tracking-[0.3em] text-green-400 mb-1">REGISTER WALLET</div>
                <div className="text-[10px] text-zinc-600 mb-4 leading-relaxed">Submit your EVM address to lock your whitelist spot.</div>
                {!walletSubmitted ? (
                  <>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={wallet}
                      onChange={(e) => { setWallet(e.target.value); setWalletError(""); }}
                      className={`w-full bg-black border text-white px-4 py-3 text-xs font-mono rounded-sm mb-1 block ${walletError ? "border-red-500/60" : "border-zinc-800"}`}
                    />
                    {walletError && (
                      <div className="text-[10px] text-red-400 mb-3">{walletError}</div>
                    )}
                    <button
                      onClick={handleWalletSubmit}
                      disabled={!wallet.trim() || submittingWallet}
                      className="w-full py-3 mt-2 text-xs font-bold tracking-[0.3em] rounded-sm border border-green-400/40 text-green-400 bg-transparent cursor-pointer transition-all disabled:opacity-40"
                    >
                      {submittingWallet ? "SUBMITTING..." : "SUBMIT WALLET"}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-2">
                    <div className="text-green-400 text-xl mb-2">✦</div>
                    <div className="text-xs font-bold tracking-widest text-green-400 mb-2">WALLET REGISTERED</div>
                    <div className="text-[10px] text-zinc-600 font-mono break-all">{submission?.wallet}</div>
                  </div>
                )}
              </div>
            )}

            {walletSubmitted && submission && (
              <EarnityProfileCard
                status={submission.status}
                wallet={submission.wallet}
              />
            )}

            {walletSubmitted && (
              <div className="bg-zinc-950 border border-orange-500/20 rounded-sm overflow-hidden">
                <a href="https://earnity.fun" target="_blank" rel="noreferrer" className="no-underline block">
                  <div className="relative h-48 overflow-hidden cursor-pointer group">
                    <img src="/IMG_8789.jpeg" alt="Upgrade to GTD" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="text-[9px] tracking-[0.3em] text-orange-400/70 mb-1">READY FOR MORE?</div>
                      <div className="text-sm font-bold tracking-[0.2em] text-white mb-1">UPGRADE TO GTD</div>
                      <div className="text-[10px] text-zinc-400 leading-relaxed">GTD holders get a guaranteed mint slot. Collect all 6 Elementals on earnity.fun.</div>
                      <div className="mt-3 text-[10px] font-bold tracking-widest text-orange-400">ENTER EARNITY.FUN →</div>
                    </div>
                  </div>
                </a>
              </div>
            )}

            <div className="bg-zinc-950 border border-orange-500/15 rounded-sm p-5">
              <div className="text-[10px] tracking-[0.3em] text-orange-400/80 mb-1">GET APPROVED FASTER?</div>
              <div className="text-[10px] text-zinc-600 mb-5 leading-relaxed">
                Write a tweet, article, or contribute to Earnity. Submit each link individually — we'll review them manually.
              </div>
              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <div className="text-[9px] tracking-[0.2em] text-zinc-700 mb-1.5">{BOOST_LABELS[i]}</div>
                    {boostDone[i] ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/5 border border-green-500/20 rounded-sm">
                        <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span className="text-[10px] text-green-400 tracking-wider">SUBMITTED</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={boostLinks[i]}
                          onChange={(e) => setBoostLinks((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                          className="flex-1 bg-black border border-zinc-800 text-white px-3 py-2.5 text-xs font-mono rounded-sm block"
                        />
                        <button
                          onClick={() => handleBoostSubmit(i)}
                          disabled={submittingBoost === i || !boostLinks[i].trim()}
                          className="px-3 py-2 text-[10px] font-bold tracking-widest rounded-sm border border-orange-500/30 text-orange-400 bg-transparent cursor-pointer transition-all disabled:opacity-40 whitespace-nowrap"
                        >
                          {submittingBoost === i ? "..." : "SUBMIT"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-6 flex flex-col items-center">
              <ElementalRing4 completedTasks={completedTasks} />
              <div className="w-full bg-zinc-900 rounded-full h-1 mt-5 mb-2">
                <div className="h-1 rounded-full transition-all duration-700"
                  style={{ width: `${(completedCount / 4) * 100}%`, background: "linear-gradient(90deg, #f97316, #facc15)" }}
                />
              </div>
              <div className="text-[9px] tracking-widest text-zinc-700 mt-1">
                {completedCount === 4 ? "ALL ELEMENTS AWAKENED" : `${4 - completedCount} ELEMENTS REMAINING`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
