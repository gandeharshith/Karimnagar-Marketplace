import {
  X, MapPin, Phone, Clock, ExternalLink, Image as ImageIcon,
  ChevronLeft, ChevronRight, Tag, Calendar, Youtube, Facebook
} from 'lucide-react';
import { useState } from 'react';
import type { Business } from '../types';

interface Props {
  business: Business;
  onClose: () => void;
}

function formatDateTime(iso?: string) {
  if (!iso) return '–';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/i.test(url);
}

function isFacebook(url: string) {
  return /facebook\.com|fb\.com/i.test(url);
}

function getYouTubeEmbedId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function BusinessModal({ business, onClose }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = business.images || [];
  const hasImages = images.length > 0;
  const hasPoster = !!business.postersLink;
  const hasMessage = !!business.messageLink;
  const ytId = hasMessage && isYouTube(business.messageLink!)
    ? getYouTubeEmbedId(business.messageLink!)
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* ── Image Gallery ─────────────────────────────────────────────────── */}
        {hasImages && (
          <div className="modal-gallery">
            <img
              src={images[imgIdx]}
              alt={business.businessName}
              className="modal-main-img"
            />
            {images.length > 1 && (
              <div>
                <button
                  className="gallery-btn gallery-prev"
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="gallery-btn gallery-next"
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                >
                  <ChevronRight size={20} />
                </button>
                <div className="gallery-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`gallery-dot ${i === imgIdx ? 'active' : ''}`}
                      onClick={() => setImgIdx(i)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Poster (if no uploaded images) ───────────────────────────────── */}
        {!hasImages && hasPoster && (
          <div className="modal-poster">
            <img
              src={business.postersLink}
              alt={`${business.businessName} poster`}
              className="modal-main-img"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="modal-body">
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="modal-header-info">
            <div>
              <h2 className="modal-title">{business.businessName}</h2>
              <div className="modal-breadcrumb">
                <span className="modal-location">
                  <MapPin size={13} />
                  {business.subLocation
                    ? `${business.subLocation}, ${business.location}`
                    : business.location}
                </span>
                <span className="breadcrumb-sep">·</span>
                <span className="modal-category">{business.category}</span>
                {business.subCategory && (
                  <span className="modal-subcategory">
                    <span className="breadcrumb-sep">›</span>
                    <Tag size={12} /> {business.subCategory}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Arya Vysya Banner ────────────────────────────────────────────── */}
          {business.isAryaVysya && (
            <div className="modal-arya-banner">
              🏅 <strong>Arya Vysya</strong> Community Business
            </div>
          )}

          {/* ── Contact ─────────────────────────────────────────────────────── */}
          <div className="modal-section">
            <h3 className="section-title">Contact</h3>
            <div className="info-grid">
              {business.contactNumber && (
                <a href={`tel:${business.contactNumber}`} className="info-item info-phone">
                  <Phone size={16} />
                  <span>{business.contactNumber}</span>
                </a>
              )}
            </div>
          </div>

          {/* ── Address ─────────────────────────────────────────────────────── */}
          {business.address && (
            <div className="modal-section">
              <h3 className="section-title">Address</h3>
              <div className="info-item">
                <MapPin size={16} />
                <span>{business.address}</span>
              </div>
            </div>
          )}

          {/* ── YouTube Embed ────────────────────────────────────────────────── */}
          {ytId && (
            <div className="modal-section">
              <h3 className="section-title">
                <Youtube size={16} style={{ color: '#ff0000' }} /> YouTube Video
              </h3>
              <div className="yt-embed-wrap">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="yt-embed"
                />
              </div>
            </div>
          )}

          {/* ── Facebook / Other Message Link ────────────────────────────────── */}
          {hasMessage && !ytId && (
            <div className="modal-section">
              <h3 className="section-title">
                {isFacebook(business.messageLink!) ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Facebook size={16} style={{ color: '#1877f2' }} /> Facebook Post
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <ExternalLink size={16} /> Message Link
                  </span>
                )}
              </h3>
              <a
                href={business.messageLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
              >
                <ExternalLink size={14} /> Open Link
              </a>
            </div>
          )}

          {/* ── Poster Link ──────────────────────────────────────────────────── */}
          {hasPoster && (
            <div className="modal-section">
              <h3 className="section-title">
                <ImageIcon size={16} /> Poster / Banner
              </h3>
              <div className="modal-poster-preview">
                <img
                  src={business.postersLink}
                  alt="Poster"
                  className="modal-poster-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <a
                  href={business.postersLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm mt-2"
                >
                  <ExternalLink size={14} /> View Full Poster
                </a>
              </div>
            </div>
          )}

          {/* ── Meta ─────────────────────────────────────────────────────────── */}
          <div className="modal-section modal-meta-section">
            <div className="modal-meta-row">
              <span className="meta-label">
                <Calendar size={13} /> Added On
              </span>
              <span className="meta-value">{formatDateTime(business.createdAt)}</span>
            </div>
            {business.updatedAt && business.updatedAt !== business.createdAt && (
              <div className="modal-meta-row">
                <span className="meta-label">
                  <Clock size={13} /> Last Updated
                </span>
                <span className="meta-value">{formatDateTime(business.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
