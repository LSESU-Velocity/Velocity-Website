import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Palette, Code, Target, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';
import { connectMockProfiles, type PrimaryRole } from '../lib/connectMockData';

const roleConfig: Record<PrimaryRole, { label: string; icon: React.ElementType }> = {
  designer: { label: 'Designer', icon: Palette },
  developer: { label: 'Developer', icon: Code },
  strategist: { label: 'Strategist', icon: Target },
};

export const NetworkProfileDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = id
    ? connectMockProfiles.find((p) => p.id === id)
    : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!profile) {
    return (
      <section className="relative z-10 py-32 px-6 bg-velocity-black min-h-screen">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-sans font-bold text-2xl text-white mb-4">
            Profile not found
          </h1>
          <p className="font-sans text-sm text-zinc-500 mb-8">
            This profile doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => navigate('/connect')} variant="outline">
            Back to Network
          </Button>
        </div>
      </section>
    );
  }

  const { label: roleLabel, icon: RoleIcon } = roleConfig[profile.primaryRole];

  const handleConnect = () => {
    // Placeholder: could open mailto, modal, or external flow
    if (profile.linkedInUrl) {
      window.open(profile.linkedInUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="relative z-10 py-32 px-6 bg-velocity-black min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          to="/connect"
          className="inline-flex items-center gap-2 font-sans text-sm text-zinc-500 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Network
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="border border-white/10 bg-velocity-black/40 p-8 md:p-10"
        >
          {/* Role badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2.5 bg-white/5 border border-white/10 border-velocity-red/30">
              <RoleIcon className="w-5 h-5 text-velocity-red" />
            </div>
            <span className="font-sans text-xs uppercase tracking-widest text-velocity-red/90">
              {roleLabel}
            </span>
          </div>

          <h1 className="font-sans font-bold text-3xl md:text-4xl text-white mb-2">
            {profile.fullName}
          </h1>
          <p className="font-sans text-lg text-zinc-400 mb-8">
            {profile.headline}
          </p>

          {/* Bio */}
          <div className="mb-8">
            <h2 className="font-sans text-xs uppercase tracking-widest text-zinc-500 mb-3">
              Bio
            </h2>
            <p className="font-sans text-sm leading-relaxed text-zinc-400">
              {profile.bio}
            </p>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h2 className="font-sans text-xs uppercase tracking-widest text-zinc-500 mb-3">
              Skills & interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1.5 font-sans text-sm border border-white/10 text-zinc-400"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="mb-8">
            <h2 className="font-sans text-xs uppercase tracking-widest text-zinc-500 mb-2">
              Availability
            </h2>
            <p className="font-sans text-sm text-white">
              {profile.availability}
            </p>
          </div>

          {/* LinkedIn */}
          {profile.linkedInUrl && (
            <div className="mb-10">
              <a
                href={profile.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-sans text-sm text-zinc-400 hover:text-velocity-red transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                LinkedIn
              </a>
            </div>
          )}

          {/* Network button */}
          <Button onClick={handleConnect} variant="primary" className="gap-2">
            Network
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
