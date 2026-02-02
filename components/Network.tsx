import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Search } from 'lucide-react';
import { NetworkProfileCard } from './NetworkProfileCard';
import { connectMockProfiles, type ConnectProfile, type PrimaryRole } from '../lib/connectMockData';

const AVAILABILITY_OPTIONS = [
  'All',
  ...Array.from(new Set(connectMockProfiles.map((p) => p.availability))).sort(),
];

const ROLE_OPTIONS: { value: 'all' | PrimaryRole; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'strategist', label: 'Strategist' },
];

function filterProfiles(
  profiles: ConnectProfile[],
  search: string,
  role: 'all' | PrimaryRole,
  availability: string
): ConnectProfile[] {
  const q = search.trim().toLowerCase();
  return profiles.filter((p) => {
    if (q) {
      const searchable =
        [p.fullName, p.headline, ...p.interests].join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    if (role !== 'all' && p.primaryRole !== role) return false;
    if (availability !== 'All' && p.availability !== availability) return false;
    return true;
  });
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
};

const TOAST_DURATION_MS = 3000;

export const Network: React.FC = () => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | PrimaryRole>('all');
  const [availability, setAvailability] = useState('All');
  const [modalProfile, setModalProfile] = useState<ConnectProfile | null>(null);
  const [introMessage, setIntroMessage] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!modalProfile) setIntroMessage('');
  }, [modalProfile]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredProfiles = useMemo(
    () => filterProfiles(connectMockProfiles, search, role, availability),
    [search, role, availability]
  );

  const openConnectModal = (profile: ConnectProfile) => {
    setModalProfile(profile);
  };

  const closeConnectModal = () => {
    setModalProfile(null);
    setIntroMessage('');
  };

  const handleSendRequest = () => {
    setModalProfile(null);
    setIntroMessage('');
    setToast('Request sent!');
  };

  return (
    <section className="relative z-10 py-32 px-6 bg-velocity-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 md:text-center max-w-3xl mx-auto">
          <h1 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-white mb-2">
            <span className="text-velocity-red">Network</span>
          </h1>
          <p className="font-sans text-gray-500 text-sm uppercase tracking-widest mb-6">
            Find builders, designers, and strategists in the Velocity network.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/connect/onboard"
              className="font-sans font-medium text-sm uppercase tracking-widest px-6 py-3 bg-velocity-red text-white border-2 border-velocity-red hover:bg-velocity-red/90 hover:border-velocity-red/90 transition-colors focus:outline-none"
            >
              Sign up
            </Link>
            <Link
              to="/connect"
              className="font-sans font-medium text-sm uppercase tracking-widest px-6 py-3 bg-transparent text-velocity-red border-2 border-velocity-red hover:bg-velocity-red/10 transition-colors focus:outline-none"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-10 flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, headline, skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full font-sans text-sm text-white bg-velocity-black/60 border border-white/10 pl-12 pr-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-velocity-red/50 focus:ring-1 focus:ring-velocity-red/30 transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Role filter buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-xs uppercase tracking-widest text-zinc-500 mr-1">
                Role
              </span>
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`font-sans text-xs uppercase tracking-widest px-4 py-2 border transition-colors focus:outline-none ${
                    role === opt.value
                      ? 'bg-velocity-darkRed/30 border-velocity-red/50 text-white'
                      : 'bg-transparent border-white/20 text-zinc-500 hover:border-white/40 hover:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Availability filter */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="availability-filter"
                className="font-sans text-xs uppercase tracking-widest text-zinc-500 whitespace-nowrap"
              >
                Availability
              </label>
              <select
                id="availability-filter"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="font-sans text-sm text-white bg-velocity-black/60 border border-white/10 px-4 py-2 focus:outline-none focus:border-velocity-red/50 min-w-[180px]"
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-velocity-black text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Profile grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredProfiles.map((profile) => (
              <motion.div
                key={profile.id}
                variants={cardVariants}
                layout
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <NetworkProfileCard
                  profile={profile}
                  onConnectClick={openConnectModal}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProfiles.length === 0 && (
          <p className="font-sans text-sm text-zinc-500 text-center py-12">
            No profiles match your filters. Try adjusting search or filters.
          </p>
        )}
      </div>

      {/* Network request modal */}
      <AnimatePresence>
        {modalProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={closeConnectModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md border border-white/10 bg-velocity-black p-8 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-sans font-bold text-xl text-white mb-1">
                Network with {modalProfile.fullName}
              </h2>
              <p className="font-sans text-sm text-zinc-500 mb-6">
                Send a short intro — they&apos;ll see it with your request.
              </p>
              <textarea
                placeholder="Write a short intro message…"
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                rows={4}
                className="w-full font-sans text-sm text-white bg-velocity-black/60 border border-white/10 px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-velocity-red/50 resize-none mb-6"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeConnectModal}
                  className="flex-1 font-sans text-xs uppercase tracking-widest px-4 py-3 border-2 border-white/30 text-white hover:border-white hover:bg-white/5 transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendRequest}
                  className="flex-1 font-sans text-xs uppercase tracking-widest px-4 py-3 border-2 border-velocity-red/50 text-white bg-velocity-darkRed/20 hover:bg-velocity-red hover:border-velocity-red transition-colors focus:outline-none"
                >
                  Send Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 border border-velocity-red/50 bg-velocity-darkRed/30 text-white font-sans text-sm uppercase tracking-widest"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
