export const formatPrice = (amount, period) =>
  `₹${Number(amount).toLocaleString('en-IN')} ${period || 'per month'}`;

export const getImageUrl = (path) => {
  if (!path) return 'https://placehold.co/400x300/f97316/white?text=No+Image';
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}${path}`;
};

export const truncate = (str, n = 80) =>
  str?.length > n ? str.slice(0, n) + '...' : str;

export const timeAgo = (date) => {
  const now  = new Date();
  const past = new Date(date);
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

export const getCategoryColor = (category) => {
  const map = {
    Rent:      'bg-blue-100 text-blue-700',
    Apartment: 'bg-purple-100 text-purple-700',
    PG:     'bg-green-100 text-green-700',
    Hostel:    'bg-yellow-100 text-yellow-700',
    Lodge:      'bg-pink-100 text-pink-700',
    Tolet:      'bg-teal-100 text-teal-700',
    Other:     'bg-gray-100 text-gray-600',
  };
  return map[category] || map.Other;
};

export const DISTRICTS = [
  'Imphal East', 'Imphal West', 'Thoubal', 'Bishnupur',
  'Churachandpur', 'Chandel', 'Ukhrul', 'Senapati',
  'Tamenglong', 'Jiribam', 'Kakching', 'Kangpokpi',
  'Noney', 'Pherzawl', 'Tengnoupal', 'Kamjong',
];

export const CATEGORIES = [
  'Rent', 'Apartment', 'PG', 'Hostel', 'Lodge', 'Tolet', 'Other',
];

export const FACILITIES = [
  'WiFi', 'Parking', 'Water', 'Electricity', 'Furnished',
  'AC', 'Security', 'CCTV', 'Kitchen', 'Bathroom attached',
  'Balcony', 'Garden', 'Lift', 'Generator backup',
];
