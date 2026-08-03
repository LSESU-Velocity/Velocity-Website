import React, { useEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import { ArrowUpRight, Instagram, Linkedin, Mail } from 'lucide-react';

const LSESU_URL = 'https://www.lsesu.com/communities/societies/group/Velocity/';
const INSTAGRAM_URL = 'https://www.instagram.com/lsesu.velocity';
const LINKEDIN_URL = 'https://www.linkedin.com/company/lsesu-velocity';
const PARTNER_MAILTO =
  'mailto:velocity@lsesu.org?subject=Partnering%20with%20LSESU%20Velocity';

const SPONSORS = [
  { name: 'Base', logo: '/sponsors/base-canvalogo.png' },
  { name: 'Bitget', logo: '/sponsors/bitget-canvalogo.png' },
  { name: 'Headstart', logo: '/sponsors/headstart-canvalogo.png' },
  { name: 'Lovable', logo: '/sponsors/lovable-logo.jpg' },
];

/* Two copies is all a seamless loop needs: the track travels exactly -50%. */
const MARQUEE_COPIES = 2;
const MARQUEE_DURATION = 26;

/* Branching circuit: one trunk splitting into the two doors. The viewBox is
   stretched to the container width, so strokes are pinned at 1px. */
const FORK_TRUNK = 'M200 2 V30';
const FORK_LEFT = 'M200 30 H100 V74';
const FORK_RIGHT = 'M200 30 H300 V74';

/* Mobile variant: the doors stack, so the branches drop to the grid edge. */
const FORK_TRUNK_SM = 'M200 0 V36';
const FORK_LEFT_SM = 'M200 36 H120 V96';
const FORK_RIGHT_SM = 'M200 36 H280 V96';

export const PartnersJoin: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const still = Boolean(prefersReducedMotion);

  return (
    <section id="get-involved" className="relative px-6 pb-28 md:pb-36">
      <div className="relative mx-auto max-w-5xl">
        <motion.header
          initial={still ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 md:text-[11px]">
            Get involved <span className="text-velocity-red">Two ways in</span>
          </p>
          <h2 className="mx-auto mt-6 max-w-2xl font-sans text-[2rem] font-bold leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
            Pick your side of the room<span className="text-velocity-red">.</span>
          </h2>
        </motion.header>

        {/* The fork */}
        <div className="mt-10">
          <svg
            aria-hidden
            viewBox="0 0 400 76"
            preserveAspectRatio="none"
            className="hidden h-[76px] w-full md:block"
            fill="none"
          >
            {[FORK_TRUNK, FORK_LEFT, FORK_RIGHT].map((d) => (
              <path
                key={d}
                d={d}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <motion.path
              d={FORK_TRUNK}
              stroke="#FF1F1F"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: still ? 1 : 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
            {[FORK_LEFT, FORK_RIGHT].map((d) => (
              <motion.path
                key={d}
                d={d}
                stroke="#FF1F1F"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: still ? 1 : 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.75, delay: still ? 0 : 0.3, ease: 'easeOut' }}
              />
            ))}
          </svg>

          <svg
            aria-hidden
            viewBox="0 0 400 96"
            preserveAspectRatio="none"
            className="h-24 w-full md:hidden"
            fill="none"
          >
            {[FORK_TRUNK_SM, FORK_LEFT_SM, FORK_RIGHT_SM].map((d) => (
              <path
                key={d}
                d={d}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <motion.path
              d={FORK_TRUNK_SM}
              stroke="#FF1F1F"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: still ? 1 : 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
            {[FORK_LEFT_SM, FORK_RIGHT_SM].map((d) => (
              <motion.path
                key={d}
                d={d}
                stroke="#FF1F1F"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: still ? 1 : 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.75, delay: still ? 0 : 0.3, ease: 'easeOut' }}
              />
            ))}
          </svg>
        </div>

        <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 md:grid-cols-2">
          {/* Students door */}
          <div className="bg-velocity-black p-8 md:p-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
              <span className="text-velocity-red">01</span> Students
            </p>
            <h3 className="mt-5 font-sans text-2xl font-bold tracking-tight text-white md:text-3xl">
              Build with us<span className="text-velocity-red">.</span>
            </h3>
            <p className="mt-4 font-sans text-sm leading-relaxed text-zinc-400">
              Open to all LSE students, no experience needed.
            </p>

            <a
              href={LSESU_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex items-center gap-3 bg-velocity-red px-5 py-3.5 font-sans text-[11px] uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-velocity-red/85 sm:px-6 sm:text-xs sm:tracking-[0.24em]"
            >
              Join via LSESU
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:transform-none" />
            </a>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <SocialLink href={INSTAGRAM_URL} label="Instagram" icon={Instagram} />
              <SocialLink href={LINKEDIN_URL} label="LinkedIn" icon={Linkedin} />
            </div>
          </div>

          {/* Sponsors door */}
          <div className="bg-velocity-black p-8 md:p-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
              <span className="text-velocity-red">02</span> Partners
            </p>
            <h3 className="mt-5 font-sans text-2xl font-bold tracking-tight text-white md:text-3xl">
              Back the builders<span className="text-velocity-red">.</span>
            </h3>
            <p className="mt-4 font-sans text-sm leading-relaxed text-zinc-400">
              Partnerships cover funding, speakers, workshops, prizes and in-kind
              support. Sponsor brief available on request.
            </p>

            <a
              href={PARTNER_MAILTO}
              className="mt-8 inline-flex items-center gap-3 border border-white/20 px-5 py-3.5 font-sans text-[11px] uppercase tracking-[0.2em] text-zinc-200 transition-colors duration-300 hover:border-white/45 hover:text-white sm:px-6 sm:text-xs sm:tracking-[0.24em]"
            >
              <Mail className="h-4 w-4" />
              Partner with us
            </a>

            <PastPartners still={still} />
          </div>
        </div>
      </div>

      {/* Dissolves the hard seam where this ambient section meets the finale's
         opaque black. The wrapper above needs `relative` so content keeps
         painting over this overlay. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-black/60 to-black md:h-72"
      />
    </section>
  );
};

/* ------------------------------- Social links ------------------------------ */

interface SocialLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SocialLink: React.FC<SocialLinkProps> = ({ href, label, icon: Icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 border border-white/10 px-4 py-2.5 font-sans text-[10px] uppercase tracking-[0.24em] text-zinc-400 transition-colors duration-300 hover:border-white/30 hover:text-white"
  >
    <Icon className="h-3.5 w-3.5" />
    {label}
  </a>
);

/* ------------------------------ Past partners ------------------------------ */

const LOOPED_SPONSORS = Array.from(
  { length: SPONSORS.length * MARQUEE_COPIES },
  (_, index) => SPONSORS[index % SPONSORS.length]
);

const PastPartners: React.FC<{ still: boolean }> = ({ still }) => {
  const offset = useMotionValue(0);
  const x = useTransform(offset, (value) => `${value}%`);
  const playback = useRef<{ pause: () => void; play: () => void } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(trackRef, { margin: '80px 0px' });
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    if (still) return;
    const controls = animate(offset, -100 / MARQUEE_COPIES, {
      duration: MARQUEE_DURATION,
      repeat: Infinity,
      ease: 'linear',
    });
    playback.current = controls;
    return () => {
      controls.stop();
      playback.current = null;
    };
  }, [offset, still]);

  // Park the loop while offscreen or paused via the accessible control.
  useEffect(() => {
    const controls = playback.current;
    if (!controls) return;
    if (inView && !userPaused) controls.play();
    else controls.pause();
  }, [inView, userPaused, still]);

  const resume = () => {
    if (inView && !userPaused) playback.current?.play();
  };

  return (
    <div className="mt-9 border-t border-white/10 pt-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
          Past sponsors &amp; partners
        </p>
        {!still && (
          <button
            type="button"
            onClick={() => setUserPaused((paused) => !paused)}
            aria-pressed={userPaused}
            aria-label={userPaused ? 'Play the partner logos' : 'Pause the partner logos'}
            className="border border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 transition-colors duration-300 hover:border-white/30 hover:text-white"
          >
            {userPaused ? 'Play' : 'Pause'}
          </button>
        )}
      </div>

      {still ? (
        <div className="mt-5 grid grid-cols-2 gap-px border border-white/10 bg-white/10">
          {SPONSORS.map((sponsor) => (
            <div
              key={sponsor.name}
              className="flex h-16 items-center justify-center bg-velocity-black px-4"
            >
              <img
                src={sponsor.logo}
                alt={`${sponsor.name} logo`}
                loading="lazy"
                decoding="async"
                className="max-h-10 w-auto max-w-[110px] object-contain opacity-70"
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={trackRef}
          className="relative mt-5 overflow-hidden"
          onMouseEnter={() => playback.current?.pause()}
          onMouseLeave={resume}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-velocity-black to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-velocity-black to-transparent" />

          <motion.div className="flex w-max items-center" style={{ x }}>
            {LOOPED_SPONSORS.map((sponsor, index) => {
              const isClone = index >= SPONSORS.length;
              return (
                <div
                  key={index}
                  aria-hidden={isClone || undefined}
                  className="flex h-14 flex-shrink-0 items-center justify-center px-7"
                >
                  <img
                    src={sponsor.logo}
                    alt={isClone ? '' : `${sponsor.name} logo`}
                    loading="lazy"
                    decoding="async"
                    className="max-h-10 w-auto max-w-[110px] object-contain opacity-60 transition-opacity duration-300 hover:opacity-100"
                  />
                </div>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
};
