import React from 'react';
import { motion, Variants } from 'framer-motion';
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

export const Hero: React.FC = () => {
  return (
    <section id="manifesto" className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 md:pt-48 pb-20 overflow-hidden">
      
      <div className="max-w-5xl mx-auto text-center z-10 flex flex-col items-center">
        
        <h1 className="flex flex-col items-center mb-8 leading-[0.85] select-none w-full">
            <AnimatedText 
                text="DON'T PITCH." 
                className="font-sans font-black text-5xl sm:text-6xl md:text-8xl lg:text-9xl tracking-tighter text-white mix-blend-screen"
                delay={0.2}
            />
            <AnimatedText 
                text="BUILD." 
                className="font-sans font-black text-5xl sm:text-6xl md:text-8xl lg:text-9xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-velocity-red to-velocity-darkRed pb-4"
                delay={0.8}
            />
        </h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="font-mono text-sm md:text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed"
        >
          The LSE society for shipping products at the speed of AI. <br className="hidden md:block" />
          Stop creating pitch decks, start building products. 
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="flex flex-col md:flex-row gap-6 w-full md:w-auto mb-8"
        >
          <Button 
            href="https://www.lsesu.com/communities/societies/group/21219/"
            target="_blank"
            rel="noopener noreferrer"
            variant="primary" 
            className="group gap-3 w-full md:w-auto"
          >
            Join Now 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button 
            href="#roadmap"
            variant="outline" 
            className="gap-3 w-full md:w-auto"
          >
            <Code2 className="w-5 h-5" />
            View Roadmap
          </Button>
        </motion.div>
      </div>
    </section>
  );
};