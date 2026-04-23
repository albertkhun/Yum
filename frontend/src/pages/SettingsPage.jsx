import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Search, Building2, CheckCircle2, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateRole, logout } = useAuth();
  const navigate  = useNavigate();
  const [selected, setSelected] = useState(user?.role || null);
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    if (selected === user?.role) return toast('No changes made');
    if (!['user', 'owner'].includes(selected)) return toast.error('Invalid role');
    setSaving(true);
    try {
      await updateRole(selected);
      toast.success('Role updated!');
      if (selected === 'owner') navigate('/owner');
      else                      navigate('/listings');
    } catch {
      toast.error('Failed to update role');
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const ROLES = [
    { value: 'user',  icon: Search,    label: 'Find Rooms / Rentals',   desc: 'Browse and contact owners' },
    { value: 'owner', icon: Building2, label: 'List Your Property',     desc: 'Post and manage listings' },
  ];

  return (
    <div className="page-wrapper max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={22} className="text-brand" />
        <h1 className="section-title">Settings</h1>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="font-display font-bold text-gray-900 text-base mb-4">
          Profile
        </h2>
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name}
              className="w-14 h-14 rounded-full border-2 border-orange-100 shrink-0" />
          ) : (
            <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center
                            justify-center text-brand font-bold text-xl shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <span className="badge badge-orange capitalize text-xs mt-1 inline-flex">
              {user?.role || 'No role'}
            </span>
          </div>
        </div>
      </div>

      {/* Role selection */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="font-display font-bold text-gray-900 text-base mb-1">
          Your Role
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Change how you use MeiteiStay
        </p>

        <div className="space-y-3 mb-5">
          {ROLES.map(({ value, icon: Icon, label, desc }) => {
            const isSelected = selected === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelected(value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left
                            transition-all duration-150
                            ${isSelected
                              ? 'border-brand bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                  ${isSelected ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm transition-colors
                                  ${isSelected ? 'text-brand' : 'text-gray-800'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                {isSelected && <CheckCircle2 size={20} className="text-brand shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || selected === user?.role}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {saving
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : 'Save Changes'}
        </button>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-display font-bold text-gray-900 text-base mb-4">
          Account
        </h2>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                     bg-red-50 text-red-600
                     font-semibold text-sm hover:bg-red-100 transition-colors"
        >
          <LogOut size={16} />Logout
        </button>
      </div>
    </div>
  );
}