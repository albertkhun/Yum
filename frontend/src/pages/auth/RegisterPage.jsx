import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', phone: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Name, email and password are required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const data = await register(form);
      toast.success(`Account created! Welcome, ${data.user.name} `);
      if (data.user.role === 'owner') navigate('/owner');
      else navigate('/listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-gray-900">Yum-<span className="text-brand">Rental & Stay Platform</span></span>
          </Link>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-1">Create account</h1>
          <p className="text-gray-500 text-sm">Join Yum today</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-orange-100/50 border border-orange-100/60 p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ val: 'user', label: 'User' }, { val: 'owner', label: ' Owner' }].map(({ val, label }) => (
                  <button key={val} type="button" onClick={() => setForm({ ...form, role: val })}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${form.role === val ? 'border-brand bg-orange-50 text-brand' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handle} placeholder="Your full name" className="input" autoComplete="name" />
            </div>

            <div>
              <label className="label">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handle} placeholder="you@example.com" className="input" autoComplete="email" />
            </div>

            <div>
              <label className="label">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="tel" name="phone" value={form.phone} onChange={handle} placeholder="+91 98765 43210" className="input" />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} name="password" value={form.password} onChange={handle}
                  placeholder="Min. 6 characters" className="input pr-12" autoComplete="new-password" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${
                      form.password.length >= n * 3
                        ? n <= 1 ? 'bg-red-400' : n <= 2 ? 'bg-yellow-400' : n <= 3 ? 'bg-blue-400' : 'bg-green-400'
                        : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><UserPlus size={18} />Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
