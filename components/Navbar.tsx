import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { SCROLL_DISTANCE } from './ChipScroll';
import {
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { liveResourceCatalog } from '../lib/resourceCatalog';

// Points to the file in the /public folder
const LOGO_URL = "/Velocity-logo-black.png";

interface SubNavItem {
  label: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  label: string;
  mobileLabel?: string;
  path: string;
  isSection: boolean;
  children?: SubNavItem[];
}

const resourceNavItems: SubNavItem[] = liveResourceCatalog.map((resource) => ({
  label: resource.title,
  description: resource.navDescription,
  path: resource.path,
  icon: resource.icon,
}));

const navItems: NavItem[] = [
  { label: 'Overview', path: '/', isSection: false },
  { label: 'Launchpad', path: '/launchpad', isSection: false },
  { label: 'Events', path: '/events', isSection: false },
  {
    label: 'Resources',
    path: '/resources',
    isSection: false,
    children: resourceNavItems,
  },
  { label: 'Student Projects', mobileLabel: 'Projects', path: '/automation-intake', isSection: false },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const [activeSection, setActiveSection] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  const mobileNavRef = useRef<HTMLDivElement>(null);
  const isPathWithin = (basePath: string) =>
    location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);

  // Track scroll position to show/hide navbar
  useEffect(() => {
    const handleScrollVisibility = () => {
      // Show navbar after scrolling past the chipscroll animation
      const heroHeight = SCROLL_DISTANCE;
      const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
      const shouldShow = isMobileViewport || window.scrollY > heroHeight || location.pathname !== '/';
      setIsVisible(shouldShow);
    };

    // Check on mount
    handleScrollVisibility();

    window.addEventListener('scroll', handleScrollVisibility);
    window.addEventListener('resize', handleScrollVisibility);
    return () => {
      window.removeEventListener('scroll', handleScrollVisibility);
      window.removeEventListener('resize', handleScrollVisibility);
    };
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLElement>, item: NavItem) => {
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
  };

  const isActive = (item: NavItem) => {
    if (item.isSection) {
      return activeSection === item.label;
    }

    if (item.path === '/') {
      return location.pathname === '/';
    }

    if (item.path === '/launchpad') {
      return isPathWithin('/launchpad');
    }

    if (item.path === '/automation-intake') {
      return isPathWithin('/automation-intake');
    }

    if (item.children) {
      return isPathWithin(item.path);
    }

    return location.pathname === item.path;
  };

  // Close dropdown when route changes
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    const nav = mobileNavRef.current;
    const activeLink = nav?.querySelector<HTMLElement>('[aria-current="page"]');

    if (!nav || !activeLink) return;

    const targetLeft = activeLink.offsetLeft - (nav.clientWidth - activeLink.clientWidth) / 2;
    nav.scrollTo({ left: Math.max(0, targetLeft) });
  }, [location.pathname]);

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenDropdown(null), 140);
  };

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      aria-label="Primary navigation"
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none max-md:!translate-y-0 max-md:!opacity-100" // pointer-events-none allows clicks through wrapper if needed, but we'll add auto to children
    >
      {/* Background with Mask */}
      <div
        className="absolute inset-x-0 top-0 h-[76px] w-full backdrop-blur-xl pointer-events-auto md:h-[100px]"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
        }}
      />

      {/* Content Container - Unmasked */}
      <div className="relative z-20 flex h-[72px] items-center justify-start px-3 pointer-events-auto md:h-auto md:justify-between md:px-12 md:py-5">
        {/* Left: Logo */}
        <button
          type="button"
          className="group flex flex-none items-center gap-2.5 text-left cursor-pointer md:min-w-[160px] md:gap-3"
          onClick={handleLogoClick}
          aria-label="Velocity home"
        >
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white/10 md:h-10 md:w-10">
            <img
              src={LOGO_URL}
              alt="Velocity Logo"
              className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <span className="hidden font-sans font-medium text-lg tracking-tight text-white/90 group-hover:text-white transition-colors md:inline">
            Velocity
          </span>
        </button>

        {/* Mobile: compact, horizontally scrollable page links */}
        <div
          ref={mobileNavRef}
          className="ml-3 flex h-full min-w-0 flex-1 snap-x snap-mandatory items-center overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"
        >
          {navItems.map((item) => {
            const active = isActive(item);

            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={(event) => handleNavClick(event, item)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-full flex-none snap-start items-center px-1 font-sans text-xs font-medium transition-colors ${
                  active ? 'text-white' : 'text-white/55 hover:text-white/85'
                }`}
              >
                {item.mobileLabel ?? item.label}
                {active && (
                  <span className="absolute inset-x-1 bottom-0 h-0.5 bg-velocity-red" aria-hidden />
                )}
              </Link>
            );
          })}
        </div>


        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            if (item.children) {
              const isOpen = openDropdown === item.label;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => {
                    cancelClose();
                    setOpenDropdown(item.label);
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <Link
                    to={item.path}
                    className={`relative inline-flex items-center gap-1 px-4 py-2 font-sans text-sm transition-colors ${
                      isActive(item)
                        ? 'text-white'
                        : 'text-white/60 hover:text-white/90'
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-white' : 'text-white/50'
                      }`}
                    />
                    {isActive(item) && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-0 left-4 right-4 h-[2px] bg-white rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>

                  {/* No AnimatePresence: exits never resolve in this app, and
                      a stalled invisible dropdown would swallow clicks on the
                      content underneath the navbar. */}
                  {isOpen && (
                    <DropdownPanel
                      children={item.children}
                      onClose={() => setOpenDropdown(null)}
                    />
                  )}
                </div>
              );
            }

            return item.isSection ? (
              <button
                key={item.label}
                onClick={(e) => handleNavClick(e, item)}
                className={`relative px-4 py-2 font-sans text-sm transition-colors ${
                  isActive(item)
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
                className={`relative px-4 py-2 font-sans text-sm transition-colors ${
                  isActive(item)
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
            );
          })}
        </div>

        {/* Right: Icons */}
        <div className="hidden items-center justify-end gap-1 md:flex md:min-w-[160px] md:gap-3">

          {/* Dynamic Actions Portal Target */}
          <div id="navbar-actions" className="flex items-center gap-3" />


          {/* Join LSESU Link */}
          <a
            href="https://www.lsesu.com/communities/societies/group/Velocity/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Join Society"
            title="Join Society"
          >
            <ExternalLink className="w-5 h-5" />
          </a>


        </div>
      </div>

    </motion.nav>
  );
};


interface DropdownPanelProps {
  children: SubNavItem[];
  onClose: () => void;
}

const DropdownPanel: React.FC<DropdownPanelProps> = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -6, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.16, ease: 'easeOut' }}
    className="absolute left-1/2 top-full w-[380px] -translate-x-1/2 pt-4"
  >
    <div className="overflow-hidden border border-white/10 bg-velocity-black/95 shadow-2xl backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(216,45,45,0.08),transparent_60%)]" />
      <div className="relative p-2">
        {children.map((child) => {
          const Icon = child.icon;
          return (
            <Link
              key={child.path}
              to={child.path}
              onClick={onClose}
              className="group flex items-start gap-3 px-3 py-3 transition-colors hover:bg-white/[0.04]"
            >
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center border border-white/10 bg-white/[0.02] transition-colors group-hover:border-velocity-red/40 group-hover:bg-velocity-red/10">
                <Icon className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-velocity-red" />
              </div>
              <div className="flex-1">
                <p className="font-sans text-sm font-medium text-white transition-colors group-hover:text-velocity-red">
                  {child.label}
                </p>
                <p className="font-sans text-xs leading-relaxed text-zinc-500">
                  {child.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="relative border-t border-white/5 bg-velocity-black/50 px-5 py-3">
        <Link
          to="/resources"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-white"
        >
          View all resources
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  </motion.div>
);
