import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { liveResourceCatalog } from '../lib/resourceCatalog';

interface Stage {
  no: string;
  label: string;
}

const STAGES: Stage[] = [
  { no: '01', label: 'Bull vs Bear council' },
  { no: '02', label: 'Market sizing' },
  { no: '03', label: 'Competitor map' },
  { no: '04', label: 'MVP prompt chain' },
];

/* Rail node / drop-stub positions: the centre of each of the four stage
   cells. The plate columns are a fixed width on every row so the chip grid,
   the stubs and the rail all share one coordinate space. */
const RAIL_STOPS = [12.5, 37.5, 62.5, 87.5];
const PLATE_COL = 'w-36 flex-shrink-0';

const PULSE_TRANSITION = {
  duration: 3.6,
  repeat: Infinity,
  ease: 'linear' as const,
};

const CTA_CLASS =
  'group inline-flex items-center justify-center gap-3 border-2 border-velocity-red/50 bg-velocity-darkRed/20 px-7 py-3.5 font-sans text-xs font-medium uppercase tracking-widest text-white shadow-[0_0_20px_rgba(255,31,31,0.15)] transition-all duration-300 hover:border-velocity-red hover:bg-velocity-red hover:shadow-[0_0_40px_rgba(255,31,31,0.45)]';

export const BuildProof: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const still = Boolean(prefersReducedMotion);

  return (
    <section className="relative px-6 pb-28 md:pb-36">
      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={still ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 md:text-[11px]">
            Built by Velocity
          </p>
          <h2 className="mt-6 max-w-2xl font-sans text-[2rem] font-bold leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
            We build our own tools<span className="text-velocity-red">.</span>
          </h2>
          <p className="mt-6 max-w-xl font-sans text-sm leading-relaxed text-zinc-400 md:text-base">
            Launchpad turns a rough idea into a full startup analysis, built in-house.
          </p>
        </motion.header>

        {/* Launchpad pipeline schematic */}
        <div className="mt-14 md:mt-16">
          <PipelineWide still={still} />
          <PipelineStacked still={still} />
        </div>

        <div className="mt-12">
          <Link to="/launchpad" className={CTA_CLASS}>
            Try Launchpad
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:transform-none" />
          </Link>
        </div>

        {/* Everything else we keep open for builders */}
        <div className="mt-16">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Also open <span className="text-velocity-red">Free to use</span>
          </p>
          <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
            {liveResourceCatalog.map((resource) => {
              const Icon = resource.icon;
              return (
                <Link
                  key={resource.id}
                  to={resource.path}
                  className="group flex items-start gap-3 bg-velocity-black p-5 transition-colors duration-300 hover:bg-white/[0.03]"
                >
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500 transition-colors group-hover:text-velocity-red" />
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-bold text-white">{resource.title}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                      {resource.count}
                    </p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-velocity-red motion-reduce:transition-none motion-reduce:transform-none" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

/* --------------------------------- Plates --------------------------------- */

const Plate: React.FC<{ kind: string; name: string; className?: string }> = ({
  kind,
  name,
  className,
}) => (
  <div className={`border border-white/15 bg-velocity-black px-4 py-3 ${className ?? ''}`}>
    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-600">{kind}</p>
    <p className="mt-1 font-sans text-xs font-bold leading-tight text-white">{name}</p>
  </div>
);

const StageChip: React.FC<{ stage: Stage; index: number; still: boolean }> = ({
  stage,
  index,
  still,
}) => (
  <motion.div
    initial={{ opacity: still ? 1 : 0, y: still ? 0 : 14 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.45, delay: still ? 0 : index * 0.09, ease: 'easeOut' }}
    className="bg-velocity-black px-4 py-4"
  >
    <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-zinc-600">{stage.no}</p>
    <p className="mt-1.5 font-sans text-[13px] font-bold leading-snug text-white">
      {stage.label}
    </p>
  </motion.div>
);

const RailNode: React.FC = () => (
  <span className="block h-[7px] w-[7px] border border-velocity-red/70 bg-velocity-black" />
);

/* ------------------------------- Wide schematic ---------------------------- */

// Four stage cells plus two plates only breathe at lg; below that the
// schematic rotates onto its side rather than squeezing.
const PipelineWide: React.FC<{ still: boolean }> = ({ still }) => {
  const ref = useRef<HTMLDivElement>(null);
  // Pause the infinite pulse while the schematic is offscreen (or display:none
  // below lg, a hidden element never intersects).
  const inView = useInView(ref, { margin: '80px 0px' });

  return (
    <div ref={ref} className="hidden lg:block">
      {/* The visual runs right-to-left rows; give AT the flow in one line instead. */}
      <p className="sr-only">
        Rough idea in, then Bull vs Bear council, Market sizing, Competitor map and
        MVP prompt chain, startup analysis out.
      </p>
      <div aria-hidden>
    {/* Stage chips */}
    <div className="flex">
      <div className={PLATE_COL} />
      <div className="grid min-w-0 flex-1 grid-cols-4 gap-px border border-white/10 bg-white/10">
        {STAGES.map((stage, index) => (
          <StageChip key={stage.no} stage={stage} index={index} still={still} />
        ))}
      </div>
      <div className={PLATE_COL} />
    </div>

    {/* Drop stubs down to the bus */}
    <div aria-hidden className="flex">
      <div className={PLATE_COL} />
      <div className="relative h-7 min-w-0 flex-1">
        {RAIL_STOPS.map((left) => (
          <span
            key={left}
            className="absolute top-0 h-full w-px -translate-x-1/2 bg-white/15"
            style={{ left: `${left}%` }}
          />
        ))}
      </div>
      <div className={PLATE_COL} />
    </div>

    {/* Bus: idea in on the left, analysis out on the right */}
    <div className="flex items-center">
      <Plate kind="Input" name="Rough idea" className={PLATE_COL} />
      <div aria-hidden className="relative h-px min-w-0 flex-1 bg-white/15">
        {RAIL_STOPS.map((left) => (
          <span
            key={left}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%` }}
          >
            <RailNode />
          </span>
        ))}
        {!still && inView && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-5 -translate-y-1/2 overflow-hidden">
            <motion.div
              className="absolute inset-0"
              animate={{ x: ['0%', '100%'] }}
              transition={PULSE_TRANSITION}
            >
              <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 bg-velocity-red shadow-[0_0_10px_rgba(255,31,31,0.9)]">
                <span className="absolute right-full top-1/2 h-px w-14 -translate-y-1/2 bg-gradient-to-r from-transparent to-velocity-red" />
              </span>
            </motion.div>
          </div>
        )}
      </div>
      <Plate kind="Output" name="Startup analysis" className={PLATE_COL} />
    </div>
      </div>
    </div>
  );
};

/* ------------------------------ Stacked schematic -------------------------- */

const PipelineStacked: React.FC<{ still: boolean }> = ({ still }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '80px 0px' });

  return (
  <div ref={ref} className="relative lg:hidden">
    <div aria-hidden className="absolute bottom-6 left-[3px] top-6 w-px bg-white/15">
      {!still && inView && (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            animate={{ y: ['0%', '100%'] }}
            transition={PULSE_TRANSITION}
          >
            <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 bg-velocity-red shadow-[0_0_10px_rgba(255,31,31,0.9)]">
              <span className="absolute bottom-full left-1/2 h-14 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-velocity-red" />
            </span>
          </motion.div>
        </div>
      )}
    </div>

    <div className="pl-9">
      <Plate kind="Input" name="Rough idea" />
      <div className="my-px grid gap-px border border-white/10 bg-white/10">
        {STAGES.map((stage, index) => (
          <div key={stage.no} className="relative">
            <span
              aria-hidden
              className="absolute left-[-37px] top-[18px] h-[7px] w-[7px] border border-velocity-red/70 bg-velocity-black"
            />
            <StageChip stage={stage} index={index} still={still} />
          </div>
        ))}
      </div>
      <Plate kind="Output" name="Startup analysis" />
    </div>
  </div>
  );
};
