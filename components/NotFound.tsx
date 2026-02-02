import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <section className="relative z-10 py-32 px-6 bg-velocity-black min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-sans font-bold text-4xl md:text-5xl text-white mb-4">
          404 - Page not found
        </h1>
        <p className="font-sans text-sm text-zinc-500 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center font-sans text-sm uppercase tracking-widest px-6 py-3 bg-velocity-red text-white border-2 border-velocity-red hover:bg-velocity-red/90 hover:border-velocity-red/90 transition-colors focus:outline-none"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
};
