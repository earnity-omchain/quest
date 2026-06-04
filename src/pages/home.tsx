import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { MainLayout } from "@/layouts/main-layout";
import { ELEMENTAL_IMAGES, ART_IMAGES, GAME_ASSETS } from "@/lib/assets";
import { useAnimationFrame } from "framer-motion";

const CDN_ART = [ART_IMAGES.hero1, ART_IMAGES.hero2, ART_IMAGES.hero3];

const WL_ELEMENTS = [
  { key: "fire",      label: "FIRE",      color: "#f97316", bg: "#ffedd5", img: ELEMENTAL_IMAGES.fire      },
  { key: "water",     label: "WATER",     color: "#3b82f6", bg: "#dbeafe", img: ELEMENTAL_IMAGES.water     },
  { key: "nature",    label: "NATURE",    color: "#22c55e", bg: "#dcfce7", img: ELEMENTAL_IMAGES.nature    },
  { key: "lightning", label: "LIGHTNING", color: "#eab308", bg: "#fef9c3", img: ELEMENTAL_IMAGES.lightning },
];

const RING_POSITIONS = [
  { angle: -90  },
  { angle: 0    },
  { angle: 90   },
  { angle: 180  },
];

function ElementalRing4() {
  const angleRef = useRef(0);
  const [rotation, setRotation] = useState(0);

  useAnimationFrame((_, delta) => {
    angleRef.current += delta * 0.010;
    setRotation(angleRef.current % 360);
  });

  const radius = 100;
  const center = 130;

  return (
    <div className="relative mx-auto" style={{ width: 260, height: 260 }}>
      <div className="absolute inset-0 rounded-full border-4 border-dashed border-orange-300 bg-white/60" />
      <div className="absolute inset-4 rounded-full border-2 border-dotted border-yellow-300" />

      <div className="absolute inset-0" style={{ transform: `rotate(${rotation}deg)` }}>
        {RING_POSITIONS.map((pos, i) => {
          const el  = WL_ELEMENTS[i];
          const rad = (pos.angle * Math.PI) / 180;
          const x   = center + radius * Math.cos(rad) - 28;
          const y   = center + radius * Math.sin(rad) - 28;

          return (
            <div key={el.key} className="absolute transition-all duration-300"
              style={{ left: x, top: y, width: 56, height: 56,
                transform: `rotate(${-rotation}deg)` }}>
              <div className="w-full h-full rounded-full flex items-center justify-center border-4 border-white shadow-lg"
                style={{ background: el.bg, boxShadow: `0 8px 20px ${el.color}40` }}>
                <img src={el.img} alt={el.label} className="w-8 h-8 object-contain" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute flex items-center justify-center rounded-full border-4 border-white shadow-xl"
        style={{
          left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          width: 80, height: 80,
          background: "linear-gradient(135deg, #fef3c7, #fde68a)",
        }}>
        <img src={GAME_ASSETS.seal2} alt="Seal" className="w-12 h-12 object-contain" />
      </div>
    </div>
  );
}

function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrev(current);
      setCurrent((c) => (c + 1) % CDN_ART.length);
      setBouncing(true);
      setTimeout(() => setBouncing(false), 600);
    }, 4000);
    return () => clearInterval(interval);
  }, [current]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl border-4 border-white shadow-xl">
      {prev !== null && (
        <img
          key={`prev-${prev}`}
          src={CDN_ART[prev]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-0"
        />
      )}
      <img
        key={`cur-${current}`}
        src={CDN_ART[current]}
        alt="Earnity Art"
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
          bouncing ? "scale-[1.05]" : "scale-100"
        }`}
        style={{ transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.7s ease" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
        {CDN_ART.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className="rounded-full transition-all cursor-pointer border-2 border-white"
            style={{
              width: i === current ? 20 : 8, height: 8,
              background: i === current ? "#fb923c" : "rgba(255,255,255,0.6)",
            }} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [particles, setParticles] = useState<{ id: number; left: string; delay: string; duration: string; size: string; opacity: number; color: string }[]>([]);

  useEffect(() => {
    const colors = ["#fb923c", "#38bdf8", "#a3e635", "#f472b6", "#facc15"];
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${Math.random() * 12 + 8}s`,
      size: `${Math.random() * 3 + 2}px`,
      opacity: Math.random() * 0.3 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    })));
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-pink-50 to-yellow-50 relative overflow-hidden">
        {particles.map((p) => (
          <div key={p.id}
            className="animate-float fixed rounded-full pointer-events-none z-0"
            style={{ left: p.left, bottom: "-4px", width: p.size, height: p.size, opacity: p.opacity, backgroundColor: p.color, animationDuration: p.duration, animationDelay: p.delay }}
          />
        ))}

        {/* HERO */}
        <section className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-32 h-32 bg-orange-300 rounded-full blur-3xl opacity-40" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-300 rounded-full blur-3xl opacity-40" />
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-sky-300 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-10 max-w-3xl">
            <div>
              <p className="text-xs tracking-[0.3em] text-orange-500 font-black mb-4 uppercase">NFT Whitelist Portal - Season 1</p>
              <h1 className="text-5xl md:text-7xl font-black leading-none mb-6 text-slate-800">
                <span>Enter The </span>
                <span className="text-orange-500">Earnity</span>
                <br />
                <span>Realm</span>
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto font-medium">
                Complete 4 elemental tasks. Secure your whitelist spot.
                Forge your path toward Eryth.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/whitelist">
                <button className="px-8 py-4 bg-orange-400 hover:bg-orange-300 text-white font-black text-xs tracking-widest rounded-2xl transition-all cursor-pointer border-none shadow-xl shadow-orange-200 hover:shadow-2xl hover:shadow-orange-200 hover:-translate-y-1 active:translate-y-0">
                  CLAIM WHITELIST
                </button>
              </Link>
              <Link href="/collab">
                <button className="px-8 py-4 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-600 hover:text-slate-800 font-black text-xs tracking-widest rounded-2xl transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0">
                  PROJECT COLLAB
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="w-full h-80 lg:h-[440px] rounded-3xl border-4 border-white shadow-2xl overflow-hidden bg-white">
              <HeroSlideshow />
            </div>

            <div>
              <p className="text-[10px] tracking-[0.3em] text-orange-500 font-black mb-4 uppercase">About Earnity</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-6 leading-tight">A World Unlike<br />Any Other</h2>

              <div className="space-y-4 text-sm text-slate-500 leading-relaxed">
                <p>
                  Earnity is a fantasy progression ecosystem built around exploration, survival, and community-driven adventure. The world begins with <span className="text-orange-500 font-bold">The Portal</span> — a mysterious gateway transporting travelers into an unknown realm. Those who emerge find themselves on a dangerous journey toward <span className="text-orange-500 font-bold">Eryth</span>, a mythical city spoken of in ancient records, yet never confirmed.
                </p>
                <p>
                  Some believe Eryth is salvation. Others believe it never existed at all.
                </p>
                <p>
                  Inside Earnity, travelers evolve through <span className="text-slate-700 font-bold">progression</span>, <span className="text-slate-700 font-bold">discovery</span>, <span className="text-slate-700 font-bold">rivalry</span>, elemental alignment, Stronghold evolution, and long-term survival. Every journey begins at <span className="text-orange-500 font-bold">E Rank</span> and grows through activity, consistency, and participation.
                </p>
                <p>
                  As the journey deepens — alliances form, rivalries emerge, mysteries sharpen, and the road toward Eryth grows more dangerous.
                </p>
                <p className="text-slate-700 font-bold tracking-wide">
                  Earnity is designed to feel like a living world shaped by those traveling through it.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {["Progression", "Discovery", "Rivalry", "Survival", "Elemental Alignment", "Stronghold Evolution"].map((tag) => (
                  <span key={tag} className="text-[10px] tracking-widest font-bold bg-white border-2 border-slate-200 text-slate-500 px-4 py-2 rounded-xl shadow-sm">
                    {tag.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] tracking-[0.3em] text-orange-500 font-black mb-4 uppercase">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-16">Three Steps To Mint</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { num: "01", title: "COMPLETE TASKS", desc: "Complete 4 elemental tasks sequentially — follow, like, quote, and contribute to Earnity. Each task awakens a new element.", color: "#fb923c" },
                { num: "02", title: "SECURE YOUR SPOT", desc: "Submit your EVM wallet after completing the tasks. Contribute further to accelerate your approval.", color: "#e879f9" },
                { num: "03", title: "MINT", desc: "Approved travelers receive a whitelist slot. GTD holders get a guaranteed mint. Be among the first to enter the realm.", color: "#38bdf8" },
              ].map((step) => (
                <div key={step.num} className="bg-white border-2 border-slate-100 rounded-3xl p-8 text-left shadow-xl hover:shadow-2xl transition-shadow hover:-translate-y-1 duration-300">
                  <div className="text-4xl font-black mb-4" style={{ color: step.color }}>{step.num}</div>
                  <div className="text-xs font-black tracking-widest text-slate-700 mb-3 uppercase">{step.title}</div>
                  <div className="text-sm text-slate-500 leading-relaxed">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ELEMENTAL RING + WL TASKS */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col items-center gap-6">
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-slate-100">
                <ElementalRing4 />
              </div>
              <p className="text-[10px] tracking-widest text-slate-400 font-bold text-center uppercase">
                Complete All 4 Elementals To Secure Whitelist
              </p>
            </div>

            <div>
              <p className="text-[10px] tracking-[0.3em] text-orange-500 font-black mb-4 uppercase">Elemental Tasks</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-8 leading-tight">Awaken The<br />4 Elementals</h2>
              <div className="flex flex-col gap-4">
                {WL_ELEMENTS.map((el, i) => (
                  <div key={el.key} className="flex items-center gap-4 bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-md"
                      style={{ background: el.bg }}>
                      <img src={el.img} alt={el.label} className="w-7 h-7 object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-black tracking-widest uppercase" style={{ color: el.color }}>{el.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-medium">
                        {i === 0 && "Follow @earnity_ on X"}
                        {i === 1 && "Like our announcement post"}
                        {i === 2 && "Quote our post with your thoughts"}
                        {i === 3 && "Contribute — tweet, article, or community post"}
                      </div>
                    </div>
                    <div className="text-[10px] tracking-widest text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full">STEP {i + 1}</div>
                  </div>
                ))}
              </div>
              <Link href="/whitelist">
                <button className="mt-6 w-full py-4 bg-orange-400 hover:bg-orange-300 text-white font-black text-xs tracking-widest rounded-2xl transition-all cursor-pointer border-none shadow-xl shadow-orange-200 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0">
                  BEGIN YOUR QUEST
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* HOW TO GTD */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[10px] tracking-[0.3em] text-orange-500 font-black mb-4 uppercase">The Deeper Path</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-4">How To GTD On Earnity</h2>
              <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                Inside Earnity, there is only one confirmed path toward full qualification. The Elementals.
                Simple in theory. Difficult in practice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {[
                {
                  title: "ELEMENTAL SHARDS",
                  color: "#fb923c",
                  body: "Throughout the portal, travelers obtain elemental shards via progression systems, Mystery Boxes, events, and future activities. Each shard belongs to a specific element — Fire, Water, Nature, Lightning, Rock, Wind, and others. Not all shards are equally common. Some grow increasingly rare over time.",
                },
                {
                  title: "FORGING AN ELEMENTAL",
                  color: "#eab308",
                  body: "To forge a complete Elemental, a traveler must gather 4 matching elemental shards of the same type. Four Fire Shards become one Fire Elemental. Mixed shards do not combine. Only complete, matching sets can forge a true Elemental.",
                },
                {
                  title: "THE PATH TO GTD",
                  color: "#22c55e",
                  body: "Full qualification requires 6 complete Elementals — one of each element. This demands collecting full shard sets, completing multiple Elementals, and progressing consistently through the portal. Travelers who fall short may never reach the next stage of their journey.",
                },
                {
                  title: "WHY IT MATTERS",
                  color: "#3b82f6",
                  body: "The Elementals are more than collectibles. They are ancient fragments tied to the deeper mysteries surrounding The Portal, the fractured world, and the road toward Eryth itself. Some believe they are keys. Others believe they are warnings left behind by those who came before.",
                },
              ].map((card, idx) => (
                <div key={card.title} className="bg-white border-2 border-slate-100 rounded-3xl p-7 shadow-lg hover:shadow-xl transition-shadow hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-xs shadow-md" style={{ background: card.color }}>
                      {idx + 1}
                    </div>
                    <span className="text-xs font-black tracking-widest uppercase" style={{ color: card.color }}>{card.title}</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border-2 border-orange-200 rounded-3xl p-8 text-center shadow-xl">
              <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-black text-lg">!</div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto mb-2">
                Not every traveler will complete the journey. Some will stop halfway. Some will lose shards along the road.
                But those who gather all 6 Elementals move one step closer toward whatever waits beyond Eryth.
              </p>
              <p className="text-[10px] tracking-[0.3em] text-orange-500 font-black mt-4 uppercase">The Journey Awaits</p>
            </div>
          </div>
        </section>

        {/* GTD UPGRADE */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] tracking-[0.3em] text-orange-500 font-black mb-4 uppercase">Upgrade Your Journey</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-6">Collect All 6 Elementals</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed mb-8">
              GTD holders receive a guaranteed mint slot. Visit earnity.fun to begin collecting Elementals and secure your place in the realm.
            </p>
            <a href="https://earnity.fun" target="_blank" rel="noreferrer" className="no-underline inline-block">
              <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-4 border-orange-200 hover:border-orange-300 transition-all cursor-pointer group shadow-xl hover:shadow-2xl">
                <img src="/IMG_8789.jpg" alt="Upgrade to GTD" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <div className="text-sm font-black tracking-widest text-white mb-1 uppercase">Enter Earnity.fun</div>
                  <div className="text-[10px] text-orange-300 tracking-widest font-bold uppercase">GTD Upgrade</div>
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* SOCIALS */}
        <section className="py-20 px-6 bg-white/50">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] tracking-[0.3em] text-orange-500 font-black mb-4 uppercase">Join The Realm</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-8">Connect With Earnity</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://discord.gg/u7EzeYQpKt" target="_blank" rel="noreferrer"
                className="flex items-center gap-3 px-8 py-4 bg-indigo-50 border-2 border-indigo-200 hover:border-indigo-400 text-indigo-500 hover:text-indigo-700 rounded-2xl transition-all no-underline group shadow-lg hover:shadow-xl hover:-translate-y-1 font-black text-xs tracking-widest uppercase">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>Discord</span>
              </a>
              <a href="https://x.com/earnity_" target="_blank" rel="noreferrer"
                className="flex items-center gap-3 px-8 py-4 bg-slate-50 border-2 border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800 rounded-2xl transition-all no-underline group shadow-lg hover:shadow-xl hover:-translate-y-1 font-black text-xs tracking-widest uppercase">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>X / Twitter</span>
              </a>
            </div>
          </div>
        </section>

        {/* COLLAB BANNER */}
        <section className="py-20 px-6 bg-white/50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 bg-white rounded-3xl p-10 border-2 border-slate-100 shadow-xl">
            <div className="max-w-lg">
              <p className="text-[10px] tracking-[0.3em] text-orange-500 font-black mb-4 uppercase">For Communities</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-4">Collab With Earnity</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Want WL spots for your community? Apply for a collab and connect with our growing realm of travelers.
              </p>
            </div>
            <Link href="/collab">
              <button className="whitespace-nowrap px-8 py-4 bg-white border-2 border-slate-200 hover:border-orange-300 text-slate-500 hover:text-orange-500 font-black text-xs tracking-widest rounded-2xl transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0">
                REQUEST COLLAB
              </button>
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-10 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="font-black tracking-[0.3em] text-slate-400 text-sm">EARNITY</span>
            <div className="flex gap-8">
              <a href="https://x.com/earnity_" target="_blank" rel="noreferrer" className="text-[10px] tracking-widest text-slate-400 hover:text-slate-600 no-underline transition-colors font-bold uppercase">X Twitter</a>
              <a href="https://earnity.fun" target="_blank" rel="noreferrer" className="text-[10px] tracking-widest text-slate-400 hover:text-slate-600 no-underline transition-colors font-bold uppercase">Earnity.fun</a>
            </div>
            <span className="text-[10px] tracking-widest text-slate-300 font-bold">2025 EARNITY</span>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
}
