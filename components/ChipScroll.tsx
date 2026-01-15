import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

const TOTAL_FRAMES = 80;
const IMAGE_PATH = '/sequence/ezgif-frame-';

// Preload all images and return array of Image objects
const preloadImages = (): Promise<HTMLImageElement[]> => {
    const promises: Promise<HTMLImageElement>[] = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            const frameNumber = String(i).padStart(3, '0');
            img.src = `${IMAGE_PATH}${frameNumber}.png`;
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

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    // Transform scroll progress to frame index (0 to 79)
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

    // Text opacity transforms based on scroll progress
    const introOpacity = useTransform(scrollYProgress, [0, 0.08, 0.15, 0.22], [0, 1, 1, 0]);
    const futureOpacity = useTransform(scrollYProgress, [0.18, 0.25, 0.38, 0.45], [0, 1, 1, 0]);
    const speedOpacity = useTransform(scrollYProgress, [0.42, 0.50, 0.62, 0.70], [0, 1, 1, 0]);
    const ctaOpacity = useTransform(scrollYProgress, [0, 0.60, 0.65, 0.75, 1], [0, 0, 0, 1, 1]);

    // Load images on mount
    useEffect(() => {
        let loadedCount = 0;

        const loadWithProgress = async () => {
            const imagePromises: Promise<HTMLImageElement>[] = [];

            for (let i = 1; i <= TOTAL_FRAMES; i++) {
                const promise = new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    const frameNumber = String(i).padStart(3, '0');
                    img.src = `${IMAGE_PATH}${frameNumber}.png`;
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

        const unsubscribe = frameIndex.on('change', (latest) => {
            const index = Math.min(Math.round(latest), TOTAL_FRAMES - 1);
            const img = images[index];

            if (img && canvas) {
                // Set canvas size to match image aspect ratio
                const aspectRatio = img.width / img.height;
                const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth;
                const containerHeight = canvas.parentElement?.clientHeight || window.innerHeight;

                let drawWidth, drawHeight;

                // Contain: fit image within container
                if (containerWidth / containerHeight > aspectRatio) {
                    drawHeight = containerHeight;
                    drawWidth = drawHeight * aspectRatio;
                } else {
                    drawWidth = containerWidth;
                    drawHeight = drawWidth / aspectRatio;
                }

                canvas.width = containerWidth;
                canvas.height = containerHeight;

                // Clear and draw
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const x = (canvas.width - drawWidth) / 2;
                const y = (canvas.height - drawHeight) / 2;

                ctx.drawImage(img, x, y, drawWidth, drawHeight);
            }
        });

        // Initial draw
        const img = images[0];
        if (img && canvas) {
            const aspectRatio = img.width / img.height;
            const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth;
            const containerHeight = canvas.parentElement?.clientHeight || window.innerHeight;

            let drawWidth, drawHeight;

            if (containerWidth / containerHeight > aspectRatio) {
                drawHeight = containerHeight;
                drawWidth = drawHeight * aspectRatio;
            } else {
                drawWidth = containerWidth;
                drawHeight = drawWidth / aspectRatio;
            }

            canvas.width = containerWidth;
            canvas.height = containerHeight;

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const x = (canvas.width - drawWidth) / 2;
            const y = (canvas.height - drawHeight) / 2;

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

                    let drawWidth, drawHeight;

                    if (containerWidth / containerHeight > aspectRatio) {
                        drawHeight = containerHeight;
                        drawWidth = drawHeight * aspectRatio;
                    } else {
                        drawWidth = containerWidth;
                        drawHeight = drawWidth / aspectRatio;
                    }

                    canvas.width = containerWidth;
                    canvas.height = containerHeight;

                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    const x = (canvas.width - drawWidth) / 2;
                    const y = (canvas.height - drawHeight) / 2;

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
                <div className="text-white/60 font-mono text-sm tracking-wide">
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
            className="h-[400vh] relative bg-black z-20"
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
                    {/* Section 1: Introducing (0-20%) */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ opacity: introOpacity }}
                    >
                        <div className="text-center px-6">
                            <h2 className="font-sans font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tighter text-white/90"
                                style={{ textShadow: '0 0 60px rgba(255,255,255,0.15)' }}>
                                Introducing
                            </h2>
                        </div>
                    </motion.div>

                    {/* Section 2: The Future of Shipping (20-45%) */}
                    <motion.div
                        className="absolute inset-0 flex items-center"
                        style={{ opacity: futureOpacity }}
                    >
                        <div className="px-8 md:px-16 lg:px-24 max-w-xl">
                            <h2 className="font-sans font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-white/90 leading-tight"
                                style={{ textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
                                The Future of
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-velocity-red to-red-400">
                                    Shipping
                                </span>
                            </h2>
                            <p className="mt-4 md:mt-6 text-white/60 font-sans text-sm md:text-base lg:text-lg max-w-md">
                                Where LSE students transform ideas into products at unprecedented speed.
                            </p>
                        </div>
                    </motion.div>

                    {/* Section 3: Built for Speed (45-70%) */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-end"
                        style={{ opacity: speedOpacity }}
                    >
                        <div className="px-8 md:px-16 lg:px-24 text-right max-w-xl">
                            <h2 className="font-sans font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-white/90 leading-tight"
                                style={{ textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
                                Built for
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-velocity-red to-red-400">
                                    Speed.
                                </span>
                            </h2>
                            <p className="mt-4 md:mt-6 text-white/60 font-sans text-sm md:text-base lg:text-lg">
                                Designed for Scale.
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
                                Stop pitching. Start building.
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
                                    className="relative px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all duration-300 transform border-2 focus:outline-none inline-flex items-center justify-center overflow-hidden bg-transparent border-white/30 text-white hover:border-white hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] gap-3"
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
