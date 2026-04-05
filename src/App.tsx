import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LessonPage from './pages/LessonPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LessonsList from './pages/LessonsList';
import Leaderboard from './pages/Leaderboard';
import ParentDashboard from './pages/ParentDashboard';
import StudyPlan from './pages/StudyPlan';
import RevisionPage from './pages/RevisionPage';
import Applications from './pages/Applications';
import FractionLab from './pages/FractionLab';
import AnalyticalGeometry from './pages/AnalyticalGeometry';
import FormulaTransformerPage from './pages/tools/FormulaTransformerPage';
import GraphGeneratorPage from './pages/tools/GraphGeneratorPage';
import UnitConverterPage from './pages/tools/UnitConverterPage';
import AdminPanel from './pages/AdminPanel';
import AdminDocumentation from './pages/AdminDocumentation';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lessons" 
              element={
                <ProtectedRoute>
                  <LessonsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/parent" 
              element={
                <ProtectedRoute>
                  <ParentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/plan" 
              element={
                <ProtectedRoute>
                  <StudyPlan />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/plan/revision/:week" 
              element={
                <ProtectedRoute>
                  <RevisionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/applications" 
              element={
                <ProtectedRoute>
                  <Applications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/applications/fraction-lab" 
              element={
                <ProtectedRoute>
                  <FractionLab />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/applications/analytical-geometry" 
              element={
                <ProtectedRoute>
                  <AnalyticalGeometry />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/applications/formula-transformer" 
              element={
                <ProtectedRoute>
                  <FormulaTransformerPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/applications/graph-generator" 
              element={
                <ProtectedRoute>
                  <GraphGeneratorPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/applications/unit-converter" 
              element={
                <ProtectedRoute>
                  <UnitConverterPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lesson/:id" 
              element={
                <ProtectedRoute>
                  <LessonPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lekcje/:id" 
              element={
                <ProtectedRoute>
                  <LessonPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/documentation" 
              element={
                <ProtectedRoute>
                  <AdminDocumentation />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <footer className="bg-white border-t border-slate-200 py-12 mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-slate-500 text-sm">
              © 2026 MathMaster. Wszystkie prawa zastrzeżone. <br />
              Profesjonalne przygotowanie do egzaminu ósmoklasisty.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
