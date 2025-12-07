import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Activity, BarChart3, Users, Zap, Trophy, Webhook, Bell, Sparkles } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import TokenAnalyzer from './pages/TokenAnalyzer';
import AddressLookup from './pages/AddressLookup';
import Integrations from './pages/Integrations';
import Leaderboard from './pages/Leaderboard';
import Webhooks from './pages/Webhooks';
import AIAnalytics from './pages/AIAnalytics';
import { AlertsManager } from './components/AlertsManager';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-qubic-dark">
        {/* Navigation */}
        <nav className="bg-qubic-gray border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-qubic-primary">Qubic Token Analyzer</h1>
                </div>
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link
                    to="/"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/token"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Token Analyzer
                  </Link>
                  <Link
                    to="/address"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Address Lookup
                  </Link>
                  <Link
                    to="/leaderboard"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4" />
                    Leaderboard
                  </Link>
                  <Link
                    to="/webhooks"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <Webhook className="w-4 h-4" />
                    Webhooks
                  </Link>
                  <Link
                    to="/alerts"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Alerts
                  </Link>
                  <Link
                    to="/ai"
                    className="text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 border border-purple-500/30"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Analytics
                  </Link>
                  <Link
                    to="/integrations"
                    className="text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 border border-yellow-500/30"
                  >
                    <Zap className="w-4 h-4" />
                    EasyConnect
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/token" element={<TokenAnalyzer />} />
            <Route path="/address" element={<AddressLookup />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/alerts" element={<AlertsManager />} />
            <Route path="/ai" element={<AIAnalytics />} />
            <Route path="/integrations" element={<Integrations />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-qubic-gray border-t border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-400 text-sm">
              Qubic Token Analyzer - Advanced on-chain analytics for the Qubic ecosystem
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
