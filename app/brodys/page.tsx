'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/* ------------------------------------------------------------------ */
/*  Brand mark — orange spark + navy cable "D" from the logo           */
/* ------------------------------------------------------------------ */
function BrandMark({
  className,
  onDark = true,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const main = onDark ? '#e8edf9' : '#1b2a52';
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="4" y="44" width="12" height="12" rx="2" fill="#f5a623" />
      <path
        d="M22 50 H40 a16 16 0 0 0 0 -32 H26"
        fill="none"
        stroke={main}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M22 34 H36"
        fill="none"
        stroke="#8b93a8"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect x="34" y="28" width="10" height="12" rx="2" fill={main} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Reveal-on-scroll wrapper                                           */
/* ------------------------------------------------------------------ */
function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  as?: 'div' | 'section' | 'h2' | 'p' | 'li';
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('bl-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={`bl-reveal ${className}`}
      style={{ ['--rd' as never]: `${delay}s` }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  Odometer-style animated number                                     */
/* ------------------------------------------------------------------ */
function useAnimatedNumber(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      setValue(v);
      fromRef.current = v;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return value;
}

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1600);
          setShown(Math.round(to * (1 - Math.pow(1 - t, 3))));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <b ref={ref}>
      {shown.toLocaleString()}
      {suffix}
    </b>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO — sunrise, parallax mountains, drifting clouds, birds         */
/* ------------------------------------------------------------------ */
function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (farRef.current)
          farRef.current.style.transform = `translateY(${y * 0.12}px)`;
        if (midRef.current)
          midRef.current.style.transform = `translateY(${y * 0.24}px)`;
        if (nearRef.current)
          nearRef.current.style.transform = `translateY(${y * 0.4}px)`;
        if (sunRef.current)
          sunRef.current.style.marginBottom = `${-y * 0.5}px`;
        if (innerRef.current) {
          innerRef.current.style.transform = `translateY(${y * 0.32}px)`;
          innerRef.current.style.opacity = String(
            Math.max(0, 1 - y / (window.innerHeight * 0.75))
          );
        }
      });
    };
    const onMove = (e: PointerEvent) => {
      const el = heroRef.current;
      const glow = glowRef.current;
      if (!el || !glow) return;
      const r = el.getBoundingClientRect();
      glow.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      glow.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    heroRef.current?.addEventListener('pointermove', onMove);
    onScroll();
    const hero = heroRef.current;
    return () => {
      window.removeEventListener('scroll', onScroll);
      hero?.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="bl-hero" id="top" ref={heroRef}>
      {/* stars fading into dawn */}
      <div className="bl-hero-layer" style={{ zIndex: 0 }}>
        {[...Array(26)].map((_, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 137) % 100}%`,
              top: `${(i * 53) % 34}%`,
              width: i % 3 ? 2 : 3,
              height: i % 3 ? 2 : 3,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.8)',
              opacity: 0.15 + ((i * 29) % 60) / 100,
            }}
          />
        ))}
      </div>

      <div className="bl-sun" ref={sunRef} style={{ zIndex: 1 }} />

      {/* clouds */}
      <svg
        className="bl-cloud"
        style={{ top: '14%', width: 220, animationDuration: '70s' }}
        viewBox="0 0 220 60"
      >
        <ellipse cx="60" cy="40" rx="60" ry="18" />
        <ellipse cx="130" cy="30" rx="70" ry="22" />
      </svg>
      <svg
        className="bl-cloud"
        style={{ top: '30%', width: 160, animationDuration: '95s', animationDelay: '-40s' }}
        viewBox="0 0 220 60"
      >
        <ellipse cx="80" cy="38" rx="70" ry="16" />
        <ellipse cx="150" cy="30" rx="55" ry="18" />
      </svg>

      {/* birds */}
      <svg className="bl-birds" width="120" height="44" viewBox="0 0 120 44">
        <path d="M4 18 Q12 8 20 18 Q28 8 36 18" />
        <path d="M52 30 Q59 22 66 30 Q73 22 80 30" />
        <path d="M88 12 Q94 5 100 12 Q106 5 112 12" />
      </svg>

      {/* far ridge */}
      <div className="bl-hero-layer" ref={farRef} style={{ zIndex: 2 }}>
        <svg viewBox="0 0 1440 420" preserveAspectRatio="none" style={{ height: '62%' }}>
          <path
            d="M0 420 L0 260 L140 150 L260 250 L420 90 L560 230 L720 120 L880 260 L1040 130 L1200 240 L1330 160 L1440 250 L1440 420 Z"
            fill="#5d4a7e"
            opacity="0.75"
          />
        </svg>
      </div>
      {/* mid ridge */}
      <div className="bl-hero-layer" ref={midRef} style={{ zIndex: 3 }}>
        <svg viewBox="0 0 1440 360" preserveAspectRatio="none" style={{ height: '48%' }}>
          <path
            d="M0 360 L0 230 L180 110 L330 240 L500 80 L660 220 L840 100 L1020 250 L1180 140 L1320 230 L1440 170 L1440 360 Z"
            fill="#3a3866"
          />
          <path
            d="M500 80 L540 120 L500 132 L470 112 Z"
            fill="#fdeedd"
            opacity="0.85"
          />
          <path d="M840 100 L874 138 L838 148 L812 130 Z" fill="#fdeedd" opacity="0.8" />
        </svg>
      </div>
      {/* near ridge */}
      <div className="bl-hero-layer" ref={nearRef} style={{ zIndex: 4 }}>
        <svg viewBox="0 0 1440 300" preserveAspectRatio="none" style={{ height: '36%' }}>
          <path
            d="M0 300 L0 200 L200 90 L380 210 L580 70 L790 220 L980 110 L1180 230 L1440 120 L1440 300 Z"
            fill="#1c2247"
          />
          {/* a cable line running along the near ridge with a glowing node */}
          <path
            d="M0 232 C240 170 420 250 640 170 C860 96 1100 230 1440 150"
            fill="none"
            stroke="#f5a623"
            strokeWidth="3"
            strokeDasharray="10 14"
            opacity="0.85"
          />
          <circle cx="640" cy="170" r="7" fill="#f5a623">
            <animate attributeName="r" values="5;9;5" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="bl-hero-glow" ref={glowRef} />

      <div className="bl-hero-inner" ref={innerRef}>
        <span className="bl-hero-badge">
          <i className="bl-dot" /> Licensed · Insured · On-Call
        </span>
        <h1>
          <span className="bl-line">
            <span>Brody&rsquo;s</span>
          </span>
          <span className="bl-line">
            <span className="bl-h-orange">Low&#8209;Voltage &amp;</span>
          </span>
          <span className="bl-line">
            <span>Cabling Services</span>
          </span>
        </h1>
        <p>
          Structured cabling, security cameras, access control, and A/V —
          pulled clean, terminated right, and certified with test reports on
          every single drop. From the first stud to the last patch panel.
        </p>
        <div className="bl-hero-ctas">
          <a href="#estimate" className="bl-btn bl-btn-primary">
            Build a Live Estimate ↓
          </a>
          <a href="#wirelab" className="bl-btn bl-btn-ghost">
            Try the Wire Lab
          </a>
        </div>
      </div>

      <div className="bl-scrollcue">
        <div className="bl-mouse" />
        Scroll
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Services fan — a hand of cards spreads open as you scroll          */
/* ------------------------------------------------------------------ */
const SERVICES = [
  {
    title: 'Structured Cabling',
    tag: 'Cat5e · Cat6 · Cat6A',
    desc: 'Voice and data drops routed, labeled, and certified — new builds and retrofits.',
    icon: 'M4 7h16M4 12h16M4 17h10',
  },
  {
    title: 'Fiber Optics',
    tag: 'OM4 · Single-mode',
    desc: 'Backbone runs, fusion splicing, and OTDR-tested terminations.',
    icon: 'M3 12c4-7 14-7 18 0M3 12c4 7 14 7 18 0',
  },
  {
    title: 'Security Cameras',
    tag: 'IP · NVR · Remote view',
    desc: 'Camera systems you can watch from your phone, with clean PoE runs.',
    icon: 'M4 8l12-3 1 5-12 3zM8 13v5h3',
  },
  {
    title: 'Access Control',
    tag: 'Keyless · Fobs · Intercom',
    desc: 'Door controllers, mag locks, and badge readers wired and programmed.',
    icon: 'M12 3a5 5 0 015 5v3H7V8a5 5 0 015-5zM6 11h12v9H6z',
  },
  {
    title: 'Audio / Video',
    tag: 'Theaters · Conference',
    desc: 'In-wall speaker wire, displays, and conference rooms without a cable in sight.',
    icon: 'M4 6h16v10H4zM9 20h6',
  },
  {
    title: 'Wi-Fi & Networks',
    tag: 'Heatmapped coverage',
    desc: 'Access points placed off a real survey — dead zones engineered out.',
    icon: 'M2 9c6-6 14-6 20 0M5 13c4-4 10-4 14 0M9 17c2-2 4-2 6 0',
  },
];

function ServicesFan() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const sec = sectionRef.current;
        if (!sec) return;
        const rect = sec.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const p = Math.min(1, Math.max(0, -rect.top / total));
        // ease the fan open, then float
        const fan = Math.min(1, p * 1.5);
        const eased = 1 - Math.pow(1 - fan, 3);
        const n = SERVICES.length;
        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const centered = i - (n - 1) / 2;
          const angle = centered * 16 * eased;
          const lift = Math.abs(centered) * 14 * eased;
          const stack = (1 - eased) * i * -3;
          card.style.transform = `rotate(${angle + stack}deg) translateY(${lift}px)`;
          card.style.zIndex = String(10 + i);
        });
        if (hintRef.current)
          hintRef.current.style.opacity = String(eased < 0.9 ? 1 : 0);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="bl-fan-section" id="services" ref={sectionRef}>
      <div className="bl-fan-sticky">
        <div className="bl-fan-head">
          <span className="bl-kicker">What we run</span>
          <h2>Every wire in the building.</h2>
          <p>
            Keep scrolling — the full hand fans out. Six trades, one crew, zero
            subcontractor roulette.
          </p>
        </div>
        <div className="bl-fan-stage">
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className="bl-fan-card"
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
            >
              <span className="bl-fc-ico">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <span className="bl-fc-tag">{s.tag}</span>
            </div>
          ))}
        </div>
        <div className="bl-fan-hint" ref={hintRef}>
          ↓ keep scrolling to fan the deck ↓
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  WIRE LAB — patch the building in, interactively                    */
/* ------------------------------------------------------------------ */
const DEVICES = [
  { name: 'Security Cam', y: 84, emoji: '📷' },
  { name: 'Wi-Fi Access Point', y: 176, emoji: '📶' },
  { name: 'Door Access', y: 268, emoji: '🔑' },
  { name: 'Conference Display', y: 360, emoji: '🖥️' },
];
const PORT_YS = [84, 176, 268, 360];
const WIRE_COLORS = ['#f5a623', '#56b8ff', '#56e39f', '#ff7b9d'];

function WireLab() {
  const [activePort, setActivePort] = useState<number | null>(null);
  const [links, setLinks] = useState<Record<number, number>>({}); // port -> device
  const usedDevices = useMemo(() => new Set(Object.values(links)), [links]);
  const count = Object.keys(links).length;
  const allDone = count === 4;

  const clickPort = (i: number) => {
    if (links[i] !== undefined) return;
    setActivePort((p) => (p === i ? null : i));
  };
  const clickDevice = (d: number) => {
    if (activePort === null || usedDevices.has(d)) return;
    setLinks((l) => ({ ...l, [activePort]: d }));
    setActivePort(null);
  };
  const reset = () => {
    setLinks({});
    setActivePort(null);
  };

  return (
    <section className="bl-wirelab" id="wirelab">
      <div className="bl-wl-grid">
        <Reveal>
          <div className="bl-wl-copy">
            <span className="bl-kicker">Interactive · Wire Lab</span>
            <h2>Patch the building in yourself.</h2>
            <p>
              This is what we do all day — you get to try it for thirty
              seconds. Click a port on the patch panel, then click the device
              it should feed. Light up all four and the building comes online.
            </p>
            <div>
              <span className="bl-wl-score">
                <b>{count}</b>/4 circuits live
              </span>
              <button className="bl-wl-reset" onClick={reset}>
                Re-pull wires
              </button>
            </div>
            {allDone && (
              <div className="bl-wl-banner">⚡ Building online — every drop tested</div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="bl-wl-board">
            <svg viewBox="0 0 760 430">
              {/* patch panel */}
              <rect x="30" y="26" width="150" height="382" rx="14" fill="#111d3e" stroke="rgba(255,255,255,.14)" />
              <text x="105" y="52" textAnchor="middle" className="bl-devlabel" fill="#8fa0c9">
                PATCH PANEL
              </text>
              {PORT_YS.map((y, i) => {
                const done = links[i] !== undefined;
                return (
                  <g
                    key={i}
                    className={`bl-port ${activePort === i ? 'bl-port-active' : ''} ${done ? 'bl-port-done' : ''}`}
                    onClick={() => clickPort(i)}
                  >
                    <rect
                      className="bl-port-body"
                      x="55"
                      y={y - 22}
                      width="100"
                      height="52"
                      rx="9"
                      fill={done ? 'rgba(86,227,159,.16)' : 'rgba(255,255,255,.06)'}
                      stroke={done ? '#56e39f' : 'rgba(255,255,255,.28)'}
                      strokeWidth="2"
                    />
                    <rect x="88" y={y - 8} width="34" height="22" rx="3" fill="#0b1327" stroke="#5c6a90" />
                    <rect x="97" y={y - 14} width="16" height="7" fill="#5c6a90" />
                    <text x="105" y={y + 26 - 2} textAnchor="middle" className="bl-devlabel" fontSize="10" fill="#8fa0c9">
                      PORT {i + 1}
                    </text>
                  </g>
                );
              })}

              {/* devices */}
              {DEVICES.map((d, i) => {
                const used = usedDevices.has(i);
                const clickable = activePort !== null && !used;
                return (
                  <g
                    key={d.name}
                    className="bl-port"
                    style={{ cursor: clickable ? 'pointer' : used ? 'default' : 'not-allowed', opacity: activePort === null && !used ? 0.75 : 1 }}
                    onClick={() => clickDevice(i)}
                  >
                    <rect
                      className="bl-port-body"
                      x="560"
                      y={d.y - 26}
                      width="170"
                      height="58"
                      rx="12"
                      fill={used ? 'rgba(86,227,159,.14)' : clickable ? 'rgba(245,166,35,.12)' : 'rgba(255,255,255,.05)'}
                      stroke={used ? '#56e39f' : clickable ? '#f5a623' : 'rgba(255,255,255,.24)'}
                      strokeWidth="2"
                    />
                    <text x="586" y={d.y + 7} fontSize="20">
                      {d.emoji}
                    </text>
                    <text x="612" y={d.y + 5} className="bl-devlabel" fontSize="12.5">
                      {d.name}
                    </text>
                    {used && (
                      <circle cx="722" cy={d.y - 16} r="5" fill="#56e39f">
                        <animate attributeName="opacity" values="1;.3;1" dur="1.6s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* wires */}
              {Object.entries(links).map(([p, d]) => {
                const pi = Number(p);
                const y1 = PORT_YS[pi];
                const y2 = DEVICES[d].y + 3;
                const path = `M155 ${y1} C 300 ${y1}, 420 ${y2}, 560 ${y2}`;
                return (
                  <g key={p}>
                    <path className="bl-wire" d={path} stroke={WIRE_COLORS[pi]} />
                    <path
                      className="bl-wl-pulse"
                      d={path}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeDasharray="4 56"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                  </g>
                );
              })}

              {/* hint when a port is armed */}
              {activePort !== null && (
                <text x="380" y="418" textAnchor="middle" className="bl-devlabel" fill="#f5a623" fontSize="13">
                  Port {activePort + 1} armed — now pick a device →
                </text>
              )}
            </svg>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  ESTIMATOR — live ballpark with animated total                      */
/* ------------------------------------------------------------------ */
const CABLES = [
  { name: 'Cat5e', per: 85, note: 'Solid & affordable' },
  { name: 'Cat6', per: 110, note: 'Most popular' },
  { name: 'Fiber', per: 240, note: 'Max bandwidth' },
];

function Estimator() {
  const [drops, setDrops] = useState(24);
  const [cable, setCable] = useState(1);
  const [cams, setCams] = useState(4);
  const [floors, setFloors] = useState(1);

  const dropCost = drops * CABLES[cable].per;
  const camCost = cams * 375;
  const floorCost = (floors - 1) * 350;
  const total = dropCost + camCost + floorCost;
  const animated = useAnimatedNumber(total);

  const range = (v: number, min: number, max: number) =>
    `${((v - min) / (max - min)) * 100}%`;

  return (
    <section className="bl-estimator" id="estimate">
      <div className="bl-est-grid">
        <Reveal>
          <div>
            <span className="bl-kicker">Live ballpark</span>
            <h2>Price it before you even call.</h2>
            <p>
              Drag the sliders and watch the number move. No email gate, no
              &ldquo;request a quote&rdquo; black hole — just an honest
              starting point we&rsquo;ll sharpen on a free walkthrough.
            </p>

            <div className="bl-field">
              <label>
                Network drops <output>{drops}</output>
              </label>
              <input
                type="range"
                className="bl-range"
                min={1}
                max={120}
                value={drops}
                style={{ ['--fill' as never]: range(drops, 1, 120) }}
                onChange={(e) => setDrops(Number(e.target.value))}
              />
            </div>

            <div className="bl-field">
              <label>Cable type</label>
              <div className="bl-cabletype">
                {CABLES.map((c, i) => (
                  <button
                    key={c.name}
                    className={i === cable ? 'bl-ct-on' : ''}
                    onClick={() => setCable(i)}
                  >
                    {c.name}
                    <small>
                      ${c.per}/drop · {c.note}
                    </small>
                  </button>
                ))}
              </div>
            </div>

            <div className="bl-field">
              <label>
                Security cameras <output>{cams}</output>
              </label>
              <input
                type="range"
                className="bl-range"
                min={0}
                max={32}
                value={cams}
                style={{ ['--fill' as never]: range(cams, 0, 32) }}
                onChange={(e) => setCams(Number(e.target.value))}
              />
            </div>

            <div className="bl-field">
              <label>
                Floors <output>{floors}</output>
              </label>
              <input
                type="range"
                className="bl-range"
                min={1}
                max={6}
                value={floors}
                style={{ ['--fill' as never]: range(floors, 1, 6) }}
                onChange={(e) => setFloors(Number(e.target.value))}
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="bl-est-card">
            <div className="bl-est-label">Estimated project</div>
            <div className="bl-est-total">
              <i>$</i>
              {Math.round(animated).toLocaleString()}
            </div>
            <div className="bl-est-sub">
              ballpark · final quote after free site walkthrough
            </div>
            <div className="bl-meter">
              <i style={{ width: `${Math.min(100, (total / 20000) * 100)}%` }} />
            </div>
            <div className="bl-est-rows">
              <div>
                <span>
                  {drops} × {CABLES[cable].name} drops
                </span>
                <b>${dropCost.toLocaleString()}</b>
              </div>
              <div>
                <span>{cams} × IP cameras installed</span>
                <b>${camCost.toLocaleString()}</b>
              </div>
              <div>
                <span>Multi-floor routing</span>
                <b>${floorCost.toLocaleString()}</b>
              </div>
            </div>
            <a href="#contact" className="bl-btn bl-btn-primary">
              Lock in a real quote →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  BEFORE / AFTER — drag the light across the rack                    */
/* ------------------------------------------------------------------ */
function RackSVG({ tidy }: { tidy: boolean }) {
  const messy = [
    'M120 90 C 240 40, 200 250, 340 180 S 520 330, 620 240',
    'M120 130 C 300 260, 260 60, 430 210 S 560 120, 640 300',
    'M120 170 C 200 320, 380 80, 470 290 S 600 180, 660 120',
    'M120 210 C 320 120, 240 340, 450 140 S 580 320, 650 200',
    'M120 250 C 260 180, 340 330, 500 100 S 610 260, 640 160',
    'M120 290 C 350 380, 300 140, 520 260 S 590 90, 655 250',
  ];
  const colors = ['#ff7b9d', '#56b8ff', '#f5a623', '#56e39f', '#c58bff', '#ffd166'];
  return (
    <svg viewBox="0 0 760 400" style={{ background: tidy ? '#152246' : '#1a1f33' }}>
      {/* rack frame */}
      <rect x="60" y="30" width="110" height="340" rx="8" fill="#0d1730" stroke="#3a4770" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x="72" y={52 + i * 52} width="86" height="34" rx="4" fill="#232f55" stroke="#42507c" />
          <circle cx="84" cy={69 + i * 52} r="4" fill={tidy ? '#56e39f' : i % 2 ? '#ff5d5d' : '#f5a623'}>
            {tidy && <animate attributeName="opacity" values="1;.35;1" dur={`${1 + i * 0.3}s`} repeatCount="indefinite" />}
          </circle>
          <rect x="96" y={62 + i * 52} width="52" height="4" rx="2" fill="#42507c" />
          <rect x="96" y={70 + i * 52} width="38" height="4" rx="2" fill="#42507c" />
        </g>
      ))}
      {tidy ? (
        <g>
          {colors.map((c, i) => (
            <path
              key={i}
              d={`M170 ${69 + i * 52} H ${330 + i * 8} V 350 H 700`}
              fill="none"
              stroke={c}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
          ))}
          {/* velcro ties */}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={210 + i * 60} y="42" width="10" height={colors.length * 52 - 10} rx="5" fill="rgba(255,255,255,.18)" />
          ))}
          <text x="480" y="90" fill="#9fe8c4" fontSize="15" fontWeight="700" fontFamily="inherit">
            Labeled · Dressed · Certified
          </text>
        </g>
      ) : (
        <g>
          {messy.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={colors[i]} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
          ))}
          <text x="440" y="70" fill="#ff9d9d" fontSize="15" fontWeight="700" fontFamily="inherit">
            The &ldquo;previous guy&rdquo; special
          </text>
        </g>
      )}
    </svg>
  );
}

function BeforeAfter() {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setCut = useCallback((clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100));
    el.style.setProperty('--cut', `${pct}%`);
  }, []);

  return (
    <section className="bl-ba" id="workmanship">
      <Reveal>
        <span className="bl-kicker">Workmanship</span>
        <h2>Drag the line. See the difference.</h2>
        <p>
          Every rack we touch leaves labeled, velcro-dressed, and photographed
          for your records. Slide across the rack to compare a typical
          inherited closet with a Brody&rsquo;s handoff.
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <div
          className="bl-ba-frame"
          ref={frameRef}
          onPointerDown={(e) => {
            dragging.current = true;
            (e.target as HTMLElement).closest('.bl-ba-frame')?.setAttribute('data-drag', '1');
            setCut(e.clientX);
          }}
          onPointerMove={(e) => {
            if (dragging.current) setCut(e.clientX);
          }}
          onPointerUp={() => (dragging.current = false)}
          onPointerLeave={() => (dragging.current = false)}
        >
          <RackSVG tidy={false} />
          <div className="bl-ba-after">
            <RackSVG tidy />
          </div>
          <div className="bl-ba-handle" />
          <div className="bl-ba-tags">
            <span>Before</span>
            <span>After · Brody&rsquo;s</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PROCESS — glowing cable draws down the timeline as you scroll      */
/* ------------------------------------------------------------------ */
const STEPS = [
  {
    t: 'Free walkthrough',
    d: 'We walk the site with you, count the drops, and flag anything the blueprints missed.',
  },
  {
    t: 'Fixed quote in 48h',
    d: 'Line-itemed and honest. The number we quote is the number you pay.',
  },
  {
    t: 'Rough-in & pull',
    d: 'Clean pathways, proper bend radius, fire-stopped penetrations — pulled to spec.',
  },
  {
    t: 'Terminate & certify',
    d: 'Every jack punched, every run tested. You get the printed certification report.',
  },
  {
    t: 'Label & handoff',
    d: 'Ports labeled at both ends, rack dressed, as-built documentation in your inbox.',
  },
];

function Process() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const r = wrap.getBoundingClientRect();
        const focus = window.innerHeight * 0.62;
        const p = Math.min(1, Math.max(0, (focus - r.top) / r.height));
        railRef.current?.style.setProperty('--h', `${p * 100}%`);
        const fillY = r.top + r.height * p;
        stepRefs.current.forEach((s) => {
          if (!s) return;
          const sr = s.getBoundingClientRect();
          s.classList.toggle('bl-step-on', sr.top + 28 <= fillY);
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="bl-process" id="process">
      <div className="bl-proc-head">
        <span className="bl-kicker">How a job runs</span>
        <h2>Watch the wire pull itself.</h2>
      </div>
      <div className="bl-proc-wrap" ref={wrapRef}>
        <div className="bl-proc-rail">
          <i ref={railRef as never} />
        </div>
        {STEPS.map((s, i) => (
          <div
            key={s.t}
            className="bl-step"
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
          >
            <div className="bl-step-num">{i + 1}</div>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  STATS                                                              */
/* ------------------------------------------------------------------ */
function Stats() {
  return (
    <section className="bl-stats">
      <div className="bl-stats-row">
        <div className="bl-stat">
          <CountUp to={1200} suffix="+" />
          <span>Drops certified</span>
        </div>
        <div className="bl-stat">
          <CountUp to={340} suffix="+" />
          <span>Cameras online</span>
        </div>
        <div className="bl-stat">
          <CountUp to={98} suffix="%" />
          <span>Jobs on schedule</span>
        </div>
        <div className="bl-stat">
          <CountUp to={24} suffix="h" />
          <span>Emergency response</span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CONTACT                                                            */
/* ------------------------------------------------------------------ */
function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section className="bl-contact" id="contact">
      <div className="bl-contact-card">
        <Reveal>
          <div>
            <span className="bl-kicker">Get wired up</span>
            <h2>Tell us about the job.</h2>
            <p>
              Same-day callback, walkthroughs within the week. Or just send a
              photo of the mess you inherited — we love those.
            </p>
            <ul className="bl-contact-list">
              <li>
                <i>☎</i> (555) 012-VOLT
              </li>
              <li>
                <i>✉</i> hello@brodyslowvoltage.com
              </li>
              <li>
                <i>⚡</i> 24/7 emergency service line
              </li>
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          {sent ? (
            <div className="bl-form-done">
              ⚡ Got it! Brody will call you back within one business day.
            </div>
          ) : (
            <form
              className="bl-form"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <input required placeholder="Your name" name="name" />
              <input required placeholder="Phone or email" name="reach" />
              <input placeholder="Job site address (optional)" name="site" />
              <textarea
                placeholder="What needs wiring? Drops, cameras, A/V…"
                name="details"
              />
              <button type="submit" className="bl-btn bl-btn-primary">
                Send it ⚡
              </button>
            </form>
          )}
        </Reveal>
      </div>
      {/* silhouette ridge at the base of the contact sunset */}
      <svg className="bl-contact-mtn" viewBox="0 0 1440 160" preserveAspectRatio="none" style={{ height: 120 }}>
        <path
          d="M0 160 L0 110 L220 40 L420 120 L640 30 L860 130 L1080 50 L1280 120 L1440 70 L1440 160 Z"
          fill="#0d1730"
        />
      </svg>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  NAV + PAGE                                                         */
/* ------------------------------------------------------------------ */
export default function BrodysPage() {
  const [solid, setSolid] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 40);
      setShowTop(window.scrollY > window.innerHeight);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bl-root">
      <nav className={`bl-nav ${solid ? 'bl-nav-solid' : ''}`}>
        <a href="#top" className="bl-nav-brand" style={{ textDecoration: 'none' }}>
          <BrandMark className="bl-navmark" />
          <span>
            Brody&rsquo;s
            <small>Low-Voltage &amp; Cabling</small>
          </span>
        </a>
        <div className="bl-nav-links">
          <a href="#services">Services</a>
          <a href="#wirelab">Wire Lab</a>
          <a href="#workmanship">Workmanship</a>
          <a href="#process">Process</a>
          <a href="#estimate" className="bl-nav-cta">
            Instant Estimate
          </a>
        </div>
      </nav>

      <Hero />

      <div className="bl-ticker" aria-hidden="true">
        <div className="bl-ticker-track">
          {[0, 1].map((k) => (
            <span key={k}>
              Structured Cabling <i>◆</i> Fiber Optics <i>◆</i> Security
              Cameras <i>◆</i> Access Control <i>◆</i> Audio / Video <i>◆</i>{' '}
              Wi-Fi Networks <i>◆</i> 24/7 Emergency Service <i>◆</i>
            </span>
          ))}
        </div>
      </div>

      <ServicesFan />
      <WireLab />
      <Estimator />
      <BeforeAfter />
      <Process />
      <Stats />
      <Contact />

      <footer className="bl-footer">
        <span>
          © {new Date().getFullYear()} <b>Brody&rsquo;s Low-Voltage &amp; Cabling Services</b> — licensed &amp; insured.
        </span>
        <span>
          Built clean, like our racks. <a href="#estimate">Get your number →</a>
        </span>
      </footer>

      <button
        className={`bl-top ${showTop ? 'bl-top-show' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}
