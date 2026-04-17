import React from 'react';
import { ChipScroll } from './ChipScroll';
import { Roadmap } from './Roadmap';
import { Features } from './Features';
import { Sponsors } from './Sponsors';


export const Home: React.FC = () => {
  return (
    <>
      <ChipScroll />

      <Sponsors />
      <Roadmap />
      <Features />
    </>
  );
};

