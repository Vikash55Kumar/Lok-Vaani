import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logoutAsync } from '../store/slices/authSlice';
import {
  ChartBarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import LokVaaniLogo from '../assets/logo.png';
import McaLogo from '../assets/mca21logo.png';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    await dispatch(logoutAsync());
    navigate('/');
  }, [dispatch, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const navigationItems = useMemo(() => [
    { name: 'Home', href: '/', public: true },
    // { name: 'Drafts', href: '/drafts', public: true },
    { name: 'About', href: '/about', public: true },
    { name: 'Pricing', href: '/pricing', public: true },
    ...(isAuthenticated ? [
      { name: 'Dashboard', href: user?.role === 'ADMIN' ? '/admin' : '/drafts', public: false },
    ] : [])
  ], [isAuthenticated, user?.role]);

  const isActivePath = useCallback((path: string) => location.pathname === path, [location.pathname]);

  return (
    <>
      {/* Top Bar with MCA Logo */}
      <div className="bg-white w-full border-b border-slate-200 font-sans">
        <div className="max-w-7xl mx-auto px-6 py-2 flex justify-center sm:justify-start items-center gap-4">
           <img src={McaLogo} alt="MCA21" className="h-16 w-auto object-contain" />
           <div className="hidden sm:block h-12 w-px bg-slate-300"></div>
           <div className="hidden sm:flex flex-col items-start">
             <h2 className="text-[#092044] font-medium text-sm tracking-wide">EMPOWERING BUSINESS, PROTECTING INVESTORS</h2>
             <div className="flex items-center gap-2 text-xs font-medium mt-1">
               <span className="text-[#e69626]">REGULATOR</span>
               <span className="text-blue-900">•</span>
               <span className="text-[#26a365]">INTEGRATOR</span>
               <span className="text-blue-900">•</span>
               <span className="text-[#e63f3f]">FACILITATOR</span>
               <span className="text-blue-900">•</span>
               <span className="text-[#0075b0]">EDUCATOR</span>
             </div>
           </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="relative z-50 w-full bg-[#092044] shadow-md font-sans">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src={LokVaaniLogo}
                alt="LokVaani" 
                className="h-10 w-auto bg-white rounded p-1"
              />
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center h-full">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`h-full flex items-center px-6 text-base font-medium transition-colors duration-200 ${
                    isActivePath(item.href)
                      ? 'bg-[#0075b0] text-white'
                      : 'text-white hover:bg-[#005a87]'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right Side - Auth Section */}
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-blue-100 hover:text-white transition-colors duration-200"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <span className="text-sm font-medium">{user?.name}</span>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg border border-slate-200 z-50 overflow-hidden">
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
                        <div className="text-xs text-slate-500">{user?.email}</div>
                        <div className="text-xs text-blue-600 font-medium">{user?.role}</div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to={user?.role === 'ADMIN' ? '/admin' : '/drafts'}
                          className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <ChartBarIcon className="h-4 w-4 mr-3 text-blue-600" />
                          Dashboard
                        </Link>
                        
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-600" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login">
                  <button className="bg-white text-blue-900 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                    Login
                  </button>
                </Link>
              )}
            </div>
          </div>
        </header>
    </>
  );
};

export default Navbar;
