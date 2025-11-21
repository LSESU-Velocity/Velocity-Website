import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const baseStyles = "relative px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all duration-300 transform border-2 focus:outline-none";
  
  const variants = {
    primary: `
      bg-velocity-red border-velocity-red text-white 
      hover:bg-transparent hover:text-velocity-red hover:shadow-[0_0_20px_rgba(255,31,31,0.4)]
    `,
    outline: `
      bg-transparent border-white/30 text-white 
      hover:border-white hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]
    `,
    ghost: `
      bg-transparent border-transparent text-gray-400 hover:text-white
    `
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], className)}
      style={{ borderRadius: '0px' }} // Razor sharp
      {...props}
    >
      {children}
      
      {/* Decorative corner accents for the 'tech' feel */}
      {variant !== 'ghost' && (
        <>
          <span className="absolute top-0 left-0 w-1 h-1 bg-white opacity-50" />
          <span className="absolute bottom-0 right-0 w-1 h-1 bg-white opacity-50" />
        </>
      )}
    </motion.button>
  );
};