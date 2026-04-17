import React from 'react';
import { motion } from 'framer-motion';

const sponsors = [
  { name: 'Base', logo: '/sponsors/base-canvalogo.png' },
  { name: 'Bitget', logo: '/sponsors/bitget-canvalogo.png' },
  { name: 'Headstart', logo: '/sponsors/headstart-canvalogo.png' },
  { name: 'Lovable', logo: '/sponsors/lovable-logo.jpg' },
];

export const Sponsors: React.FC = () => {
  const loopedSponsors = [...sponsors, ...sponsors];

  return (
    <section className="py-20 md:py-28 relative bg-velocity-black overflow-hidden">
      {/* Section header */}
      <motion.div
        className="text-center mb-12 md:mb-14 px-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <p className="font-sans text-gray-500 text-xs md:text-sm uppercase tracking-[0.3em] mb-3">
          Past Sponsors &amp; Partners
        </p>
        <div className="w-12 h-[1px] bg-velocity-red/60 mx-auto" />
      </motion.div>

      {/* Marquee */}
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-velocity-black via-velocity-black/80 to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-velocity-black via-velocity-black/80 to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex items-center"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {loopedSponsors.map((sponsor, i) => (
            <div
              key={i}
              className="shrink-0 flex items-center justify-center h-20 md:h-24 px-8 md:px-14"
            >
              <img
                src={sponsor.logo}
                alt={`${sponsor.name} logo`}
                className="h-full w-auto max-w-[180px] md:max-w-[220px] object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
