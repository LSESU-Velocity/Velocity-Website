import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const tools = [
  { name: "CURSOR", desc: "AI-first code editor designed for pair programming with LLMs." },
  { name: "V0", desc: "Generative UI system by Vercel. Text to React code instantly." },
  { name: "CLAUDE", desc: "Anthropic's advanced AI model, excelling in coding tasks." },
  { name: "VERCEL", desc: "Frontend cloud platform for static and hybrid apps." },
  { name: "REACT", desc: "The library for web and native user interfaces." },
  { name: "SUPABASE", desc: "The open source Firebase alternative. Postgres DB." },
  { name: "OPENAI", desc: "AI research & deployment company behind GPT-4." },
  { name: "TAILWIND", desc: "A utility-first CSS framework for rapid UI building." },
  { name: "NEXT.JS", desc: "The React Framework for the Web." }
];

export const TechStack: React.FC = () => {
  return (
    <section className="py-8 bg-velocity-black/80 border-y border-white/5 overflow-hidden backdrop-blur-sm z-20 relative">
      <style>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-content {
          animation: scroll 40s linear infinite;
        }
        /* Pause animation when hovering over the container */
        .marquee-container:hover .marquee-content {
          animation-play-state: paused !important;
        }
      `}</style>
      
      <div className="flex relative max-w-[100vw] marquee-container group select-none">
        {/* Gradient Masks for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-r from-velocity-black to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-l from-velocity-black to-transparent z-20 pointer-events-none" />

        <div 
          className="flex flex-shrink-0 gap-16 pr-16 marquee-content"
          style={{ width: "max-content" }}
        >
          {/* Quadruple the list for smooth looping */}
          {[...tools, ...tools, ...tools, ...tools].map((tool, i) => (
            <TechItem key={i} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
};

const TechItem = ({ tool }: { tool: { name: string, desc: string } }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setCoords({
        left: rect.left + rect.width / 2,
        top: rect.top + window.scrollY
      });
      setIsHovered(true);
    }
  };

  return (
    <>
      <div 
        ref={itemRef}
        className="relative flex items-center gap-3 group/item cursor-help py-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
          <div className="w-1.5 h-1.5 bg-velocity-red rounded-full opacity-50 group-hover/item:scale-150 transition-transform duration-300" />
          <span className="font-mono text-lg text-gray-500 font-bold tracking-widest opacity-70 group-hover/item:opacity-100 group-hover/item:text-white group-hover/item:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all whitespace-nowrap">
              {tool.name}
          </span>
      </div>
      
      <PortalTooltip isVisible={isHovered} coords={coords} tool={tool} />
    </>
  );
};

const PortalTooltip = ({ 
  isVisible, 
  coords, 
  tool 
}: { 
  isVisible: boolean, 
  coords: { left: number, top: number }, 
  tool: { name: string, desc: string } 
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: -20, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: 'absolute',
            left: coords.left,
            top: coords.top,
            transform: 'translate(-50%, -100%)' // Centered and above
          }}
          className="w-72 z-[9999] pointer-events-none"
        >
            <div className="bg-[#0A0A0A] border border-white/10 px-5 py-4 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] relative">
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-velocity-red/50" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-velocity-red/50" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-velocity-red/50" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-velocity-red/50" />
                
                {/* Scanline effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none" />

                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-velocity-red animate-pulse" />
                        <span className="font-mono text-[10px] text-velocity-red tracking-widest uppercase">
                            SYSTEM_INFO
                        </span>
                    </div>
                    <span className="font-mono text-[9px] text-gray-600">v1.0</span>
                </div>
                
                <h4 className="font-sans font-bold text-white text-sm mb-1">{tool.name}</h4>
                <p className="font-mono text-xs text-gray-400 leading-relaxed">
                    {tool.desc}
                </p>
            </div>
            
            {/* Connecting line */}
            <div className="w-[1px] h-6 bg-gradient-to-b from-white/20 to-transparent mx-auto" />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
