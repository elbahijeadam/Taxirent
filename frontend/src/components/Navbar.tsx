'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, User, LogOut, Calendar, ChevronDown, ShieldCheck } from 'lucide-react';
import { getUser, clearAuth } from '@/lib/auth';
import { User as UserType } from '@/types';

export default function Navbar() {
  const [menuOpen, setMenuOpen]         = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser]                 = useState<UserType | null>(null);
  const [scrolled, setScrolled]         = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setUser(getUser());
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  const logout = () => {
    clearAuth();
    setUser(null);
    window.location.href = '/';
  };

  const navLink = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`text-sm font-medium transition-colors duration-200 ${
        pathname === href ? 'text-brand-500' : 'text-gray-300 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? 'bg-dark-900 shadow-xl shadow-black/30'
          : 'bg-dark-900/95 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="bg-white rounded-xl px-2 py-1">
              <Image
                src="/logo-taxirent.png"
                alt="Taxirent"
                width={120}
                height={40}
                className="h-9 w-auto"
                priority
              />
            </div>
          </Link>

          {/* ── Desktop navigation ── */}
          <div className="hidden md:flex items-center gap-7">
            {navLink('/cars', 'Véhicules')}
            {user && navLink('/reservations', 'Mes réservations')}
            {navLink('/mentions-legales', 'Mentions légales')}
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 hover:text-brand-300 rounded-lg text-sm font-semibold transition"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          {/* ── Auth area ── */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition"
                >
                  <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  <span>{user.first_name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg mx-1"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        Mon profil
                      </Link>
                      <Link
                        href="/reservations"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg mx-1"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Réservations
                      </Link>
                      <div className="border-t border-gray-100 my-1.5" />
                      <button
                        onClick={logout}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg mx-1 w-[calc(100%-8px)]"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-300 hover:text-white transition"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary py-2 px-5 text-sm rounded-xl"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile toggle ── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-300 hover:text-white p-1"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="md:hidden bg-dark-900 border-t border-white/5 px-4 py-4 space-y-1">
          <Link href="/cars" className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-xl text-sm" onClick={() => setMenuOpen(false)}>
            Véhicules
          </Link>
          <Link href="/mentions-legales" className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-xl text-sm" onClick={() => setMenuOpen(false)}>
            Mentions légales
          </Link>
          {user ? (
            <>
              <Link href="/reservations" className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-xl text-sm" onClick={() => setMenuOpen(false)}>
                Mes réservations
              </Link>
              <Link href="/profile" className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-xl text-sm" onClick={() => setMenuOpen(false)}>
                Mon profil
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="flex items-center gap-2 text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 px-3 py-2.5 rounded-xl text-sm font-semibold" onClick={() => setMenuOpen(false)}>
                  <ShieldCheck className="w-4 h-4" />
                  Administration
                </Link>
              )}
              <div className="border-t border-white/5 pt-2 mt-2">
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2.5 rounded-xl text-sm w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <div className="border-t border-white/5 pt-3 mt-2 flex flex-col gap-2">
              <Link href="/auth/login" className="text-center text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-xl text-sm" onClick={() => setMenuOpen(false)}>
                Connexion
              </Link>
              <Link href="/auth/register" className="btn-primary text-center rounded-xl py-2.5 text-sm" onClick={() => setMenuOpen(false)}>
                Inscription
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
