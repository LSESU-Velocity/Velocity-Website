import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'outline' | 'ghost';
  children: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  children, 
  href,
  ...props 
}) => {
  const baseStyles = "relative px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all duration-300 transform border-2 focus:outline-none inline-flex items-center justify-center overflow-hidden";
  
  const variants = {
    primary: `
      bg-velocity-darkRed/20 border-velocity-red/50 text-white 
      shadow-[0_0_20px_rgba(255,31,31,0.15)] backdrop-blur-sm
      hover:bg-velocity-red hover:border-velocity-red hover:text-white 
      hover:shadow-[0_0_50px_rgba(255,31,31,0.6)]
    `,
    outline: `
      bg-transparent border-white/30 text-white 
      hover:border-white hover:bg-white/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]
    `,
    ghost: `
      bg-transparent border-transparent text-gray-400 hover:text-white
    `
  };

  const content = (
    <>
      {children}
      {/* Decorative corner accents for the 'tech' feel */}
      {variant !== 'ghost' && (
        <>
          <span className="absolute top-0 left-0 w-1 h-1 bg-white opacity-50" />
          <span className="absolute bottom-0 right-0 w-1 h-1 bg-white opacity-50" />
        </>
      )}
      
      {/* Subtle sheen for primary button */}
      {variant === 'primary' && (
         <span className="absolute inset-0 opacity-20 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none" />
      )}
    </>
  );

  if (href) {
    const isInternal = href.startsWith('#');
    
    return (
      <motion.a
        href={href}
        onClick={(e) => {
          if (isInternal) {
            e.preventDefault();
            const element = document.querySelector(href);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }
          // Allow external onClick props to fire if provided
          if (props.onClick) {
            props.onClick(e as any);
          }
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], className)}
        style={{ borderRadius: '0px' }}
        {...(props as any)}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], className)}
      style={{ borderRadius: '0px' }} // Razor sharp
      {...props}
    >
      {content}
    </motion.button>
  );
};