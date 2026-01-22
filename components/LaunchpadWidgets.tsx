import React, { useState, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, Variants } from 'framer-motion';


// Animated text component matching Hero.tsx
export const AnimatedText = ({
    text,
    className,
    delay = 0
}: {
    text: string,
    className?: string,
    delay?: number
}) => {
    const container: Variants = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.06, delayChildren: delay }
        })
    };

    const child: Variants = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            }
        },
        hidden: {
            opacity: 0,
            y: 20,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            }
        }
    };

    return (
        <motion.span
            variants={container}
            initial="hidden"
            animate="visible"
            className={`flex flex-wrap justify-center gap-x-[0.25em] ${className}`}
        >
            {text.split(" ").map((word, index) => (
                <span key={index} className="whitespace-nowrap inline-block">
                    {Array.from(word).map((letter, i) => (
                        <motion.span variants={child} key={i} className="inline-block">
                            {letter}
                        </motion.span>
                    ))}
                </span>
            ))}
        </motion.span>
    );
};

// Animated Dial/Gauge Component - Clean minimal design matching site aesthetic
export const AnimatedScoreBar = ({
    label,
    targetValue,
    delay = 0,
    visible = true,
    invertColor = false
}: {
    label: string;
    targetValue: number;
    delay?: number;
    visible?: boolean;
    invertColor?: boolean;
}) => {
    const [currentValue, setCurrentValue] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (visible && !hasAnimated) {
            setHasAnimated(true);
            const startTime = Date.now();
            const duration = 1500;
            const delayMs = delay * 1000;

            const timeout = setTimeout(() => {
                const animate = () => {
                    const elapsed = Date.now() - startTime - delayMs;
                    const progress = Math.min(elapsed / duration, 1);

                    // Ease out cubic
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const value = Math.round(eased * targetValue);

                    setCurrentValue(value);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };
                requestAnimationFrame(animate);
            }, delayMs);

            return () => clearTimeout(timeout);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, targetValue, delay]);

    useEffect(() => {
        if (visible) {
            setHasAnimated(false);
            setCurrentValue(0);
        }
    }, [targetValue]);

    // Get solid color based on thresholds (unchanged)
    const getDialColor = (percentage: number) => {
        const effectivePercentage = invertColor ? 100 - percentage : percentage;

        // Thresholds: 0-33 (Red), 33-70 (Yellow), 70-90 (Green), 90+ (Dark Green)
        if (effectivePercentage < 33.33) {
            return '#ef4444'; // Red
        } else if (effectivePercentage < 70) {
            return '#eab308'; // Yellow
        } else if (effectivePercentage < 90) {
            return '#22c55e'; // Green
        } else {
            return '#15803d'; // Dark green
        }
    };

    const dialColor = getDialColor(currentValue);

    // Arc configuration - smaller size
    const radius = 36;
    const strokeWidth = 4;
    const centerX = 50;
    const centerY = 45;

    // Calculate arc path (semicircle opening upward)
    const startAngle = -180;
    const endAngle = 0;
    const angleRange = endAngle - startAngle;
    const filledAngle = startAngle + (currentValue / 100) * angleRange;

    const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
        return {
            x: cx + r * Math.cos(angleInRadians),
            y: cy + r * Math.sin(angleInRadians)
        };
    };

    const describeArc = (cx: number, cy: number, r: number, startAng: number, endAng: number) => {
        const start = polarToCartesian(cx, cy, r, startAng);
        const end = polarToCartesian(cx, cy, r, endAng);
        const largeArcFlag = Math.abs(endAng - startAng) > 180 ? 1 : 0;
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
    };

    const backgroundArc = describeArc(centerX, centerY, radius, startAngle, endAngle);
    const filledArc = currentValue > 0 ? describeArc(centerX, centerY, radius, startAngle, filledAngle) : '';

    return (
        <div className="flex flex-col items-center justify-center w-full">
            {/* Minimal container */}
            <div className="relative p-2">
                {/* SVG Dial */}
                <div className="relative w-20 h-12 flex items-center justify-center">
                    <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                        {/* Background arc track */}
                        <path
                            d={backgroundArc}
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                        />

                        {/* Filled arc - no glow filter */}
                        {currentValue > 0 && (
                            <path
                                d={filledArc}
                                fill="none"
                                stroke={dialColor}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                style={{
                                    transition: 'stroke 0.3s ease-out'
                                }}
                            />
                        )}

                        {/* Minimal tick marks */}
                        <circle cx={centerX - radius} cy={centerY} r="1" fill="rgba(255,255,255,0.15)" />
                        <circle cx={centerX + radius} cy={centerY} r="1" fill="rgba(255,255,255,0.15)" />
                    </svg>

                    {/* Centered percentage display */}
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                        <span
                            className="font-sans font-medium text-sm tracking-tight tabular-nums leading-none"
                            style={{ color: dialColor }}
                        >
                            {currentValue}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Label below the dial */}
            <span className="font-sans text-[9px] text-gray-300 uppercase tracking-widest mt-1">
                {label}
            </span>
        </div>
    );
};

// Widget with spotlight effect - Updated for Premium Apple-like Design
export const Widget = ({ title, icon: Icon, children, delay = 0, className = "", action, visible = true }: any) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
            transition={{ duration: 0.5, delay: visible ? delay : 0 }}
            onMouseMove={handleMouseMove}
            className={`relative group bg-black border border-white/5 overflow-hidden h-full flex flex-col shadow-2xl rounded-3xl ${className}`}
        >
            {/* Spotlight Effect - Subtle */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.03),
              transparent 40%
            )
          `,
                }}
            />

            <div className="relative z-10 p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 border border-white/5 rounded-full group-hover:border-velocity-red/30 group-hover:bg-velocity-red/10 transition-colors duration-300">
                            <Icon className="w-4 h-4 text-gray-400 group-hover:text-velocity-red transition-colors duration-300" />
                        </div>
                        <span className="font-sans text-[11px] text-gray-400 uppercase tracking-widest font-medium">{title}</span>
                    </div>
                    {action}
                </div>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </motion.div>
    );
};


