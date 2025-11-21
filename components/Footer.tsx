import React from 'react';
import { Instagram, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="join" className="border-t border-white/10 bg-velocity-black py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        
        <div className="flex flex-col items-center md:items-start">
            <h4 className="font-sans font-bold text-lg text-white tracking-tight">VELOCITY</h4>
            <p className="font-mono text-xs text-gray-500 mt-1">EST. 2025 // LSE</p>
        </div>

        <div className="flex items-center gap-6">
            <a 
                href="https://www.linkedin.com/company/lsesu-velocity" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-velocity-red transition-colors"
            >
                <Linkedin size={20} />
            </a>
            <a 
                href="https://www.instagram.com/lsesu.velocity" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-velocity-red transition-colors"
            >
                <Instagram size={20} />
            </a>
        </div>

        <div className="text-center md:text-right">
            <p className="font-mono text-[10px] text-gray-600">
                DESIGNED FOR BUILDERS.<br />
                &copy; {new Date().getFullYear()} VELOCITY SOCIETY.
            </p>
        </div>
      </div>
    </footer>
  );
};