import React from 'react';
import { Hero } from './Hero';
import { Roadmap } from './Roadmap';
import { Features } from './Features';
import { TechStack } from './TechStack';

export const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <TechStack />
      <Roadmap />
      <Features />
    </>
  );
};

