'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, Users, Calendar, FileText, LogOut,
  ExternalLink, Menu, X, ShieldCheck, Car,
} from 'lucide-react';
import { getUser, clearAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { User } from '@/types';

const NAV = [
  { href: '/admin',              label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/users',        label: 'Utilisateurs',    icon: Users },
  { href: '/admin/documents',    label: 'Documents',       icon: FileText },
  { href: '/admin/reservations', label: 'Réservations',    icon: Calendar },
  { href: '/admin/cars',         label: 'Flotte',          icon: Car },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [sidebarOpen, setSidebar] = useState(false);
  const [pending, setPending]     = useState({ users: 0, documents: 0, reservations: 0 });

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/auth/login'); return; }
    if (u.role !== 'admin') { router.replace('/'); return; }
    setUser(u);

    adminApi.getStats().then((res) => {
      setPending({
        users: Number(res.data.users?.pending ?? 0),
        documents: Number(res.data.documents?.pending ?? 0),
        reservations: Number(res.data.reservations?.pending ?? 0),
      });
    }).catch(() => {});
  }, []);

  const logout = () => { clearAuth(); window.location.href = '/auth/login'; };

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <Link href="/" className="inline-block mb-2">
          <div className="bg-white rounded-xl px-2 py-1 inline-block">
            <Image src="/logo-taxirent.png" alt="Taxirent" width={110} height={36} className="h-8 w-auto" />
          </div>
        </Link>
        <div className="flex items-center gap-1 mt-1">
          <ShieldCheck className="w-3 h-3 text-brand-400" />
          <span className="text-brand-400 text-xs font-semibold uppercase tracking-wider">Administration</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          const badge =
            href === '/admin/users'        ? pending.users :
            href === '/admin/documents'    ? pending.documents :
            href === '/admin/reservations' ? pending.reservations : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebar(false)}
              className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </span>
              {badge > 0 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-brand-500 text-white'}`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-slate-700/50 space-y-1">
        {user && (
          <div className="px-4 py-3 mb-2">
            <p className="text-white text-sm font-semibold truncate">{user.first_name} {user.last_name}</p>
            <p className="text-slate-400 text-xs truncate">{user.email}</p>
          </div>
        )}
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
        >
          <ExternalLink className="w-4 h-4" /> Voir le site
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebar(false)} />
          <aside className="relative flex flex-col w-64 bg-slate-900 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebar(true)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900">Taxirent Admin</span>
          <div className="w-9" />
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
