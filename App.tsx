import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackgroundGrid } from './components/ui/BackgroundGrid';
import { Home } from './components/Home';
import { Launchpad } from './components/Launchpad';

const App: React.FC = () => {
  return (
    <Router>
      <div className="relative min-h-screen overflow-x-hidden selection:bg-velocity-red selection:text-white bg-velocity-black">
        <BackgroundGrid />
        
        <div className="relative z-10 flex flex-col">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/launchpad" element={<Launchpad />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </Router>
  );
};

export default App;
