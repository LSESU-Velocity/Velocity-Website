/**
 * The decorative Remotion demo loop shown above the fold on /launchpad.
 * Default-exported and loaded via React.lazy so the Remotion player (a large
 * dependency) stays out of the route's initial chunk.
 */
import React, { useEffect, useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { Player, type PlayerRef } from '@remotion/player';
import {
  LaunchpadPreview,
  DURATION_IN_FRAMES as PREVIEW_DURATION,
  FPS as PREVIEW_FPS,
  PREVIEW_WIDTH,
  PREVIEW_HEIGHT,
} from '../LaunchpadPreview';

export const PREVIEW_ASPECT_RATIO = `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}`;

const PreviewPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const inView = useInView(containerRef, { margin: '120px 0px' });
  const prefersReducedMotion = useReducedMotion();
  const still = Boolean(prefersReducedMotion);

  // Playback costs a raf loop per frame: park it whenever the demo is
  // offscreen, and hold the first frame entirely under reduced motion.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (still) {
        player.pause();
        player.seekTo(0);
        return;
      }

      if (inView) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // The player rejects play/pause before it is mounted and ready; the
      // next inView change re-runs this effect.
    }
  }, [inView, still]);

  return (
    <div ref={containerRef}>
      <Player
        ref={playerRef}
        component={LaunchpadPreview}
        durationInFrames={PREVIEW_DURATION}
        compositionWidth={PREVIEW_WIDTH}
        compositionHeight={PREVIEW_HEIGHT}
        fps={PREVIEW_FPS}
        loop
        autoPlay={!still}
        controls={false}
        clickToPlay={false}
        style={{
          width: '100%',
          aspectRatio: PREVIEW_ASPECT_RATIO,
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

export default PreviewPlayer;
