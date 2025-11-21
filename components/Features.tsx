import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Code, Zap, Users, ArrowUpRight } from 'lucide-react';

interface FeatureCardProps {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    large?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, subtitle, icon: Icon, large }) => {
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
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            onMouseMove={handleMouseMove}
            className={`
                relative group bg-white/[0.02] border border-white/10 
                overflow-hidden min-h-[280px] flex flex-col justify-between
                ${large ? 'md:col-span-2' : 'col-span-1'}
            `}
        >
            {/* Spotlight Effect on Background */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                        450px circle at ${mouseX}px ${mouseY}px,
                        rgba(255, 31, 31, 0.1),
                        transparent 80%
                        )
                    `,
                }}
            />
            
            {/* Grid Background */}
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.07]" 
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
            />

            <div className="relative z-10 p-8 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="p-3 bg-white/5 w-fit border border-white/10 group-hover:border-velocity-red/50 group-hover:bg-velocity-red/10 transition-colors duration-300">
                        <Icon className="w-6 h-6 text-gray-300 group-hover:text-velocity-red transition-colors duration-300" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors duration-300" />
                </div>

                <div className="mt-8">
                    <h3 className="font-sans font-bold text-2xl text-white mb-3 group-hover:text-velocity-red transition-colors duration-300">{title}</h3>
                    <p className="font-mono text-sm text-gray-400 leading-relaxed">{subtitle}</p>
                </div>
            </div>
        </motion.div>
    );
};

export const Features: React.FC = () => {
    return (
        <section className="py-32 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16 md:text-center max-w-3xl mx-auto">
                    <h2 className="font-sans font-bold text-3xl md:text-5xl tracking-tight mb-6">Why Join Velocity?</h2>
                    <p className="font-mono text-gray-400 text-sm md:text-base">
                        We provide the infrastructure, network, and pressure you need to ship.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard 
                        title="No Code Required"
                        subtitle="Focus on logic and architecture. Let AI handle the syntax. We prioritize product vision over memorizing documentation."
                        icon={Code}
                    />
                    <FeatureCard 
                        title="Ship in Weeks"
                        subtitle="The semester is short. Our sprints are shorter. Go from idea to live URL before midterms with our structured accelerator."
                        icon={Zap}
                    />
                    <FeatureCard 
                        title="Builder Network"
                        subtitle="Stop searching for a technical co-founder. Become one. Join a high-bandwidth network of LSE students who are actually shipping products."
                        icon={Users}
                        // large 
                    />
                </div>
            </div>
        </section>
    );
};