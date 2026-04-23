import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = [
  {
    value:    'user',
    icon:     Search,
    title:    'Find Rooms & Rentals',
    desc:     'Discover verified rooms, PGs, and apartments across Manipur. Connect directly with owners on Yum—no middlemen, no hassle.',
    perks:    [
      'Smart search & filters',
      'Direct owner contact',
      'Save favourites',
      'Trusted reviews'
    ],
    color:    'blue',
    bg:       'bg-blue-50',
    border:   'border-blue-200',
    selected: 'border-brand ring-2 ring-brand/20 bg-orange-50',
    icon_bg:  'bg-blue-100 text-blue-600',
  },
  {
    value:    'owner',
    icon:     Building2,
    title:    'List Your Property',
    desc:     'List your rooms, apartments, or spaces on Yum and reach genuine tenants across Manipur with zero brokerage.',
    perks:    [
      'Post listings easily',
      'Upload photos & details',
      'Manage availability',
      'Get direct enquiries'
    ],
    color:    'orange',
    bg:       'bg-orange-50',
    border:   'border-orange-200',
    selected: 'border-brand ring-2 ring-brand/30 bg-orange-50',
    icon_bg:  'bg-orange-100 text-brand',
  },
];

export default function RoleSelectPage() {
  const { user, updateRole } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);

  const handleContinue = async () => {
    if (!selected) return toast.error('Please choose how you want to use Yum');
    setLoading(true);
    try {
      await updateRole(selected);
      toast.success( selected === 'owner'? 'Welcome, Property Owner!': 'Welcome! Start browsing listings');
      if (selected === 'owner') navigate('/owner');
      else                      navigate('/listings');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50
                    flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">

        {/* Logo + greeting */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
              <Home size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-gray-900">
              Yum<span className="text-brand"></span>
            </span>
          </div>

          {user?.avatar && (
            <img src={user.avatar} alt={user.name}
              className="w-14 h-14 rounded-full mx-auto mb-3 border-2 border-white shadow-md" />
          )}

          <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-2">
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            What do you want to do on Yum?
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelected(role.value)}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200
                            ${isSelected ? role.selected : `${role.bg} ${role.border} hover:border-opacity-60`}`}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 size={22} className="text-brand fill-brand" />
                  </div>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${role.icon_bg}`}>
                  <Icon size={24} />
                </div>

                {/* Text */}
                <h2 className="font-display font-bold text-gray-900 text-lg mb-2 leading-snug">
                  <span className="flex items-center gap-2">
                    <Icon size={18} className="text-gray-700" />
                    {role.title}
                  </span>
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {role.desc}
                </p>

                {/* Perks */}
                <ul className="space-y-1.5">
                  {role.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="btn-primary w-full flex items-center justify-center gap-2
                     text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Continue <ArrowRight size={18} /></>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          You can change this anytime from your Settings
        </p>
      </div>
    </div>
  );
}