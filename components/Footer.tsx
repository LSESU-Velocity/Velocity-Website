import React from 'react';
import { Instagram, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="join" className="bg-black border-t border-white/10 py-8 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">

        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
          <p className="font-sans text-xs text-gray-500 tracking-[0.2em]">EST. 2025 // LSE</p>
          <a href="mailto:velocity@lsesu.org" className="font-sans text-sm text-gray-400 hover:text-white transition-colors tracking-wide">
            velocity@lsesu.org
          </a>
          <a href="https://www.lsesu.com/communities/societies/group/velocity/" target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-gray-400 hover:text-white transition-colors tracking-wide">
            LSESU Society Page
          </a>
        </div>

        <div className="flex items-center gap-5">
          <a
            href="https://www.linkedin.com/company/lsesu-velocity"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative p-3 bg-white/5 border border-white/10 hover:border-velocity-red hover:bg-velocity-red/10 transition-all duration-300 hover:-translate-y-1"
            aria-label="LinkedIn"
          >
            <div className="absolute inset-0 bg-velocity-red/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-white relative z-10 transition-colors" />
          </a>
          <a
            href="https://www.instagram.com/lsesu.velocity"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative p-3 bg-white/5 border border-white/10 hover:border-velocity-red hover:bg-velocity-red/10 transition-all duration-300 hover:-translate-y-1"
            aria-label="Instagram"
          >
            <div className="absolute inset-0 bg-velocity-red/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white relative z-10 transition-colors" />
          </a>
        </div>

        <div className="text-center md:text-right">
          <p className="font-sans text-[10px] text-gray-600 leading-relaxed tracking-wider">
            DESIGNED FOR BUILDERS.<br />
            &copy; {new Date().getFullYear()} VELOCITY SOCIETY.
          </p>
        </div>
      </div>
    </footer>
  );
};