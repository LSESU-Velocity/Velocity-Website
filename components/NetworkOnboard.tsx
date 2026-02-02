import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { PrimaryRole } from '../lib/connectMockData';
import { connectMockProfiles } from '../lib/connectMockData';

const TOTAL_STEPS = 5;

const ROLE_LABELS: Record<PrimaryRole, string> = {
  designer: 'Designer',
  developer: 'Developer',
  strategist: 'Strategist',
};

const SKILL_OPTIONS = [
  ...new Set(connectMockProfiles.flatMap((p) => p.interests)),
].sort();

const AVAILABILITY_OPTIONS = [
  ...new Set(connectMockProfiles.map((p) => p.availability)),
].sort();

export interface OnboardFormState {
  roleSliders: Record<PrimaryRole, number>;
  fullName: string;
  headline: string;
  bio: string;
  interests: string[];
  availability: string;
}

const initialFormState: OnboardFormState = {
  roleSliders: { designer: 33, developer: 34, strategist: 33 },
  fullName: '',
  headline: '',
  bio: '',
  interests: [],
  availability: AVAILABILITY_OPTIONS[0] ?? '',
};

function getPrimaryRoleFromSliders(sliders: Record<PrimaryRole, number>): PrimaryRole {
  const entries = Object.entries(sliders) as [PrimaryRole, number][];
  return entries.reduce((a, b) => (sliders[a] >= sliders[b] ? a : b), 'developer');
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

export const NetworkOnboard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [form, setForm] = useState<OnboardFormState>(initialFormState);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const updateForm = (patch: Partial<OnboardFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const toggleInterest = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(skill)
        ? prev.interests.filter((s) => s !== skill)
        : [...prev.interests, skill],
    }));
  };

  const primaryRole = getPrimaryRoleFromSliders(form.roleSliders);

  const handleSubmit = () => {
    setSubmitted(true);
    // No backend yet — could navigate to /connect or show success
    setTimeout(() => navigate('/connect'), 2000);
  };

  const inputClass =
    'w-full font-sans text-sm text-white bg-velocity-black/60 border border-white/10 px-4 py-3 placeholder:text-zinc-600 focus:outline-none focus:border-velocity-red/50 transition-colors';
  const labelClass = 'font-sans text-xs uppercase tracking-widest text-zinc-500 mb-2 block';

  return (
    <section className="relative z-10 py-32 px-6 bg-velocity-black min-h-screen">
      <div className="max-w-xl mx-auto">
        <Link
          to="/connect"
          className="inline-flex items-center gap-2 font-sans text-sm text-zinc-500 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Network
        </Link>

        <div className="mb-10">
          <h1 className="font-sans font-bold text-2xl md:text-3xl text-white mb-1">
            Create your <span className="text-velocity-red">Network</span> profile
          </h1>
          <p className="font-sans text-sm text-zinc-500 uppercase tracking-widest">
            Step {step} of {TOTAL_STEPS}
          </p>
          {/* Progress bar */}
          <div className="mt-4 h-1 bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-velocity-red"
              initial={false}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 1: Role assessment sliders */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              <p className="font-sans text-sm text-zinc-400">
                How would you describe your primary focus? Adjust the sliders to reflect your mix.
              </p>
              {(['designer', 'developer', 'strategist'] as PrimaryRole[]).map((role) => (
                <div key={role}>
                  <label className={labelClass}>{ROLE_LABELS[role]}</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.roleSliders[role]}
                      onChange={(e) =>
                        updateForm({
                          roleSliders: {
                            ...form.roleSliders,
                            [role]: Number(e.target.value),
                          },
                        })
                      }
                      className="flex-1 h-2 bg-white/10 accent-velocity-red appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-velocity-red [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <span className="font-sans text-sm text-zinc-400 w-10 text-right">
                      {form.roleSliders[role]}%
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Step 2: Name, headline, bio */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <label htmlFor="fullName" className={labelClass}>
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Alex Chen"
                  value={form.fullName}
                  onChange={(e) => updateForm({ fullName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="headline" className={labelClass}>
                  Headline
                </label>
                <input
                  id="headline"
                  type="text"
                  placeholder="e.g. Building fintech products that ship"
                  value={form.headline}
                  onChange={(e) => updateForm({ headline: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="bio" className={labelClass}>
                  Bio
                </label>
                <textarea
                  id="bio"
                  placeholder="A short intro about you and what you're looking for…"
                  value={form.bio}
                  onChange={(e) => updateForm({ bio: e.target.value })}
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Select skills */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <p className="font-sans text-sm text-zinc-400 mb-4">
                Select the skills and interests you want to show on your profile.
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleInterest(skill)}
                    className={`font-sans text-xs px-3 py-2 border transition-colors focus:outline-none ${
                      form.interests.includes(skill)
                        ? 'border-velocity-red/50 bg-velocity-darkRed/20 text-white'
                        : 'border-white/20 text-zinc-500 hover:border-white/40 hover:text-zinc-300'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              {form.interests.length > 0 && (
                <p className="font-sans text-xs text-zinc-500 mt-4">
                  {form.interests.length} selected
                </p>
              )}
            </motion.div>
          )}

          {/* Step 4: Availability */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <p className="font-sans text-sm text-zinc-400 mb-4">
                How available are you for new connections and projects?
              </p>
              <div className="space-y-2">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 font-sans text-sm py-3 px-4 border cursor-pointer transition-colors ${
                      form.availability === opt
                        ? 'border-velocity-red/50 bg-velocity-darkRed/20 text-white'
                        : 'border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="availability"
                      value={opt}
                      checked={form.availability === opt}
                      onChange={() => updateForm({ availability: opt })}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 5: Preview & submit */}
          {step === 5 && (
            <motion.div
              key="step5"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {submitted ? (
                <div className="text-center py-12">
                  <p className="font-sans text-velocity-red text-lg mb-2">Profile created!</p>
                  <p className="font-sans text-sm text-zinc-500">Taking you to Network…</p>
                </div>
              ) : (
                <>
                  <p className="font-sans text-sm text-zinc-400 mb-6">
                    Review your profile before submitting.
                  </p>
                  <div className="border border-white/10 bg-velocity-black/40 p-6 space-y-4">
                    <div>
                      <span className="font-sans text-xs uppercase tracking-widest text-zinc-500">
                        Role
                      </span>
                      <p className="font-sans text-white capitalize">{primaryRole}</p>
                    </div>
                    <div>
                      <span className="font-sans text-xs uppercase tracking-widest text-zinc-500">
                        Name
                      </span>
                      <p className="font-sans text-white">
                        {form.fullName || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="font-sans text-xs uppercase tracking-widest text-zinc-500">
                        Headline
                      </span>
                      <p className="font-sans text-white">
                        {form.headline || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="font-sans text-xs uppercase tracking-widest text-zinc-500">
                        Bio
                      </span>
                      <p className="font-sans text-sm text-zinc-400">
                        {form.bio || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="font-sans text-xs uppercase tracking-widest text-zinc-500">
                        Skills
                      </span>
                      <p className="font-sans text-sm text-zinc-400">
                        {form.interests.length > 0
                          ? form.interests.join(', ')
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="font-sans text-xs uppercase tracking-widest text-zinc-500">
                        Availability
                      </span>
                      <p className="font-sans text-white">{form.availability}</p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!submitted && (
          <div className="flex gap-3 mt-10">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="font-sans text-xs uppercase tracking-widest px-6 py-3 border-2 border-white/30 text-white hover:border-white hover:bg-white/5 transition-colors focus:outline-none"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <div className="flex-1" />
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                className="font-sans text-xs uppercase tracking-widest px-6 py-3 border-2 border-velocity-red/50 text-white bg-velocity-darkRed/20 hover:bg-velocity-red hover:border-velocity-red transition-colors focus:outline-none"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitted}
                className="font-sans text-xs uppercase tracking-widest px-6 py-3 border-2 border-velocity-red/50 text-white bg-velocity-darkRed/20 hover:bg-velocity-red hover:border-velocity-red transition-colors focus:outline-none disabled:opacity-50"
              >
                Submit
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
