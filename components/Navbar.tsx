import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { SCROLL_DISTANCE } from './ChipScroll';

// Points to the file in the /public folder
const LOGO_URL = "/Velocity-logo-black.png";

// Navigation items for the center
const navItems = [
  { label: 'Overview', path: '/', isSection: false },
  { label: 'Launchpad', path: '/launchpad', isSection: false },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Track scroll position to show/hide navbar
  useEffect(() => {
    const handleScrollVisibility = () => {
      // Show navbar after scrolling past the chipscroll animation
      const heroHeight = SCROLL_DISTANCE;
      const shouldShow = window.scrollY > heroHeight || location.pathname !== '/';
      setIsVisible(shouldShow);
    };

    // Check on mount
    handleScrollVisibility();

    window.addEventListener('scroll', handleScrollVisibility);
    return () => window.removeEventListener('scroll', handleScrollVisibility);
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLElement>, item: typeof navItems[0]) => {
    if (item.isSection) {
      e.preventDefault();
      const sectionId = item.path.replace('/#', '');
      if (location.pathname !== '/') {
        navigate('/', { state: { scrollTo: sectionId } });
      } else {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
      setActiveSection(item.label);
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
    setActiveSection('Overview');
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.isSection) {
      return activeSection === item.label;
    }
    if (item.path === '/') {
      return location.pathname === '/' && activeSection === 'Overview';
    }
    return location.pathname === item.path;
  };

  // Set initial active state
  useEffect(() => {
    if (location.pathname === '/launchpad') {
      setActiveSection('Launchpad');
    } else if (location.pathname === '/') {
      setActiveSection('Overview');
    }
  }, [location.pathname]);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none" // pointer-events-none allows clicks through wrapper if needed, but we'll add auto to children
    >
      {/* Background with Mask */}
      <div
        className="absolute inset-0 h-full w-full backdrop-blur-xl pointer-events-auto"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          height: '100px', // Explicit height for the background panel
        }}
      />

      {/* Content Container - Unmasked */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 md:px-12 pointer-events-auto">
        {/* Left: Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group min-w-[160px]"
          onClick={handleLogoClick}
        >
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-white/10">
            <img
              src={LOGO_URL}
              alt="Velocity Logo"
              className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <span className="font-sans font-medium text-lg tracking-tight text-white/90 group-hover:text-white transition-colors">
            Velocity
          </span>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            item.isSection ? (
              <button
                key={item.label}
                onClick={(e) => handleNavClick(e, item)}
                className={`relative px-4 py-2 font-sans text-sm transition-colors ${isActive(item)
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/90'
                  }`}
              >
                {item.label}
                {isActive(item) && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-4 right-4 h-[2px] bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setActiveSection(item.label)}
                className={`relative px-4 py-2 font-sans text-sm transition-colors ${isActive(item)
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/90'
                  }`}
              >
                {item.label}
                {isActive(item) && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-4 right-4 h-[2px] bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            )
          ))}
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-3 min-w-[160px] justify-end">

          {/* Dynamic Actions Portal Target */}
          <div id="navbar-actions" className="flex items-center gap-3" />


          {/* Join LSESU Link */}
          <a
            href="https://www.lsesu.com/communities/societies/group/Velocity/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Join Society"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-none stroke-current"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </a>

          {/* Menu Dots */}
          <button
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Menu"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-current"
            >
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </motion.nav>
  );
};
