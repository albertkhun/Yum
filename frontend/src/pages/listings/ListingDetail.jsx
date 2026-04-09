import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { MapPin, Phone, IndianRupee, CheckCircle2, ArrowLeft, Share2, Flag } from 'lucide-react';
import ImageCarousel   from '../../components/common/ImageCarousel';
import MapPicker       from '../../components/common/MapPicker';
import { PageSpinner } from '../../components/common/Spinner';
import { listingAPI }  from '../../services/api';
import { useAuth }     from '../../context/AuthContext';
import { formatPrice, timeAgo, getCategoryColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ListingDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing,   setListing]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    listingAPI.getById(id)
      .then(({ data }) => setListing(data.listing))
      .catch(() => navigate('/listings'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: listing.title, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }
  };

  if (loading) return <PageSpinner />;
  if (!listing) return null;

  const { title, description, category, price, location, images, facilities, contactNumber, whatsappNumber, status, approved, createdBy, createdAt } = listing;
  const isOwner = user?.id === (createdBy?._id || createdBy);

  return (
    <div className="page-wrapper max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-brand text-sm font-medium mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to listings
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          <ImageCarousel images={images} title={title} />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`badge text-xs ${getCategoryColor(category)}`}>{category}</span>
                  <span className={`badge text-xs ${status === 'available' ? 'badge-green' : 'badge-red'}`}>{status === 'available' ? '● Available' : '● Rented'}</span>
                  {approved && <span className="badge badge-blue text-xs"><CheckCircle2 size={11} /> Verified</span>}
                </div>
                <h1 className="font-display font-bold text-gray-900 text-xl sm:text-2xl lg:text-3xl leading-snug">{title}</h1>
              </div>
              <button onClick={handleShare} className="p-2.5 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-brand hover:text-brand transition-colors"><Share2 size={18} /></button>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
              <MapPin size={16} className="text-brand shrink-0" />
              <span>{location?.locality}{location?.landmark ? `, near ${location.landmark}` : ''}, {location?.district}</span>
            </div>
            <div className="flex items-baseline gap-1 pb-4 border-b border-gray-100">
              <IndianRupee size={20} className="text-brand" />
              <span className="font-display font-bold text-3xl text-brand">{Number(price?.amount).toLocaleString('en-IN')}</span>
              <span className="text-gray-400 text-sm ml-1">{price?.period}</span>
            </div>
            <div className="pt-4">
              <h2 className="font-display font-bold text-gray-900 text-lg mb-3">About this property</h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">{description}</p>
            </div>
          </div>

          {facilities?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="font-display font-bold text-gray-900 text-lg mb-4">Facilities & Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {facilities.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 bg-orange-50 rounded-xl px-3 py-2.5">
                    <CheckCircle2 size={15} className="text-brand shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-display font-bold text-gray-900 text-lg mb-4">Location Details</h2>
            <div className="space-y-3">
              {[{ label: 'District', value: location?.district }, { label: 'Locality', value: location?.locality }, { label: 'Landmark', value: location?.landmark || '—' }].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500 font-medium">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {location?.coordinates?.lat && location?.coordinates?.lng && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="font-display font-bold text-gray-900 text-lg mb-4">
                Property Location
              </h2>
              <MapPicker
                lat={location.coordinates.lat}
                lng={location.coordinates.lng}
                readOnly
              />
            </div>
          )}
        </div>

        {/* Right */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h2 className="font-display font-bold text-gray-900 text-lg mb-4">Contact Owner</h2>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl mb-5 border border-orange-100">
                <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {createdBy?.name?.[0]?.toUpperCase() || 'O'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{createdBy?.name || 'Property Owner'}</p>
                  <p className="text-xs text-gray-500">Owner</p>
                </div>
              </div>
              <div className="space-y-3">
                {showPhone ? (
                  <a href={`tel:${contactNumber}`} className="flex items-center justify-center gap-2.5 bg-brand hover:bg-brand-dark text-white font-semibold py-3.5 rounded-xl transition-colors text-sm w-full">
                    <Phone size={17} />{contactNumber}
                  </a>
                ) : (
                  <button onClick={() => setShowPhone(true)} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Phone size={17} />Show Phone Number
                  </button>
                )}
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in your listing: ${title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-3.5 rounded-xl transition-colors text-sm w-full"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">Posted {timeAgo(createdAt)}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-2.5">
                <Flag size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Safety Tip</p>
                  <p className="text-xs text-amber-700 leading-relaxed">Always visit the property in person before making any payment. Never transfer money without seeing the property.</p>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Owner Actions</p>
                <Link to={`/owner/edit/${listing._id}`} className="btn-secondary w-full text-center text-sm block">Edit Listing</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
