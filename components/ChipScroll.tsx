import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, Loader2, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';

const TOTAL_FRAMES = 210;
const IMAGE_PATH = '/webp-sequence/frame-';

// Fixed scroll distance in pixels - ensures consistent experience across all devices
// This is the actual scrollable distance beyond the first viewport
const SCROLL_DISTANCE = 2400;

// Phase breakpoints in pixels (from start of scroll)
// Shifting everything earlier to guarantee massive buffer at the end
const PHASE_PIXELS = {
    introEnd: 100,           // Quick intro
    futureStart: 50,         // "AI-Native Founders" starts early
    futureEnd: 550,          // Ends at 550px
    speedStart: 450,         // "From Idea to Prototype" starts
    speedEnd: 950,           // Ends at 950px
    animationEnd: 900,       // Frame animation completes at 900px
    ctaStart: 850,           // CTA starts appearing
    ctaFull: 1050,           // CTA fully visible by 1050px
    // Remaining 1350px (from 1050 to 2400) is pure visibility buffer
};

// Preload all images and return array of Image objects
const preloadImages = (): Promise<HTMLImageElement[]> => {
    const promises: Promise<HTMLImageElement>[] = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            const frameNumber = String(i).padStart(3, '0');
            img.src = `${IMAGE_PATH}${frameNumber}.webp`;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
        promises.push(promise);
    }

    return Promise.all(promises);
};

export const ChipScroll: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Constant helper to convert pixels to scroll progress (0-1)
    const toProgress = (px: number) => Math.min(px / SCROLL_DISTANCE, 1);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    // Helper function for linear interpolation between keyframes
    const interpolate = (progress: number, inputRange: number[], outputRange: number[]) => {
        // Clamp progress to input range
        if (progress <= inputRange[0]) return outputRange[0];
        if (progress >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];

        // Find the segment
        for (let i = 0; i < inputRange.length - 1; i++) {
            if (progress >= inputRange[i] && progress <= inputRange[i + 1]) {
                const segmentProgress = (progress - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
                return outputRange[i] + segmentProgress * (outputRange[i + 1] - outputRange[i]);
            }
        }
        return outputRange[outputRange.length - 1];
    };

    // Transform scroll progress to frame index
    // Animation completes early so last frame holds during the buffer
    const frameIndex = useTransform(scrollYProgress, (progress) => {
        const endProgress = toProgress(PHASE_PIXELS.animationEnd);
        const normalizedProgress = Math.min(progress / endProgress, 1);
        return normalizedProgress * (TOTAL_FRAMES - 1);
    });

    // Text opacity transforms
    const introOpacity = useTransform(scrollYProgress, (progress) => {
        return interpolate(progress, [0, 0.02, toProgress(PHASE_PIXELS.introEnd)], [1, 1, 0]);
    });

    const futureOpacity = useTransform(scrollYProgress, (progress) => {
        return interpolate(progress,
            [
                toProgress(PHASE_PIXELS.futureStart),
                toProgress(PHASE_PIXELS.futureStart + 100),
                toProgress(PHASE_PIXELS.futureEnd - 100),
                toProgress(PHASE_PIXELS.futureEnd)
            ],
            [0, 1, 1, 0]
        );
    });

    const speedOpacity = useTransform(scrollYProgress, (progress) => {
        return interpolate(progress,
            [
                toProgress(PHASE_PIXELS.speedStart),
                toProgress(PHASE_PIXELS.speedStart + 100),
                toProgress(PHASE_PIXELS.speedEnd - 150),
                toProgress(PHASE_PIXELS.speedEnd)
            ],
            [0, 1, 1, 0]
        );
    });

    const ctaOpacity = useTransform(scrollYProgress, (progress) => {
        return interpolate(progress,
            [
                0,
                toProgress(PHASE_PIXELS.ctaStart),
                toProgress(PHASE_PIXELS.ctaFull),
                1
            ],
            [0, 0, 1, 1]
        );
    });

    // Load images on mount
    useEffect(() => {
        let loadedCount = 0;

        const loadWithProgress = async () => {
            const imagePromises: Promise<HTMLImageElement>[] = [];

            for (let i = 1; i <= TOTAL_FRAMES; i++) {
                const promise = new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    const frameNumber = String(i).padStart(3, '0');
                    img.src = `${IMAGE_PATH}${frameNumber}.webp`;
                    img.onload = () => {
                        loadedCount++;
                        setLoadingProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
                        resolve(img);
                    };
                    img.onerror = reject;
                });
                imagePromises.push(promise);
            }

            try {
                const loadedImages = await Promise.all(imagePromises);
                setImages(loadedImages);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load images:', error);
                setIsLoading(false);
            }
        };

        loadWithProgress();
    }, []);

    // Draw frame to canvas on scroll
    useEffect(() => {
        if (images.length === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const unsubscribe = frameIndex.on('change', (latest) => {
            const index = Math.min(Math.round(latest), TOTAL_FRAMES - 1);
            const img = images[index];

            if (img && canvas) {
                // Set canvas size to match image aspect ratio
                const aspectRatio = img.width / img.height;
                const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth;
                const containerHeight = canvas.parentElement?.clientHeight || window.innerHeight;
                const dpr = window.devicePixelRatio || 1;

                let drawWidth, drawHeight;

                // Contain: fit image within container
                if (containerWidth / containerHeight > aspectRatio) {
                    drawHeight = containerHeight;
                    drawWidth = drawHeight * aspectRatio;
                } else {
                    drawWidth = containerWidth;
                    drawHeight = drawWidth / aspectRatio;
                }

                // Set canvas resolution for HiDPI displays
                canvas.width = containerWidth * dpr;
                canvas.height = containerHeight * dpr;
                canvas.style.width = `${containerWidth}px`;
                canvas.style.height = `${containerHeight}px`;
                ctx.scale(dpr, dpr);

                // Re-apply image smoothing after scale
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Clear and draw
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, containerWidth, containerHeight);

                const x = (containerWidth - drawWidth) / 2;
                const y = (containerHeight - drawHeight) / 2;

                ctx.drawImage(img, x, y, drawWidth, drawHeight);
            }
        });

        // Initial draw
        const img = images[0];
        if (img && canvas) {
            const aspectRatio = img.width / img.height;
            const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth;
            const containerHeight = canvas.parentElement?.clientHeight || window.innerHeight;
            const dpr = window.devicePixelRatio || 1;

            let drawWidth, drawHeight;

            if (containerWidth / containerHeight > aspectRatio) {
                drawHeight = containerHeight;
                drawWidth = drawHeight * aspectRatio;
            } else {
                drawWidth = containerWidth;
                drawHeight = drawWidth / aspectRatio;
            }

            // Set canvas resolution for HiDPI displays
            canvas.width = containerWidth * dpr;
            canvas.height = containerHeight * dpr;
            canvas.style.width = `${containerWidth}px`;
            canvas.style.height = `${containerHeight}px`;
            ctx.scale(dpr, dpr);

            // Re-apply image smoothing after scale
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, containerWidth, containerHeight);

            const x = (containerWidth - drawWidth) / 2;
            const y = (containerHeight - drawHeight) / 2;

            ctx.drawImage(img, x, y, drawWidth, drawHeight);
        }

        return () => unsubscribe();
    }, [images, frameIndex]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (images.length > 0 && canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const currentIndex = Math.round(frameIndex.get());
                const img = images[currentIndex];

                if (img) {
                    const aspectRatio = img.width / img.height;
                    const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth;
                    const containerHeight = canvas.parentElement?.clientHeight || window.innerHeight;
                    const dpr = window.devicePixelRatio || 1;

                    let drawWidth, drawHeight;

                    if (containerWidth / containerHeight > aspectRatio) {
                        drawHeight = containerHeight;
                        drawWidth = drawHeight * aspectRatio;
                    } else {
                        drawWidth = containerWidth;
                        drawHeight = drawWidth / aspectRatio;
                    }

                    // Set canvas resolution for HiDPI displays
                    canvas.width = containerWidth * dpr;
                    canvas.height = containerHeight * dpr;
                    canvas.style.width = `${containerWidth}px`;
                    canvas.style.height = `${containerHeight}px`;
                    ctx.scale(dpr, dpr);

                    // Re-apply image smoothing after scale
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, containerWidth, containerHeight);

                    const x = (containerWidth - drawWidth) / 2;
                    const y = (containerHeight - drawHeight) / 2;

                    ctx.drawImage(img, x, y, drawWidth, drawHeight);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [images, frameIndex]);

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-black">
                <Loader2 className="w-12 h-12 text-white/60 animate-spin mb-6" />
                <div className="text-white/60 font-sans text-sm tracking-wide">
                    Loading experience... {loadingProgress}%
                </div>
                <div className="w-48 h-1 bg-white/10 mt-4 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-velocity-red to-red-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${loadingProgress}%` }}
                        transition={{ duration: 0.2 }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative bg-black z-20"
            style={{ height: 'calc(100vh + 2400px)' }}
        >
            {/* Sticky canvas container */}
            <div
                className="sticky top-0 h-screen w-full overflow-hidden"
                style={{ position: 'sticky', top: 0 }}
            >
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                />

                {/* Text Overlays */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

                    {/* Section 1: Intro Hint (0-15%) */}
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-end pb-16 md:pb-24"
                        style={{ opacity: introOpacity }}
                    >
                        <p className="text-white/50 font-sans text-sm md:text-base tracking-widest uppercase mb-4">
                            The journey begins
                        </p>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ChevronDown className="w-6 h-6 md:w-8 md:h-8 text-white/40" />
                        </motion.div>
                    </motion.div>

                    {/* Section 2: The Future of Shipping (20-45%) */}
                    <motion.div
                        className="absolute inset-0 flex items-center"
                        style={{ opacity: futureOpacity }}
                    >
                        <div className="px-4 sm:px-6 md:px-16 lg:px-24 max-w-2xl">
                            <h2 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tighter text-white/90 leading-none"
                                style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                                AI-Native
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-velocity-red to-red-400 whitespace-nowrap">
                                    Founders.
                                </span>
                            </h2>
                            <p className="mt-4 md:mt-6 text-white/60 font-sans text-sm md:text-base lg:text-lg max-w-md">
                                Where LSE students transform ideas <br className="hidden sm:block" /> into products at unprecedented speed.
                            </p>
                        </div>
                    </motion.div>

                    {/* Section 3: Built for Speed (45-70%) */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-end"
                        style={{ opacity: speedOpacity }}
                    >
                        <div className="px-6 md:px-16 lg:px-24 text-right max-w-2xl">
                            <h2 className="font-sans font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tighter text-white/90 leading-none"
                                style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                                From Idea to
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-velocity-red to-red-400">
                                    Prototype.
                                </span>
                            </h2>
                            <p className="mt-4 md:mt-6 text-white/60 font-sans text-sm md:text-base lg:text-lg">
                                In weeks, not years.
                            </p>
                        </div>
                    </motion.div>

                    {/* Section 4: CTA (70-100%) */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                        style={{ opacity: ctaOpacity }}
                    >
                        {/* Dark backdrop for visibility */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />
                        <div className="text-center px-6 relative z-10">
                            <h2 className="font-sans font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-white/90 mb-4 md:mb-6"
                                style={{ textShadow: '0 0 60px rgba(255,255,255,0.15)' }}>
                                Velocity is Here.
                            </h2>
                            <p className="text-white/60 font-sans text-base md:text-lg lg:text-xl mb-8 md:mb-10 max-w-md mx-auto">
                                Ship first. Polish later.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
