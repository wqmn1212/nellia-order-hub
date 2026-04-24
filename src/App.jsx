import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/layout/Layout';
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

  // 어드민 전용: admin 역할이 아닌 경우 접근 차단
  if (user && user.role !== 'admin') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background text-center px-6">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="font-serif text-2xl text-foreground mb-2">접근 권한이 없습니다</h1>
        <p className="text-muted-foreground text-sm">이 페이지는 관리자 계정으로만 접근할 수 있습니다.</p>
        <button
          onClick={() => { base44.auth.logout(); }}
          className="mt-6 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/api-settings" element={<ApiSettings />} />
        <Route path="/ai-team" element={<AiTeam />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/products" element={<Products />} />
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