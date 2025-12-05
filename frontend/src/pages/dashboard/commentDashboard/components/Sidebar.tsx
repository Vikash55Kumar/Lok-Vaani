import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { MessageSquare, FileText, LayoutDashboard, Bell, type LucideIcon } from 'lucide-react';
import { Tooltip } from '@mui/material';
import { cn } from '@/lib/utils';

// Constants for configuration
const HEADER_HEIGHT = 128;
const SIDEBAR_OPEN_WIDTH = '200px';
const SIDEBAR_CLOSED_WIDTH = '50px';

interface MenuItem {
  name: string;
  icon: LucideIcon;
  path: string;
}

const useSidebarPosition = (headerHeight: number) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;

    const updatePosition = () => {
      const newTop = Math.max(0, headerHeight - window.scrollY);
      
      if (sidebarRef.current) {
        sidebarRef.current.style.transform = `translateY(${newTop}px)`;
      }
      if (overlayRef.current) {
        overlayRef.current.style.transform = `translateY(${newTop}px)`;
      }
    };

    const onScroll = () => {
      rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Initial update
    updatePosition();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [headerHeight]);

  return { sidebarRef, overlayRef };
};

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { draftId } = useParams();
  const location = useLocation();
  
  // Use transform instead of top for better performance
  // We set top: 0 in CSS and translate it down
  const { sidebarRef, overlayRef } = useSidebarPosition(HEADER_HEIGHT);

  const menuItems: MenuItem[] = useMemo(() => [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      // path: `/drafts/comment-analysis/${draftId || ''}`
      path: `/drafts/comment-analysis/a90315d4-b2b1-4836-a848-b47e318a5fa5`
    },
    {
      name: 'Comment List',
      icon: MessageSquare,
      path: '/drafts/comments-list'
    },
    {
      name: 'Overall Summary',
      icon: FileText,
      path: `/drafts/overall-summary`
    },
    {
      name: 'Alerts',
      icon: Bell,
      path: `/drafts/alerts`
    }
  ], [draftId]);

  return (
    <>
      {/* Sidebar Container */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden shadow-xl",
          "bg-[#092044] text-white",
          "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          !isOpen && "cursor-pointer hover:bg-[#092044]/95"
        )}
        style={{ 
          width: isOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSED_WIDTH,
          willChange: 'transform, width'
        }}
        onClick={() => !isOpen && setIsOpen(true)}
        aria-expanded={isOpen}
        aria-label="Sidebar Navigation"
      >
        <nav className="flex flex-col mt-4 gap-0 w-full">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Tooltip 
                key={item.path} 
                title={!isOpen ? item.name : ''} 
                placement="right" 
                arrow
              >
                <Link
                  to={item.path}
                  className={cn(
                    "group flex items-center w-full py-3",
                    "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    isOpen ? "pl-6 gap-3" : "pl-[13px] gap-0",
                    isActive 
                      ? "bg-[#0075b0] border-l-4 border-white" 
                      : "hover:bg-white/10 border-l-4 border-transparent"
                  )}
                  onClick={(e) => e.stopPropagation()} // Prevent sidebar toggle when clicking link
                >
                  <item.icon 
                    size={24} 
                    className={cn(
                      "shrink-0 transition-transform duration-300",
                      isActive || "group-hover:scale-110"
                    )} 
                  />
                  <span 
                    className={cn(
                      "text-sm font-medium whitespace-nowrap overflow-hidden",
                      "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                      isOpen ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          ref={overlayRef}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          className="fixed inset-0 top-0 z-30 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
          style={{ willChange: 'transform' }}
        />
      )}
    </>
  );
};

export default Sidebar;
