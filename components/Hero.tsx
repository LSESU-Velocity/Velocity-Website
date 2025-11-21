import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { ArrowRight, Code2 } from 'lucide-react';

const AnimatedText = ({ 
  text, 
  className, 
  delay = 0 
}: { 
  text: string, 
  className?: string, 
  delay?: number
}) => {
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: delay }
    })
  };

  const child = {
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
      style={{ display: "inline-block" }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {Array.from(text).map((letter, index) => (
        <motion.span variants={child} key={index} style={{ display: "inline-block" }}>
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 md:pt-48 pb-20 overflow-hidden">
      
      <div className="max-w-5xl mx-auto text-center z-10 flex flex-col items-center">
        
        <h1 className="flex flex-col items-center mb-8 leading-[0.85] select-none">
            <AnimatedText 
                text="DON'T PITCH." 
                className="font-sans font-black text-6xl md:text-8xl lg:text-9xl tracking-tighter text-white mix-blend-screen"
                delay={0.2}
            />
            <AnimatedText 
                text="BUILD." 
                className="font-sans font-black text-6xl md:text-8xl lg:text-9xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-velocity-red to-velocity-darkRed pb-4"
                delay={0.8}
            />
        </h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="font-mono text-sm md:text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed"
        >
          The LSE society for shipping products at the speed of AI. 
          Stop waiting for a technical co-founder. <br className="hidden md:block" />
          Master the new stack to turn your ideas into live applications in days, not months.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="flex flex-col md:flex-row gap-6 w-full md:w-auto mb-8"
        >
          <Button variant="primary" className="group flex items-center justify-center gap-3 px-10 py-5 text-base">
            Apply Now 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" className="flex items-center justify-center gap-3 px-10 py-5 text-base">
            <Code2 className="w-5 h-5" />
            View Roadmap
          </Button>
        </motion.div>
      </div>
    </section>
  );
};