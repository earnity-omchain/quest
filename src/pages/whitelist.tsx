import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ELEMENTAL_IMAGES, GAME_ASSETS } from "@/lib/assets";
import { useAnimationFrame } from "framer-motion";
import { Check, ExternalLink } from "lucide-react";

const TASKS = [
  {
    id: "follow", element: "FIRE", color: "#f97316", bg: "#fff7ed",
    img: ELEMENTAL_IMAGES.fire, label: "Follow Earnity",
    desc: "Follow @earnity_ on X", action: "GO",
    url: "https://x.com/earnity_", needsProof: false,
  },
  {
    id: "like", element: "WATER", color: "#3b82f6", bg: "#eff6ff",
    img: ELEMENTAL_IMAGES.water, label: "Like the Post",
    desc: "Like our announcement post", action: "GO",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20", needsProof: false,
  },
  {
    id: "quote", element: "NATURE", color: "#22c55e", bg: "#f0fdf4",
    img: ELEMENTAL_IMAGES.nature, label: "Quote the Post",
    desc: "Quote our post with your thoughts", action: "GO",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20", needsProof: true,
  },
  {
    id: "comment", element: "LIGHTNING", color: "#eab308", bg: "#fefce8",
    img: ELEMENTAL_IMAGES.lightning, label: "Comment on Post",
    desc: "Drop a comment on our post", action: "GO",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20", needsProof: true,
  },
];

const RING_POSITIONS = [{ angle: -90 }, { angle: 0 }, { angle: 90 }, { angle: 180 }];

const EVM_REGEX = /^0x[a-fA-F0-9]{40}$/;

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
};

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
      <div className="absolute inset-0 rounded-full border-4 border-dashed border-orange-300 bg-white/80" />
      <div className="absolute inset-3 rounded-full border-2 border-dotted border-yellow-300" />

      <div className="absolute inset-0" style={{ transform: `rotate(${rotation}deg)` }}>
        {RING_POSITIONS.map((pos, i) => {
          const task = TASKS[i];
          const isDone = completedTasks.includes(task.id);
          const rad = (pos.angle * Math.PI) / 180;
          const x = center + radius * Math.cos(rad) - 20;
          const y = center + radius * Math.sin(rad) - 20;

          return (
            <div key={task.id} className="absolute"
              style={{ left: x, top: y, width: 40, height: 40, transform: `rotate(${-rotation}deg)` }}>
              {isDone && (
                <div className="absolute inset-0 rounded-full animate-pulse"
                  style={{ boxShadow: `0 0 12px 4px ${task.color}40`, border: `2px solid ${task.color}`, borderRadius: "50%" }} />
              )}
              <div className="w-full h-full rounded-full flex items-center justify-center border-2 border-white shadow-md transition-all duration-500"
                style={{
                  background: isDone ? task.bg : "white",
                }}>
                {isDone
                  ? <img src={task.img} alt={task.element} className="w-6 h-6 object-contain" />
                  : <div className="text-[9px] font-black text-slate-300">{task.element.slice(0, 2)}</div>
                }
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute flex items-center justify-center rounded-full border-4 border-white shadow-xl"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 60, height: 60, background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
        <img src={GAME_ASSETS.seal2} alt="Seal" className="w-9 h-9 object-contain" />
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

  const handleTask = async (task: typeof TASKS[0]) => {
    if (!sessionId || done(task.id)) return;
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
        toast({ title: `${task.element} awakened`, description: `${task.label} complete.` });
      }, 1500);
    }
  };

  const submitProof = async (taskId: string) => {
    if (!sessionId || !proofInputs[taskId]?.trim()) return;
    await ensureSubmission();
    setPendingTask(taskId);
    await supabase.from("wl_submissions_quest")
      .update({ [`${taskId}_done`]: true, [`${taskId}_url`]: proofInputs[taskId].trim(), updated_at: new Date().toISOString() })
      .eq("session_id", sessionId);
    await fetchSubmission();
    setPendingTask(null);
    const task = TASKS.find((t) => t.id === taskId)!;
    toast({ title: `${task.element} awakened`, description: `${task.label} verified.` });
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

  return (
    <MainLayout>
      {celebrating && (
        <div className="animate-fade-in-out fixed inset-0 bg-orange-50/95 flex items-center justify-center z-[100] text-center">
          <div>
            <div className="text-4xl mb-6 font-black text-orange-500 tracking-widest">FIRE WATER NATURE LIGHTNING</div>
            <div className="text-2xl font-black tracking-widest text-slate-800 mb-3">ALL ELEMENTS AWAKENED</div>
            <div className="text-sm tracking-widest text-green-600 font-black">WHITELIST SECURED</div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-sky-50 relative overflow-hidden">
        {/* Floating blobs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-40 right-10 w-72 h-72 bg-pink-300 rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-sky-300 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-5xl mx-auto px-6 py-16 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.3em] text-orange-500 mb-4 font-black uppercase">Whitelist Portal</p>
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight mb-5">CLAIM YOUR SPOT</h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">Complete all 4 elemental tasks to secure your whitelist spot.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Tasks Card */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl p-6">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-50">
                  <span className="text-[10px] tracking-[0.3em] text-slate-400 font-black uppercase">Elemental Tasks</span>
                  <span className="text-[10px] tracking-[0.2em] text-slate-400 font-black">{completedCount}/4 COMPLETE</span>
                </div>

                <div className="flex flex-col gap-4">
                  {TASKS.map((task) => {
                    const isDone = done(task.id);
                    const isPending = pendingTask === task.id;
                    const showProof = !isDone && task.needsProof;

                    return (
                      <div
                        key={task.id}
                        className="rounded-2xl border-2 transition-all duration-300 overflow-hidden"
                        style={{
                          borderColor: isDone ? task.color + "30" : "#f1f5f9",
                          background: isDone ? task.bg : "white",
                        }}
                      >
                        <div className="flex items-center gap-5 px-5 py-5">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-md flex-shrink-0 transition-all duration-300"
                            style={{
                              background: isDone ? task.color + "15" : "#f8fafc",
                            }}
                          >
                            {isDone
                              ? <img src={task.img} alt={task.element} className="w-6 h-6 object-contain" />
                              : <div className="text-[10px] font-black text-slate-300">{task.element.slice(0, 2)}</div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-slate-800 mb-0.5">{task.label}</div>
                            <div className="text-[11px] text-slate-400">{task.desc}</div>
                          </div>
                          <div className="flex-shrink-0">
                            {isDone ? (
                              <span className="text-[10px] font-black tracking-widest border-2 px-4 py-2 rounded-full flex items-center gap-1.5"
                                style={{ color: task.color, borderColor: task.color + "30", background: task.color + "08" }}>
                                <Check className="w-3 h-3" /> DONE
                              </span>
                            ) : (
                              <button
                                onClick={() => handleTask(task)}
                                disabled={!!isPending}
                                className="text-[10px] font-black tracking-widest px-5 py-2.5 rounded-full cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                                style={{ color: "white", background: task.color }}
                              >
                                {isPending ? "OPENING..." : <span className="flex items-center gap-1">{task.action} <ExternalLink className="w-3 h-3" /></span>}
                              </button>
                            )}
                          </div>
                        </div>

                        {showProof && (
                          <div className="px-5 pb-5 border-t-2 border-slate-50 pt-4">
                            <div className="text-[9px] tracking-[0.3em] text-slate-400 mb-2 font-black uppercase">Paste Your {task.id} Link</div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="https://x.com/..."
                                value={proofInputs[task.id] || ""}
                                onChange={(e) => setProofInputs((p) => ({ ...p, [task.id]: e.target.value }))}
                                className="flex-1 bg-slate-50 border-2 border-slate-100 text-slate-800 px-4 py-3 text-xs font-mono rounded-xl focus:outline-none focus:border-orange-300 transition-colors"
                              />
                              <button
                                onClick={() => submitProof(task.id)}
                                disabled={!proofInputs[task.id]?.trim() || isPending}
                                className="px-5 py-3 text-[10px] font-black tracking-widest rounded-xl cursor-pointer transition-all disabled:opacity-40 shadow-md hover:shadow-lg"
                                style={{ color: "white", background: task.color }}
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

              {/* Wallet Card */}
              {isWL && (
                <div className="bg-white rounded-3xl border-2 border-green-100 shadow-xl p-6">
                  <div className="text-[10px] tracking-[0.3em] text-green-500 mb-1 font-black uppercase">Register Wallet</div>
                  <div className="text-[11px] text-slate-400 mb-5 leading-relaxed">Submit your EVM address to lock your whitelist spot.</div>
                  {!walletSubmitted ? (
                    <>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={wallet}
                        onChange={(e) => { setWallet(e.target.value); setWalletError(""); }}
                        className={`w-full bg-slate-50 border-2 text-slate-800 px-4 py-3 text-xs font-mono rounded-xl mb-1 block focus:outline-none transition-colors ${walletError ? "border-red-300" : "border-slate-100 focus:border-green-300"}`}
                      />
                      {walletError && (
                        <div className="text-[10px] text-red-500 mb-3">{walletError}</div>
                      )}
                      <button
                        onClick={handleWalletSubmit}
                        disabled={!wallet.trim() || submittingWallet}
                        className="w-full py-3 mt-2 text-xs font-black tracking-widest rounded-xl text-white cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 bg-green-500"
                      >
                        {submittingWallet ? "SUBMITTING..." : "SUBMIT WALLET"}
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center text-green-500 font-black text-lg">!</div>
                      <div className="text-xs font-black tracking-widest text-green-500 mb-2">WALLET REGISTERED</div>
                      <div className="text-[10px] text-slate-400 font-mono break-all">{submission?.wallet}</div>
                    </div>
                  )}
                </div>
              )}

              {/* GTD Upgrade - RESTORED */}
              {walletSubmitted && (
                <div className="bg-white rounded-3xl border-2 border-orange-100 shadow-xl overflow-hidden">
                  <a href="https://earnity.fun" target="_blank" rel="noreferrer" className="no-underline block">
                    <div className="relative h-56 overflow-hidden cursor-pointer group">
                      <img src="/IMG_8789.jpeg" alt="Upgrade to GTD" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="text-[9px] tracking-[0.3em] text-orange-300 mb-1 font-black uppercase">Ready For More?</div>
                        <div className="text-lg font-black tracking-tight text-white mb-1">UPGRADE TO GTD</div>
                        <div className="text-[11px] text-slate-300 leading-relaxed">GTD holders get a guaranteed mint slot. Collect all 6 Elementals on earnity.fun.</div>
                        <div className="mt-3 text-[10px] font-black tracking-widest text-orange-300 uppercase">Enter Earnity.fun</div>
                      </div>
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Right Column - Ring */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl p-6 flex flex-col items-center">
                <ElementalRing4 completedTasks={completedTasks} />
                <div className="w-full bg-slate-100 rounded-full h-2 mt-6 mb-2 overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${(completedCount / 4) * 100}%`, background: "linear-gradient(90deg, #fb923c, #facc15)" }}
                  />
                </div>
                <div className="text-[9px] tracking-widest text-slate-400 mt-1 font-black uppercase">
                  {completedCount === 4 ? "ALL ELEMENTS AWAKENED" : `${4 - completedCount} ELEMENTS REMAINING`}
                </div>
              </div>

              {/* Mini GTD teaser when wallet not yet submitted */}
              {!walletSubmitted && (
                <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-lg p-5 text-center">
                  <div className="text-[10px] tracking-[0.3em] text-slate-400 mb-2 font-black uppercase">Want Guaranteed Mint?</div>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">Complete tasks and submit your wallet to unlock the GTD upgrade path.</p>
                  <div className="w-8 h-8 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-black text-sm">?</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
