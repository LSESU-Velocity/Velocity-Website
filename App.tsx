import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Roadmap } from './components/Roadmap';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { BackgroundGrid } from './components/ui/BackgroundGrid';
import { TechStack } from './components/TechStack';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-velocity-red selection:text-white bg-velocity-black">
      <BackgroundGrid />
      
      <div className="relative z-10 flex flex-col">
        <Navbar />
        <main>
          <Hero />
          <TechStack />
          <Roadmap />
          <Features />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;