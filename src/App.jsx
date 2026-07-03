import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/layout/Layout';
import RoleGuard from '@/components/RoleGuard';
import { base44 } from '@/api/base44Client';
import Dashboard from '@/pages/Dashboard';
import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import Shipping from '@/pages/Shipping';
import Upload from '@/pages/Upload';
import ApiSettings from '@/pages/ApiSettings';
import AiTeam from '@/pages/AiTeam';
import Analytics from '@/pages/Analytics';
import Products from '@/pages/Products';
import MarketingKpi from '@/pages/MarketingKpi';
import TeamCalendar from '@/pages/TeamCalendar';
import Sourcing from '@/pages/Sourcing';
import FileDrive from '@/pages/FileDrive';
import CsTickets from '@/pages/CsTickets';
import Profitability from '@/pages/Profitability';
import MobileSummary from '@/pages/MobileSummary';
import AdHub from '@/pages/AdHub';
import ImageStudio from '@/pages/ImageStudio';
import Inventory from '@/pages/Inventory';
import Influencers from '@/pages/Influencers';
import Reviews from '@/pages/Reviews';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }



  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<RoleGuard><Orders /></RoleGuard>} />
        <Route path="/orders/:id" element={<RoleGuard><OrderDetail /></RoleGuard>} />
        <Route path="/shipping" element={<RoleGuard><Shipping /></RoleGuard>} />
        <Route path="/upload" element={<RoleGuard><Upload /></RoleGuard>} />
        <Route path="/api-settings" element={<RoleGuard><ApiSettings /></RoleGuard>} />
        <Route path="/ai-team" element={<RoleGuard><AiTeam /></RoleGuard>} />
        <Route path="/analytics" element={<RoleGuard><Analytics /></RoleGuard>} />
        <Route path="/products" element={<RoleGuard><Products /></RoleGuard>} />
        <Route path="/marketing-kpi" element={<RoleGuard><MarketingKpi /></RoleGuard>} />
        <Route path="/calendar" element={<RoleGuard><TeamCalendar /></RoleGuard>} />
        <Route path="/sourcing" element={<RoleGuard><Sourcing /></RoleGuard>} />
        <Route path="/drive" element={<RoleGuard><FileDrive /></RoleGuard>} />
        <Route path="/cs-tickets" element={<RoleGuard><CsTickets /></RoleGuard>} />
        <Route path="/profitability" element={<RoleGuard><Profitability /></RoleGuard>} />
        <Route path="/ad-hub" element={<RoleGuard><AdHub /></RoleGuard>} />
        <Route path="/image-studio" element={<RoleGuard><ImageStudio /></RoleGuard>} />
        <Route path="/inventory" element={<RoleGuard><Inventory /></RoleGuard>} />
        <Route path="/influencers" element={<RoleGuard><Influencers /></RoleGuard>} />
        <Route path="/reviews" element={<RoleGuard><Reviews /></RoleGuard>} />
        <Route path="/summary" element={<RoleGuard><MobileSummary /></RoleGuard>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App