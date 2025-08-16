import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useApp } from '@/contexts/AppContext';
import { Brain } from 'lucide-react';

export const AppLayout = () => {
  const { user } = useApp();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/upload':
        return 'Upload & Classify';
      case '/results':
        return 'Classification Results';
      case '/stats':
        return 'Your Statistics';
      case '/history':
        return 'Analysis History';
      case '/account':
        return 'Account Settings';
      default:
        return 'Classify My Stuff';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30 relative overflow-hidden w-full">
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/4 right-1/4 w-60 h-60 bg-primary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="flex min-h-screen w-full relative z-10">
          <AppSidebar />
          
          <main className="flex-1 flex flex-col">
            {/* Page Header */}
            <header className="flex justify-between items-center p-6 border-b border-border/20 backdrop-blur-sm bg-background/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {getPageTitle()}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || 'AI Classification Platform'}
                  </p>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <div className="flex-1 p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};