'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Pre-baked confetti — 8 particles at even angles; distances varied so they
// don't land in a perfect ring. Uses volt/flare/bone from the site palette.
const CONFETTI: { angle: number; dist: number; color: string }[] = [
  { angle: 0,                 dist: 22, color: '#F4C430' }, // right — volt
  { angle: Math.PI * 0.25,   dist: 17, color: '#FF4326' }, // down-right — flare
  { angle: Math.PI * 0.5,    dist: 24, color: '#F4F1E9' }, // down — bone
  { angle: Math.PI * 0.75,   dist: 18, color: '#F4C430' }, // down-left — volt
  { angle: Math.PI,           dist: 21, color: '#FF4326' }, // left — flare
  { angle: Math.PI * 1.25,   dist: 16, color: '#F4F1E9' }, // up-left — bone
  { angle: Math.PI * 1.5,    dist: 23, color: '#F4C430' }, // up — volt
  { angle: Math.PI * 1.75,   dist: 19, color: '#FF4326' }, // up-right — flare
];

interface Props {
  score: number;
  /** Applied to the rendered number span — pass font/color/size classes here. */
  className?: string;
}

/**
 * Animated score display for live match scorebugs.
 * – When the score goes up: old number slides out upward, new number slides in
 *   from below (slot-machine feel), plus a brief confetti burst.
 * – When the score goes down (undo): reverse direction, no confetti.
 */
export function AnimatedScore({ score, className }: Props) {
  const prevScore = useRef(score);
  // Incrementing key re-mounts confetti particles each time score increases.
  const [burstId, setBurstId] = useState(0);
  const [bursting, setBursting] = useState(false);
  // 1 = number went up (enter from below), -1 = number went down (enter from above)
  const direction = useRef<1 | -1>(1);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (score === prevScore.current) return;

    direction.current = score > prevScore.current ? 1 : -1;

    if (score > prevScore.current) {
      setBurstId((n) => n + 1);
      setBursting(true);
      if (clearRef.current) clearTimeout(clearRef.current);
      clearRef.current = setTimeout(() => setBursting(false), 650);
    }

    prevScore.current = score;
  }, [score]);

  // Cleanup timer on unmount.
  useEffect(() => () => { if (clearRef.current) clearTimeout(clearRef.current); }, []);

  const enterY = direction.current === 1 ? '110%' : '-110%';
  const exitY  = direction.current === 1 ? '-110%' : '110%';

  return (
    // Outer wrapper: relative so confetti particles are positioned against it.
    // inline-block so text-center in the parent card still centres this.
    <div className="relative inline-block">

      {/* Confetti burst — absolutely positioned, spills outside the score box */}
      <AnimatePresence>
        {bursting &&
          CONFETTI.map((p, i) => (
            <motion.span
              key={`${burstId}-${i}`}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: p.color }}
              initial={{ x: '-50%', y: '-50%', opacity: 1, scale: 1 }}
              animate={{
                x: `calc(-50% + ${Math.cos(p.angle) * p.dist}px)`,
                y: `calc(-50% + ${Math.sin(p.angle) * p.dist}px)`,
                opacity: 0,
                scale: 0.3,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          ))}
      </AnimatePresence>

      {/* Score number — clips the vertical slide so only one digit shows at a time.
          position:relative lets mode="popLayout" anchor the exiting span here. */}
      <div className="relative overflow-hidden" style={{ lineHeight: 1 }}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score}
            className={`block ${className ?? ''}`}
            initial={{ y: enterY, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: exitY, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {score}
          </motion.span>
        </AnimatePresence>
      </div>

    </div>
  );
}
