import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Search, PlusSquare, LayoutDashboard, LogIn, LogOut, Menu, X, ShieldCheck, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin, isOwner } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };

  const isActive = (path) =>
    location.pathname === path ? 'text-brand font-semibold' : 'text-gray-600 hover:text-brand';

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link to={to} onClick={() => setOpen(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isActive(to)}`}>
      <Icon size={17} /><span>{label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-display font-bold text-gray-900 text-base sm:text-lg">Yum</span>
              <span className="font-display font-bold text-brand text-base sm:text-lg"></span>
              <div className="text-[9px] text-gray-400 font-sans -mt-0.5 hidden sm:block">Rental & Stay Platform</div>
            </div>
          </Link>
 
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" icon={Home} label="Home" />
            <NavLink to="/listings" icon={Search} label="Browse" />
            {isOwner && (<><NavLink to="/owner/create" icon={PlusSquare} label="Post Listing" /><NavLink to="/owner" icon={LayoutDashboard} label="My Listings" /></>)}
            {isAdmin && <NavLink to="/admin" icon={ShieldCheck} label="Admin" />}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{user.name}</span>
                  <span className="badge badge-orange capitalize text-[10px]">{user.role}</span>
                </div>
                <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-1.5">
                  <LogOut size={15} />Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Register</Link>
              </div>
            )}
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 shadow-lg">
          {user && (
            <div className="flex items-center gap-3 px-3 py-3 bg-orange-50 rounded-xl mb-3 border border-orange-100">
              <div className="w-9 h-9 bg-brand rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <span className="badge badge-orange capitalize ml-auto shrink-0">{user.role}</span>
            </div>
          )}
          <NavLink to="/" icon={Home} label="Home" />
          <NavLink to="/listings" icon={Search} label="Browse Listings" />
          {isOwner && (<><NavLink to="/owner/create" icon={PlusSquare} label="Post a Listing" /><NavLink to="/owner" icon={LayoutDashboard} label="My Listings" /></>)}
          {isAdmin && (<><NavLink to="/admin" icon={ShieldCheck} label="Admin Dashboard" /><NavLink to="/admin/listings" icon={LayoutDashboard} label="Manage Listings" /><NavLink to="/admin/users" icon={User} label="Manage Users" /></>)}
          <div className="pt-3 border-t border-gray-100 mt-2 space-y-2">
            {user ? (
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors">
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
