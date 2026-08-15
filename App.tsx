import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { FlagshipInterestBanner, FlagshipInterestModal } from './components/FlagshipInterest';
import { Footer } from './components/Footer';
import { BackgroundGrid } from './components/ui/BackgroundGrid';
import { Home } from './components/Home';
import { resourceCatalog } from './lib/resourceCatalog';

// Everything below the landing page is route-split so the homepage bundle
// stays free of Remotion, Recharts, and the Launchpad dashboard.
const Launchpad = lazy(() => import('./components/Launchpad').then((m) => ({ default: m.Launchpad })));
const ArtifactPreviewRedirect = lazy(() =>
  import('./components/launchpad/ArtifactPreviewRedirect').then((m) => ({ default: m.ArtifactPreviewRedirect })),
);
const LaunchpadSources = lazy(() => import('./components/LaunchpadSources').then((m) => ({ default: m.LaunchpadSources })));
const LaunchpadPrivacySecurity = lazy(() =>
  import('./components/LaunchpadPrivacySecurity').then((m) => ({ default: m.LaunchpadPrivacySecurity })),
);
const AutomationIntake = lazy(() => import('./components/AutomationIntake').then((m) => ({ default: m.AutomationIntake })));
const AutomationIntakeAdmin = lazy(() =>
  import('./components/AutomationIntakeAdmin').then((m) => ({ default: m.AutomationIntakeAdmin })),
);
const Blog = lazy(() => import('./components/Blog').then((m) => ({ default: m.Blog })));
const EventsPage = lazy(() => import('./components/EventsPage').then((m) => ({ default: m.EventsPage })));
const LockedResourcePage = lazy(() => import('./components/LockedResourcePage').then((m) => ({ default: m.LockedResourcePage })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./components/TermsOfService').then((m) => ({ default: m.TermsOfService })));
const Resources = lazy(() => import('./components/Resources').then((m) => ({ default: m.Resources })));
const ResourceDiscounts = lazy(() => import('./components/ResourceDiscounts').then((m) => ({ default: m.ResourceDiscounts })));
const ResourceTools = lazy(() => import('./components/ResourceTools').then((m) => ({ default: m.ResourceTools })));
const ResourceTemplates = lazy(() => import('./components/ResourceTemplates').then((m) => ({ default: m.ResourceTemplates })));
const ResourceCaseStudies = lazy(() =>
  import('./components/ResourceCaseStudies').then((m) => ({ default: m.ResourceCaseStudies })),
);

const resourcePageComponents: Partial<Record<string, React.ComponentType>> = {
  '/resources/blog': Blog,
  '/resources/discounts': ResourceDiscounts,
  '/resources/tools': ResourceTools,
  '/resources/templates': ResourceTemplates,
  '/resources/case-studies': ResourceCaseStudies,
};

const blogResource = resourceCatalog.find((resource) => resource.id === 'blog');

const RouteFallback: React.FC = () => (
  <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading page">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-velocity-red" />
  </div>
);

const App: React.FC = () => {
  const adminRouteElement = import.meta.env.DEV ? (
    <AutomationIntakeAdmin />
  ) : (
    <Navigate to="/" replace />
  );

  return (
    <Router>
      <div className="relative min-h-screen selection:bg-velocity-red selection:text-white bg-velocity-black">
        <BackgroundGrid />

        <div className="relative z-10 flex flex-col">
          <FlagshipInterestBanner />
          <FlagshipInterestModal />
          <Navbar />
          <main>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/launchpad" element={<Launchpad />} />
                <Route path="/artifact-preview" element={<ArtifactPreviewRedirect />} />
                <Route path="/launchpad/privacy-security" element={<LaunchpadPrivacySecurity />} />
                <Route path="/launchpad/sources/:analysisId" element={<LaunchpadSources />} />
                <Route path="/automation-intake" element={<AutomationIntake />} />
                <Route path="/automation-intake/admin" element={adminRouteElement} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/resources" element={<Resources />} />
                <Route
                  path="/resources/blog/:slug"
                  element={
                    blogResource?.status === 'locked' ? (
                      <LockedResourcePage resourceLabel="Blog" />
                    ) : (
                      <Blog />
                    )
                  }
                />
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
            </Suspense>
          </main>
          <Footer />
        </div>
      </div>
    </Router>
  );
};

export default App;
