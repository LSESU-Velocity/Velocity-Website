import React from 'react';
import { ChipScroll } from './ChipScroll';
import { Roadmap } from './Roadmap';
import { Features } from './Features';
import { TechStack } from './TechStack';

export const Home: React.FC = () => {
  return (
    <>
      <ChipScroll />
      <TechStack />
      <Roadmap />
      <Features />
    </>
  );
};

