import React from 'react';
import { motion, useMotionTemplate, useMotionValue, Variants } from 'framer-motion';
import { Code, Zap, Users, ArrowRight } from 'lucide-react';

interface FeatureCardProps {
    step: string;
    title: string;
    description: string;
    icon: React.ElementType;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ step, title, description, icon: Icon }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    };

    const cardVariants: Variants = {
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
        <motion.div
            variants={cardVariants}
            onMouseMove={handleMouseMove}
            className="group relative flex flex-col justify-between bg-velocity-black/40 border border-white/5 p-8 h-full overflow-hidden hover:border-velocity-red/30 transition-colors duration-500"
        >
            {/* Spotlight Effect on Background */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                        500px circle at ${mouseX}px ${mouseY}px,
                        rgba(255, 31, 31, 0.08),
                        transparent 80%
                        )
                    `,
                }}
            />



            <div>
                <div className="flex justify-between items-start mb-8">
                    <div className="relative">
                        <span className="font-sans text-6xl font-bold text-white/5 select-none group-hover:text-velocity-red/10 transition-colors duration-500">
                            {step}
                        </span>
                        <div className="absolute top-1/2 left-1 -translate-y-1/2 ml-1">
                            <div className="p-2.5 bg-white/5 border border-white/10 backdrop-blur-sm group-hover:border-velocity-red/40 group-hover:bg-velocity-red/10 transition-colors duration-500">
                                <Icon className="w-5 h-5 text-gray-400 group-hover:text-velocity-red transition-colors duration-500" />
                            </div>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-700 -rotate-45 group-hover:rotate-0 group-hover:text-white transition-all duration-500" />
                </div>

                <h3 className="font-sans font-bold text-xl md:text-2xl text-white mb-4 group-hover:text-velocity-red transition-colors duration-500">
                    {title}
                </h3>
                <p className="font-sans text-sm leading-relaxed text-zinc-500 group-hover:text-zinc-400 transition-colors duration-500">
                    {description}
                </p>
            </div>


        </motion.div>
    );
};

export const Features: React.FC = () => {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <section id="how-it-works" className="py-32 px-6 bg-velocity-black relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Header Section - takes up one slot or sits above? 
                        The prompt asked for 3 steps, usually these are side by side. 
                        I'll put the header above the grid to let the 3 steps shine. 
                    */}
                    <div className="lg:col-span-3 mb-16 md:text-center max-w-3xl mx-auto">
                        <h2 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-white mb-2">
                            Why join <span className="text-velocity-red">Velocity?</span>
                        </h2>
                        <p className="font-sans text-gray-500 text-sm uppercase tracking-widest">
                            We provide the tools, network, and skills you need to ship.
                        </p>
                    </div>

                    <motion.div
                        className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <FeatureCard
                            step="01"
                            title="No Code Required"
                            description="Focus on logic and architecture. Let AI handle the syntax. We prioritize product vision over memorizing documentation."
                            icon={Code}
                        />
                        <FeatureCard
                            step="02"
                            title="Ship in Weeks"
                            description="The semester is short. Our sprints are shorter. Go from idea to live URL before midterms with our structured accelerator."
                            icon={Zap}
                        />
                        <FeatureCard
                            step="03"
                            title="Builder Network"
                            description="Stop searching for a technical co-founder. Become one. Join a high-bandwidth network of LSE students who are actually shipping."
                            icon={Users}
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};