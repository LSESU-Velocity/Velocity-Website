import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Code2, Rocket, TrendingUp } from 'lucide-react';

const steps = [
  {
    timeline: 'Day 1',
    title: 'IDEATE',
    desc: 'Identify a problem worth solving.',
    icon: Lightbulb,
    color: 'text-gray-400',
    border: 'border-gray-700'
  },
  {
    timeline: 'Week 1-2',
    title: 'BUILD',
    desc: 'Ship with Cursor, v0, Claude.',
    icon: Code2,
    color: 'text-white',
    border: 'border-white/40'
  },
  {
    timeline: 'Week 2-3',
    title: 'DEPLOY',
    desc: 'Live URL, real product.',
    icon: Rocket,
    color: 'text-velocity-red',
    border: 'border-velocity-red'
  },
  {
    timeline: 'Week 3+',
    title: 'SCALE',
    desc: 'Get users, iterate, grow.',
    icon: TrendingUp,
    color: 'text-velocity-red',
    border: 'border-velocity-red'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export const Roadmap: React.FC = () => {
  return (
    <section id="roadmap" className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
        {/* Background glow for this section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-velocity-red/5 blur-[100px] pointer-events-none" />

      <motion.div 
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <motion.div variants={itemVariants} className="mb-16 text-center md:text-left">
          <h2 className="font-sans font-bold text-3xl md:text-4xl tracking-tight mb-2">THE PIPELINE</h2>
          <p className="font-mono text-gray-500 text-sm uppercase tracking-widest">From conception to production</p>
        </motion.div>

        <div className="relative flex flex-col md:flex-row justify-between items-start gap-8">
            
            {/* Connecting line (hidden on mobile) */}
            <motion.div 
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 1 }}
              className="hidden md:block absolute top-8 left-0 right-0 h-[1px] bg-gradient-to-r from-gray-800 via-velocity-red to-gray-800 z-0" 
            />

            {steps.map((step, index) => (
                <motion.div 
                    key={index}
                    variants={itemVariants}
                    className="relative z-10 flex-1 bg-velocity-black md:bg-transparent p-4 md:p-0 border border-white/5 md:border-none w-full"
                >
                    <div className="flex flex-col items-center md:items-start">
                        {/* Icon Box */}
                        <div className={`w-16 h-16 bg-velocity-black border ${step.border} flex items-center justify-center mb-6 shadow-lg z-10 relative group transition-colors duration-300`}>
                            <div className={`absolute inset-0 ${step.color.includes('red') ? 'bg-velocity-red/10' : 'bg-white/5'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                            <step.icon className={`w-6 h-6 ${step.color}`} />
                        </div>

                        <div className="text-center md:text-left">
                            <span className="font-mono text-xs text-velocity-red/80 font-bold mb-2 block tracking-widest uppercase">{step.timeline}</span>
                            <h3 className="font-sans font-bold text-xl text-white mb-2">{step.title}</h3>
                            <p className="font-mono text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </motion.div>
    </section>
  );
};