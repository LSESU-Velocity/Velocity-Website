import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

// Points to the file in the /public folder
const LOGO_URL = "/Velocity-logo-black.png";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleScroll = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    if (location.pathname === '/' && location.state && (location.state as any).scrollTo) {
      const id = (location.state as any).scrollTo;
      const element = document.getElementById(id);
      if (element) {
        // Small timeout to ensure render
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      // Clear state to avoid scrolling on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 backdrop-blur-sm bg-velocity-black/50 border-b border-white/5"
    >
      <div className="flex items-center gap-4 group cursor-pointer" onClick={handleLogoClick}>
        <div className="w-16 h-16 p-1 bg-white/5 border border-white/10 group-hover:border-velocity-red/50 transition-colors flex items-center justify-center">
          {LOGO_URL ? (
            <img src={LOGO_URL} alt="Velocity Logo" className="w-full h-full object-contain" />
          ) : (
            <Terminal size={32} className="text-velocity-red" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-sans font-bold text-2xl tracking-tighter text-white leading-none">VELOCITY</span>
          <span className="font-mono text-xs text-gray-500 tracking-[0.2em]">LSESU SOCIETY</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link
          to="/launchpad"
          className={`font-mono text-xs uppercase tracking-widest transition-colors ${location.pathname === '/launchpad' ? 'text-velocity-red font-bold' : 'text-gray-400 hover:text-velocity-red'}`}
        >
          Launchpad
        </Link>

        {['Manifesto', 'Roadmap', 'Builders'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            onClick={(e) => handleScroll(e, item.toLowerCase())}
            className="font-mono text-xs text-gray-400 hover:text-velocity-red uppercase tracking-widest transition-colors"
          >
            {item}
          </a>
        ))}
        <a
          href="https://www.lsesu.com/communities/societies/group/Velocity/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-xs font-mono font-bold bg-white text-black hover:bg-velocity-red hover:text-white transition-colors"
        >
          JOIN_NOW
        </a>
      </div>
    </motion.nav>
  );
};
