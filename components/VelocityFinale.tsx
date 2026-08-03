import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { V_PATH, V_VERTICES } from './ChipScroll';

const WORDMARK = 'VELOCITY';
const CADENCE = ['Build', 'Test', 'Iterate'];
const SIGN_OFF = 'See you in the room.';

/* Scroll phases across the pinned stage. */
const DRAW = [0, 0.55] as const;
const IGNITE_START = 0.25;
const IGNITE_STEP = 0.055;
const WORD_START = 0.6;
const WORD_STEP = 0.028;
const SETTLE = [0.85, 0.96] as const;

const GLOW =
  'bg-[radial-gradient(circle_at_50%_54%,rgba(255,31,31,0.16),rgba(255,31,31,0.04)_38%,transparent_66%)]';

export const VelocityFinale: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? <FinaleStill /> : <FinaleStage />;
};

/* --------------------------------- Scrolled -------------------------------- */

const FinaleStage: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  // 190svh outer / 100svh stage leaves ~90svh of pinned travel, enough for the
  // four phases to land without feeling rushed. The sticky child stays inside
  // its parent, so it can never ride over the footer.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const pathLength = useTransform(scrollYProgress, [DRAW[0], DRAW[1]], [0, 1]);
  const strokeOpacity = useTransform(scrollYProgress, [0, 0.06], [0, 1]);
  const settleOpacity = useTransform(scrollYProgress, [SETTLE[0], SETTLE[1]], [0, 1]);
  const settleY = useTransform(scrollYProgress, [SETTLE[0], SETTLE[1]], [16, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-[190svh] bg-velocity-black">
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden px-6">
        <div aria-hidden className={`pointer-events-none absolute inset-0 ${GLOW}`} />

        <div className="relative flex w-full max-w-3xl flex-col items-center">
          <svg
            aria-hidden
            viewBox="14 26 172 152"
            className="h-auto w-[clamp(80px,13vmin,132px)]"
            fill="none"
          >
            <path d={V_PATH} stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} />
            <motion.path
              d={V_PATH}
              stroke="rgba(255,255,255,0.92)"
              strokeWidth={2}
              style={{ pathLength, opacity: strokeOpacity }}
            />
            {V_VERTICES.map(([x, y], index) => (
              <Vertex
                key={`${x}-${y}`}
                x={x}
                y={y}
                index={index}
                progress={scrollYProgress}
              />
            ))}
          </svg>

          <h2 className="mt-8 font-sans text-[clamp(2.5rem,12vw,7rem)] font-black leading-none tracking-tighter text-white md:mt-10">
            <span className="sr-only">Velocity</span>
            <span aria-hidden className="flex items-end justify-center">
              {WORDMARK.split('').map((letter, index) => (
                <RisingLetter
                  key={`${letter}-${index}`}
                  letter={letter}
                  index={index}
                  progress={scrollYProgress}
                />
              ))}
            </span>
          </h2>

          <motion.div
            className="mt-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-400 sm:gap-4 sm:text-[11px]"
            style={{ opacity: settleOpacity, y: settleY }}
          >
            {CADENCE.map((word, index) => (
              <React.Fragment key={word}>
                {index > 0 && <span aria-hidden className="h-1 w-1 flex-shrink-0 bg-velocity-red" />}
                <span>{word}</span>
              </React.Fragment>
            ))}
          </motion.div>

          <motion.p
            className="mt-6 font-sans text-sm text-zinc-400"
            style={{ opacity: settleOpacity, y: settleY }}
          >
            {SIGN_OFF}
          </motion.p>
        </div>
      </div>
    </section>
  );
};

interface VertexProps {
  x: number;
  y: number;
  index: number;
  progress: MotionValue<number>;
}

const Vertex: React.FC<VertexProps> = ({ x, y, index, progress }) => {
  const start = IGNITE_START + index * IGNITE_STEP;
  const opacity = useTransform(progress, [start, start + 0.045], [0, 1]);

  return (
    <motion.g style={{ opacity }}>
      <circle cx={x} cy={y} r={6} fill="rgba(255,31,31,0.22)" />
      <circle cx={x} cy={y} r={1.9} fill="#FF4545" />
    </motion.g>
  );
};

interface RisingLetterProps {
  letter: string;
  index: number;
  progress: MotionValue<number>;
}

const RisingLetter: React.FC<RisingLetterProps> = ({ letter, index, progress }) => {
  const start = WORD_START + index * WORD_STEP;
  const y = useTransform(progress, [start, start + 0.06], ['100%', '0%']);
  const opacity = useTransform(progress, [start, start + 0.03], [0, 1]);

  return (
    <span className="block overflow-hidden">
      <motion.span className="block leading-[1.05]" style={{ y, opacity }}>
        {letter}
      </motion.span>
    </span>
  );
};

/* ---------------------------------- Still ---------------------------------- */

const FinaleStill: React.FC = () => (
  <section className="relative flex min-h-[70svh] items-center justify-center overflow-hidden bg-velocity-black px-6 py-24">
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${GLOW}`} />

    <div className="relative flex w-full max-w-3xl flex-col items-center">
      <svg
        aria-hidden
        viewBox="14 26 172 152"
        className="h-auto w-[clamp(80px,13vmin,132px)]"
        fill="none"
      >
        <path d={V_PATH} stroke="rgba(255,255,255,0.92)" strokeWidth={2} />
        {V_VERTICES.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={6} fill="rgba(255,31,31,0.22)" />
            <circle cx={x} cy={y} r={1.9} fill="#FF4545" />
          </g>
        ))}
      </svg>

      <h2 className="mt-8 font-sans text-[clamp(2.5rem,12vw,7rem)] font-black leading-none tracking-tighter text-white md:mt-10">
        <span className="sr-only">Velocity</span>
        <span aria-hidden>{WORDMARK}</span>
      </h2>

      <div className="mt-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-400 sm:gap-4 sm:text-[11px]">
        {CADENCE.map((word, index) => (
          <React.Fragment key={word}>
            {index > 0 && <span aria-hidden className="h-1 w-1 flex-shrink-0 bg-velocity-red" />}
            <span>{word}</span>
          </React.Fragment>
        ))}
      </div>

      <p className="mt-6 font-sans text-sm text-zinc-400">{SIGN_OFF}</p>
    </div>
  </section>
);
