import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, lastUpdated, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="pt-32 md:pt-40 pb-20 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="font-sans text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 text-sm leading-relaxed [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-white [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_a]:text-velocity-red [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1">
          {children}
        </div>
      </div>
    </motion.div>
  );
};
