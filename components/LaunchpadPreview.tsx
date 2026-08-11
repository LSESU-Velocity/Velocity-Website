import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Series,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const RED = '#FF1F1F';
const DARK_RED = '#500A0A';
const BG = '#000000';
const CELL = '#030303';
const BORDER = 'rgba(255,255,255,0.11)';
const BORDER_SOFT = 'rgba(255,255,255,0.06)';
const MUTED = '#71717A';
const DIM = '#52525B';
const SOFT = '#A1A1AA';
const WHITE_SOFT = '#D4D4D8';
const SANS = "'Google Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

export const FPS = 30;
export const PREVIEW_WIDTH = 1280;
export const PREVIEW_HEIGHT = 720;

const SCENE_1 = 120; // 4.0s — idea in
const SCENE_2 = 30; // 1.0s — launch burst
const SCENE_3 = 150; // 5.0s — staged analysis
const SCENE_4 = 135; // 4.5s — scored verdict
const SCENE_5 = 165; // 5.5s — bull vs bear
const SCENE_6 = 165; // 5.5s — market position + sizing
const SCENE_7 = 165; // 5.5s — customers, revenue, channels
const SCENE_8 = 165; // 5.5s — build prompt + founder assets

export const DURATION_IN_FRAMES =
  SCENE_1 + SCENE_2 + SCENE_3 + SCENE_4 + SCENE_5 + SCENE_6 + SCENE_7 + SCENE_8;

const IDEA_TEXT = 'An app for finding and booking pottery nights and craft workshops nearby';

const JUDGE_LINE =
  'Eager weekday studio supply and no craft-first owner — win one city before the platforms notice.';

const PROMPT_TEXT =
  'Build a web app using React with TypeScript (Vite) for discovering and booking local craft workshops. Create a warm, mobile-first layout with pages for Browse Workshops, Studio Profiles and My Bookings. Seed mock data for classes with dates, seats and prices.';

const STAGES = [
  'Classifying idea',
  'Preparing analysis',
  'Grounding live sources',
  'Bull analyst evaluating',
  'Bear analyst stress-testing',
  'Council judge deciding',
  'Synthesizing findings',
  'Validating report',
];

const STAGE_START = 6;
const STAGE_HOLD = 15;

const LIVE_FEED = [
  { label: 'Research', detail: '22 grounded sources captured', tone: SOFT, delay: 30 },
  { label: 'Bull', detail: 'Date-night crafting demand is rising', tone: WHITE_SOFT, delay: 54 },
  { label: 'Bear', detail: 'Airbnb Experiences owns discovery', tone: RED, delay: 78 },
  { label: 'Judge', detail: 'Verdict reached — bull leads', tone: RED, delay: 102 },
];

const BULL_POINTS = [
  'Date-night and gifting demand keeps rising',
  'Studios sit on empty weekday seats',
  'No one owns "crafts near me" yet',
];

const BEAR_POINTS = [
  'Airbnb Experiences owns discovery traffic',
  'Supply onboards slowly, studio by studio',
  'Small basket sizes squeeze a 12% take',
];

const MAP_POINTS = [
  { label: 'Airbnb Experiences', x: 22, y: 20, active: false, delay: 14 },
  { label: 'ClassPass', x: 30, y: 38, active: false, delay: 20 },
  { label: 'Skillshare', x: 18, y: 78, active: false, delay: 26 },
  { label: 'You', x: 78, y: 22, active: true, delay: 34 },
];

const MARKET_SIZING = [
  { label: 'TAM', value: '38M', note: 'Hobby crafters', ratio: 1, color: 'white' },
  { label: 'SAM', value: '6.2M', note: 'Urban workshop bookers', ratio: 0.42, color: MUTED },
  { label: 'SOM', value: '310K', note: 'Year-one reachable', ratio: 0.14, color: RED },
];

const SEGMENTS = [
  { name: 'Curious beginners', detail: 'First wheel nights and date-night bookings', tag: 'Demand' },
  { name: 'Hobby regulars', detail: 'Weekly studio time without a membership', tag: 'Demand' },
  { name: 'Studio owners', detail: 'Fill quiet weekday seats with new faces', tag: 'Supply' },
];

const CHANNELS = ['Instagram makers', 'r/pottery', 'City date-night guides'];

const FOUNDER_ASSETS = [
  { label: '▧ Waitlist page — Live', delay: 88 },
  { label: '▤ Pitch deck — 10 slides', delay: 102 },
];

const useLoopFade = (totalFrames: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, 14, totalFrames - 18, totalFrames - 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

const useSceneOpacity = (duration: number) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exit = interpolate(frame, [duration - 14, duration - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return Math.min(enter, exit);
};

const SceneShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      backgroundColor: BG,
      color: 'white',
      fontFamily: SANS,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(to right, rgba(31,31,31,0.42) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,31,31,0.42) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.52), transparent 92%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: -280,
        width: 1040,
        height: 540,
        transform: 'translateX(-50%)',
        background: 'radial-gradient(ellipse, rgba(255,31,31,0.10), transparent 68%)',
        filter: 'blur(34px)',
      }}
    />
    {children}
  </AbsoluteFill>
);

const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, distance = 10, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });

  return (
    <div
      style={{
        ...style,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

const Kicker: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, color = MUTED, style }) => (
  <div
    style={{
      color,
      fontFamily: MONO,
      fontSize: 12,
      letterSpacing: '0.18em',
      lineHeight: 1.4,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

const SourceTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: 'inline-block',
      border: '1px solid rgba(255,255,255,0.16)',
      color: SOFT,
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: '0.1em',
      lineHeight: 1.4,
      padding: '3px 7px',
    }}
  >
    {children}
  </span>
);

const TinyButton: React.FC<{ children: React.ReactNode; accent?: boolean }> = ({
  children,
  accent = false,
}) => (
  <div
    style={{
      border: `1px solid ${accent ? 'rgba(255,31,31,0.58)' : 'rgba(255,255,255,0.15)'}`,
      background: accent ? DARK_RED : 'transparent',
      color: accent ? 'white' : SOFT,
      fontFamily: MONO,
      fontSize: 12,
      letterSpacing: '0.18em',
      padding: '11px 15px',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

const PhaseRail: React.FC<{ no: string; label: string }> = ({ no, label }) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [2, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, height: 20 }}>
      <Kicker>
        <span style={{ color: RED }}>{no}</span> {label}
      </Kicker>
      <div
        style={{
          height: 1,
          flex: 1,
          background: BORDER,
          transform: `scaleX(${grow})`,
          transformOrigin: 'left',
        }}
      />
    </div>
  );
};

const Bullet: React.FC<{
  children: React.ReactNode;
  red?: boolean;
  style?: React.CSSProperties;
}> = ({ children, red = false, style }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      color: WHITE_SOFT,
      fontSize: 19,
      lineHeight: 1.5,
      ...style,
    }}
  >
    <span style={{ width: 8, height: 8, marginTop: 10, flexShrink: 0, background: red ? RED : 'white' }} />
    <span>{children}</span>
  </div>
);

const VerdictTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      border: '1px solid rgba(255,31,31,0.52)',
      background: 'rgba(80,10,10,0.42)',
      color: RED,
      fontFamily: MONO,
      fontSize: 12,
      letterSpacing: '0.18em',
      padding: '7px 12px',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

const VerdictNeedle: React.FC<{ position: number; delay: number }> = ({ position, delay }) => {
  const frame = useCurrentFrame();
  const travel = interpolate(frame, [delay, delay + 38], [50, position], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ position: 'relative', height: 3, background: 'rgba(255,255,255,0.12)' }}>
        <div
          style={{
            position: 'absolute',
            left: `${travel}%`,
            top: '50%',
            width: 14,
            height: 14,
            background: RED,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 18px rgba(255,31,31,0.75)',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 15,
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ color: RED }}>Bull</span><span>Split</span><span>Bear</span>
      </div>
    </div>
  );
};

const SceneTyping: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = useSceneOpacity(SCENE_1);
  const typedCount = Math.round(
    interpolate(frame, [24, 94], [0, IDEA_TEXT.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const typed = IDEA_TEXT.slice(0, typedCount);
  const cursorVisible = Math.floor(frame / (fps * 0.34)) % 2 === 0;
  const buttonPulse = spring({
    frame: frame - 93,
    fps,
    config: { damping: 20, stiffness: 200 },
    durationInFrames: 18,
  });

  return (
    <SceneShell>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '0 80px',
          boxSizing: 'border-box',
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Reveal delay={2} distance={18}>
          <div
            style={{
              textAlign: 'center',
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: '-0.055em',
              lineHeight: 0.9,
            }}
          >
            Got an idea?<br /><span style={{ color: RED }}>Start here.</span>
          </div>
        </Reveal>

        <Reveal delay={10}>
          <p
            style={{
              width: 720,
              margin: '30px 0 0',
              color: SOFT,
              fontSize: 19,
              lineHeight: 1.55,
              textAlign: 'center',
            }}
          >
            A rough spark goes in. Market, customers, risks, monetization and the
            next build prompts come out.
          </p>
        </Reveal>

        <Reveal delay={18} style={{ width: 1120, marginTop: 46 }}>
          <div style={{ display: 'flex', height: 72, border: '1px solid rgba(255,255,255,0.15)', background: CELL }}>
            <div style={{ width: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, fontFamily: MONO, fontSize: 20 }}>&gt;</div>
            <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', color: typed ? 'white' : MUTED, fontFamily: MONO, fontSize: 17 }}>
              {typed || 'Describe the idea in one sentence'}
              <span style={{ width: 9, height: 21, marginLeft: 6, flexShrink: 0, background: RED, opacity: typed && cursorVisible ? 1 : 0 }} />
            </div>
            <div
              style={{
                minWidth: 214,
                borderLeft: `1px solid ${BORDER}`,
                background: RED,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                fontFamily: MONO,
                fontSize: 13,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                transform: `scale(${1 + buttonPulse * 0.025})`,
                boxShadow: `0 0 ${buttonPulse * 34}px rgba(255,31,31,0.55)`,
              }}
            >
              Run analysis <span>→</span>
            </div>
          </div>
        </Reveal>
      </div>
    </SceneShell>
  );
};

const SceneLaunch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const burst = spring({ frame, fps, config: { damping: 200 }, durationInFrames: SCENE_2 });
  const scale = interpolate(burst, [0, 1], [0.2, 11]);
  const opacity = interpolate(burst, [0, 0.18, 1], [0, 0.55, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneShell>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 92, height: 92, border: `2px solid ${RED}`, transform: `translate(-50%, -50%) scale(${scale})`, opacity }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: 15,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          opacity: interpolate(frame, [0, 8, 22], [0, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Analysis started
      </div>
    </SceneShell>
  );
};

const SceneAnalysis: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useSceneOpacity(SCENE_3);
  const stageIndex = Math.min(
    STAGES.length - 1,
    Math.max(0, Math.floor((frame - STAGE_START) / STAGE_HOLD)),
  );
  const sinceStage = frame - STAGE_START - stageIndex * STAGE_HOLD;
  const stageFade = interpolate(sinceStage, [0, 5], [0.28, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const progress = interpolate(frame, [STAGE_START, SCENE_3 - 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const counter = `${stageIndex + 1}`.padStart(2, '0');

  return (
    <SceneShell>
      <div style={{ position: 'absolute', inset: 0, padding: '0 72px', boxSizing: 'border-box', opacity, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Reveal>
          <Kicker>Build log</Kicker>
        </Reveal>

        <Reveal delay={4} style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
            <div style={{ flexShrink: 0, color: RED, fontFamily: MONO, fontSize: 90, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {counter}<span style={{ color: DIM, fontSize: 44 }}>/{`${STAGES.length}`.padStart(2, '0')}</span>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: BORDER }} />
            <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 18, opacity: stageFade }}>
              <span style={{ width: 10, height: 10, flexShrink: 0, background: RED, boxShadow: '0 0 16px rgba(255,31,31,0.9)' }} />
              <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-0.032em', whiteSpace: 'nowrap' }}>{STAGES[stageIndex]}</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={9} style={{ marginTop: 38 }}>
          <div style={{ height: 5, background: BORDER_SOFT }}>
            <div style={{ width: `${progress * 100}%`, height: '100%', background: RED, boxShadow: '0 0 18px rgba(255,31,31,0.7)' }} />
          </div>
        </Reveal>

        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {LIVE_FEED.map((entry) => (
            <Reveal key={entry.label} delay={entry.delay}>
              <div style={{ height: 48, boxSizing: 'border-box', border: `1px solid ${BORDER}`, background: CELL, display: 'flex', alignItems: 'center', gap: 18, padding: '0 20px' }}>
                <span style={{ width: 8, height: 8, flexShrink: 0, background: entry.tone }} />
                <span style={{ width: 96, flexShrink: 0, color: entry.tone, fontFamily: MONO, fontSize: 16, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{entry.label}</span>
                <span style={{ color: SOFT, fontFamily: MONO, fontSize: 16, whiteSpace: 'nowrap' }}>{entry.detail}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SceneShell>
  );
};

const SceneVerdict: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useSceneOpacity(SCENE_4);
  const score = Math.round(
    interpolate(frame, [10, 60], [0, 68], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }),
  );

  return (
    <SceneShell>
      <div style={{ position: 'absolute', inset: 0, padding: '0 80px', boxSizing: 'border-box', opacity, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Reveal>
          <Kicker>Report <span style={{ color: RED }}>Complete</span></Kicker>
        </Reveal>

        <Reveal delay={5} style={{ marginTop: 20 }}>
          <div style={{ fontSize: 54, fontWeight: 760, letterSpacing: '-0.045em', lineHeight: 1 }}>Claymate<span style={{ color: RED }}>.</span></div>
          <div style={{ marginTop: 16, color: SOFT, fontSize: 19, lineHeight: 1.5 }}>Discover and book hands-on craft workshops near you.</div>
        </Reveal>

        <Reveal delay={12} style={{ marginTop: 38 }}>
          <div style={{ display: 'flex', border: `1px solid ${BORDER}`, background: CELL }}>
            <div style={{ width: 372, flexShrink: 0, boxSizing: 'border-box', borderRight: `1px solid ${BORDER}`, padding: '34px 36px' }}>
              <Kicker>Confidence</Kicker>
              <div style={{ marginTop: 16, color: RED, fontFamily: MONO, fontSize: 104, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {`${score}`.padStart(2, '0')}<span style={{ color: DIM, fontSize: 38 }}>/100</span>
              </div>
              <Kicker color={SOFT} style={{ marginTop: 16 }}>Promising — directional score</Kicker>
            </div>
            <div style={{ minWidth: 0, flex: 1, boxSizing: 'border-box', padding: '34px 36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Kicker>Judge</Kicker>
                <VerdictTag>Bull leads</VerdictTag>
              </div>
              <div style={{ marginTop: 20, color: WHITE_SOFT, fontSize: 20, lineHeight: 1.55 }}>{JUDGE_LINE}</div>
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Kicker style={{ marginRight: 6 }}>Grounded</Kicker>
                <SourceTag>S2</SourceTag><SourceTag>S7</SourceTag><SourceTag>S12</SourceTag>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </SceneShell>
  );
};

const SceneCouncil: React.FC = () => {
  const opacity = useSceneOpacity(SCENE_5);

  return (
    <SceneShell>
      <div style={{ position: 'absolute', inset: 0, padding: '72px 72px', boxSizing: 'border-box', opacity, display: 'flex', flexDirection: 'column' }}>
        <PhaseRail no="01" label="Validate" />

        <div style={{ minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, border: `1px solid ${BORDER}`, background: BORDER }}>
            <Reveal delay={6} style={{ height: '100%' }}>
              <div style={{ height: '100%', boxSizing: 'border-box', background: CELL, padding: '30px 32px' }}>
                <Kicker>Bull case</Kicker>
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {BULL_POINTS.map((point) => (
                    <Bullet key={point} style={{ fontSize: 18 }}>{point}</Bullet>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={12} style={{ height: '100%' }}>
              <div style={{ height: '100%', boxSizing: 'border-box', background: CELL, padding: '30px 32px' }}>
                <Kicker color={RED}>Bear case</Kicker>
                <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {BEAR_POINTS.map((point) => (
                    <Bullet key={point} red style={{ fontSize: 18 }}>{point}</Bullet>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={18}>
            <div style={{ border: `1px solid ${BORDER}`, background: CELL, padding: '26px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <Kicker>Analyst council</Kicker>
                <VerdictTag>Bull leads</VerdictTag>
              </div>
              <div style={{ marginTop: 18, color: WHITE_SOFT, fontSize: 19, lineHeight: 1.5 }}>{JUDGE_LINE}</div>
              <VerdictNeedle position={26} delay={30} />
            </div>
          </Reveal>
        </div>
      </div>
    </SceneShell>
  );
};

const SceneMarket: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useSceneOpacity(SCENE_6);
  const barProgress = interpolate(frame, [34, 92], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <SceneShell>
      <div style={{ position: 'absolute', inset: 0, padding: '72px 72px', boxSizing: 'border-box', opacity, display: 'flex', flexDirection: 'column' }}>
        <PhaseRail no="01" label="Validate" />

        <div style={{ minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
          <Reveal delay={5}>
            <Kicker>Market position</Kicker>
            <div style={{ position: 'relative', height: 340, marginTop: 16, border: `1px solid ${BORDER}`, background: 'radial-gradient(circle at 78% 22%, rgba(255,31,31,0.12), transparent 34%), #020202' }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: BORDER_SOFT }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: BORDER_SOFT }} />
              <Kicker style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)' }}>In-studio</Kicker>
              <Kicker style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>Online</Kicker>
              <Kicker style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }}>Generalist</Kicker>
              <Kicker style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)' }}>Craft-first</Kicker>
              {MAP_POINTS.map((point) => (
                <Reveal key={point.label} delay={point.delay} distance={6} style={{ position: 'absolute', left: `${point.x}%`, top: `${point.y}%` }}>
                  <div style={{ transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: 11, border: `1px solid ${point.active ? 'rgba(255,31,31,0.55)' : BORDER}`, background: point.active ? 'rgba(80,10,10,0.72)' : '#050505', color: point.active ? 'white' : SOFT, padding: '11px 15px', fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', whiteSpace: 'nowrap', boxShadow: point.active ? '0 0 22px rgba(255,31,31,0.24)' : 'none' }}>
                    <span style={{ width: 7, height: 7, flexShrink: 0, background: point.active ? RED : MUTED }} />{point.label}
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delay={26}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: `1px solid ${BORDER}`, background: BORDER }}>
              {MARKET_SIZING.map((item) => (
                <div key={item.label} style={{ background: CELL, padding: '22px 24px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14 }}>
                    <Kicker color={RED}>{item.label}</Kicker>
                    <span style={{ fontFamily: MONO, fontSize: 28, letterSpacing: '-0.02em' }}>{item.value}</span>
                  </div>
                  <Kicker color={SOFT} style={{ marginTop: 12 }}>{item.note}</Kicker>
                  <div style={{ height: 6, marginTop: 16, background: BORDER_SOFT }}>
                    <div style={{ width: `${item.ratio * barProgress * 100}%`, height: '100%', background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </SceneShell>
  );
};

const SceneStrategy: React.FC = () => {
  const opacity = useSceneOpacity(SCENE_7);

  return (
    <SceneShell>
      <div style={{ position: 'absolute', inset: 0, padding: '72px 72px', boxSizing: 'border-box', opacity, display: 'flex', flexDirection: 'column' }}>
        <PhaseRail no="02" label="Strategy" />

        <div style={{ minHeight: 0, flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'stretch', gap: 20 }}>
            <Reveal delay={6} style={{ flex: 55, minWidth: 0 }}>
              <div style={{ height: '100%', boxSizing: 'border-box', border: `1px solid ${BORDER}`, background: CELL, padding: '30px 32px', display: 'flex', flexDirection: 'column' }}>
                <Kicker>Customers</Kicker>
                <div style={{ marginTop: 18, minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 1, background: BORDER, border: `1px solid ${BORDER}` }}>
                  {SEGMENTS.map((segment) => (
                    <div key={segment.name} style={{ minHeight: 0, flex: 1, background: BG, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                        <span style={{ minWidth: 0, fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap' }}>{segment.name}</span>
                        <span style={{ flexShrink: 0, border: `1px solid ${BORDER}`, color: segment.tag === 'Supply' ? RED : SOFT, fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 9px' }}>{segment.tag}</span>
                      </div>
                      <div style={{ marginTop: 9, color: SOFT, fontSize: 15, lineHeight: 1.45 }}>{segment.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <div style={{ flex: 45, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Reveal delay={12}>
                <div style={{ border: `1px solid ${BORDER}`, background: CELL, padding: '30px 32px' }}>
                  <Kicker>Revenue model</Kicker>
                  <div style={{ marginTop: 16, fontSize: 38, fontWeight: 760, letterSpacing: '-0.04em', lineHeight: 1 }}>Marketplace</div>
                  <div style={{ marginTop: 12, color: RED, fontFamily: MONO, fontSize: 24, whiteSpace: 'nowrap' }}>12% per booking</div>
                  <Bullet red style={{ marginTop: 20, fontSize: 17 }}>Studios keep their own pricing</Bullet>
                </div>
              </Reveal>

              <Reveal delay={18}>
                <div style={{ border: `1px solid ${BORDER}`, background: CELL, padding: '30px 32px' }}>
                  <Kicker>Where your first users are</Kicker>
                  <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {CHANNELS.map((channel) => (
                      <div key={channel} style={{ border: `1px solid ${BORDER}`, background: BG, display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', color: WHITE_SOFT, fontFamily: MONO, fontSize: 14, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        <span style={{ width: 7, height: 7, flexShrink: 0, background: RED }} />{channel}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
};

const SceneExecution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = useSceneOpacity(SCENE_8);
  const typedCount = Math.round(
    interpolate(frame, [14, 92], [0, PROMPT_TEXT.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const typed = PROMPT_TEXT.slice(0, typedCount);
  const cursorVisible = Math.floor(frame / (fps * 0.35)) % 2 === 0;
  const buttonGlow = spring({ frame: frame - 56, fps, config: { damping: 200 }, durationInFrames: 28 });

  return (
    <SceneShell>
      <div style={{ position: 'absolute', inset: 0, padding: '72px 72px', boxSizing: 'border-box', opacity, display: 'flex', flexDirection: 'column' }}>
        <PhaseRail no="03" label="Execute" />

        <div style={{ minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          <Reveal delay={6}>
            <div style={{ border: `1px solid ${BORDER}`, background: CELL }}>
              <div style={{ height: 66, boxSizing: 'border-box', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '0 28px' }}>
                <Kicker>Build prompt <span style={{ color: RED }}>Step 01/03</span></Kicker>
                <TinyButton>⌾ Copy prompt</TinyButton>
              </div>
              <div style={{ padding: '28px 32px' }}>
                <div style={{ height: 120, overflow: 'hidden', color: SOFT, fontFamily: MONO, fontSize: 17, lineHeight: 1.72 }}>
                  <span style={{ color: RED }}>&gt;</span> {typed}
                  <span style={{ display: 'inline-block', width: 9, height: 18, marginLeft: 6, transform: 'translateY(3px)', background: RED, opacity: cursorVisible ? 1 : 0 }} />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={16}>
            <div style={{ border: `1px solid ${BORDER}`, background: CELL }}>
              <div style={{ height: 66, boxSizing: 'border-box', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '0 28px' }}>
                <Kicker>Founder assets</Kicker>
                <div style={{ transform: `scale(${1 + buttonGlow * 0.02})`, boxShadow: `0 0 ${buttonGlow * 30}px rgba(255,31,31,0.28)` }}>
                  <TinyButton accent>✣ Generate</TinyButton>
                </div>
              </div>
              <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {FOUNDER_ASSETS.map((asset) => (
                  <Reveal key={asset.label} delay={asset.delay} distance={8}>
                    <div style={{ height: 72, boxSizing: 'border-box', border: `1px solid ${BORDER}`, background: BG, display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px' }}>
                      <span style={{ flexShrink: 0, color: RED, fontFamily: MONO, fontSize: 16 }}>✓</span>
                      <span style={{ color: WHITE_SOFT, fontFamily: MONO, fontSize: 16, whiteSpace: 'nowrap' }}>{asset.label}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </SceneShell>
  );
};

export const LaunchpadPreview: React.FC = () => {
  const loopFade = useLoopFade(DURATION_IN_FRAMES);

  return (
    <AbsoluteFill style={{ opacity: loopFade, backgroundColor: BG }}>
      <Series>
        <Series.Sequence durationInFrames={SCENE_1} premountFor={FPS}>
          <SceneTyping />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_2} premountFor={FPS}>
          <SceneLaunch />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_3} premountFor={FPS}>
          <SceneAnalysis />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_4} premountFor={FPS}>
          <SceneVerdict />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_5} premountFor={FPS}>
          <SceneCouncil />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_6} premountFor={FPS}>
          <SceneMarket />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_7} premountFor={FPS}>
          <SceneStrategy />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_8} premountFor={FPS}>
          <SceneExecution />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
