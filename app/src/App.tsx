import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { preloadVisionModels } from "./lib/analysis/visionModels";

const Create = lazy(() => import("./pages/Create"));
const TutorialViewer = lazy(() => import("./pages/TutorialViewer"));
const Practice = lazy(() => import("./pages/Practice"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink/50 dark:text-white/50">
      Loading…
    </div>
  );
}

function ScrollToTopOnMount() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return null;
}

export default function App() {
  useEffect(() => {
    // Warm up the free on-device vision models in the background the first
    // time someone opens the app, so Create -> Generate feels instant later.
    const idle = (window as typeof window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(() => preloadVisionModels());
    else setTimeout(preloadVisionModels, 1200);
  }, []);

  return (
    <HashRouter>
      <ScrollToTopOnMount />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<Create />} />
            <Route path="/tutorial" element={<TutorialViewer />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
