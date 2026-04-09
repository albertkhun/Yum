import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, X, ArrowLeft, PlusCircle, MapPin } from 'lucide-react';
import { listingAPI } from '../../services/api';
import { DISTRICTS, CATEGORIES, FACILITIES } from '../../utils/helpers';
import MapPicker from '../../components/common/MapPicker';
import toast from 'react-hot-toast';

const PERIODS = ['per month', 'per week', 'per day'];
const Req = () => <span className="text-red-400 ml-0.5">*</span>;
const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
    <h2 className="font-display font-bold text-gray-900 text-base sm:text-lg mb-4 pb-3 border-b border-gray-100">{title}</h2>
    {children}
  </div>
);

export default function CreateListing() {
  const navigate = useNavigate();
  const [loading,  setLoading]  = useState(false);
  const [previews, setPreviews] = useState([]);
  const [coords,   setCoords]   = useState({ lat: null, lng: null });
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    priceAmount: '', pricePeriod: 'per month',
    district: '', locality: '', landmark: '',
    facilities: [], contactNumber: '', whatsappNumber: '',
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleFacility = (f) =>
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter((x) => x !== f)
        : [...prev.facilities, f],
    }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 6 - previews.length);
    const urls  = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews((prev) => [...prev, ...urls].slice(0, 6));
  };

  const removeImage = (idx) => setPreviews((prev) => prev.filter((_, i) => i !== idx));

  const handleCoords = (pos) => {
    setCoords(pos ? { lat: pos.lat, lng: pos.lng } : { lat: null, lng: null });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.priceAmount || !form.district || !form.locality || !form.contactNumber)
      return toast.error('Please fill all required fields');

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'facilities') v.forEach((f) => fd.append('facilities', f));
        else fd.append(k, v);
      });
      // Append coordinates
      if (coords.lat) fd.append('lat', coords.lat);
      if (coords.lng) fd.append('lng', coords.lng);
      previews.forEach(({ file }) => fd.append('images', file));

      await listingAPI.create(fd);
      toast.success('Listing submitted for review! ✅');
      navigate('/owner');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/owner" className="p-2 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-brand hover:text-brand transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="section-title">Post New Listing</h1>
          <p className="text-gray-500 text-sm">Fill in the details below</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">

        {/* Basic Info */}
        <Section title="Basic Information">
          <div className="space-y-4">
            <div>
              <label className="label">Title <Req /></label>
              <input name="title" value={form.title} onChange={handle} className="input" placeholder="e.g. Spacious 2BHK near Kangla Fort" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Category <Req /></label>
                <select name="category" value={form.category} onChange={handle} className="input appearance-none">
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Contact Number <Req /></label>
                <input name="contactNumber" value={form.contactNumber} onChange={handle} className="input" placeholder="+91 98765 43210" type="tel" />
              </div>
            </div>
            {/* WhatsApp */}
            <div>
              <label className="label">
                WhatsApp Number
                <span className="text-gray-400 font-normal ml-1"></span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-500 text-lg"></span>
                <input name="whatsappNumber" value={form.whatsappNumber} onChange={handle}
                  className="input pl-10" placeholder="Enter Whatsapp Number" type="tel" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Users will be redirected to this WhatsApp number</p>
            </div>
            <div>
              <label className="label">Description <Req /></label>
              <textarea name="description" value={form.description} onChange={handle} rows={4}
                className="input resize-none" placeholder="Describe the property, nearby landmarks, rules, etc." />
            </div>
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Pricing">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (₹) <Req /></label>
              <input name="priceAmount" value={form.priceAmount} onChange={handle} type="number" min="0" className="input" placeholder="e.g. 8000" />
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
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="label">District <Req /></label>
              <select name="district" value={form.district} onChange={handle} className="input appearance-none">
                <option value="">Select district</option>
                {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Locality / Area <Req /></label>
              <input name="locality" value={form.locality} onChange={handle} className="input" placeholder="e.g. Paona Bazar" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Landmark <span className="text-gray-400 font-normal">(optional)</span></label>
              <input name="landmark" value={form.landmark} onChange={handle} className="input" placeholder="e.g. Near RIMS Hospital" />
            </div>
          </div>

          {/* Map Picker */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-brand" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Pin on Map <span className="text-gray-400 font-normal">(optional)</span></p>
                <p className="text-xs text-gray-400">Click on the map to mark the exact property location</p>
              </div>
            </div>
            <MapPicker lat={coords.lat} lng={coords.lng} onChange={handleCoords} />
          </div>
        </Section>

        {/* Facilities */}
        <Section title="Facilities & Amenities">
          <div className="flex flex-wrap gap-2">
            {FACILITIES.map((f) => (
              <button key={f} type="button" onClick={() => toggleFacility(f)}
                className={`px-3 py-2 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all ${form.facilities.includes(f) ? 'border-brand bg-orange-50 text-brand' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {form.facilities.includes(f) ? '✓ ' : ''}{f}
              </button>
            ))}
          </div>
        </Section>

        {/* Photos */}
        <Section title="Photos (max 6)">
          {previews.length < 6 && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-brand hover:bg-orange-50 transition-colors mb-4">
              <Upload size={28} className="text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Click to upload photos</span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — max 5MB each</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>
          )}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {previews.map(({ url }, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                  {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-brand/80 text-white text-[10px] text-center py-0.5">Cover</div>}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><PlusCircle size={18} />Submit for Review</>}
          </button>
          <Link to="/owner" className="btn-secondary text-center flex-1 sm:flex-none sm:px-8">Cancel</Link>
        </div>
        <p className="text-xs text-gray-400 text-center">Your listing will be reviewed by our team before going live (usually within 12hrs).</p>
      </form>
    </div>
  );
}
