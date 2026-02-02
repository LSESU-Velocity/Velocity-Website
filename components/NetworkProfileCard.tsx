import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionTemplate, useMotionValue, Variants } from 'framer-motion';
import { Palette, Code, Target } from 'lucide-react';
import type { ConnectProfile, PrimaryRole } from '../lib/connectMockData';

const roleConfig: Record<PrimaryRole, { label: string; icon: React.ElementType }> = {
  designer: { label: 'Designer', icon: Palette },
  developer: { label: 'Developer', icon: Code },
  strategist: { label: 'Strategist', icon: Target },
};

interface NetworkProfileCardProps {
  profile: ConnectProfile;
  onConnectClick?: (profile: ConnectProfile) => void;
}

export const NetworkProfileCard: React.FC<NetworkProfileCardProps> = ({ profile, onConnectClick }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] },
    },
  };

  const { label: roleLabel, icon: RoleIcon } = roleConfig[profile.primaryRole];

  return (
    <Link to={`/connect/profile/${profile.id}`} className="block h-full">
      <motion.article
        variants={cardVariants}
        onMouseMove={handleMouseMove}
        className="group relative flex flex-col bg-velocity-black/40 border border-white/5 p-8 h-full overflow-hidden hover:border-velocity-red/30 transition-colors duration-500 cursor-pointer"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        {/* Spotlight effect on hover */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`radial-gradient(500px circle at ${mouseX}px ${mouseY}px, rgba(255, 31, 31, 0.08), transparent 80%)`,
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
        {/* Role badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-white/5 border border-white/10 group-hover:border-velocity-red/40 group-hover:bg-velocity-red/10 transition-colors duration-500">
            <RoleIcon className="w-4 h-4 text-gray-400 group-hover:text-velocity-red transition-colors duration-500" />
          </div>
          <span className="font-sans text-xs uppercase tracking-widest text-zinc-500 group-hover:text-velocity-red/80 transition-colors duration-500">
            {roleLabel}
          </span>
        </div>

        <h3 className="font-sans font-bold text-xl text-white mb-2 group-hover:text-velocity-red transition-colors duration-500">
          {profile.fullName}
        </h3>
        <p className="font-sans text-sm leading-relaxed text-zinc-500 group-hover:text-zinc-400 transition-colors duration-500 mb-6">
          {profile.headline}
        </p>

        {/* Interests */}
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="px-2.5 py-1 font-sans text-xs border border-white/10 text-zinc-500 group-hover:border-velocity-red/20 group-hover:text-zinc-400 transition-colors duration-500"
            >
              {interest}
            </span>
          ))}
        </div>

        {/* Availability */}
        <p className="font-sans text-xs uppercase tracking-widest text-zinc-600 group-hover:text-velocity-red/70 transition-colors duration-500">
          {profile.availability}
        </p>

        {/* Connect button */}
        {onConnectClick && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onConnectClick(profile);
            }}
            className="mt-6 w-full font-sans text-xs uppercase tracking-widest px-4 py-3 border-2 border-velocity-red/50 text-white bg-velocity-darkRed/20 hover:bg-velocity-red hover:border-velocity-red transition-colors duration-300 focus:outline-none focus:border-velocity-red"
          >
            Connect
          </button>
        )}
      </div>
    </motion.article>
    </Link>
  );
};
