import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Home, 
  FileText, 
  Calendar, 
  DollarSign,
  Settings,
  Shield 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { href: "/", label: "Accueil", icon: Home, public: true },
    { href: "/devis", label: "Devis", icon: FileText, public: true },
    { href: "/reservations", label: "Réservations", icon: Calendar, public: true },
    { href: "/factures", label: "Factures", icon: DollarSign, public: false },
  ];

  const adminItems = [
    { href: "/admin", label: "Administration", icon: Shield },
  ];

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-red-600">MY JANTES</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const isActive = location === item.href;
              const shouldShow = item.public || isAuthenticated;
              
              if (!shouldShow) return null;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-red-600 bg-red-50"
                      : "text-gray-700 hover:text-red-600 hover:bg-gray-50"
                  }`}
                  data-testid={`nav-link-${item.label.toLowerCase()}`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}

            {/* Admin Links */}
            {isAuthenticated && user?.role === 'admin' && (
              <>
                {adminItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "text-red-600 bg-red-50"
                          : "text-gray-700 hover:text-red-600 hover:bg-gray-50"
                      }`}
                      data-testid="nav-link-admin"
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-700">
                  Bonjour, {user?.firstName || user?.email}
                </span>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-red-600 p-2 rounded-md transition-colors"
                  data-testid="nav-link-profile"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 p-2 rounded-md transition-colors"
                  data-testid="nav-button-logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = '/api/login'}
                className="bg-red-600 hover:bg-red-700"
                data-testid="nav-button-login"
              >
                Se connecter
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-colors"
              data-testid="nav-button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {navigationItems.map((item) => {
                const isActive = location === item.href;
                const shouldShow = item.public || isAuthenticated;
                
                if (!shouldShow) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? "text-red-600 bg-red-50"
                        : "text-gray-700 hover:text-red-600 hover:bg-gray-50"
                    }`}
                    data-testid={`nav-mobile-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Mobile Admin Links */}
              {isAuthenticated && user?.role === 'admin' && (
                <>
                  {adminItems.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                          isActive
                            ? "text-red-600 bg-red-50"
                            : "text-gray-700 hover:text-red-600 hover:bg-gray-50"
                        }`}
                        data-testid="nav-mobile-admin"
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Link>
                    );
                  })}
                </>
              )}

              {/* Mobile User Menu */}
              {isAuthenticated ? (
                <>
                  <div className="border-t border-gray-200 pt-4 pb-3">
                    <div className="flex items-center px-3 mb-3">
                      <User className="h-8 w-8 text-gray-400" />
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.email
                          }
                        </div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Link
                        href="/profile"
                        onClick={closeMobileMenu}
                        className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 transition-colors"
                        data-testid="nav-mobile-profile"
                      >
                        <Settings className="h-5 w-5 mr-3" />
                        Mon profil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 transition-colors text-left"
                        data-testid="nav-mobile-logout"
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <Button
                    onClick={() => {
                      window.location.href = '/api/login';
                      closeMobileMenu();
                    }}
                    className="w-full mx-3 bg-red-600 hover:bg-red-700"
                    data-testid="nav-mobile-login"
                  >
                    Se connecter
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}