import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ELEMENTAL_IMAGES, GAME_ASSETS } from "@/lib/assets";
import { useAnimationFrame } from "framer-motion";
import { Check, ExternalLink } from "lucide-react";

const TASKS = [
  {
    id: "follow", element: "FIRE", color: "#ea580c", glow: "rgba(234,88,12,0.3)",
    img: ELEMENTAL_IMAGES.fire, label: "Follow Earnity",
    desc: "Follow @earnity_ on X", action: "FOLLOW",
    url: "https://x.com/earnity_", needsProof: false,
  },
  {
    id: "like", element: "WATER", color: "#2563eb", glow: "rgba(37,99,235,0.3)",
    img: ELEMENTAL_IMAGES.water, label: "Like the Post",
    desc: "Like our announcement post", action: "LIKE",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20", needsProof: false,
  },
  {
    id: "quote", element: "NATURE", color: "#16a34a", glow: "rgba(22,163,74,0.3)",
    img: ELEMENTAL_IMAGES.nature, label: "Quote the Post",
    desc: "Quote our post with your thoughts", action: "QUOTE",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20", needsProof: true,
  },
  {
    id: "comment", element: "LIGHTNING", color: "#ca8a04", glow: "rgba(202,138,4,0.3)",
    img: ELEMENTAL_IMAGES.lightning, label: "Comment on Post",
    desc: "Drop a comment on our post", action: "COMMENT",
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
      <div className="absolute inset-0 rounded-full border border-orange-200" />
      <div className="absolute inset-3 rounded-full border border-yellow-200/60" />

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
              <div className="w-full h-full rounded-full flex items-center justify-center border transition-all duration-500 shadow-sm"
                style={{
                  background: isDone ? `radial-gradient(circle, ${task.color}15, white)` : "white",
                  borderColor: isDone ? task.color : "#e5e7eb",
                }}>
                {isDone
                  ? <img src={task.img} alt={task.element} className="w-5 h-5 object-contain"
                      style={{ filter: `drop-shadow(0 0 4px ${task.color})` }} />
                  : <div className="text-gray-300 text-[8px] font-mono font-bold">{task.element.slice(0, 2)}</div>
                }
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute flex items-center justify-center rounded-full border border-orange-200 bg-white shadow-lg"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 56, height: 56 }}>
        <img src={GAME_ASSETS.seal2} alt="Seal" className="w-8 h-8 object-contain opacity-80" />
      </div>
    </div>
  );
}

export default function Whitelist() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<<Submission | null>(null);
  const [proofInputs, setProofInputs] = useState<<Record<string, string>>({});
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

  const isUnlocked = (index: number) => {
    if (!sessionId) return false;
    if (index === 0) return true;
    return done(TASKS[index - 1].id);
  };

  const handleTask = async (task: typeof TASKS[0]) => {
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

  return (
    <MainLayout>
      {celebrating && (
        <div className="animate-fade-in-out fixed inset-0 bg-white/95 flex items-center justify-center z-[100] text-center">
          <div>
            <div className="text-4xl mb-6">🜂🜄✦⚡</div>
            <div className="font-serif text-2xl font-black tracking-[0.4em] text-gray-900 mb-3">ALL ELEMENTS AWAKENED</div>
            <div className="text-sm tracking-[0.3em] text-green-600">WHITELIST SECURED</div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.5em] text-orange-500 mb-4 font-bold">WHITELIST PORTAL</p>
          <h1 className="font-serif text-4xl md:text-6xl font-black text-gray-900 tracking-widest mb-5">CLAIM YOUR SPOT</h1>
          <p className="text-xs text-gray-500 leading-relaxed">Complete all 4 elemental tasks to secure your whitelist spot.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <span className="text-[10px] tracking-[0.3em] text-gray-400 font-bold">ELEMENTAL TASKS</span>
                <span className="text-[10px] tracking-[0.2em] text-gray-400 font-bold">{completedCount}/4 COMPLETE</span>
              </div>

              <div className="flex flex-col gap-4">
                {TASKS.map((task, index) => {
                  const isDone = done(task.id);
                  const unlocked = isUnlocked(index);
                  const isPending = pendingTask === task.id;
                  const showProof = unlocked && !isDone && task.needsProof;

                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border transition-all duration-300 overflow-hidden"
                      style={{
                        borderColor: isDone ? task.color + "40" : "#e5e7eb",
                        background: isDone ? task.color + "06" : "#fafafa",
                      }}
                    >
                      <div className="flex items-center gap-5 px-5 py-5">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0 transition-all duration-300 shadow-sm"
                          style={{
                            borderColor: isDone ? task.color : unlocked ? task.color + "50" : "#e5e7eb",
                            background: isDone ? task.color + "15" : "white",
                          }}
                        >
                          {isDone
                            ? <img src={task.img} alt={task.element} className="w-5 h-5 object-contain"
                                style={{ filter: `drop-shadow(0 0 4px ${task.color})` }} />
                            : <div className="text-[9px] font-mono font-bold" style={{ color: unlocked ? task.color + "90" : "#d1d5db" }}>
                                {task.element.slice(0, 2)}
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold tracking-wider text-gray-800 mb-0.5">{task.label}</div>
                          <div className="text-[11px] text-gray-400 tracking-wide">{task.desc}</div>
                        </div>
                        <div className="flex-shrink-0">
                          {isDone ? (
                            <span className="text-[10px] font-bold tracking-[0.2em] border px-3 py-1.5 rounded-full flex items-center gap-1.5"
                              style={{ color: task.color, borderColor: task.color + "40", background: task.color + "08" }}>
                              <Check className="w-3 h-3" /> DONE
                            </span>
                          ) : !unlocked ? (
                            <span className="text-[10px] text-gray-300 tracking-widest px-3 py-1.5 font-bold">🔒 LOCKED</span>
                          ) : (
                            <button
                              onClick={() => handleTask(task)}
                              disabled={!!isPending}
                              className="text-[10px] font-bold tracking-[0.2em] px-4 py-2 rounded-full cursor-pointer transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                              style={{ color: "white", background: task.color }}
                            >
                              {isPending ? "OPENING..." : task.action}
                            </button>
                          )}
                        </div>
                      </div>

                      {showProof && (
                        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                          <div className="text-[9px] tracking-[0.3em] text-gray-400 mb-2 font-bold">PASTE YOUR {task.id.toUpperCase()} LINK</div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="https://x.com/..."
                              value={proofInputs[task.id] || ""}
                              onChange={(e) => setProofInputs((p) => ({ ...p, [task.id]: e.target.value }))}
                              className="flex-1 bg-white border border-gray-200 text-gray-800 px-3 py-2.5 text-xs font-mono rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                            />
                            <button
                              onClick={() => submitProof(task.id)}
                              disabled={!proofInputs[task.id]?.trim() || isPending}
                              className="px-4 py-2.5 text-[10px] font-bold tracking-widest rounded-lg cursor-pointer transition-all disabled:opacity-40 shadow-sm"
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

            {isWL && (
              <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6">
                <div className="text-[10px] tracking-[0.3em] text-green-600 mb-1 font-bold">REGISTER WALLET</div>
                <div className="text-[11px] text-gray-400 mb-5 leading-relaxed">Submit your EVM address to lock your whitelist spot.</div>
                {!walletSubmitted ? (
                  <>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={wallet}
                      onChange={(e) => { setWallet(e.target.value); setWalletError(""); }}
                      className={`w-full bg-gray-50 border text-gray-800 px-4 py-3 text-xs font-mono rounded-xl mb-1 block focus:outline-none focus:ring-2 ${walletError ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:ring-green-100"}`}
                    />
                    {walletError && (
                      <div className="text-[10px] text-red-500 mb-3">{walletError}</div>
                    )}
                    <button
                      onClick={handleWalletSubmit}
                      disabled={!wallet.trim() || submittingWallet}
                      className="w-full py-3 mt-2 text-xs font-bold tracking-[0.3em] rounded-xl text-white cursor-pointer transition-all shadow-sm hover:shadow-md disabled:opacity-40"
                      style={{ background: "#16a34a" }}
                    >
                      {submittingWallet ? "SUBMITTING..." : "SUBMIT WALLET"}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-green-600 text-xl mb-2">✦</div>
                    <div className="text-xs font-bold tracking-widest text-green-600 mb-2">WALLET REGISTERED</div>
                    <div className="text-[10px] text-gray-400 font-mono break-all">{submission?.wallet}</div>
                  </div>
                )}
              </div>
            )}

            {walletSubmitted && (
              <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
                <a href="https://earnity.fun" target="_blank" rel="noreferrer" className="no-underline block">
                  <div className="relative h-48 overflow-hidden cursor-pointer group">
                    <img src="/IMG_8789.jpeg" alt="Upgrade to GTD" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="text-[9px] tracking-[0.3em] text-orange-300 mb-1">READY FOR MORE?</div>
                      <div className="text-sm font-bold tracking-[0.2em] text-white mb-1">UPGRADE TO GTD</div>
                      <div className="text-[10px] text-gray-300 leading-relaxed">GTD holders get a guaranteed mint slot. Collect all 6 Elementals on earnity.fun.</div>
                      <div className="mt-3 text-[10px] font-bold tracking-widest text-orange-300">ENTER EARNITY.FUN →</div>
                    </div>
                  </div>
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center">
              <ElementalRing4 completedTasks={completedTasks} />
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-6 mb-2">
                <div className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${(completedCount / 4) * 100}%`, background: "linear-gradient(90deg, #f97316, #facc15)" }}
                />
              </div>
              <div className="text-[9px] tracking-widest text-gray-400 mt-1 font-bold">
                {completedCount === 4 ? "ALL ELEMENTS AWAKENED" : `${4 - completedCount} ELEMENTS REMAINING`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
