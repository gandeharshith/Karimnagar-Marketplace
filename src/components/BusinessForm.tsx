import { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { Business } from '../types';
import { LOCATIONS, ALL_LOCATIONS, CATEGORIES, ALL_CATEGORIES } from '../types';
import { checkContactExists } from '../services/mongodb';

interface Props {
  initial?: Partial<Business>;
  onSave: (data: Business) => void;
  onCancel: () => void;
  loading?: boolean;
}

const emptyForm: Business = {
  location: '',
  subLocation: '',
  category: '',
  subCategory: '',
  businessName: '',
  contactNumber: '',
  address: '',
  messageLink: '',
  postersLink: '',
  isAryaVysya: false,
  images: [],
};

export default function BusinessForm({ initial, onSave, onCancel, loading }: Props) {
  const [form, setForm] = useState<Business>({ ...emptyForm, ...initial });
  const [imgLoading, setImgLoading] = useState(false);
  const [contactStatus, setContactStatus] = useState<
    'idle' | 'checking' | 'exists' | 'ok'
  >('idle');
  const [contactExistingBiz, setContactExistingBiz] = useState<Business | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const contactCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived sub-lists
  const subLocations = form.location ? (LOCATIONS[form.location] || ['Other']) : [];
  const subCategories = form.category ? (CATEGORIES[form.category] || ['Other']) : [];

  // Reset sub-location when location changes
  useEffect(() => {
    if (form.location && !LOCATIONS[form.location]?.includes(form.subLocation)) {
      setForm((f) => ({ ...f, subLocation: '' }));
    }
  }, [form.location]);

  // Reset sub-category when category changes
  useEffect(() => {
    if (form.category && !CATEGORIES[form.category]?.includes(form.subCategory)) {
      setForm((f) => ({ ...f, subCategory: '' }));
    }
  }, [form.category]);

  const set = (field: keyof Business, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ── Contact number duplicate check ──────────────────────────────────────────
  const handleContactChange = (val: string) => {
    set('contactNumber', val);
    setContactStatus('idle');
    setContactExistingBiz(null);

    if (contactCheckTimer.current) clearTimeout(contactCheckTimer.current);

    if (val.trim().length >= 7) {
      setContactStatus('checking');
      contactCheckTimer.current = setTimeout(async () => {
        try {
          const existing = await checkContactExists(val.trim(), initial?._id);
          if (existing) {
            setContactStatus('exists');
            setContactExistingBiz(existing);
          } else {
            setContactStatus('ok');
          }
        } catch {
          setContactStatus('idle');
        }
      }, 600);
    }
  };

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    setImgLoading(true);
    const promises = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX = 900;
              let w = img.width,
                h = img.height;
              if (w > MAX) {
                h = (h * MAX) / w;
                w = MAX;
              }
              if (h > MAX) {
                w = (w * MAX) / h;
                h = MAX;
              }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d')!;
              ctx.drawImage(img, 0, 0, w, h);
              resolve(canvas.toDataURL('image/jpeg', 0.78));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );
    Promise.all(promises)
      .then((base64s) => {
        set('images', [...(form.images || []), ...base64s]);
        setImgLoading(false);
      })
      .catch(() => setImgLoading(false));
  };

  const removeImage = (idx: number) => {
    set('images', (form.images || []).filter((_, i) => i !== idx));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName.trim()) return alert('Business Name is required');
    if (!form.contactNumber.trim()) return alert('Contact Number is required');
    if (!form.location) return alert('Location is required');
    if (!form.category) return alert('Category is required');
    if (contactStatus === 'exists') {
      if (
        !window.confirm(
          `A business with this contact number already exists:\n"${contactExistingBiz?.businessName}"\n\nDo you still want to save?`
        )
      )
        return;
    }
    onSave(form);
  };

  return (
    <form className="business-form" onSubmit={handleSubmit} noValidate>
      {/* ── Section 1: Location ─────────────────────────────────────────────── */}
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="section-num">1</span> Location
        </h3>
        <div className="form-grid">
          <div className="form-group required">
            <label>Location *</label>
            <select
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              required
            >
              <option value="">Select Location</option>
              {ALL_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group required">
            <label>Sub Location *</label>
            <select
              value={form.subLocation}
              onChange={(e) => set('subLocation', e.target.value)}
              required
              disabled={!form.location}
            >
              <option value="">
                {form.location ? 'Select Sub Location' : 'Select Location first'}
              </option>
              {subLocations.map((sl) => (
                <option key={sl} value={sl}>
                  {sl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 2: Category ─────────────────────────────────────────────── */}
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="section-num">2</span> Category
        </h3>
        <div className="form-grid">
          <div className="form-group required">
            <label>Category *</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              required
            >
              <option value="">Select Category</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group required">
            <label>Sub Category *</label>
            <select
              value={form.subCategory}
              onChange={(e) => set('subCategory', e.target.value)}
              required
              disabled={!form.category}
            >
              <option value="">
                {form.category ? 'Select Sub Category' : 'Select Category first'}
              </option>
              {subCategories.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 3: Business Info ─────────────────────────────────────────── */}
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="section-num">3</span> Business Information
        </h3>
        <div className="form-grid">
          <div className="form-group required full-width">
            <label>Business Name *</label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => set('businessName', e.target.value)}
              placeholder="Enter business name"
              required
            />
          </div>

          <div className="form-group required">
            <label>Contact Number *</label>
            <div className="contact-input-wrap">
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) => handleContactChange(e.target.value)}
                placeholder="e.g. 9876543210"
                required
              />
              <span className={`contact-status contact-${contactStatus}`}>
                {contactStatus === 'checking' && (
                  <Loader size={14} className="spin" />
                )}
                {contactStatus === 'exists' && (
                  <AlertCircle size={14} />
                )}
                {contactStatus === 'ok' && (
                  <CheckCircle size={14} />
                )}
              </span>
            </div>
            {contactStatus === 'exists' && contactExistingBiz && (
              <div className="contact-warning">
                <AlertCircle size={13} />
                Already exists: <strong>{contactExistingBiz.businessName}</strong>
                {' '}({contactExistingBiz.location} › {contactExistingBiz.subLocation})
              </div>
            )}
            {contactStatus === 'ok' && (
              <div className="contact-ok">
                <CheckCircle size={13} /> Contact number is available
              </div>
            )}
          </div>

          <div className="form-group full-width">
            <label>Address</label>
            <textarea
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Full address of the business"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* ── Section 4: Links ─────────────────────────────────────────────────── */}
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="section-num">4</span> Links & Media
        </h3>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Message Link</label>
            <input
              type="url"
              value={form.messageLink || ''}
              onChange={(e) => set('messageLink', e.target.value)}
              placeholder="YouTube or Facebook link (e.g. https://youtube.com/watch?v=...)"
            />
            <span className="field-hint">YouTube video or Facebook post link</span>
          </div>

          <div className="form-group full-width">
            <label>Posters Link</label>
            <input
              type="url"
              value={form.postersLink || ''}
              onChange={(e) => set('postersLink', e.target.value)}
              placeholder="Direct URL to GIF or image poster (e.g. https://example.com/poster.gif)"
            />
            <span className="field-hint">Direct link to a GIF, JPG, PNG or other image</span>
          </div>
        </div>
      </div>

      {/* ── Section 5: Arya Vysya ────────────────────────────────────────────── */}
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="section-num">5</span> Community
        </h3>
        <div className="arya-vysya-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={!!form.isAryaVysya}
              onChange={(e) => set('isAryaVysya', e.target.checked)}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            <span className="toggle-text">
              This business belongs to <strong>Arya Vysya</strong> community
            </span>
          </label>
          {form.isAryaVysya && (
            <div className="arya-vysya-note">
              ✅ This business will be tagged as <strong>Arya Vysya</strong> and can be filtered separately.
            </div>
          )}
        </div>
      </div>

      {/* ── Section 6: Images ────────────────────────────────────────────────── */}
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="section-num">5</span> Upload Images
        </h3>
        <div
          className="image-upload-zone"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleImageUpload(e.dataTransfer.files);
          }}
        >
          <Upload size={30} />
          <p>Click or drag & drop images here</p>
          <p className="upload-hint">JPG, PNG, GIF, WebP – compressed to max 900px</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleImageUpload(e.target.files)}
          />
        </div>

        {imgLoading && (
          <p className="upload-loading">
            <Loader size={14} className="spin" /> Processing images...
          </p>
        )}

        {(form.images || []).length > 0 && (
          <div className="image-preview-grid">
            {(form.images || []).map((img, i) => (
              <div key={i} className="image-preview-item">
                <img src={img} alt={`Preview ${i + 1}`} />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => removeImage(i)}
                  title="Remove image"
                >
                  <Trash2 size={13} />
                </button>
                {i === 0 && <span className="primary-badge">Main</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || imgLoading}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" /> Saving...
            </span>
          ) : (
            initial?._id ? 'Update Business' : 'Add Business'
          )}
        </button>
      </div>
    </form>
  );
}
