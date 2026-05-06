import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackgroundGrid } from './components/ui/BackgroundGrid';
import { Home } from './components/Home';
import { Launchpad } from './components/Launchpad';
import { LaunchpadSources } from './components/LaunchpadSources';
import { AutomationIntake } from './components/AutomationIntake';
import { Blog } from './components/Blog';
import { LockedEventsPage } from './components/LockedEventsPage';
import { LockedResourcePage } from './components/LockedResourcePage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { LaunchpadPrivacySecurity } from './components/LaunchpadPrivacySecurity';
import { TermsOfService } from './components/TermsOfService';
import { Resources } from './components/Resources';
import { resourceCatalog } from './lib/resourceCatalog';
import { ResourceDiscounts } from './components/ResourceDiscounts';
import { ResourceTools } from './components/ResourceTools';
import { ResourceTemplates } from './components/ResourceTemplates';
import { ResourceCaseStudies } from './components/ResourceCaseStudies';

const resourcePageComponents: Partial<Record<string, React.ComponentType>> = {
  '/resources/blog': Blog,
  '/resources/discounts': ResourceDiscounts,
  '/resources/tools': ResourceTools,
  '/resources/templates': ResourceTemplates,
  '/resources/case-studies': ResourceCaseStudies,
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="relative min-h-screen selection:bg-velocity-red selection:text-white bg-velocity-black">
        <BackgroundGrid />

        <div className="relative z-10 flex flex-col">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/launchpad" element={<Launchpad />} />
              <Route path="/launchpad/privacy-security" element={<LaunchpadPrivacySecurity />} />
              <Route path="/launchpad/sources/:analysisId" element={<LaunchpadSources />} />
              <Route path="/automation-intake" element={<AutomationIntake />} />
              <Route path="/events" element={<LockedEventsPage />} />
              <Route path="/resources" element={<Resources />} />
              {resourceCatalog.map((resource) => {
                const ResourcePage = resourcePageComponents[resource.path];
                const isLocked = resource.status === 'locked';

                return (
                  <Route
                    key={resource.path}
                    path={resource.path}
                    element={
                      isLocked ? (
                        <LockedResourcePage resourceLabel={resource.title} />
                      ) : ResourcePage ? (
                        <ResourcePage />
                      ) : (
                        <Navigate to="/resources" replace />
                      )
                    }
                  />
                );
              })}
              {resourceCatalog.flatMap((resource) =>
                (resource.aliases ?? []).map((aliasPath) => (
                  <Route
                    key={aliasPath}
                    path={aliasPath}
                    element={
                      resource.status === 'locked' ? (
                        <LockedResourcePage resourceLabel={resource.title} />
                      ) : (
                        <Navigate to={resource.path} replace />
                      )
                    }
                  />
                ))
              )}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </Router>
  );
};

export default App;
