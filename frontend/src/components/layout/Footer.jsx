import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import yumvrLogo from '../../assets/yumvr-logo.jpeg';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group yumvr-nav-brand mb-3">
              <div className="yumvr-logo-wrap">
                <img src={yumvrLogo} alt="YumVR" className="yumvr-logo-img" />
              </div>
              <div className="yumvr-brand-text">
                <div className="yumvr-name">
                  <span className="yumvr-yum text-white">Yum</span><span className="yumvr-vr">VR</span>
                </div>
                <div className="yumvr-tagline">Rental &amp; Stay Platform</div>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Manipur's trusted rental platform. Find rents, apartments, hostel and more across all districts in Manipur.
            </p>
          </div>
          <div>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Categories</h4>
            <ul className="space-y-2 text-sm">
              {['Rent', 'Apartment', 'PG', 'Hostel', 'Lodge', 'To-let'].map((cat) => (
                <li key={cat}><Link to={`/listings?category=${cat}`} className="hover:text-brand transition-colors duration-150">{cat}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2"><MapPin size={15} className="text-brand mt-0.5 shrink-0" /><span className="text-gray-400">Imphal, Manipur, India</span></li>
              <li className="flex items-center gap-2"><Phone size={15} className="text-brand shrink-0" /><span className="text-gray-400">+91 9366256348</span></li>
              <li className="flex items-center gap-2"><Mail size={15} className="text-brand shrink-0" /><span className="text-gray-400">yum.rental@gmail.com</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Yum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}