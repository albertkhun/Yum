import { motion } from 'framer-motion';

// ─── Shimmer base ─────────────────────────────────────
const shimmer = {
  animate: { backgroundPosition: ['200% 0', '-200% 0'] },
  transition: { duration: 2.2, repeat: Infinity, ease: 'linear' },
};

const SHIMMER_BG = `
  linear-gradient(
    90deg,
    rgba(255,255,255,0.03) 0%,
    rgba(232,93,4,0.07)   40%,
    rgba(255,255,255,0.03) 80%
  )
`;

/** Reusable shimmer block */
function Bone({ className = '', style = {}, rounded = 'rounded-xl', delay = 0 }) {
  return (
    <motion.div
      className={`${rounded} overflow-hidden ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backgroundImage: SHIMMER_BG,
        backgroundSize: '400% 100%',
        border: '1px solid rgba(255,255,255,0.05)',
        ...style,
      }}
      animate={shimmer.animate}
      transition={{ ...shimmer.transition, delay }}
    />
  );
}

/** Text lines skeleton */
function TextLines({ lines = 3, widths, gap = 'gap-2.5', delay = 0 }) {
  const defaults = ['100%', '88%', '72%', '90%', '60%'];
  const ws = widths || defaults.slice(0, lines);
  return (
    <div className={`flex flex-col ${gap}`}>
      {ws.map((w, i) => (
        <Bone
          key={i}
          rounded="rounded-full"
          className="h-3.5"
          style={{ width: w }}
          delay={delay + i * 0.06}
        />
      ))}
    </div>
  );
}

/** Badge pill skeleton */
function BadgeBone({ width = 72, delay = 0 }) {
  return (
    <Bone
      rounded="rounded-full"
      className="h-5 inline-block shrink-0"
      style={{ width }}
      delay={delay}
    />
  );
}

/** Section card wrapper */
function SkeletonCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 ${className}`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {children}
    </div>
  );
}

// ─── Stagger container ────────────────────────────────
const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function FadeItem({ children, className = '' }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Main skeleton ────────────────────────────────────
export default function ListingDetailSkeleton() {
  return (
    <div
      className="min-h-screen"
      style={{ background: '#080a0c' }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Ambient glow — matches the app's dark aesthetic */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(232,93,4,0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(251,146,60,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div className="relative z-10 page-wrapper max-w-6xl mx-auto">

        {/* Back button skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Bone rounded="rounded-lg" className="h-8 w-32" />
        </motion.div>

        {/* Grid — matches lg:grid-cols-3 */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >

          {/* ═══════════════════════════════════════
              LEFT COLUMN — lg:col-span-2
          ═══════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* Image carousel */}
            <FadeItem>
              <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <Bone rounded="rounded-none" className="absolute inset-0 w-full h-full" />
                {/* Thumbnail strip */}
                <div
                  className="absolute bottom-3 left-1/2 flex gap-1.5"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  {[1, 0.4, 0.4, 0.4, 0.4].map((op, i) => (
                    <div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: i === 0 ? 20 : 6,
                        height: 6,
                        background: `rgba(232,93,4,${op})`,
                        transition: 'all 0.3s',
                      }}
                    />
                  ))}
                </div>
                {/* Nav arrows */}
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
                  style={{ width: 36, height: 36, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
                  style={{ width: 36, height: 36, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </FadeItem>

            {/* Title + badges + price card */}
            <FadeItem>
              <SkeletonCard>
                {/* Badges row */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <BadgeBone width={64}  delay={0.1} />
                  <BadgeBone width={80}  delay={0.15} />
                  <BadgeBone width={72}  delay={0.2} />
                  <BadgeBone width={88}  delay={0.25} />
                </div>

                {/* Title */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 space-y-2.5">
                    <Bone rounded="rounded-lg" className="h-7 w-3/4" delay={0.1} />
                    <Bone rounded="rounded-lg" className="h-5 w-1/2" delay={0.15} />
                  </div>
                  {/* Share button */}
                  <Bone rounded="rounded-xl" className="h-10 w-10 shrink-0" delay={0.1} />
                </div>

                {/* Location row */}
                <div className="flex items-center gap-2 mb-4">
                  <Bone rounded="rounded-full" className="h-4 w-4 shrink-0" />
                  <Bone rounded="rounded-full" className="h-4" style={{ width: '55%' }} delay={0.1} />
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 pb-4 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Bone rounded="rounded-lg" className="h-9 w-10" delay={0.1} />
                  <Bone rounded="rounded-lg" className="h-8 w-28" delay={0.12} />
                  <Bone rounded="rounded-full" className="h-4 w-14 ml-1" delay={0.15} />
                </div>

                {/* About section */}
                <div>
                  <Bone rounded="rounded-lg" className="h-5 w-40 mb-3" delay={0.15} />
                  <TextLines lines={4} delay={0.2} />
                </div>
              </SkeletonCard>
            </FadeItem>

            {/* Facilities card */}
            <FadeItem>
              <SkeletonCard>
                <Bone rounded="rounded-lg" className="h-5 w-28 mb-4" delay={0.1} />
                <div className="flex flex-wrap gap-2">
                  {[88, 96, 72, 112, 80, 100, 76, 92].map((w, i) => (
                    <Bone
                      key={i}
                      rounded="rounded-full"
                      className="h-9"
                      style={{ width: w }}
                      delay={0.1 + i * 0.04}
                    />
                  ))}
                </div>
              </SkeletonCard>
            </FadeItem>

            {/* Location details card */}
            <FadeItem>
              <SkeletonCard>
                <Bone rounded="rounded-lg" className="h-5 w-40 mb-4" delay={0.1} />
                <div className="space-y-0">
                  {['District', 'Locality', 'Landmark'].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3"
                      style={{
                        borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <Bone rounded="rounded-full" className="h-3.5 w-16" delay={0.1 + i * 0.06} />
                      <Bone rounded="rounded-full" className="h-3.5 w-24" delay={0.15 + i * 0.06} />
                    </div>
                  ))}
                </div>
              </SkeletonCard>
            </FadeItem>

            {/* Review section placeholder */}
            <FadeItem>
              <SkeletonCard>
                <div className="flex items-center justify-between mb-5">
                  <Bone rounded="rounded-lg" className="h-5 w-24" delay={0.1} />
                  <Bone rounded="rounded-lg" className="h-8 w-28" delay={0.12} />
                </div>
                {/* Rating summary */}
                <div className="flex items-center gap-3 mb-5">
                  <Bone rounded="rounded-xl" className="h-14 w-16" delay={0.1} />
                  <div className="flex-1 space-y-2">
                    {[1, 0.8, 0.6, 0.4, 0.3].map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Bone rounded="rounded-full" className="h-2.5 shrink-0" style={{ width: '100%', maxWidth: `${w * 100}%` }} delay={0.15 + i * 0.04} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Two review cards */}
                {[0, 1].map(i => (
                  <div key={i} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Bone rounded="rounded-full" className="h-9 w-9 shrink-0" delay={0.2 + i * 0.08} />
                      <div className="flex-1 space-y-1.5">
                        <Bone rounded="rounded-full" className="h-3.5 w-28" delay={0.22 + i * 0.08} />
                        <Bone rounded="rounded-full" className="h-3 w-20" delay={0.25 + i * 0.08} />
                      </div>
                    </div>
                    <TextLines lines={2} widths={['92%', '70%']} delay={0.28 + i * 0.08} />
                  </div>
                ))}
              </SkeletonCard>
            </FadeItem>
          </div>

        
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Contact card */}
              <FadeItem>
                <SkeletonCard>
                  {/* "Contact Owner" heading */}
                  <Bone rounded="rounded-lg" className="h-5 w-36 mb-4" delay={0.1} />

                  {/* Owner avatar row */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl mb-4"
                    style={{ background: 'rgba(232,93,4,0.07)', border: '1px solid rgba(232,93,4,0.12)' }}
                  >
                    <Bone rounded="rounded-full" className="h-10 w-10 shrink-0" delay={0.12} />
                    <div className="flex-1 space-y-1.5">
                      <Bone rounded="rounded-full" className="h-3.5 w-28" delay={0.14} />
                      <Bone rounded="rounded-full" className="h-3 w-14" delay={0.16} />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-3">
                    {/* Call button */}
                    <Bone rounded="rounded-xl" className="h-12 w-full" style={{ background: 'rgba(232,93,4,0.15)' }} delay={0.18} />
                    {/* WhatsApp button */}
                    <Bone rounded="rounded-xl" className="h-12 w-full" style={{ background: 'rgba(37,211,102,0.10)' }} delay={0.22} />
                    {/* VR Tour button — gradient tint */}
                    <Bone
                      rounded="rounded-xl"
                      className="h-12 w-full"
                      style={{ background: 'linear-gradient(135deg, rgba(232,93,4,0.15), rgba(251,191,36,0.10))' }}
                      delay={0.26}
                    />
                    {/* Directions button */}
                    <Bone rounded="rounded-xl" className="h-12 w-full" style={{ background: 'rgba(26,115,232,0.12)' }} delay={0.30} />
                  </div>

                  {/* Login note */}
                  <div className="flex items-center justify-center gap-1.5 mt-4">
                    <Bone rounded="rounded-full" className="h-3 w-10" delay={0.32} />
                    <Bone rounded="rounded-full" className="h-3 w-4" delay={0.34} />
                    <Bone rounded="rounded-full" className="h-3 w-16" delay={0.36} />
                    <Bone rounded="rounded-full" className="h-3 w-4" delay={0.38} />
                    <Bone rounded="rounded-full" className="h-3 w-14" delay={0.40} />
                  </div>
                </SkeletonCard>
              </FadeItem>

              {/* Posted time / meta */}
              <FadeItem>
                <SkeletonCard className="py-4">
                  <div className="flex items-center justify-between">
                    <Bone rounded="rounded-full" className="h-3.5 w-20" delay={0.1} />
                    <Bone rounded="rounded-full" className="h-3.5 w-28" delay={0.14} />
                  </div>
                </SkeletonCard>
              </FadeItem>

            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}


