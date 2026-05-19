import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import {
  Home, Search, PlusSquare, LayoutDashboard, LogOut,
  Menu, X, ShieldCheck, User, Settings, KeyRound, ChevronDown, Heart,
} from 'lucide-react';
import yumvrLogo from '../../assets/yumvr-logo.jpeg';

export default function Navbar() {
  const { user, logout, isAdmin, isOwner } = useAuth();
  const { ids: wishlistIds } = useWishlist();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open,        setOpen]        = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); setSettingsOpen(false); };

  const isActive = (path) =>
    location.pathname === path
      ? 'text-brand font-semibold'
      : 'text-gray-500 hover:text-gray-900';

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link to={to} onClick={() => setOpen(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isActive(to)}`}>
      <Icon size={17} /><span>{label}</span>
    </Link>
  );

  const UserMenu = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
      >
        {user.avatar
          ? <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full shrink-0 object-cover" />
          : <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{user.name?.[0]?.toUpperCase()}</div>
        }
        <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{user.name}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
      </button>

      {settingsOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <span className="badge badge-orange capitalize text-[10px] mt-1">{user.role}</span>
          </div>
          {!user.isGoogleUser && (
            <Link to="/change-password" onClick={() => setSettingsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
              <KeyRound size={15} className="text-gray-400" />Change Password
            </Link>
          )}
          <Link to="/wishlist" onClick={() => setSettingsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
            <Heart size={15} className="text-gray-400" />My Wishlist
          </Link>
          {isAdmin && (
            <Link to="/admin/settings" onClick={() => setSettingsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
              <Settings size={15} className="text-gray-400" />Admin Settings
            </Link>
          )}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
              <LogOut size={15} />Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── YumVR Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 group yumvr-nav-brand" onClick={() => setOpen(false)}>
            <div className="yumvr-logo-wrap">
              <img src={yumvrLogo} alt="YumVR" className="yumvr-logo-img" />
            </div>
            <div className="yumvr-brand-text">
              <div className="yumvr-name">
                <span className="yumvr-yum">Yum</span><span className="yumvr-vr">VR</span>
              </div>
              <div className="yumvr-tagline hidden sm:block">Rental &amp; Stay Platform</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            <NavLink to="/" icon={Home} label="Home" />
            <NavLink to="/listings" icon={Search} label="Browse" />
            {isOwner && (<><NavLink to="/owner/create" icon={PlusSquare} label="Post Listing" /><NavLink to="/owner" icon={LayoutDashboard} label="My Listings" /></>)}
            {isAdmin && <NavLink to="/admin" icon={ShieldCheck} label="Admin" />}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            {user && (
              <Link to="/wishlist" className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-red-500 transition-colors" aria-label="Wishlist">
                <Heart size={19} className={wishlistIds.length > 0 ? 'text-red-500' : ''} />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {wishlistIds.length > 9 ? '9+' : wishlistIds.length}
                  </span>
                )}
              </Link>
            )}
            {user ? <UserMenu /> : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-0.5">
          {user && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-3 bg-gray-50 border border-gray-200">
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full shrink-0 object-cover" />
                : <div className="w-9 h-9 bg-brand rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">{user.name?.[0]?.toUpperCase()}</div>
              }
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <span className="badge badge-orange capitalize ml-auto shrink-0 text-[10px]">{user.role}</span>
            </div>
          )}
          <NavLink to="/" icon={Home} label="Home" />
          <NavLink to="/listings" icon={Search} label="Browse Listings" />
          {user && <NavLink to="/wishlist" icon={Heart} label={`My Wishlist${wishlistIds.length > 0 ? ` (${wishlistIds.length})` : ''}`} />}
          {isOwner && (<><NavLink to="/owner/create" icon={PlusSquare} label="Post a Listing" /><NavLink to="/owner" icon={LayoutDashboard} label="My Listings" /></>)}
          {isAdmin && (<>
            <NavLink to="/admin" icon={ShieldCheck} label="Admin Dashboard" />
            <NavLink to="/admin/listings" icon={LayoutDashboard} label="Manage Listings" />
            <NavLink to="/admin/users" icon={User} label="Manage Users" />
            <NavLink to="/admin/settings" icon={Settings} label="Admin Settings" />
          </>)}
          {user && !user.isGoogleUser && (
            <NavLink to="/change-password" icon={KeyRound} label="Change Password" />
          )}
          <div className="pt-3 border-t border-gray-100 mt-2 space-y-2">
            {user ? (
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-500 font-semibold text-sm border border-red-100 hover:bg-red-50 transition-colors">
                <LogOut size={16} />Logout
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block w-full text-center btn-secondary py-3">Login</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="block w-full text-center btn-primary py-3">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}