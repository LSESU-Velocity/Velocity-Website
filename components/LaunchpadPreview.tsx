import React from 'react';
import {
  AbsoluteFill,
  Series,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

const VELOCITY_RED = '#FF1F1F';
const BG = '#0A0A0A';

export const FPS = 30;
export const PREVIEW_WIDTH = 1280;
export const PREVIEW_HEIGHT = 720;

const SCENE_1 = 4 * FPS; // typing
const SCENE_2 = 1 * FPS; // launch
const SCENE_3 = 5 * FPS; // analysis
const SCENE_4 = 5 * FPS; // phase 1
const SCENE_5 = 5 * FPS; // phase 2
const SCENE_6 = 5 * FPS; // phase 3

export const DURATION_IN_FRAMES =
  SCENE_1 + SCENE_2 + SCENE_3 + SCENE_4 + SCENE_5 + SCENE_6;

const IDEA_TEXT = 'AI meal planner for busy parents';

type StepMeta = { label: string };

const STEPS: StepMeta[] = [
  { label: 'Classifying idea' },
  { label: 'Bull analyst evaluating' },
  { label: 'Bear analyst stress-testing' },
  { label: 'Council judge deciding' },
  { label: 'Synthesizing findings' },
];

const useCrossfadeLoop = (totalFrames: number) => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, 15, totalFrames - 20, totalFrames - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
};

const SceneShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      backgroundColor: BG,
      fontFamily: "'Google Sans', system-ui, sans-serif",
      color: 'white',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        width: '90%',
        height: '60%',
        transform: 'translateX(-50%)',
        background:
          'radial-gradient(ellipse at center, rgba(255,31,31,0.18) 0%, rgba(255,31,31,0) 65%)',
        filter: 'blur(40px)',
      }}
    />
    {children}
  </AbsoluteFill>
);

const SceneTyping: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const barShift = interpolate(frame, [0, 18], [30, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const typeStart = 18;
  const typeEnd = 100;
  const typedCount = Math.max(
    0,
    Math.round(
      interpolate(frame, [typeStart, typeEnd], [0, IDEA_TEXT.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    ),
  );
  const typed = IDEA_TEXT.slice(0, typedCount);
  const showCursor = Math.floor(frame / (fps * 0.35)) % 2 === 0;

  const launchPulse =
    spring({
      frame: frame - 100,
      fps,
      config: { damping: 10, stiffness: 170 },
    }) * 0.1;

  return (
    <SceneShell>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            opacity: barOpacity,
            transform: `translateY(${barShift}px)`,
            width: 900,
            padding: 2,
            borderRadius: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 14px 14px 28px',
              borderRadius: 0,
              background: 'rgba(18,18,18,0.9)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                fontSize: 26,
                fontWeight: 500,
                color: 'white',
                height: 44,
              }}
            >
              <span>{typed}</span>
              <span
                style={{
                  display: 'inline-block',
                  marginLeft: 3,
                  width: 2,
                  height: 28,
                  background: VELOCITY_RED,
                  opacity: showCursor ? 1 : 0,
                }}
              />
              {typedCount === 0 && (
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Describe your startup idea...
                </span>
              )}
            </div>

            <div
              style={{
                padding: '14px 34px',
                borderRadius: 0,
                background: VELOCITY_RED,
                color: 'white',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transform: `scale(${1 + launchPulse})`,
                boxShadow: `0 0 36px rgba(255,31,31,${0.35 + launchPulse * 2})`,
              }}
            >
              Launch
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
};

const SceneLaunch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ripple = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  });
  const rippleScale = interpolate(ripple, [0, 1], [0.4, 9]);
  const rippleOpacity = interpolate(ripple, [0, 0.2, 1], [0, 0.5, 0]);

  const contentOpacity = interpolate(frame, [6, 22], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneShell>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 120,
            height: 120,
            borderRadius: 0,
            border: `2px solid ${VELOCITY_RED}`,
            transform: `scale(${rippleScale})`,
            opacity: rippleOpacity,
          }}
        />

        <div
          style={{
            opacity: contentOpacity,
            width: 900,
            padding: 2,
            borderRadius: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 14px 14px 28px',
              borderRadius: 0,
              background: 'rgba(18,18,18,0.9)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: 26,
                fontWeight: 500,
                color: 'white',
              }}
            >
              {IDEA_TEXT}
            </div>
            <div
              style={{
                padding: '14px 34px',
                borderRadius: 0,
                background: VELOCITY_RED,
                color: 'white',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              Launch
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
};

const StepIcon: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200 },
    durationInFrames: 20,
  });
  const scale = interpolate(pop, [0, 1], [0.6, 1]);
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 0,
        background: 'rgba(255,31,31,0.14)',
        border: `1px solid ${VELOCITY_RED}55`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 800,
        letterSpacing: '0.1em',
        color: VELOCITY_RED,
        transform: `scale(${scale})`,
      }}
    >
      {String(index + 1).padStart(2, '0')}
    </div>
  );
};

const AnimatedStepLabel: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [0, 14], [10, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <span
      style={{
        fontSize: 26,
        fontWeight: 600,
        color: 'white',
        opacity,
        transform: `translateY(${y}px)`,
        minWidth: 360,
        textAlign: 'left',
      }}
    >
      {STEPS[index].label}
    </span>
  );
};

const SceneAnalysis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalFrames = SCENE_3;
  const stepFrames = Math.floor(totalFrames / STEPS.length);
  const activeStepIndex = Math.min(
    STEPS.length - 1,
    Math.floor(frame / stepFrames),
  );
  const completedCount = activeStepIndex;

  const enter = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 18,
  });
  const exit = interpolate(frame, [totalFrames - 14, totalFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(enter, exit);

  const progressPct = interpolate(
    frame,
    [0, totalFrames - 8],
    [0, 99],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <SceneShell>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
          gap: 36,
        }}
      >
        <div
          style={{
            fontSize: 14,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          Running multi-agent analysis
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '18px 32px',
            borderRadius: 0,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            minWidth: 560,
            justifyContent: 'center',
          }}
          key={activeStepIndex}
        >
          <StepIcon index={activeStepIndex} />
          <AnimatedStepLabel index={activeStepIndex} />
          <span
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: 2,
            }}
          >
            ...
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {STEPS.map((_, i) => {
            const isDone = i < completedCount;
            const isActive = i === activeStepIndex;
            return (
              <div
                key={i}
                style={{
                  width: isActive ? 14 : 10,
                  height: isActive ? 14 : 10,
                  borderRadius: 0,
                  background:
                    isDone || isActive ? VELOCITY_RED : 'rgba(255,255,255,0.1)',
                  boxShadow: isActive ? `0 0 16px ${VELOCITY_RED}` : 'none',
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            position: 'relative',
            width: 420,
            height: 4,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            borderRadius: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: `${progressPct}%`,
              background: VELOCITY_RED,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 60,
              left: `calc(${progressPct}% - 60px)`,
              background:
                'radial-gradient(ellipse at right, rgba(255,31,31,0.9) 0%, rgba(255,31,31,0) 70%)',
              filter: 'blur(6px)',
            }}
          />
        </div>

        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {completedCount}/{STEPS.length} agents done
        </div>
      </div>
    </SceneShell>
  );
};

type ResultCardProps = {
  delay: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const ResultCard: React.FC<ResultCardProps> = ({ delay, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 140 },
    durationInFrames: 24,
  });
  const scale = interpolate(appear, [0, 1], [0.94, 1]);
  const opacity = interpolate(appear, [0, 1], [0, 1]);
  const y = interpolate(appear, [0, 1], [14, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        borderRadius: 0,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const MiniLabel: React.FC<{
  children: React.ReactNode;
  color?: string;
}> = ({ children, color = 'rgba(255,255,255,0.35)' }) => (
  <div
    style={{
      fontSize: 10,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color,
      marginBottom: 10,
    }}
  >
    {children}
  </div>
);

const PhaseBanner: React.FC<{ label: string; accent?: string }> = ({
  label,
  accent = VELOCITY_RED,
}) => {
  const frame = useCurrentFrame();
  const lineGrow = interpolate(frame, [0, 22], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <div
        style={{
          height: 1,
          flex: 1,
          background:
            'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 100%)',
          transform: `scaleX(${lineGrow})`,
          transformOrigin: 'right',
        }}
      />
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 0,
            background: accent,
            boxShadow: `0 0 10px ${accent}`,
          }}
        />
        {label}
      </div>
      <div
        style={{
          height: 1,
          flex: 1,
          background:
            'linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 100%)',
          transform: `scaleX(${lineGrow})`,
          transformOrigin: 'left',
        }}
      />
    </div>
  );
};

const ScenePhase1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });

  const exit = interpolate(frame, [SCENE_4 - 18, SCENE_4 - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const confidenceScore = Math.round(
    interpolate(frame, [10, 55], [0, 82], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  const opacity = Math.min(enter, exit);

  const tamRatios = [1, 0.42, 0.14];
  const tamLabels = ['TAM', 'SAM', 'SOM'];
  const tamValues = ['14.8M', '6.2M', '210K'];

  return (
    <SceneShell>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '60px 70px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          opacity,
        }}
      >
        <PhaseBanner label="Phase 1: Validation" />

        <ResultCard delay={2} style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 26 }}>
            <div>
              <MiniLabel>Identity</MiniLabel>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                }}
              >
                PantryPilot
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Weeknight dinners, planned for you.
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <MiniLabel>Confidence</MiniLabel>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                  fontSize: 44,
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  justifyContent: 'flex-end',
                }}
              >
                {confidenceScore}
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  /100
                </span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                Worth building
              </div>
            </div>
          </div>
        </ResultCard>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.15fr',
            gap: 16,
            flex: 1,
          }}
        >
          <ResultCard delay={14}>
            <MiniLabel>Market sizing</MiniLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tamRatios.map((ratio, i) => (
                <MarketBar
                  key={tamLabels[i]}
                  label={tamLabels[i]}
                  value={tamValues[i]}
                  ratio={ratio}
                  index={i}
                  accent={
                    i === 0 ? '#ffffff' : i === 1 ? '#71717A' : VELOCITY_RED
                  }
                />
              ))}
            </div>
          </ResultCard>

          <ResultCard delay={20}>
            <MiniLabel>Analyst Council</MiniLabel>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              <div
                style={{
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 0,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                    marginBottom: 6,
                  }}
                >
                  Bull
                </div>
                <BulletList
                  items={[
                    'Clear weeknight-time pain',
                    'Recipes beat grocery delivery on value',
                  ]}
                  dot="#FFFFFF"
                />
              </div>
              <div
                style={{
                  border: '1px solid rgba(255,31,31,0.30)',
                  background: 'rgba(255,31,31,0.07)',
                  borderRadius: 0,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#FF1F1F',
                    marginBottom: 6,
                  }}
                >
                  Bear
                </div>
                <BulletList
                  items={[
                    'Recipe fatigue after 6 weeks',
                    'Grocery API coverage is thin',
                  ]}
                  dot="#FF1F1F"
                />
              </div>
            </div>
            <div
              style={{
                marginTop: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 0,
                padding: 12,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.45)',
                  marginBottom: 6,
                }}
              >
                Judge
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'rgba(255,255,255,0.88)',
                }}
              >
                Ship with one cuisine and tight grocery integration before
                broadening.
              </div>
            </div>
          </ResultCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ResultCard delay={34}>
            <MiniLabel>Open risk</MiniLabel>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              Recipe consistency across cuisines needs strong LLM grounding.
            </div>
          </ResultCard>
          <ResultCard delay={40}>
            <MiniLabel>Next move</MiniLabel>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              Ship a 10-family beta with weekly plans + grocery export.
            </div>
          </ResultCard>
        </div>
      </div>
    </SceneShell>
  );
};

const MarketBar: React.FC<{
  label: string;
  value: string;
  ratio: number;
  index: number;
  accent: string;
}> = ({ label, value, ratio, index, accent }) => {
  const frame = useCurrentFrame();
  const width = interpolate(
    frame,
    [20 + index * 6, 60 + index * 6],
    [0, ratio * 100],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
          {value}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 0,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.max(width, 6)}%`,
            height: '100%',
            background: accent,
            borderRadius: 0,
            boxShadow: `0 0 14px ${accent}66`,
          }}
        />
      </div>
    </div>
  );
};

const BulletList: React.FC<{ items: string[]; dot: string }> = ({
  items,
  dot,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {items.map((t) => (
      <div
        key={t}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          fontSize: 12,
          color: 'rgba(255,255,255,0.86)',
          lineHeight: 1.4,
        }}
      >
        <span
          style={{
            marginTop: 6,
            width: 5,
            height: 5,
            borderRadius: 0,
            background: dot,
            flexShrink: 0,
          }}
        />
        {t}
      </div>
    ))}
  </div>
);

const ScenePhase2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const exit = interpolate(frame, [SCENE_5 - 18, SCENE_5 - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(enter, exit);

  const segments = [
    {
      name: 'Time-starved working parents',
      age: '28–42',
      target: 'Weeknight dinner for two kids',
      income: '$90K–$160K',
    },
    {
      name: 'Dietary-need families',
      age: '30–48',
      target: 'Gluten-free, dairy-free recipes',
      income: '$70K–$140K',
    },
    {
      name: 'Meal-prep households',
      age: '25–38',
      target: 'Batch-cook 4 meals in 90 min',
      income: '$60K–$120K',
    },
  ];

  const channels = [
    { name: 'TikTok cooking creators', type: 'Influencer', metric: '+42K' },
    { name: 'r/MealPrepSunday', type: 'Community', metric: '2.1M' },
    { name: 'Parenting newsletters', type: 'Partnership', metric: '380K' },
    { name: 'App Store organic', type: 'Search', metric: 'SEO' },
    { name: 'Pinterest recipe pins', type: 'Content', metric: '95M mo' },
  ];

  return (
    <SceneShell>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '60px 70px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          opacity,
        }}
      >
        <PhaseBanner label="Phase 2: Strategy" accent="#FFFFFF" />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 1.1fr 1fr',
            gap: 16,
            flex: 1,
          }}
        >
          <ResultCard delay={2}>
            <MiniLabel color="#A1A1AA">Customer segments</MiniLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {segments.map((s, i) => (
                <SegmentRow key={s.name} seg={s} delay={8 + i * 6} />
              ))}
            </div>
          </ResultCard>

          <ResultCard delay={14}>
            <MiniLabel color="#A1A1AA">Monetization strategy</MiniLabel>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Model
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                marginTop: 4,
              }}
            >
              Freemium subscription
            </div>
            <div
              style={{
                fontSize: 15,
                color: VELOCITY_RED,
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              $7.99 / mo · $59 / yr
            </div>
            <div
              style={{
                marginTop: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 0,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {[
                'Free: 3 AI plans per week',
                'Pro: unlimited plans + grocery export',
                'Family: shared profiles & pantry sync',
              ].map((s) => (
                <div
                  key={s}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.88)',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 0,
                      background: VELOCITY_RED,
                      flexShrink: 0,
                    }}
                  />
                  {s}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#A1A1AA',
              }}
            >
              Who does this well
            </div>
            <div
              style={{
                borderLeft: '2px solid rgba(255,255,255,0.08)',
                paddingLeft: 10,
                marginTop: 6,
                fontStyle: 'italic',
                fontSize: 13,
                color: 'rgba(255,255,255,0.72)',
                lineHeight: 1.4,
              }}
            >
              HelloFresh, Mealime, Paprika
            </div>
          </ResultCard>

          <ResultCard delay={26}>
            <MiniLabel color="#A1A1AA">Distribution channels</MiniLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {channels.map((c, i) => (
                <ChannelRow key={c.name} channel={c} delay={30 + i * 6} />
              ))}
            </div>
          </ResultCard>
        </div>
      </div>
    </SceneShell>
  );
};

const SegmentRow: React.FC<{
  seg: { name: string; age: string; target: string; income: string };
  delay: number;
}> = ({ seg, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 18,
  });
  const x = interpolate(appear, [0, 1], [-10, 0]);
  const opacity = interpolate(appear, [0, 1], [0, 1]);
  return (
    <div
      style={{
        borderRadius: 0,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        padding: 12,
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, maxWidth: '75%' }}>
          {seg.name}
        </div>
        <div
          style={{
            borderRadius: 0,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            padding: '3px 8px',
            fontSize: 9,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          {seg.age}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ color: VELOCITY_RED }}>Target:</span>
          <span style={{ color: 'rgba(255,255,255,0.85)' }}>{seg.target}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 12 }}>
        <span style={{ color: '#71717A' }}>Income:</span>
        <span style={{ color: 'rgba(255,255,255,0.85)' }}>{seg.income}</span>
      </div>
    </div>
  );
};

const ChannelRow: React.FC<{
  channel: { name: string; type: string; metric: string };
  delay: number;
}> = ({ channel, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 18,
  });
  const x = interpolate(appear, [0, 1], [14, 0]);
  const opacity = interpolate(appear, [0, 1], [0, 1]);
  return (
    <div
      style={{
        borderRadius: 0,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 0,
            background: VELOCITY_RED,
            boxShadow: `0 0 12px ${VELOCITY_RED}88`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {channel.name}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span
          style={{
            borderRadius: 0,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            padding: '2px 8px',
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          {channel.type}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: VELOCITY_RED,
          }}
        >
          {channel.metric}
        </span>
      </div>
    </div>
  );
};

const ScenePhase3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const exit = interpolate(frame, [SCENE_6 - 18, SCENE_6 - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(enter, exit);

  const waitlistCount = Math.round(
    interpolate(frame, [30, 110], [0, 412], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  return (
    <SceneShell>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '60px 70px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          opacity,
        }}
      >
        <PhaseBanner label="Phase 3: Execution" accent="#FFFFFF" />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr',
            gap: 16,
            flex: 1,
          }}
        >
          <ResultCard delay={2} style={{ padding: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <MiniLabel color="#A1A1AA">Waitlist page</MiniLabel>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 0,
                    background: '#FF1F1F',
                    boxShadow: '0 0 8px #FF1F1F',
                  }}
                />
                Live preview
              </div>
            </div>

            <div
              style={{
                borderRadius: 0,
                border: '1px solid rgba(255,255,255,0.08)',
                background:
                  'radial-gradient(ellipse at top, rgba(255,31,31,0.10) 0%, rgba(255,31,31,0) 60%), rgba(10,10,10,0.7)',
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                flex: 1,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px',
                  borderRadius: 0,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.04)',
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#A1A1AA',
                  width: 'fit-content',
                }}
              >
                Coming soon
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.05,
                }}
              >
                Dinner, sorted.
                <br />
                <span style={{ color: VELOCITY_RED }}>Without the thinking.</span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.6)',
                  maxWidth: 420,
                }}
              >
                Weekly meal plans tailored to your family's tastes, pantry, and
                schedule. Grocery list exported in one tap.
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 6,
                  padding: 4,
                  borderRadius: 0,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  maxWidth: 420,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    padding: '8px 14px',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  you@email.com
                </div>
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: 0,
                    background: VELOCITY_RED,
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  Join
                </div>
              </div>
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 0,
                    background: '#FF1F1F',
                    boxShadow: '0 0 10px #FF1F1F',
                  }}
                />
                <span style={{ color: 'white', fontWeight: 700 }}>
                  {waitlistCount}
                </span>
                families on the waitlist
              </div>
            </div>
          </ResultCard>

          <ResultCard delay={14} style={{ padding: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <MiniLabel color="#A1A1AA">Pitch deck</MiniLabel>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                12 slides · auto-drafted
              </div>
            </div>
            <SlideStack />
          </ResultCard>
        </div>

        <ResultCard delay={34}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 4,
            }}
          >
            <div
              style={{
                width: 6,
                height: 36,
                borderRadius: 0,
                background: VELOCITY_RED,
                boxShadow: `0 0 14px ${VELOCITY_RED}88`,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                Tune any widget with a prompt
              </div>
              <div
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
              >
                &ldquo;Add a family plan at $12/mo&rdquo;: only the monetization
                card updates.
              </div>
            </div>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: 0,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Send
            </div>
          </div>
        </ResultCard>
      </div>
    </SceneShell>
  );
};

const SLIDE_TITLES = [
  { kicker: '01 · Problem', title: '4.3 hours a week gone to "what\'s for dinner?"' },
  { kicker: '02 · Solution', title: 'AI plans the week around your pantry + tastes.' },
  { kicker: '03 · Market', title: '14.8M US families · $3.1B serviceable.' },
  { kicker: '04 · Traction', title: '412 waitlist signups in 2 weeks, $0 spend.' },
];

const SlideStack: React.FC = () => {
  const frame = useCurrentFrame();
  const slideDurationFrames = 30;
  const activeIndex =
    Math.floor(frame / slideDurationFrames) % SLIDE_TITLES.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 0,
          border: '1px solid rgba(255,255,255,0.08)',
          background:
            'radial-gradient(ellipse at bottom right, rgba(255,31,31,0.12) 0%, rgba(255,31,31,0) 60%), rgba(10,10,10,0.7)',
          padding: 24,
          minHeight: 210,
          overflow: 'hidden',
        }}
      >
        {SLIDE_TITLES.map((s, i) => (
          <SlideContent
            key={s.kicker}
            slide={s}
            index={i}
            activeIndex={activeIndex}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 24,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            PantryPilot · Series Seed
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {SLIDE_TITLES.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === activeIndex ? 18 : 6,
                  height: 3,
                  borderRadius: 0,
                  background:
                    i === activeIndex
                      ? VELOCITY_RED
                      : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SlideContent: React.FC<{
  slide: { kicker: string; title: string };
  index: number;
  activeIndex: number;
}> = ({ slide, index, activeIndex }) => {
  const isActive = index === activeIndex;
  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        justifyContent: 'center',
        animation: 'none',
      }}
    >
      <SlideReveal>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: VELOCITY_RED,
          }}
        >
          {slide.kicker}
        </div>
      </SlideReveal>
      <SlideReveal delay={4}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            maxWidth: 440,
          }}
        >
          {slide.title}
        </div>
      </SlideReveal>
    </div>
  );
};

const SlideReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const localFrame = frame % 30;
  const opacity = interpolate(
    localFrame,
    [delay, delay + 10],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const y = interpolate(
    localFrame,
    [delay, delay + 14],
    [8, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  );
  return (
    <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>
  );
};

export const LaunchpadPreview: React.FC = () => {
  const loopFade = useCrossfadeLoop(DURATION_IN_FRAMES);

  return (
    <AbsoluteFill style={{ opacity: loopFade, backgroundColor: BG }}>
      <Series>
        <Series.Sequence durationInFrames={SCENE_1}>
          <SceneTyping />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_2}>
          <SceneLaunch />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_3}>
          <SceneAnalysis />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_4}>
          <ScenePhase1 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_5}>
          <ScenePhase2 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENE_6}>
          <ScenePhase3 />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
