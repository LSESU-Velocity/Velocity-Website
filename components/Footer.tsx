import React from 'react';
import { Instagram, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="join" className="border-t border-white/10 bg-velocity-black py-16 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
        
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-sans font-black text-2xl text-white tracking-tighter mb-2">VELOCITY</h4>
            <p className="font-mono text-xs text-gray-500 tracking-[0.2em]">EST. 2025 // LSE</p>
        </div>

        <div className="flex items-center gap-5">
            <a 
                href="https://www.linkedin.com/company/lsesu-velocity" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-4 bg-white/5 border border-white/10 hover:border-velocity-red hover:bg-velocity-red/10 transition-all duration-300 hover:-translate-y-1"
                aria-label="LinkedIn"
            >
                <div className="absolute inset-0 bg-velocity-red/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Linkedin className="w-7 h-7 text-gray-400 group-hover:text-white relative z-10 transition-colors" />
            </a>
            <a 
                href="https://www.instagram.com/lsesu.velocity" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative p-4 bg-white/5 border border-white/10 hover:border-velocity-red hover:bg-velocity-red/10 transition-all duration-300 hover:-translate-y-1"
                aria-label="Instagram"
            >
                <div className="absolute inset-0 bg-velocity-red/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Instagram className="w-7 h-7 text-gray-400 group-hover:text-white relative z-10 transition-colors" />
            </a>
        </div>

        <div className="text-center md:text-right">
            <p className="font-mono text-[10px] text-gray-600 leading-relaxed tracking-wider">
                DESIGNED FOR BUILDERS.<br />
                &copy; {new Date().getFullYear()} VELOCITY SOCIETY.
            </p>
        </div>
      </div>
    </footer>
  );
};