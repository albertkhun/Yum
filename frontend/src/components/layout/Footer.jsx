import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
} from 'lucide-react';

import yumvrLogo from '../../assets/yumvr-logo.jpeg';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 mb-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-2.5 group yumvr-nav-brand mb-3"
            >
              <div className="yumvr-logo-wrap">
                <img src={yumvrLogo} alt="YumVR" className="yumvr-logo-img" />
              </div>
              <div className="yumvr-brand-text">
                <div className="yumvr-name">
                  <span className="yumvr-yum text-white">Yum</span>
                  <span className="yumvr-vr">VR</span>
                </div>
                <div className="yumvr-tagline">Rental &amp; Stay Platform</div>
              </div>
            </Link>

            <p className="text-sm text-gray-400 leading-relaxed max-w-xs mb-5">
              Discover PGs, rooms, hostels, rentals, and stays with immersive
              VR tours on YumVR. Explore smarter living across Manipur.
            </p>

            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=100069704782347" target="_blank" rel="noreferrer" className="footer-social">
                <Facebook size={17} />
              </a>
              <a href="https://www.instagram.com/yumvr.tech/" target="_blank" rel="noreferrer" className="footer-social">
                <Instagram size={17} />
              </a>
              <a href="https://www.youtube.com/channel/UCFY_YsIl0NxM0KH7vtGHtxw" target="_blank" rel="noreferrer" className="footer-social">
                <Youtube size={17} />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="text-brand mt-0.5 shrink-0" />
                <span className="text-gray-400">Imphal, Manipur, India</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="text-brand shrink-0" />
                <span className="text-gray-400">+91 9366256348</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="text-brand shrink-0" />
                <span className="text-gray-400">support.yumvr.tech@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} YumVR. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-brand transition-colors duration-150">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}