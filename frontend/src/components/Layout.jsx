
import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import CurrencySelector from './CurrencySelector';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  FolderKanban,
  Wallet,
  BarChart3,
  TrendingUp,
  Users,
  User,
  LogOut,
  Menu,
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const Layout = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Standardized Nav Items with grouping logic could be added here
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/transactions', icon: ArrowLeftRight, label: t('nav.transactions') },
    { to: '/analytics', icon: TrendingUp, label: t('nav.analytics') },
    { to: '/reports', icon: BarChart3, label: t('nav.reports') },
  ];

  const managementItems = [
    { to: '/budgets', icon: Wallet, label: t('nav.budgets') },
    { to: '/goals', icon: Target, label: t('nav.goals') },
    { to: '/categories', icon: FolderKanban, label: t('nav.categories') },
    { to: '/family', icon: Users, label: t('nav.family') },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-r">
      {/* Brand Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <div>
            <img src="/soqqam-logo.svg" alt="Soqqam.uz" className="h-5 object-contain mb-1 dark:hidden block" />
            <img src="/soqqam-logo-dark.svg" alt="Soqqam.uz" className="h-5 object-contain mb-1 hidden dark:block" />
            <p className="text-sm font-medium text-muted-foreground ml-0.5">{t('app.financeManager')}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-6">
          {/* Main Group */}
          <div>
            <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              {t('nav.overview', 'Overview')}
            </h3>
            <div className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  variant={location.pathname === item.to ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-medium h-9",
                    location.pathname === item.to
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  asChild
                >
                  <NavLink to={item.to} onClick={() => setOpen(false)}>
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </Button>
              ))}
            </div>
          </div>

          {/* Management Group */}
          <div>
            <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              {t('nav.management', 'Management')}
            </h3>
            <div className="space-y-1">
              {managementItems.map((item) => (
                <Button
                  key={item.to}
                  variant={location.pathname === item.to ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-medium h-9",
                    location.pathname === item.to
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  asChild
                >
                  <NavLink to={item.to} onClick={() => setOpen(false)}>
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* User Footer */}
      {/* User Footer */}
      <div className="p-4 border-t bg-muted/20">
        <NavLink
          to="/profile"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-2 mb-2 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm border border-primary/20 group-hover:bg-primary/20 transition-colors">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium leading-none truncate">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
          </div>
        </NavLink>

        <div className="space-y-2 w-full mt-2 border-t pt-2">
          <div className="flex items-center gap-2">
            <LanguageSelector className="flex-1" />
            <ThemeToggle className="w-9 h-9" />
          </div>
          <CurrencySelector />
        </div>

        <div className="mt-2 space-y-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-9 font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              logout();
              setOpen(false);
            }}
          >
            <LogOut size={16} />
            {t('nav.logout')}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 font-sans antialiased">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md border-b z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            A
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            {t('app.name')}
          </h1>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 z-20">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 pb-10 transition-all duration-200">
        <div className="px-6 py-6 lg:px-10 lg:py-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;


