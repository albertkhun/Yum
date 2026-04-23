import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ChangePasswordPage({ adminMode = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleShow = (field) => setShow(s => ({ ...s, [field]: !s[field] }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword)
      return toast.error('All fields are required');
    if (form.newPassword !== form.confirmPassword)
      return toast.error('New passwords do not match');
    const minLen = adminMode ? 8 : 6;
    if (form.newPassword.length < minLen)
      return toast.error(`Password must be at least ${minLen} characters`);
    if (form.newPassword === form.currentPassword)
      return toast.error('New password must be different from current');

    setLoading(true);
    try {
      const payload = { currentPassword: form.currentPassword, newPassword: form.newPassword };
      if (adminMode) await authAPI.adminChangePassword(payload);
      else           await authAPI.changePassword(payload);
      toast.success('Password changed successfully! 🔒');
      navigate(adminMode ? '/admin/settings' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  const backTo = adminMode ? '/admin/settings' : '/';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to={backTo}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              {adminMode
                ? <ShieldCheck size={20} className="text-brand" />
                : <KeyRound size={20} className="text-brand" />}
              <h1 className="font-display font-bold text-gray-900 text-2xl">
                {adminMode ? 'Admin' : ''} Change Password
              </h1>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              {adminMode ? 'Update your admin account password' : 'Update your account password'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-5">

            {[
              { field: 'currentPassword', showKey: 'current', label: 'Current Password',  placeholder: 'Enter current password' },
              { field: 'newPassword',     showKey: 'new',     label: 'New Password',       placeholder: adminMode ? 'Min. 8 characters' : 'Min. 6 characters' },
              { field: 'confirmPassword', showKey: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ].map(({ field, showKey, label, placeholder }) => (
              <div key={field}>
                <label className="label">{label}</label>
                <div className="relative">
                  <input
                    type={show[showKey] ? 'text' : 'password'}
                    name={field}
                    value={form[field]}
                    onChange={handle}
                    placeholder={placeholder}
                    className="input pr-12"
                    autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'}
                  />
                  <button type="button" onClick={() => toggleShow(showKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {show[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            ))}

            {/* Strength bar */}
            {form.newPassword && (
              <div className="flex gap-1">
                {[1,2,3,4].map((n) => (
                  <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${
                    form.newPassword.length >= n * 3
                      ? n <= 1 ? 'bg-red-400' : n <= 2 ? 'bg-yellow-400' : n <= 3 ? 'bg-blue-400' : 'bg-green-400'
                      : 'bg-gray-200'
                  }`} />
                ))}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><KeyRound size={17} />Update Password</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
