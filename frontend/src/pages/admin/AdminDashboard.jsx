import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Users, CheckCircle2, Clock, Home, TrendingUp } from 'lucide-react';
import { adminAPI }    from '../../services/api';
import { PageSpinner } from '../../components/common/Spinner';

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(({ data }) => setStats(data.stats))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const cards = [
    { label: 'Total Listings',   value: stats.totalListings,    icon: Home,         color: 'bg-blue-50 text-blue-600',    border: 'border-blue-100' },
    { label: 'Pending Approval', value: stats.pendingListings,  icon: Clock,        color: 'bg-yellow-50 text-yellow-600',border: 'border-yellow-100' },
    { label: 'Approved',         value: stats.approvedListings, icon: CheckCircle2, color: 'bg-green-50 text-green-600',  border: 'border-green-100' },
    { label: 'Total Users',      value: stats.totalUsers,       icon: Users,        color: 'bg-purple-50 text-purple-600',border: 'border-purple-100' },
    { label: 'Owners',           value: stats.ownerCount,       icon: TrendingUp,   color: 'bg-orange-50 text-brand',     border: 'border-orange-100' },
    { label: 'Available Now',    value: stats.availableListings,icon: ListChecks,   color: 'bg-teal-50 text-teal-600',    border: 'border-teal-100' },
  ];

  return (
    <div className="page-wrapper">
      <div className="flex items-center gap-2 mb-8">
        <LayoutDashboard size={22} className="text-brand" />
        <div>
          <h1 className="section-title">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Platform overview</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {cards.map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`bg-white rounded-2xl border ${border} shadow-sm p-5`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="font-display font-bold text-2xl sm:text-3xl text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { to: '/admin/listings?approved=false', icon: Clock,        color: 'yellow', title: 'Review Pending',  sub: `${stats.pendingListings} listing${stats.pendingListings !== 1 ? 's' : ''} waiting` },
          { to: '/admin/listings',                icon: ListChecks,   color: 'blue',   title: 'All Listings',   sub: `${stats.totalListings} total` },
          { to: '/admin/users',                   icon: Users,        color: 'purple', title: 'Manage Users',   sub: `${stats.totalUsers} registered` },
          { to: '/admin/listings?approved=true',  icon: CheckCircle2, color: 'green',  title: 'Live Listings',  sub: `${stats.approvedListings} approved` },
        ].map(({ to, icon: Icon, color, title, sub }) => (
          <Link key={to} to={to}
            className={`bg-${color}-50 border-2 border-${color}-200 rounded-2xl p-5 hover:border-${color}-400 transition-colors group`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon size={20} className={`text-${color}-600`} />
              </div>
              <div>
                <p className="font-display font-bold text-gray-900">{title}</p>
                <p className={`text-sm text-${color}-700`}>{sub}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
