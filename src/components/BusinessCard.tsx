import { Phone, MapPin, Tag, Clock, ExternalLink, Image } from 'lucide-react';
import type { Business } from '../types';

interface Props {
  business: Business;
  onClick: () => void;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/i.test(url);
}

function isFacebook(url: string) {
  return /facebook\.com|fb\.com/i.test(url);
}

export default function BusinessCard({ business, onClick }: Props) {
  const firstImage = business.images?.[0];
  const hasPoster = !!business.postersLink;
  const hasMessage = !!business.messageLink;

  return (
    <div className="business-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>

      {/* Image / Poster */}
      <div className="card-image">
        {firstImage ? (
          <img src={firstImage} alt={business.businessName} loading="lazy" />
        ) : hasPoster ? (
          <img src={business.postersLink} alt={business.businessName} loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
        ) : (
          <div className="card-image-placeholder">
            <span>{business.businessName.charAt(0).toUpperCase()}</span>
          </div>
        )}

        {/* Category badge */}
        <div className="card-category-tag">{business.category}</div>

        {/* Media indicators */}
        <div className="card-media-badges">
          {hasMessage && (
            <span className={`media-badge ${isYouTube(business.messageLink!) ? 'yt' : isFacebook(business.messageLink!) ? 'fb' : 'link'}`}>
              {isYouTube(business.messageLink!) ? '▶ YT' : isFacebook(business.messageLink!) ? 'f FB' : '🔗'}
            </span>
          )}
          {hasPoster && !firstImage && (
            <span className="media-badge poster">
              <Image size={10} /> Poster
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="card-title-row">
          <h3 className="card-title">{business.businessName}</h3>
          {business.isAryaVysya && (
            <span className="card-arya-badge">🏅 Arya Vysya</span>
          )}
        </div>

        {/* Sub category */}
        {business.subCategory && (
          <div className="card-subcategory">
            <Tag size={11} /> {business.subCategory}
          </div>
        )}

        <div className="card-meta">
          {/* Location */}
          <div className="meta-item">
            <MapPin size={13} />
            <span>
              {business.subLocation
                ? `${business.subLocation}, ${business.location}`
                : business.location}
            </span>
          </div>

          {/* Contact */}
          {business.contactNumber && (
            <div className="meta-item">
              <Phone size={13} />
              <span>{business.contactNumber}</span>
            </div>
          )}

          {/* Address */}
          {business.address && (
            <div className="meta-item meta-address">
              <MapPin size={13} />
              <span className="truncate">{business.address}</span>
            </div>
          )}

          {/* Added on */}
          {business.createdAt && (
            <div className="meta-item meta-date">
              <Clock size={12} />
              <span>Added {formatDate(business.createdAt)}</span>
            </div>
          )}
        </div>

        {/* Links row */}
        {(hasMessage || hasPoster) && (
          <div className="card-links" onClick={(e) => e.stopPropagation()}>
            {hasMessage && (
              <a
                href={business.messageLink}
                target="_blank"
                rel="noreferrer"
                className={`card-link-btn ${isYouTube(business.messageLink!) ? 'yt-btn' : 'fb-btn'}`}
                title={business.messageLink}
              >
                <ExternalLink size={12} />
                {isYouTube(business.messageLink!) ? 'YouTube' : isFacebook(business.messageLink!) ? 'Facebook' : 'Link'}
              </a>
            )}
            {hasPoster && (
              <a
                href={business.postersLink}
                target="_blank"
                rel="noreferrer"
                className="card-link-btn poster-btn"
                title="View Poster"
              >
                <Image size={12} /> Poster
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
