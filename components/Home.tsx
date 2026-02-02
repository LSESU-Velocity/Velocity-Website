import React from 'react';
import { ChipScroll } from './ChipScroll';
import { Roadmap } from './Roadmap';
import { Features } from './Features';
import { InterestForm } from './InterestForm';


export const Home: React.FC = () => {
  return (
    <>
      <ChipScroll />

      <Roadmap />
      <Features />
      <InterestForm />
    </>
  );
};

