import React from 'react';
import { motion, Variants } from 'framer-motion';

export const InterestForm: React.FC = () => {
    const sectionVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.21, 0.47, 0.32, 0.98]
            }
        }
    };

    return (
        <section className="py-48 px-6 bg-velocity-black relative z-10">
            {/* Top gradient separator */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-gray-800 via-velocity-red to-gray-800" />

            <div className="max-w-3xl mx-auto">
                <div className="mb-16 md:text-center">
                    <h2 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-white mb-2">
                        Express your <span className="text-velocity-red">Interest</span>
                    </h2>
                    <p className="font-sans text-gray-500 text-sm uppercase tracking-widest">
                        Join the next cohort of builders at LSE.
                    </p>
                </div>

                <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="group relative border border-white/5 overflow-hidden hover:border-velocity-red/30 transition-colors duration-500"
                >
                    <iframe
                        src="https://docs.google.com/forms/d/e/1FAIpQLScH0kmYkrgIXmTtPfT49iTAILEFfO2R_dfolsinRq_-8VqEzA/viewform?embedded=true"
                        width="100%"
                        height="800"
                        className="block w-full"
                        style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                        title="Express Interest Form"
                    >
                        Loading...
                    </iframe>
                </motion.div>
            </div>
        </section>
    );
};
