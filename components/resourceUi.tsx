import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ShieldAlert } from 'lucide-react';

interface BreadcrumbProps {
  current: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ current }) => (
  <nav
    aria-label="Breadcrumb"
    className="mb-12 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]"
  >
    <Link
      to="/resources"
      className="inline-flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-white"
    >
      <ChevronLeft className="h-3 w-3" />
      Resources
    </Link>
    <span aria-hidden className="text-zinc-700">
      /
    </span>
    <span className="text-zinc-300">{current}</span>
  </nav>
);

export const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
    {children}
  </p>
);

interface MetaRowProps {
  label: string;
  value: string;
}

export const MetaRow: React.FC<MetaRowProps> = ({ label, value }) => (
  <div className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.15em]">
    <span className="whitespace-nowrap text-zinc-600">{label}</span>
    <span aria-hidden className="flex-1 border-b border-dotted border-white/15" />
    <span className="whitespace-nowrap tabular-nums text-zinc-300">{value}</span>
  </div>
);

export const HeaderRule: React.FC<{ className?: string }> = ({ className = 'mt-12' }) => (
  <div className={`relative h-px bg-white/10 ${className}`}>
    <span className="absolute left-0 top-0 h-px w-20 bg-velocity-red" />
  </div>
);

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ children, className = '' }) => (
  <div className={`flex items-center gap-4 ${className}`}>
    <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
      {children}
    </span>
    <span aria-hidden className="h-px flex-1 bg-white/10" />
  </div>
);

export const CornerTicks: React.FC = () => (
  <>
    <span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-white/25"
    />
    <span
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-white/25"
    />
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-white/25"
    />
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-white/25"
    />
  </>
);

interface ResourceFootnoteProps {
  label?: string;
  children: React.ReactNode;
}

export const ResourceFootnote: React.FC<ResourceFootnoteProps> = ({
  label = 'Disclaimer',
  children,
}) => (
  <div className="mt-16 border-t border-white/10 pt-6">
    <div className="flex items-start gap-3">
      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-600" />
      <p className="w-full max-w-none font-sans text-xs leading-relaxed text-zinc-600 xl:whitespace-nowrap">
        <span className="mr-3 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          {label}
        </span>
        {children}
      </p>
    </div>
  </div>
);
