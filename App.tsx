import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackgroundGrid } from './components/ui/BackgroundGrid';
import { Home } from './components/Home';
import { Launchpad } from './components/Launchpad';
import { Network } from './components/Network';
import { NetworkProfileDetail } from './components/NetworkProfileDetail';
import { NetworkOnboard } from './components/NetworkOnboard';
import { NetworkInbox } from './components/NetworkInbox';
import { Concepts } from './components/Concepts';
import { Blog } from './components/Blog';
import { ScrollToTop } from './components/ScrollToTop';
import { NotFound } from './components/NotFound';

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="relative min-h-screen selection:bg-velocity-red selection:text-white bg-velocity-black">
        <BackgroundGrid />

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/launchpad" element={<Launchpad />} />
              <Route path="/connect" element={<Network />} />
              <Route path="/connect/profile/:id" element={<NetworkProfileDetail />} />
              <Route path="/connect/onboard" element={<NetworkOnboard />} />
              <Route path="/connect/inbox" element={<NetworkInbox />} />
              <Route path="/concepts" element={<Concepts />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </Router>
  );
};

export default App;
