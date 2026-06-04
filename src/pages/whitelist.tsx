import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/layouts/main-layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ELEMENTAL_IMAGES, GAME_ASSETS } from "@/lib/assets";
import { useAnimationFrame } from "framer-motion";
import { Check, ExternalLink } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TASK CONFIG                                                        */
/* ------------------------------------------------------------------ */

const TASKS = [
  {
    id: "follow",
    element: "FIRE",
    color: "#f97316",
    bg: "#fff7ed",
    img: ELEMENTAL_IMAGES.fire,
    label: "Follow Earnity",
    desc: "Follow @earnity_ on X",
    url: "https://x.com/earnity_",
    goButton: true,
  },
  {
    id: "like",
    element: "WATER",
    color: "#3b82f6",
    bg: "#eff6ff",
    img: ELEMENTAL_IMAGES.water,
    label: "Like the Post",
    desc: "Like our announcement post",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20",
    goButton: true,
  },
  {
    id: "quote",
    element: "NATURE",
    color: "#22c55e",
    bg: "#f0fdf4",
    img: ELEMENTAL_IMAGES.nature,
    label: "Quote the Post",
    desc: "Quote our post with your thoughts",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20",
    goButton: true,
    inputPlaceholder: "Paste your quote tweet link",
  },
  {
    id: "comment",
    element: "LIGHTNING",
    color: "#eab308",
    bg: "#fefce8",
    img: ELEMENTAL_IMAGES.lightning,
    label: "Comment & Tag 2 Friends",
    desc: "Comment & tag 2 friends in our post",
    url: "https://x.com/earnity_/status/2059543689223885305?s=20",
    goButton: true,
    inputPlaceholder: "Paste your comment link",
  },
];

const RING_POSITIONS = [
  { angle: -90 },
  { angle: 0 },
  { angle: 90 },
  { angle: 180 },
];

const EVM_REGEX = /^0x[a-fA-F0-9]{40}$/;

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function getClientId(): string {
  const key = "wl_client_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

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

/* ------------------------------------------------------------------ */
/*  RING COMPONENT                                                     */
/* ------------------------------------------------------------------ */

function ElementalRing4({ completedTasks }: { completedTasks: string[] }) {
  const angleRef = useRef(0);
  const [rotation, setRotation] = useState(0);

  useAnimationFrame((_, delta) => {
    angleRef.current += delta * 0.01;
    setRotation(angleRef.current % 360);
  });

  const radius = 72;
  const center = 96;

  return (
    <div className="relative mx-auto" style={{ width: 192, height: 192 }}>
      <div className="absolute inset-0 rounded-full border-4 border-dashed border-orange-300 bg-white/80" />
      <div className="absolute inset-3 rounded-full border-2 border-dotted border-yellow-300" />

      <div
        className="absolute inset-0"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {RING_POSITIONS.map((pos, i) => {
          const task = TASKS[i];
          const isDone = completedTasks.includes(task.id);
          const rad = (pos.angle * Math.PI) / 180;
          const x = center + radius * Math.cos(rad) - 20;
          const y = center + radius * Math.sin(rad) - 20;

          return (
            <div
              key={task.id}
              className="absolute"
              style={{
                left: x,
                top: y,
                width: 40,
                height: 40,
                transform: `rotate(${-rotation}deg)`,
              }}
            >
              {isDone && (
                <div
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    boxShadow: `0 0 12px 4px ${task.color}40`,
                    border: `2px solid ${task.color}`,
                    borderRadius: "50%",
                  }}
                />
              )}
              <div
                className="w-full h-full rounded-full flex items-center justify-center border-2 border-white shadow-md transition-all duration-500"
                style={{ background: isDone ? task.bg : "white" }}
              >
                {isDone ? (
                  <img
                    src={task.img}
                    alt={task.element}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <div className="text-[9px] font-black text-slate-300">
                    {task.element.slice(0, 2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="absolute flex items-center justify-center rounded-full border-4 border-white shadow-xl"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 60,
          height: 60,
          background: "linear-gradient(135deg, #fef3c7, #fde68a)",
        }}
      >
        <img
          src={GAME_ASSETS.seal2}
          alt="Seal"
          className="w-9 h-9 object-contain"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE                                                          */
/* ------------------------------------------------------------------ */

export default function Whitelist() {
  const clientId = useRef<string>(getClientId());
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [pendingTask, setPendingTask] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  /* --- load draft inputs ------------------------------------------ */
  useEffect(() => {
    const draft = localStorage.getItem(`wl_draft_${clientId.current}`);
    if (draft) {
      try {
        setInputs(JSON.parse(draft));
      } catch {
        /* noop */
      }
    }
    fetchSubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- persist draft inputs ---------------------------------------- */
  useEffect(() => {
    localStorage.setItem(`wl_draft_${clientId.current}`, JSON.stringify(inputs));
  }, [inputs]);

  /* --- fetch existing submission ----------------------------------- */
  const fetchSubmission = async () => {
    const { data } = await supabase
      .from("wl_submissions_quest")
      .select("*")
      .eq("session_id", clientId.current)
      .single();

    if (data) {
      setSubmission(data);
      if (data.wallet) {
        setInputs({
          quote: data.quote_url || "",
          comment: data.comment_url || "",
          wallet: data.wallet || "",
        });
      }
    }
  };

  /* --- ensure row exists ------------------------------------------- */
  const ensureSubmission = async () => {
    const { data } = await supabase
      .from("wl_submissions_quest")
      .select("id")
      .eq("session_id", clientId.current)
      .single();

    if (!data) {
      await supabase.from("wl_submissions_quest").insert({
        session_id: clientId.current,
        status: "in_progress",
      });
    }
  };

  /* --- helpers ----------------------------------------------------- */
  const done = (id: string) => {
    if (!submission) return false;
    return submission[`${id}_done` as keyof Submission] as boolean;
  };

  const completedTasks = TASKS.filter((t) => done(t.id)).map((t) => t.id);
  const completedCount = completedTasks.length;
  const isSubmitted = !!submission?.wallet;

  /* --- GO-button tasks --------------------------------------------- */
  const handleGoTask = async (task: (typeof TASKS)[0]) => {
    if (done(task.id)) return;
    await ensureSubmission();

    window.open(task.url!, "_blank");
    setPendingTask(task.id);

    setTimeout(async () => {
      await supabase
        .from("wl_submissions_quest")
        .update({
          [`${task.id}_done`]: true,
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", clientId.current);

      await fetchSubmission();
      setPendingTask(null);
      toast({
        title: `${task.element} awakened`,
        description: `${task.label} complete.`,
      });
    }, 1200);
  };

  /* --- input change ------------------------------------------------ */
  const setField = (key: string, value: string) => {
    setInputs((p) => ({ ...p, [key]: value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
  };

  /* --- final submit ------------------------------------------------ */
  const handleSubmit = async () => {
    const errs: Record<string, string> = {};

    if (!done("follow")) errs.follow = "Required — complete this task";
    if (!done("like")) errs.like = "Required — complete this task";
    if (!done("quote")) errs.quote = "Click GO and paste your quote tweet link";
    if (!done("comment")) errs.comment = "Click GO and paste your comment link";

    if (!inputs.quote?.trim()) errs.quote = "Paste your quote tweet link";
    if (!inputs.comment?.trim()) errs.comment = "Paste your comment link";

    const wallet = inputs.wallet?.trim();
    if (!wallet) {
      errs.wallet = "Wallet address required";
    } else if (!EVM_REGEX.test(wallet)) {
      errs.wallet = "Invalid EVM address (must be 0x + 40 hex chars)";
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await ensureSubmission();

      const { error } = await supabase
        .from("wl_submissions_quest")
        .update({
          quote_done: true,
          quote_url: inputs.quote.trim(),
          comment_done: true,
          comment_url: inputs.comment.trim(),
          wallet: wallet,
          status: "submitted",
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", clientId.current);

      if (error) throw error;

      await fetchSubmission();
      toast({
        title: "Application Received",
        description: "We'll review your submission and whitelist approved Outworlders.",
      });
    } catch {
      setErrors({ submit: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  /* ================================================================ */
  /*  SUBMITTED STATE                                                  */
  /* ================================================================ */
  if (isSubmitted) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-[#050a06] flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-green-900/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-md bg-[#0d1f14] border border-green-800/40 rounded-[2rem] p-10 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>

            <h2 className="text-2xl font-black text-green-400 mb-2 tracking-wide uppercase">
              WL Spot Secured!
            </h2>

            <p className="text-green-600/80 font-mono text-sm mb-8 tracking-wider">
              {submission!.wallet!.slice(0, 6)}...
              {submission!.wallet!.slice(-4)}
            </p>

            <div className="w-full py-4 rounded-xl bg-green-700 text-white font-black tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-900/50">
              <Check className="w-5 h-5" /> Submitted
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  /* ================================================================ */
  /*  FORM STATE                                                       */
  /* ================================================================ */
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-sky-50 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute bottom-40 right-10 w-72 h-72 bg-pink-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-sky-300 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 py-16 relative z-10">
          {/* header */}
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.3em] text-orange-500 mb-4 font-black uppercase">
              Whitelist Portal
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight mb-5">
              CLAIM YOUR SPOT
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Complete all 4 elemental tasks to secure your whitelist spot.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
            {/* -------------------- LEFT COLUMN -------------------- */}
            <div className="flex flex-col gap-6">
              {/* Tasks Card */}
              <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl p-6">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-50">
                  <span className="text-[10px] tracking-[0.3em] text-slate-400 font-black uppercase">
                    Elemental Tasks
                  </span>
                  <span className="text-[10px] tracking-[0.2em] text-slate-400 font-black">
                    {completedCount}/4 COMPLETE
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {TASKS.map((task) => {
                    const isDone = done(task.id);
                    const isPending = pendingTask === task.id;

                    return (
                      <div
                        key={task.id}
                        className="rounded-2xl border-2 transition-all duration-300 overflow-hidden"
                        style={{
                          borderColor: isDone ? task.color + "30" : "#f1f5f9",
                          background: isDone ? task.bg : "white",
                        }}
                      >
                        <div className="p-5">
                          {/* Top row: icon + text + GO button */}
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-md flex-shrink-0 transition-all duration-300"
                              style={{
                                background: isDone
                                  ? task.color + "15"
                                  : "#f8fafc",
                              }}
                            >
                              {isDone ? (
                                <img
                                  src={task.img}
                                  alt={task.element}
                                  className="w-6 h-6 object-contain"
                                />
                              ) : (
                                <div className="text-[10px] font-black text-slate-300">
                                  {task.element.slice(0, 2)}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-sm font-black mb-0.5 ${
                                  isDone
                                    ? "text-slate-400 line-through"
                                    : "text-slate-800"
                                }`}
                              >
                                {task.label}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {task.desc}
                              </div>
                            </div>

                            {task.goButton && (
                              <button
                                onClick={() => handleGoTask(task)}
                                disabled={isDone || !!isPending}
                                className="text-[10px] font-black tracking-widest px-5 py-2.5 rounded-full cursor-pointer transition-all shadow-md disabled:opacity-50 disabled:cursor-default whitespace-nowrap flex items-center gap-1"
                                style={{
                                  background: isDone
                                    ? "transparent"
                                    : "#1a1a1a",
                                  color: isDone ? task.color : "#fff",
                                  border: isDone
                                    ? `2px solid ${task.color}30`
                                    : "none",
                                }}
                              >
                                {isDone ? (
                                  <>
                                    <Check className="w-3 h-3" /> DONE
                                  </>
                                ) : isPending ? (
                                  "OPENING…"
                                ) : (
                                  <>
                                    GO{" "}
                                    <ExternalLink className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Input field (quote / comment / wallet) */}
                          {task.inputPlaceholder && !task.isWallet && (
                            <div className="mt-4">
                              <input
                                type="text"
                                placeholder={task.inputPlaceholder}
                                value={inputs[task.id] || ""}
                                onChange={(e) =>
                                  setField(task.id, e.target.value)
                                }
                                className="w-full bg-slate-50 border-2 border-slate-100 text-slate-800 px-4 py-3 text-xs font-mono rounded-xl focus:outline-none focus:border-orange-300 transition-colors"
                              />
                              {errors[task.id] && (
                                <p className="text-[10px] text-red-500 mt-1.5 font-bold">
                                  {errors[task.id]}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wallet Card */}
              <div className="rounded-3xl border-2 border-slate-900 bg-slate-900 shadow-xl p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-black">
                      Submit Your EVM Wallet
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Required for whitelist allocation
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="0x…"
                  value={inputs.wallet || ""}
                  onChange={(e) => setField("wallet", e.target.value)}
                  className={`w-full bg-black/30 border-2 text-white px-4 py-3 text-xs font-mono rounded-xl focus:outline-none transition-colors ${
                    errors.wallet
                      ? "border-red-500/50"
                      : "border-white/10 focus:border-green-500/50"
                  }`}
                />
                {errors.wallet && (
                  <p className="text-[10px] text-red-400 mt-2 font-bold">
                    {errors.wallet}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              {errors.submit && (
                <p className="text-[11px] text-red-500 text-center font-bold">
                  {errors.submit}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-[#1a1a1a] text-white font-black tracking-widest text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? "SUBMITTING…" : "SUBMIT APPLICATION"}
              </button>

              <p className="text-[10px] text-slate-400 text-center font-bold tracking-wide">
                Quote & comment links are manually reviewed.
              </p>
            </div>

            {/* -------------------- RIGHT COLUMN (RING) -------------------- */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl p-6 flex flex-col items-center">
                <ElementalRing4 completedTasks={completedTasks} />

                <div className="w-full bg-slate-100 rounded-full h-2 mt-6 mb-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${(completedCount / 4) * 100}%`,
                      background: "linear-gradient(90deg, #fb923c, #facc15)",
                    }}
                  />
                </div>
                <div className="text-[9px] tracking-widest text-slate-400 mt-1 font-black uppercase">
                  {completedCount === 4
                    ? "ALL ELEMENTS AWAKENED"
                    : `${4 - completedCount} ELEMENTS REMAINING`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
