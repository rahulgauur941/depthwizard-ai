import React from 'react';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
// Pages
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { DepthAnalysisPage } from './pages/DepthAnalysisPage';
import { HeightAnalysisPage } from './pages/HeightAnalysisPage';
import { ThreeDReconstructionPage } from './pages/ThreeDReconstructionPage';
import { FlythroughPage } from './pages/FlythroughPage';
import { ObjectAnalysisPage } from './pages/ObjectAnalysisPage';
import { ExportPage } from './pages/ExportPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useAnalysis();

  if (activeTab === 'landing') {
    return <LandingPage />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'upload':
        return <UploadPage />;
      case 'depth-analysis':
        return <DepthAnalysisPage />;
      case 'height-analysis':
        return <HeightAnalysisPage />;
      case '3d-reconstruction':
        return <ThreeDReconstructionPage />;
      case 'flythrough':
        return <FlythroughPage />;
      case 'object-analysis':
        return <ObjectAnalysisPage />;
      case 'export':
        return <ExportPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-950 font-sans text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
  );
};

export default App;
