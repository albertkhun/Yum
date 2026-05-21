import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import yumvrLogo from '../../assets/yumvr-logo.jpeg';

// ─── Ambient orb config ──────────────────────────────
const ORBS = [
  { cx: '15%',  cy: '20%', size: 380, delay: 0,   dur: 8  },
  { cx: '85%',  cy: '70%', size: 320, delay: 1.5, dur: 11 },
  { cx: '60%',  cy: '10%', size: 260, delay: 0.8, dur: 9  },
  { cx: '5%',   cy: '80%', size: 200, delay: 2,   dur: 13 },
];

// ─── Loading messages that cycle ─────────────────────
const MESSAGES = [
  'Finding your perfect space…',
  'Preparing your virtual home tour…',
  'Welcome to immersive living…',
];

export default function AppLoader({ visible = true }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="app-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#080a0c' }}
          aria-label="Loading YumVR"
          role="status"
        >

          {/* ── Ambient gradient orbs ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {ORBS.map((orb, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: orb.cx,
                  top: orb.cy,
                  width: orb.size,
                  height: orb.size,
                  transform: 'translate(-50%, -50%)',
                  background: i % 2 === 0
                    ? 'radial-gradient(circle, rgba(232,93,4,0.13) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)',
                  filter: 'blur(2px)',
                }}
                animate={{
                  x: [0, 18, -12, 6, 0],
                  y: [0, -14, 8, -6, 0],
                  scale: [1, 1.06, 0.97, 1.03, 1],
                  opacity: [0.7, 1, 0.8, 0.95, 0.7],
                }}
                transition={{
                  duration: orb.dur,
                  delay: orb.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* ── Subtle grid overlay ── */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />

          {/* ── Vignette ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
            }}
          />

          {/* ── Content container ── */}
          <div className="relative z-10 flex flex-col items-center gap-0">

            {/* Outer glow ring */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 160,
                height: 160,
                background: 'radial-gradient(circle, rgba(232,93,4,0.20) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
              animate={{
                scale: [1, 1.35, 1],
                opacity: [0.5, 0.9, 0.5],
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Logo wrapper — float + glow */}
            <motion.div
              className="relative"
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Ring pulse 1 */}
              <motion.div
                className="absolute inset-0 rounded-[22px]"
                style={{
                  boxShadow: '0 0 0 0 rgba(232,93,4,0.6)',
                }}
                animate={{
                  boxShadow: [
                    '0 0 0 0px rgba(232,93,4,0.55)',
                    '0 0 0 18px rgba(232,93,4,0)',
                  ],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Ring pulse 2 — offset */}
              <motion.div
                className="absolute inset-0 rounded-[22px]"
                animate={{
                  boxShadow: [
                    '0 0 0 0px rgba(251,146,60,0.35)',
                    '0 0 0 28px rgba(251,146,60,0)',
                  ],
                }}
                transition={{ duration: 2.2, delay: 0.7, repeat: Infinity, ease: 'easeOut' }}
              />

              {/* Logo image */}
              <motion.div
                className="relative"
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 22,
                  overflow: 'hidden',
                  border: '1.5px solid rgba(232,93,4,0.35)',
                  boxShadow: `
                    0 0 0 1px rgba(232,93,4,0.12),
                    0 8px 32px rgba(232,93,4,0.30),
                    0 2px 8px rgba(0,0,0,0.6),
                    inset 0 1px 0 rgba(255,255,255,0.08)
                  `,
                }}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <img
                  src={yumvrLogo}
                  alt="YumVR"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {/* Logo glass sheen */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 60%)',
                    borderRadius: 22,
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Brand name */}
            <motion.div
              className="mt-7 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              <p
                className="font-brand font-black tracking-tight text-white"
                style={{ fontSize: 28, letterSpacing: '-0.03em' }}
              >
                Yum<span style={{ color: '#e85d04' }}>VR</span>
              </p>
            </motion.div>

            {/* Animated loading text */}
            <motion.div
              className="mt-3 h-5 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="text-xs font-medium text-center"
                  style={{ color: 'rgba(255,255,255,0.40)', letterSpacing: '0.01em' }}
                >
                  {MESSAGES[msgIdx]}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="mt-7 overflow-hidden rounded-full"
              style={{
                width: 140,
                height: 2,
                background: 'rgba(255,255,255,0.07)',
              }}
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #e85d04, #fb923c, #e85d04)',
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
                  scaleX: [0, 1],
                  originX: 0,
                }}
                transition={{
                  backgroundPosition: { duration: 1.8, repeat: Infinity, ease: 'linear' },
                  scaleX: { duration: 2.5, ease: [0.22, 1, 0.36, 1] },
                }}
              />
            </motion.div>

            {/* Three dots — subtle secondary indicator */}
            <motion.div
              className="mt-5 flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  style={{ width: 4, height: 4, background: 'rgba(232,93,4,0.5)' }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.22,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>

          </div>

          {/* ── Bottom credits ── */}
          <motion.p
            className="absolute bottom-8 text-center text-[11px] font-medium"
            style={{ color: 'rgba(255,255,255,0.15)', letterSpacing: '0.08em' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            YumVR - VR RENTAL & STAY PLATFORM
          </motion.p>

        </motion.div>
      )}
    </AnimatePresence>
  );
}


