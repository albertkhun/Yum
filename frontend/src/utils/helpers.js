export const formatPrice = (amount, period) =>
  `₹${Number(amount).toLocaleString('en-IN')} ${period || 'per month'}`;

export function getImageUrl(path, opts = {}) {
  if (!path) return 'https://placehold.co/400x300/f97316/white?text=No+Image';

  if (!path.startsWith('http')) {
    return `${import.meta.env.VITE_API_BASE || 'http://localhost:5001'}${path}`;
  }

  if (!path.includes('cloudinary.com')) return path;

  const {
    width   = 800,
    height,
    quality = 'auto',
    crop    = 'fill',
  } = opts;

  const transform = [
    `f_auto`,
    `q_${quality}`,
    `w_${width}`,
    height ? `h_${height}` : null,
    `c_${crop}`,
    `dpr_auto`,
  ].filter(Boolean).join(',');

  const uploadIdx = path.indexOf('/upload/');
  if (uploadIdx === -1) return path;

  const afterUpload = path.slice(uploadIdx + '/upload/'.length);

  const alreadyTransformed = /^[a-z]_[a-zA-Z0-9]/.test(afterUpload);
  if (alreadyTransformed) {
    const slashIdx = afterUpload.indexOf('/');
    if (slashIdx !== -1) {
      const rest = afterUpload.slice(slashIdx + 1);
      return `${path.slice(0, uploadIdx)}/upload/${transform}/${rest}`;
    }
  }

  return `${path.slice(0, uploadIdx)}/upload/${transform}/${afterUpload}`;
}

export const getCardImageUrl   = (path) => getImageUrl(path, { width: 600,  height: 450, crop: 'fill' });
export const getThumbImageUrl  = (path) => getImageUrl(path, { width: 120,  height: 90,  crop: 'fill' });
export const getDetailImageUrl = (path) => getImageUrl(path, { width: 1200, height: 675, crop: 'fill' });
export const getHeroImageUrl   = (path) => getImageUrl(path, { width: 1400, quality: 'auto:best' });

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
    PG:        'bg-green-100 text-green-700',
    Hostel:    'bg-yellow-100 text-yellow-700',
    Lodge:     'bg-pink-100 text-pink-700',
    Tolet:     'bg-teal-100 text-teal-700',
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
  'WiFi', 'Parking', 'Water', 'Electricity', 'Study Table', 'Security', 'Kitchen', 'Bathroom attached',
];