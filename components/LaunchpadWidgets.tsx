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


