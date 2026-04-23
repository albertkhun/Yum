import { useState, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import { X, Home, Building2, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const nameRegex = /^[A-Za-z\s'-]+$/;

export default function GoogleCompleteModal({ googleProfile, onClose }) {
  const { completeGoogleProfile } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [role,      setRole]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});

  // Pre-fill from Google
  useEffect(() => {
    if (googleProfile) {
      setFirstName(googleProfile.firstName || '');
      setLastName(googleProfile.lastName  || '');
    }
  }, [googleProfile]);

  const validate = () => {
    const e = {};
    if (!firstName.trim())          e.firstName = 'First name is required';
    else if (!nameRegex.test(firstName)) e.firstName = 'Letters only, no numbers or symbols';
    if (!lastName.trim())           e.lastName  = 'Last name is required';
    else if (!nameRegex.test(lastName))  e.lastName  = 'Letters only, no numbers or symbols';
    if (!role)                      e.role      = 'Please choose your role';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const data = await completeGoogleProfile({
        googleId: googleProfile.googleId,
        email:    googleProfile.email,
        avatar:   googleProfile.picture,
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        role,
      });
      toast.success(`Welcome, ${data.user.name}! 🎉`);
      if (role === 'owner') navigate('/owner');
      else                  navigate('/listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally { setLoading(false); }
  };

  const Field = ({ id, label, value, onChange, error, placeholder }) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} type="text" value={value} onChange={onChange}
        placeholder={placeholder} className={`input ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {googleProfile?.picture && (
              <img src={googleProfile.picture} alt="Google avatar"
                className="w-10 h-10 rounded-full border-2 border-gray-100" />
            )}
            <div>
              <h2 className="font-display font-bold text-gray-900 text-lg leading-tight">
                Complete your profile
              </h2>
              <p className="text-xs text-gray-500">{googleProfile?.email}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="firstName" label="First Name" value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setErrors(p => ({...p, firstName: ''})); }}
              placeholder="e.g. Ravi" error={errors.firstName} />
            <Field id="lastName" label="Last Name" value={lastName}
              onChange={(e) => { setLastName(e.target.value); setErrors(p => ({...p, lastName: ''})); }}
              placeholder="e.g. Singh" error={errors.lastName} />
          </div>

          {/* Role picker */}
          {/* Role picker */}
<div>
  <label className="label">I want to</label>
  <div className="grid grid-cols-2 gap-3">
    {[
      { val: 'user',  icon: User,      label: 'Find Rentals' },
      { val: 'owner', icon: Building2, label: 'List Property' },
    ].map(({ val, icon: Icon, label }) => (
      <button
        key={val}
        type="button"
        onClick={() => { setRole(val); setErrors(p => ({ ...p, role: '' })); }}
        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
          ${role === val
            ? 'border-brand bg-orange-50 text-brand'
            : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
      >
        {role === val && (
          <CheckCircle2 size={14} className="absolute top-2 right-2 text-brand" />
        )}

        {/* Icon instead of emoji */}
        <Icon
          size={22}
          className={role === val ? "text-brand" : "text-gray-700"}
        />

        <span className="text-sm font-semibold">{label}</span>
      </button>
    ))}
  </div>
</div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Create Account & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
