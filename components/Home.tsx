import React from 'react';
import { ChipScroll } from './ChipScroll';
import { VelocityExplainer } from './VelocityExplainer';
import { SeasonProgramme } from './SeasonProgramme';
import { BuildProof } from './BuildProof';
import { PartnersJoin } from './PartnersJoin';
import { VelocityFinale } from './VelocityFinale';

export const Home: React.FC = () => {
  return (
    <>
      <ChipScroll />

      <VelocityExplainer />
      <SeasonProgramme />
      <BuildProof />
      <PartnersJoin />
      <VelocityFinale />
    </>
  );
};
