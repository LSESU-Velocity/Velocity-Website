import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';

const TOTAL_FRAMES = 210;
const IMAGE_PATH = '/webp-sequence/frame-';

// Minimum time the ignition overture stays up so cached loads don't strobe
const MIN_OVERTURE_MS = 700;

// Fixed scroll distance in pixels - ensures consistent experience across all devices
// This is the actual scrollable distance beyond the first viewport
export const SCROLL_DISTANCE = 3000;

// Phase breakpoints in pixels (from start of scroll)
// Shifting everything earlier to guarantee massive buffer at the end
const PHASE_PIXELS = {
    introEnd: 200,           // Quick intro
    futureStart: 300,        // "AI-Native Founders" starts later
    futureEnd: 800,          // Ends at 800px
    speedStart: 700,         // "From Idea to Prototype" starts
    speedEnd: 1200,          // Ends at 1200px
    animationEnd: 1150,      // Frame animation completes at 1150px
    ctaStart: 1100,          // CTA starts appearing
    ctaFull: 1350,           // CTA fully visible by 1350px
    // Remaining 1650px (from 1350 to 3000) is pure visibility buffer
};

// Blueprint "V" drawn during loading — foreshadows the V the cheetah assembles into.
// Vertex order matches the path direction so the nodes ignite along the stroke.
const V_PATH = 'M28 40 L74 40 L100 116 L126 40 L172 40 L118 164 L82 164 Z';
const V_VERTICES: Array<[number, number]> = [
    [28, 40], [74, 40], [100, 116], [126, 40], [172, 40], [118, 164], [82, 164],
];

const WORDMARK = 'VELOCITY';

export const ChipScroll: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const frameRef = useRef(0);
    const sizeRef = useRef({ width: 0, height: 0 });

    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(0);
    // ready flips once frames are loaded: the overture dims into the resting hero
    const [ready, setReady] = useState(false);

    const prefersReducedMotion = useReducedMotion();

    // Constant helper to convert pixels to scroll progress (0-1)
    const toProgress = (px: number) => Math.min(px / SCROLL_DISTANCE, 1);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    // Spring-smoothed progress so frame scrubbing and text glide instead of stepping
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 28,
        mass: 0.4,
        restDelta: 0.0001,
    });
    const progress = prefersReducedMotion ? scrollYProgress : smoothProgress;

    // Helper function for linear interpolation between keyframes
    const interpolate = (value: number, inputRange: number[], outputRange: number[]) => {
        if (value <= inputRange[0]) return outputRange[0];
        if (value >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];

        for (let i = 0; i < inputRange.length - 1; i++) {
            if (value >= inputRange[i] && value <= inputRange[i + 1]) {
                const segmentProgress = (value - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
                return outputRange[i] + segmentProgress * (outputRange[i + 1] - outputRange[i]);
            }
        }
        return outputRange[outputRange.length - 1];
    };

    // Transform scroll progress to frame index
    // Animation completes early so last frame holds during the buffer
    const frameIndex = useTransform(progress, (value) => {
        const endProgress = toProgress(PHASE_PIXELS.animationEnd);
        const normalizedProgress = Math.min(value / endProgress, 1);
        return normalizedProgress * (TOTAL_FRAMES - 1);
    });

    // Slow cinematic push-in on the sequence while the cheetah assembles
    const canvasScale = useTransform(progress, (value) => {
        if (prefersReducedMotion) return 1;
        return interpolate(value, [0, toProgress(PHASE_PIXELS.animationEnd)], [1, 1.045]);
    });

    // Hero overture layer: holds 100% during load, rests at 26%, dissolves on scroll
    const heroOpacity = useTransform(progress, (value) => {
        return interpolate(value, [0, toProgress(60), toProgress(PHASE_PIXELS.futureStart)], [1, 1, 0]);
    });

    const heroScale = useTransform(progress, (value) => {
        return interpolate(value, [0, toProgress(PHASE_PIXELS.futureStart)], [1, 1.035]);
    });

    const introOpacity = useTransform(progress, (value) => {
        return interpolate(value, [0, 0.02, toProgress(PHASE_PIXELS.introEnd)], [1, 1, 0]);
    });

    const futureRange = [
        toProgress(PHASE_PIXELS.futureStart),
        toProgress(PHASE_PIXELS.futureStart + 100),
        toProgress(PHASE_PIXELS.futureEnd - 100),
        toProgress(PHASE_PIXELS.futureEnd),
    ];
    const futureOpacity = useTransform(progress, (value) => interpolate(value, futureRange, [0, 1, 1, 0]));
    const futureY = useTransform(progress, (value) => interpolate(value, futureRange, [36, 0, 0, -28]));

    const speedRange = [
        toProgress(PHASE_PIXELS.speedStart),
        toProgress(PHASE_PIXELS.speedStart + 100),
        toProgress(PHASE_PIXELS.speedEnd - 150),
        toProgress(PHASE_PIXELS.speedEnd),
    ];
    const speedOpacity = useTransform(progress, (value) => interpolate(value, speedRange, [0, 1, 1, 0]));
    const speedY = useTransform(progress, (value) => interpolate(value, speedRange, [36, 0, 0, -28]));

    const ctaBackdropOpacity = useTransform(progress, (value) => {
        return interpolate(
            value,
            [0, toProgress(PHASE_PIXELS.ctaStart), toProgress(PHASE_PIXELS.ctaFull), 1],
            [0, 0, 1, 1]
        );
    });

    // Staggered CTA entrance: heading, copy, then buttons
    const ctaReveal = (offset: number) => [
        toProgress(PHASE_PIXELS.ctaStart + offset),
        toProgress(PHASE_PIXELS.ctaFull + offset),
    ];
    const ctaGlowOpacity = useTransform(progress, (value) => interpolate(value, ctaReveal(0), [0, 1]));
    const ctaHeadingOpacity = useTransform(progress, (value) => interpolate(value, ctaReveal(0), [0, 1]));
    const ctaHeadingY = useTransform(progress, (value) => interpolate(value, ctaReveal(0), [30, 0]));
    const ctaCopyOpacity = useTransform(progress, (value) => interpolate(value, ctaReveal(90), [0, 1]));
    const ctaCopyY = useTransform(progress, (value) => interpolate(value, ctaReveal(90), [26, 0]));
    const ctaButtonsOpacity = useTransform(progress, (value) => interpolate(value, ctaReveal(180), [0, 1]));
    const ctaButtonsY = useTransform(progress, (value) => interpolate(value, ctaReveal(180), [22, 0]));
    // Keep invisible CTA buttons from intercepting clicks before they appear
    const ctaPointerEvents = useTransform(progress, (value) =>
        value >= toProgress(PHASE_PIXELS.ctaStart) ? ('auto' as const) : ('none' as const)
    );

    const railOpacity = useTransform(progress, (value) => {
        return interpolate(
            value,
            [toProgress(140), toProgress(340), toProgress(PHASE_PIXELS.ctaStart), toProgress(PHASE_PIXELS.ctaFull)],
            [0, 1, 1, 0]
        );
    });

    // Ambient constellation specks during loading — deterministic pseudo-random layout
    const particles = useMemo(() => {
        return Array.from({ length: 26 }, (_, i) => {
            const rand = (seed: number) => {
                const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
                return x - Math.floor(x);
            };
            return {
                left: `${4 + rand(1) * 92}%`,
                top: `${6 + rand(2) * 82}%`,
                size: 1.5 + rand(3) * 1.8,
                dx: `${Math.round((rand(4) - 0.5) * 44)}px`,
                dy: `${Math.round(-10 - rand(5) * 30)}px`,
                driftDuration: `${(7 + rand(6) * 7).toFixed(1)}s`,
                twinkleDuration: `${(2.4 + rand(7) * 3.2).toFixed(1)}s`,
                delay: `${(rand(8) * 4).toFixed(1)}s`,
            };
        });
    }, []);

    // Load images on mount; tolerate individual failures by reusing the nearest frame
    useEffect(() => {
        let cancelled = false;
        const startedAt = performance.now();

        const load = async () => {
            let settledCount = 0;
            const promises = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
                return new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.decoding = 'async';
                    const frameNumber = String(i + 1).padStart(3, '0');
                    img.src = `${IMAGE_PATH}${frameNumber}.webp`;
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error(`Failed to load frame ${frameNumber}`));
                }).finally(() => {
                    settledCount++;
                    if (!cancelled) {
                        setLoadingProgress(Math.round((settledCount / TOTAL_FRAMES) * 100));
                    }
                });
            });

            const results = await Promise.allSettled(promises);
            if (cancelled) return;

            const loaded = results.map((result) => (result.status === 'fulfilled' ? result.value : null));
            const firstLoaded = loaded.find((img): img is HTMLImageElement => img !== null);

            if (!firstLoaded) {
                console.error('Failed to load scroll sequence frames');
                setReady(true); // fail open: reveal the page rather than trapping the user
                return;
            }

            // Patch any gaps with the nearest earlier frame so scrubbing never hits a hole
            let previous = firstLoaded;
            setImages(loaded.map((img) => (img ? (previous = img) : previous)));

            const remaining = Math.max(0, MIN_OVERTURE_MS - (performance.now() - startedAt));
            window.setTimeout(() => {
                if (!cancelled) setReady(true);
            }, remaining);
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    // Lock scrolling until the sequence is ready so the journey always starts at the top
    useEffect(() => {
        if (ready) return;
        const root = document.documentElement;
        const previousOverflow = root.style.overflow;
        root.style.overflow = 'hidden';
        return () => {
            root.style.overflow = previousOverflow;
        };
    }, [ready]);

    // Draw the current frame letterboxed into the cached canvas size
    const drawFrame = useCallback((index: number) => {
        const ctx = ctxRef.current;
        const frames = imagesRef.current;
        if (!ctx || frames.length === 0) return;

        const img = frames[Math.min(Math.max(index, 0), frames.length - 1)];
        const { width, height } = sizeRef.current;
        if (!img || !width || !height) return;

        const aspectRatio = img.width / img.height;
        let drawWidth, drawHeight;

        // Contain: fit image within container
        if (width / height > aspectRatio) {
            drawHeight = height;
            drawWidth = drawHeight * aspectRatio;
        } else {
            drawWidth = width;
            drawHeight = drawWidth / aspectRatio;
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    }, []);

    // Size the canvas for HiDPI displays; only runs on mount/resize, not per frame
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        if (!canvas || !parent) return;

        const dpr = window.devicePixelRatio || 1;
        const width = parent.clientWidth;
        const height = parent.clientHeight;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctxRef.current = ctx;
        sizeRef.current = { width, height };
        drawFrame(frameRef.current);
    }, [drawFrame]);

    // Draw frames as scroll progress changes
    useEffect(() => {
        if (images.length === 0) return;

        imagesRef.current = images;
        frameRef.current = Math.min(Math.round(frameIndex.get()), TOTAL_FRAMES - 1);
        resizeCanvas();

        const unsubscribe = frameIndex.on('change', (latest) => {
            const index = Math.min(Math.round(latest), TOTAL_FRAMES - 1);
            if (index !== frameRef.current) {
                frameRef.current = index;
                drawFrame(index);
            }
        });

        return () => unsubscribe();
    }, [images, frameIndex, drawFrame, resizeCanvas]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => resizeCanvas();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [resizeCanvas]);

    return (
        <div
            ref={containerRef}
            className="relative bg-black z-20"
            style={{ height: 'calc(100vh + 3000px)' }}
        >
            {/* Sticky canvas container */}
            <div
                className="sticky top-0 h-screen w-full overflow-hidden"
                style={{ position: 'sticky', top: 0 }}
            >
                <motion.div className="absolute inset-0" style={{ scale: canvasScale }}>
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full"
                    />
                </motion.div>

                {/* Vignette to blend letterbox edges into the page */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)' }}
                />

                {/* Black shroud behind the overture; dissolves to reveal the sequence */}
                <div
                    className={`absolute inset-0 bg-black transition-[opacity,visibility] duration-[1100ms] ${ready ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
                />

                {/* Ignition overture: loader and hero banner in one layer, so the
                    handoff into the scroll journey is a single continuous dissolve */}
                <motion.div
                    className="pointer-events-none absolute inset-0"
                    style={{ opacity: heroOpacity, scale: heroScale }}
                >
                    {/* Constellation specks (echo the sequence's red nodes) */}
                    <div
                        aria-hidden="true"
                        className={`absolute inset-0 transition-[opacity,visibility] duration-700 ${ready ? 'opacity-0 invisible' : 'vel-fade-up'}`}
                        style={{ animationDelay: '250ms' }}
                    >
                        {particles.map((particle, i) => (
                            <span
                                key={i}
                                className="vel-particle absolute rounded-full bg-velocity-red"
                                style={{
                                    left: particle.left,
                                    top: particle.top,
                                    width: `${particle.size}px`,
                                    height: `${particle.size}px`,
                                    boxShadow: '0 0 6px rgba(255,31,31,0.8)',
                                    animation: `vel-drift ${particle.driftDuration} ease-in-out ${particle.delay} infinite alternate, vel-twinkle ${particle.twinkleDuration} ease-in-out ${particle.delay} infinite`,
                                    '--vel-dx': particle.dx,
                                    '--vel-dy': particle.dy,
                                } as React.CSSProperties}
                            />
                        ))}
                    </div>

                    {/* Lockup: blueprint V + wordmark. Dims to the resting hero once ready */}
                    <div
                        className={`absolute inset-0 flex flex-col items-center justify-center gap-8 sm:gap-10 px-6 transition-opacity duration-[1200ms] ease-out ${ready ? 'opacity-[0.26]' : 'opacity-100'}`}
                    >
                        <svg
                            aria-hidden="true"
                            viewBox="14 26 172 152"
                            className={`h-auto w-[clamp(110px,17vmin,170px)] ${ready ? 'vel-ignite' : 'vel-fade-up'}`}
                            style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.2))', animationDelay: ready ? undefined : '100ms' }}
                        >
                            {/* Faint full outline so the blueprint reads from the start */}
                            <path d={V_PATH} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={1.5} />
                            {/* Stroke draws with actual load progress */}
                            <path
                                d={V_PATH}
                                fill="none"
                                stroke="rgba(255,255,255,0.9)"
                                strokeWidth={2}
                                pathLength={1}
                                strokeDasharray={1}
                                style={{
                                    strokeDashoffset: 1 - loadingProgress / 100,
                                    transition: 'stroke-dashoffset 400ms ease-out',
                                }}
                            />
                            {/* Nodes ignite along the stroke as frames arrive */}
                            {V_VERTICES.map(([x, y], i) => {
                                const lit = loadingProgress >= ((i + 1) / V_VERTICES.length) * 100 - 0.5;
                                return (
                                    <g key={i} style={{ opacity: lit ? 1 : 0, transition: 'opacity 400ms ease' }}>
                                        <circle cx={x} cy={y} r={5} fill="rgba(255,31,31,0.25)" />
                                        <circle cx={x} cy={y} r={1.8} fill="#FF4545" />
                                    </g>
                                );
                            })}
                        </svg>

                        <div className="text-center">
                            <h1 className="font-sans font-black tracking-tighter leading-none text-white text-[clamp(3.2rem,11vw,9.5rem)]">
                                <span className="sr-only">Velocity</span>
                                {WORDMARK.split('').map((letter, i) => (
                                    <span
                                        key={i}
                                        aria-hidden="true"
                                        className="vel-letter"
                                        style={{ animationDelay: `${150 + i * 55}ms` }}
                                    >
                                        {letter}
                                    </span>
                                ))}
                            </h1>
                            <p
                                className="vel-fade-up mt-4 sm:mt-5 flex items-center justify-center gap-2.5 sm:gap-3 font-sans font-light text-white/65 text-[clamp(0.8rem,1.5vw,1.1rem)]"
                                style={{ animationDelay: '750ms' }}
                            >
                                <span>Build</span>
                                <span className="text-velocity-red/80">/</span>
                                <span>Test</span>
                                <span className="text-velocity-red/80">/</span>
                                <span>Iterate</span>
                            </p>
                        </div>
                    </div>

                    {/* Loading HUD: mono readout + hairline progress along the bottom edge */}
                    <div
                        role="status"
                        aria-label={`Loading ${loadingProgress}%`}
                        className={`absolute inset-x-0 bottom-0 transition-[opacity,visibility] duration-500 ${ready ? 'opacity-0 invisible' : 'vel-fade-up'}`}
                        style={{ animationDelay: '400ms' }}
                    >
                        <div className="flex items-baseline justify-center gap-3 pb-5 font-mono text-[10px] uppercase tracking-[0.35em] text-white/40">
                            <span>Ignition sequence</span>
                            <span className="tabular-nums text-velocity-red">{String(loadingProgress).padStart(3, '0')}%</span>
                        </div>
                        <div className="h-px w-full bg-white/10">
                            <div
                                className="h-full bg-gradient-to-r from-velocity-darkRed via-velocity-red to-red-400"
                                style={{ width: `${loadingProgress}%`, transition: 'width 300ms ease-out' }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Text Overlays */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

                    {/* Section 1: Scroll cue (appears once ready, fades on first scroll) */}
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-end pb-16 md:pb-24"
                        style={{ opacity: introOpacity }}
                    >
                        <div
                            className={`flex flex-col items-center transition-opacity duration-700 delay-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <span className="mb-3 font-mono text-[10px] uppercase tracking-[0.45em] text-white/35">
                                Scroll
                            </span>
                            <motion.div
                                animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <ChevronDown className="w-6 h-6 md:w-8 md:h-8 text-white/40" />
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Section 2: The Future of Shipping (20-45%) */}
                    <motion.div
                        className="absolute inset-0 flex items-start pt-32 justify-center sm:items-center sm:pt-0 sm:justify-start"
                        style={{ opacity: futureOpacity }}
                    >
                        <motion.div
                            className="px-4 sm:px-6 md:px-16 lg:px-24 max-w-2xl text-center sm:text-left"
                            style={{ y: futureY }}
                        >
                            <h2 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tighter text-white/90 leading-none"
                                style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                                AI-Native
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-velocity-red to-red-400 whitespace-nowrap">
                                    Founders.
                                </span>
                            </h2>
                            <p className="mt-4 md:mt-6 text-white/60 font-sans text-sm md:text-base lg:text-lg max-w-md mx-auto sm:mx-0">
                                Where LSE students transform ideas <br className="hidden sm:block" /> into products at unprecedented speed.
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Section 3: Built for Speed (45-70%) */}
                    <motion.div
                        className="absolute inset-0 flex items-end pb-32 justify-center sm:items-center sm:pb-0 sm:justify-end"
                        style={{ opacity: speedOpacity }}
                    >
                        <motion.div
                            className="px-6 md:px-16 lg:px-24 text-center sm:text-right max-w-2xl"
                            style={{ y: speedY }}
                        >
                            <h2 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tighter text-white/90 leading-none"
                                style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                                From Idea to
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-velocity-red to-red-400">
                                    Prototype.
                                </span>
                            </h2>
                            <p className="mt-4 md:mt-6 text-white/60 font-sans text-sm md:text-base lg:text-lg">
                                In hours, not years.
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Section 4: CTA (70-100%) */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ opacity: ctaBackdropOpacity, pointerEvents: ctaPointerEvents }}
                    >
                        {/* Dark backdrop for visibility */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />
                        {/* Soft red bloom behind the finale */}
                        <motion.div
                            className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{
                                opacity: ctaGlowOpacity,
                                background: 'radial-gradient(circle, rgba(255,31,31,0.16) 0%, rgba(255,31,31,0.05) 40%, transparent 70%)',
                            }}
                        />
                        <div className="text-center px-6 relative z-10">
                            <motion.h2
                                className="font-sans font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-white/90 mb-4 md:mb-6"
                                style={{ textShadow: '0 0 60px rgba(255,255,255,0.15)', opacity: ctaHeadingOpacity, y: ctaHeadingY }}
                            >
                                Velocity is Here.
                            </motion.h2>
                            <motion.p
                                className="text-white/60 font-sans text-base md:text-lg lg:text-xl mb-8 md:mb-10 max-w-md mx-auto"
                                style={{ opacity: ctaCopyOpacity, y: ctaCopyY }}
                            >
                                Empowering LSE students to build real products at unprecedented speed.
                            </motion.p>

                            <motion.div
                                className="flex flex-col sm:flex-row gap-4 justify-center"
                                style={{ opacity: ctaButtonsOpacity, y: ctaButtonsY }}
                            >
                                <Button
                                    href="https://www.lsesu.com/communities/societies/group/Velocity/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="primary"
                                    className="group gap-3"
                                >
                                    Join Now
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>

                                <Link
                                    to="/launchpad"
                                    className="relative px-8 py-4 font-sans font-medium text-sm uppercase tracking-widest transition-all duration-300 transform border-2 focus:outline-none inline-flex items-center justify-center overflow-hidden bg-transparent border-white/30 text-white hover:border-white hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] gap-3"
                                    style={{ borderRadius: '0px' }}
                                >
                                    <Rocket className="w-5 h-5" />
                                    Launchpad
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Journey progress rail */}
                <motion.div
                    className="pointer-events-none absolute right-4 sm:right-6 top-1/2 h-28 w-[2px] -translate-y-1/2 bg-white/10"
                    style={{ opacity: railOpacity }}
                >
                    <motion.div
                        className="h-full w-full origin-top bg-velocity-red"
                        style={{ scaleY: progress }}
                    />
                </motion.div>
            </div>
        </div>
    );
};
