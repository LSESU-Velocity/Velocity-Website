import React from 'react';
import { ChipScroll } from './ChipScroll';
import { Roadmap } from './Roadmap';
import { Features } from './Features';


export const Home: React.FC = () => {
  return (
    <>
      <ChipScroll />

      <Roadmap />
      <Features />
    </>
  );
};

