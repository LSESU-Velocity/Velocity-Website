import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';

interface OperatingFormat {
  no: string;
  title: string;
  copy: string;
}

const FORMATS: OperatingFormat[] = [
  {
    no: '01',
    title: 'Open coworking',
    copy: 'A room at LSE, every week of term. Drop in, build, no sign-up.',
  },
  {
    no: '02',
    title: 'Workshops',
    copy: 'Live demos of the newest AI tools, then you build with them in the room.',
  },
  {
    no: '03',
    title: 'Buildathons',
    copy: 'Multi-day sprints from idea to shipped product.',
  },
  {
    no: '04',
    title: 'Competitions',
    copy: 'Pitch, demo, and win against other builders.',
  },
];

/* Desktop rail nodes sit at 12.5/37.5/62.5/87.5% of the rail, so they ignite
   exactly when the scaleX trace reaches those fractions. The mobile rail runs
   down the cell column where nodes sit near the top of each quarter, so the
   cells (and their nodes) fire on earlier thresholds. */
const RAIL_IGNITION = [0.125, 0.375, 0.625, 0.875];
const FLOW_IGNITION = [0.05, 0.29, 0.53, 0.77];
const RAMP = 0.08;

export const VelocityExplainer: React.FC = () => {
  const graphicRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const still = Boolean(prefersReducedMotion);

  // Rail is traced by the reader's own scroll through the graphic block.
  const { scrollYProgress } = useScroll({
    target: graphicRef,
    offset: ['start 85%', 'end 55%'],
  });
  // Let the sequence play across the section's approach, but finish before the
  // centered composition begins to leave the viewport.
  const railProgress = useTransform(scrollYProgress, [0.05, 0.68], [0, 1]);
  const cardProgress = useTransform(scrollYProgress, [0.05, 0.75], [0, 1]);

  return (
    <section
      id="about"
      className="relative flex min-h-[100svh] items-center px-6 py-32 md:py-44 lg:py-48"
    >
      {/* Dissolves the hard seam where ChipScroll's opaque black ends and the
         ambient BackgroundGrid shows through. The wrapper below needs
         `relative` so content keeps painting above this overlay. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-black via-black/60 to-transparent md:h-72"
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <motion.header
          initial={still ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center"
        >
          <h2 className="mx-auto max-w-3xl font-sans text-[2.15rem] font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            LSE&rsquo;s AI builders&rsquo; society<span className="text-velocity-red">.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-sans text-sm leading-relaxed text-zinc-400 md:text-base">
            We exist so students ship real products.
          </p>
        </motion.header>

        <div ref={graphicRef} className="mt-16 md:mt-20">
          {/* Desktop rail: traced left to right above the cells */}
          <div aria-hidden className="relative mb-10 hidden h-px md:block">
            <div className="absolute inset-0 bg-white/10" />
            <motion.div
              className="absolute inset-0 origin-left bg-velocity-red"
              style={{ scaleX: still ? 1 : railProgress }}
            />
            {FORMATS.map((format, index) => (
              <IgnitionNode
                key={format.no}
                onRail
                index={index}
                progress={railProgress}
                still={still}
              />
            ))}
          </div>

          <div className="relative pl-9 md:pl-0">
            {/* Mobile rail: same trace, rotated onto the left edge */}
            <div
              aria-hidden
              className="absolute bottom-0 left-[3px] top-0 w-px bg-white/10 md:hidden"
            >
              <motion.div
                className="h-full w-full origin-top bg-velocity-red"
                style={{ scaleY: still ? 1 : railProgress }}
              />
            </div>

            <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 md:grid-cols-4">
              {FORMATS.map((format, index) => (
                <FormatCell
                  key={format.no}
                  format={format}
                  index={index}
                  progress={cardProgress}
                  still={still}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface NodeProps {
  index: number;
  progress: MotionValue<number>;
  still: boolean;
  onRail?: boolean;
}

const IgnitionNode: React.FC<NodeProps> = ({ index, progress, still, onRail }) => {
  const start = (onRail ? RAIL_IGNITION : FLOW_IGNITION)[index];
  const opacity = useTransform(progress, [start, start + RAMP], [0.12, 1]);
  const scale = useTransform(progress, [start, start + RAMP], [0.45, 1]);

  // Rotation lives in the motion style, not a class: framer owns `transform`.
  const lit = still ? { rotate: 45 } : { rotate: 45, opacity, scale };

  return (
    <motion.span
      aria-hidden
      className={
        onRail
          ? 'absolute hidden h-2 w-2 bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.55)] md:block'
          : 'absolute left-[-37.5px] top-[27px] h-2 w-2 bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.55)] md:hidden'
      }
      style={
        onRail
          ? { ...lit, left: `${12.5 + index * 25}%`, top: '50%', x: '-50%', y: '-50%' }
          : lit
      }
    />
  );
};

interface FormatCellProps {
  format: OperatingFormat;
  index: number;
  progress: MotionValue<number>;
  still: boolean;
}

const FormatCell: React.FC<FormatCellProps> = ({ format, index, progress, still }) => {
  const start = FLOW_IGNITION[index];
  const opacity = useTransform(progress, [start, start + 0.1], [0, 1]);
  const y = useTransform(progress, [start, start + 0.1], [18, 0]);

  return (
    <motion.div
      className="relative bg-velocity-black p-6 text-center"
      style={still ? undefined : { opacity, y }}
    >
      <IgnitionNode index={index} progress={progress} still={still} />
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
        {format.no}
      </p>
      <h3 className="mt-3 font-sans text-base font-bold tracking-tight text-white">
        {format.title}
      </h3>
      <p className="mt-2.5 font-sans text-[13px] leading-relaxed text-zinc-400">
        {format.copy}
      </p>
    </motion.div>
  );
};
