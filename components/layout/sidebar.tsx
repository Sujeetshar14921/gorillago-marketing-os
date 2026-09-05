'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  PenLine,
  Image as ImageIcon,
  Video,
  Calendar,
  Megaphone,
  BarChart3,
  Bot,
  Users,
  CreditCard,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Products',
    items: [
      { label: 'Products', href: '/dashboard/products', icon: Package },
    ],
  },
  {
    title: 'AI Studios',
    items: [
      { label: 'Content Studio', href: '/dashboard/content-studio', icon: PenLine },
      { label: 'Image Studio', href: '/dashboard/image-studio', icon: ImageIcon },
      { label: 'Video Studio', href: '/dashboard/video-studio', icon: Video },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Organic Publishing', href: '/dashboard/organic', icon: Calendar },
      { label: 'Paid Advertising', href: '/dashboard/ads', icon: Megaphone },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'AI Assistant', href: '/dashboard/assistant', icon: Bot, badge: 'AI' },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Team', href: '/dashboard/team', icon: Users },
      { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, sectionIdx) => (
          <div key={section.title} className={cn(sectionIdx > 0 && 'mt-6')}>
            <h4 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {section.title}
            </h4>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      onClick={onNavigate}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'text-white'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-hover'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-lg bg-accent"
                          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        />
                      )}
                      <Icon
                        className={cn(
                          'relative h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
                        )}
                      />
                      <span className="relative flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="relative rounded-md bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-sidebar-hover bg-sidebar md:flex">
      <div className="flex h-16 items-center border-b border-sidebar-hover px-5">
        <Link href="/dashboard" prefetch={true} className="flex items-center">
          <Logo />
        </Link>
      </div>

      <SidebarNav />

      <div className="border-t border-sidebar-hover p-3">
        <div className="rounded-xl bg-gradient-to-br from-sidebar-hover to-sidebar p-4">
          <p className="text-xs font-semibold text-sidebar-foreground">
            AI Auto Pilot
          </p>
          <p className="mt-1 text-[11px] text-sidebar-foreground/50">
            Let AI run your marketing 24/7
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/40">
              Status
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-warning">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
              </span>
              Paused
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
