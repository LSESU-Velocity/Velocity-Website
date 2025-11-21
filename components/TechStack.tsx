import React from 'react';
import { motion } from 'framer-motion';

const tools = ["CURSOR", "V0", "CLAUDE 3.5", "VERCEL", "REACT", "SUPABASE", "OPENAI", "TAILWIND", "NEXT.JS", "ANTHROPIC"];

export const TechStack: React.FC = () => {
  return (
    <section className="py-10 bg-velocity-black/80 border-y border-white/5 overflow-hidden backdrop-blur-sm z-20 relative">
      <div className="flex relative max-w-[100vw]">
        {/* Gradient Masks for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-velocity-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-velocity-black to-transparent z-10" />

        <motion.div 
          className="flex flex-shrink-0 gap-16 pr-16"
          animate={{ x: "-50%" }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[...tools, ...tools, ...tools, ...tools].map((tool, i) => (
            <div key={i} className="flex items-center gap-3 group">
                <div className="w-1.5 h-1.5 bg-velocity-red rounded-full opacity-50 group-hover:scale-150 transition-transform duration-300" />
                <span className="font-mono text-lg text-gray-500 font-bold tracking-widest opacity-70 group-hover:opacity-100 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all cursor-default whitespace-nowrap">
                {tool}
                </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};