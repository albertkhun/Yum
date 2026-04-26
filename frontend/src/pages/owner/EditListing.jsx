import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { listingAPI } from '../../services/api';
import { DISTRICTS, CATEGORIES, FACILITIES, getImageUrl } from '../../utils/helpers';
import MapPicker from '../../components/common/MapPicker';
import toast from 'react-hot-toast';

const PERIODS = ['per month', 'per week', 'per day'];

export default function EditListing() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [loading,        setLoading]        = useState(false);
  const [fetching,       setFetching]       = useState(true);
  const [existingImages, setExistingImages] = useState([]);
  const [existingVR,     setExistingVR]     = useState('');
  const [vrFile,         setVrFile]         = useState(null);
  const [vrRemoved,      setVrRemoved]      = useState(false);
  const [newPreviews,    setNewPreviews]    = useState([]);
  const [coords,         setCoords]         = useState({ lat: null, lng: null });
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    priceAmount: '', pricePeriod: 'per month',
    district: '', locality: '', landmark: '',
    facilities: [], contactNumber: '', whatsappNumber: '', status: 'available',
  });

  useEffect(() => {
    listingAPI.getById(id)
      .then(({ data }) => {
        const l = data.listing;
        setForm({
          title: l.title, description: l.description, category: l.category,
          priceAmount: l.price?.amount, pricePeriod: l.price?.period || 'per month',
          district: l.location?.district, locality: l.location?.locality,
          landmark: l.location?.landmark || '',
          facilities: l.facilities || [],
          contactNumber: l.contactNumber, whatsappNumber: l.whatsappNumber || '', status: l.status,
        });
        setExistingImages(l.images || []);
        setExistingVR(l.vrMediaUrl || '');
        if (l.location?.coordinates?.lat) {
          setCoords({ lat: l.location.coordinates.lat, lng: l.location.coordinates.lng });
        }
      })
      .catch(() => { toast.error('Listing not found'); navigate('/owner'); })
      .finally(() => setFetching(false));
  }, [id]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleFacility = (f) =>
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter((x) => x !== f)
        : [...prev.facilities, f],
    }));


  const handleVR = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVrFile({ file, url: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'video' : 'image' });
    setVrRemoved(false);
  };
  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    const total = existingImages.length + newPreviews.length + files.length;
    if (total > 6) return toast.error('Maximum 6 images total');
    const urls = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setNewPreviews((p) => [...p, ...urls]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'facilities') v.forEach((f) => fd.append('facilities', f));
        else fd.append(k, v);
      });
      if (coords.lat) fd.append('lat', coords.lat);
      if (coords.lng) fd.append('lng', coords.lng);
      newPreviews.forEach(({ file }) => fd.append('images', file));
      await listingAPI.update(id, fd);
      // Handle VR upload/removal
      if (vrFile) {
        const vrFd = new FormData();
        vrFd.append('vrMedia', vrFile.file);
        try { await listingAPI.uploadVR(id, vrFd); } catch (_) {}
      } else if (vrRemoved && existingVR) {
        try { await listingAPI.removeVR(id); } catch (_) {}
      }
      toast.success('Listing updated! Pending re-review.');
      navigate('/owner');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const SectionTitle = ({ children }) => (
    <h2 className="font-display font-bold text-base sm:text-lg mb-4 pb-3 border-b border-gray-100">{children}</h2>
  );

  return (
    <div className="page-wrapper max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/owner" className="p-2 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-brand hover:text-brand transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="section-title">Edit Listing</h1>
          <p className="text-gray-500 text-sm">Changes require re-approval</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Basic */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <SectionTitle>Basic Information</SectionTitle>
          <div className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input name="title" value={form.title} onChange={handle} className="input" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select name="category" value={form.category} onChange={handle} className="input appearance-none">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" value={form.status} onChange={handle} className="input appearance-none">
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input name="contactNumber" value={form.contactNumber} onChange={handle} className="input" type="tel" />
            </div>
            <div>
              <label className="label">
                WhatsApp Number
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-500 text-lg"></span>
                <input name="whatsappNumber" value={form.whatsappNumber} onChange={handle}
                  className="input pl-10" placeholder="+91 98765 43210" type="tel" />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" value={form.description} onChange={handle} rows={4} className="input resize-none" />
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <SectionTitle>Pricing</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (₹)</label>
              <input name="priceAmount" value={form.priceAmount} onChange={handle} type="number" min="0" className="input" />
            </div>
            <div>
              <label className="label">Period</label>
              <div className="flex gap-2">
                {PERIODS.map((p) => (
                  <button key={p} type="button" onClick={() => setForm({ ...form, pricePeriod: p })}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-colors ${form.pricePeriod === p ? 'border-brand bg-orange-50 text-brand' : 'border-gray-200 text-gray-600'}`}>
                    {p.replace('per ', '/')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <SectionTitle>Location</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">District</label>
              <select name="district" value={form.district} onChange={handle} className="input appearance-none">
                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Locality</label>
              <input name="locality" value={form.locality} onChange={handle} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Landmark</label>
              <input name="landmark" value={form.landmark} onChange={handle} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">
                Pin Location on Map
                <span className="text-gray-400 font-normal ml-1">(optional — helps users find you)</span>
              </label>
              <MapPicker
                lat={coords.lat} lng={coords.lng}
                onChange={(pos) => setCoords(pos ?? { lat: null, lng: null })}
              />
            </div>
          </div>
        </div>

        {/* Facilities */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <SectionTitle>Facilities</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {FACILITIES.map((f) => (
              <button key={f} type="button" onClick={() => toggleFacility(f)}
                className={`px-3 py-2 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all ${form.facilities.includes(f) ? 'border-brand bg-orange-50 text-brand' : 'border-gray-200 text-gray-600'}`}>
                {form.facilities.includes(f) ? '✓ ' : ''}{f}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <SectionTitle>Photos</SectionTitle>
          <p className="text-xs text-gray-400 mb-4">Existing photos are kept. Upload new ones to add (max 6 total).</p>
          {existingImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
              {existingImages.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://placehold.co/100x100/f97316/white?text=Img'; }} />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] text-center py-0.5">Existing</div>
                </div>
              ))}
            </div>
          )}
          {(existingImages.length + newPreviews.length) < 6 && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 cursor-pointer hover:border-brand hover:bg-orange-50 transition-colors mb-3">
              <Upload size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-600 font-medium">Add more photos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleNewImages} />
            </label>
          )}
          {newPreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {newPreviews.map(({ url }, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setNewPreviews((p) => p.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* VR Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <h2 className="font-display font-bold text-gray-900 text-base sm:text-lg mb-4 pb-3 border-b border-gray-100">360° Virtual Tour (optional)</h2>
          {(existingVR && !vrRemoved && !vrFile) ? (
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video">
              {existingVR.includes('/video/') || /\.(mp4|mov|webm)/i.test(existingVR)
                ? <video src={existingVR} className="w-full h-full object-cover" muted />
                : <img src={existingVR} alt="VR" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="badge bg-brand text-white text-xs px-3 py-1.5">🥽 Current VR Tour</span>
              </div>
              <button type="button" onClick={() => setVrRemoved(true)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : vrFile ? (
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video">
              {vrFile.type === 'video'
                ? <video src={vrFile.url} className="w-full h-full object-cover" muted />
                : <img src={vrFile.url} alt="VR" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="badge bg-brand text-white text-xs px-3 py-1.5">🥽 New {vrFile.type === 'video' ? 'Video' : 'Panorama'}</span>
              </div>
              <button type="button" onClick={() => setVrFile(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center">
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-orange-200 bg-orange-50 rounded-2xl p-6 cursor-pointer hover:border-brand transition-colors">
              <span className="text-2xl mb-2">🥽</span>
              <span className="text-sm font-semibold text-gray-700 mb-1">{vrRemoved ? 'Upload replacement VR media' : 'Upload 360° Media'}</span>
              <span className="text-xs text-gray-400">Panorama image or 360° video · Max 200 MB</span>
              <input type="file" accept="image/*,video/mp4,video/mov,video/webm,.mov" className="hidden" onChange={handleVR} />
            </label>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="submit" disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Save size={17} />Save Changes</>}
          </button>
          <Link to="/owner" className="btn-secondary text-center sm:px-8">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
