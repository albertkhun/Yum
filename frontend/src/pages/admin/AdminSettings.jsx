import { Link } from 'react-router-dom';
import { KeyRound, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSettings() {
  const { user } = useAuth();
  return (
    <div className="page-wrapper max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Settings size={22} className="text-brand" />
        <div>
          <h1 className="section-title">Admin Settings</h1>
          <p className="text-gray-500 text-sm">Manage your admin account</p>
        </div>
      </div>

      {/* Admin profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h2 className="font-display font-bold text-gray-900 text-base mb-4">Admin Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-xl shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge badge-blue text-xs mt-1 inline-flex">
              <ShieldCheck size={11} />Admin
            </span>
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-display font-bold text-gray-900 text-base mb-1">Security</h2>
        <p className="text-sm text-gray-500 mb-4">Manage your admin account security</p>
        <Link to="/admin/change-password"
          className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200
                     hover:border-brand hover:bg-orange-50 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <KeyRound size={18} className="text-brand" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Change Password</p>
              <p className="text-xs text-gray-500">Update your admin account password</p>
            </div>
          </div>
          <span className="text-brand text-xs font-semibold group-hover:underline">Update →</span>
        </Link>
      </div>
    </div>
  );
}
