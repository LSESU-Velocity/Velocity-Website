import React from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 backdrop-blur-sm bg-velocity-black/50 border-b border-white/5"
    >
      <div className="flex items-center gap-3 group cursor-pointer">
        <div className="p-2 bg-white/5 border border-white/10 group-hover:border-velocity-red/50 transition-colors">
            <Terminal size={20} className="text-velocity-red" />
        </div>
        <div className="flex flex-col">
            <span className="font-sans font-bold text-xl tracking-tighter text-white leading-none">VELOCITY</span>
            <span className="font-mono text-[10px] text-gray-500 tracking-[0.2em]">LSE SOCIETY</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {['Manifesto', 'Roadmap', 'Builders'].map((item) => (
          <a 
            key={item} 
            href={`#${item.toLowerCase()}`}
            className="font-mono text-xs text-gray-400 hover:text-velocity-red uppercase tracking-widest transition-colors"
          >
            {item}
          </a>
        ))}
        <a 
            href="#join"
            className="px-4 py-2 text-xs font-mono font-bold bg-white text-black hover:bg-velocity-red hover:text-white transition-colors"
        >
            JOIN_WAITLIST
        </a>
      </div>
    </motion.nav>
  );
};