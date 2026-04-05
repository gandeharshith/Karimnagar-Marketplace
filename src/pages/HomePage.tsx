import { useState, useEffect, useMemo, type ReactElement } from 'react';
import {
  Search, X, SlidersHorizontal, Building2, ChevronDown,
  MapPin, Phone, Tag, ChevronLeft, ChevronRight
} from 'lucide-react';
import BusinessCard from '../components/BusinessCard';
import BusinessModal from '../components/BusinessModal';
import { fetchAllBusinesses } from '../services/mongodb';
import type { Business } from '../types';
import { ALL_LOCATIONS, LOCATIONS, ALL_CATEGORIES, CATEGORIES } from '../types';

const PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
];

export default function HomePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Business | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSubLocation, setFilterSubLocation] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filterAryaVysya, setFilterAryaVysya] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAllBusinesses().then((data) => {
      setBusinesses(data);
      setLoading(false);
    });
  }, []);

  // Derived sub-lists for filters
  const subLocations = filterLocation ? (LOCATIONS[filterLocation] || []) : [];
  const subCategories = filterCategory ? (CATEGORIES[filterCategory] || []) : [];

  // Reset sub-filters when parent changes
  const handleLocationChange = (val: string) => {
    setFilterLocation(val);
    setFilterSubLocation('');
    setPage(1);
  };
  const handleCategoryChange = (val: string) => {
    setFilterCategory(val);
    setFilterSubCategory('');
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = [...businesses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.businessName.toLowerCase().includes(q) ||
          b.contactNumber.includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.subCategory.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q) ||
          b.subLocation.toLowerCase().includes(q) ||
          (b.address || '').toLowerCase().includes(q)
      );
    }

    if (filterLocation) list = list.filter((b) => b.location === filterLocation);
    if (filterSubLocation) list = list.filter((b) => b.subLocation === filterSubLocation);
    if (filterCategory) list = list.filter((b) => b.category === filterCategory);
    if (filterSubCategory) list = list.filter((b) => b.subCategory === filterSubCategory);
    if (filterAryaVysya) list = list.filter((b) => b.isAryaVysya === true);

    switch (sortBy) {
      case 'name_asc':
        list.sort((a, b) => a.businessName.localeCompare(b.businessName));
        break;
      case 'name_desc':
        list.sort((a, b) => b.businessName.localeCompare(a.businessName));
        break;
      case 'oldest':
        list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        break;
      default:
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    return list;
  }, [businesses, search, filterLocation, filterSubLocation, filterCategory, filterSubCategory, filterAryaVysya, sortBy]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const clearFilters = () => {
    setSearch('');
    setFilterLocation('');
    setFilterSubLocation('');
    setFilterCategory('');
    setFilterSubCategory('');
    setFilterAryaVysya(false);
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters =
    search || filterLocation || filterSubLocation || filterCategory || filterSubCategory || filterAryaVysya;

  // Stats
  const uniqueLocations = new Set(businesses.map((b) => b.location)).size;
  const uniqueCategories = new Set(businesses.map((b) => b.category)).size;

  return (
    <div className="home-page">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-icon">
            <Building2 size={52} />
          </div>
          <h1>Karimnagar Business Marketplace</h1>
          <p>Discover local businesses – restaurants, shops, services & more</p>

          <div className="hero-search">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by business name, contact, category, location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              autoFocus
            />
            {search && (
              <button className="clear-search" onClick={() => { setSearch(''); setPage(1); }}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="hero-stats">
            <span>
              <strong>{businesses.length}</strong> Businesses
            </span>
            <span>
              <MapPin size={14} /> <strong>{uniqueLocations}</strong> Locations
            </span>
            <span>
              <Tag size={14} /> <strong>{uniqueCategories}</strong> Categories
            </span>
          </div>
        </div>
      </div>

      {/* ── Category Quick Chips ──────────────────────────────────────────── */}
      <div className="category-scroll">
        <button
          className={`cat-chip ${!filterCategory ? 'active' : ''}`}
          onClick={() => handleCategoryChange('')}
        >
          All
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`cat-chip ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => handleCategoryChange(filterCategory === cat ? '' : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Location Quick Chips ──────────────────────────────────────────── */}
      <div className="location-scroll">
        <span className="scroll-label">
          <MapPin size={13} /> Location:
        </span>
        <button
          className={`loc-chip ${!filterLocation ? 'active' : ''}`}
          onClick={() => handleLocationChange('')}
        >
          All
        </button>
        {ALL_LOCATIONS.map((loc) => (
          <button
            key={loc}
            className={`loc-chip ${filterLocation === loc ? 'active' : ''}`}
            onClick={() => handleLocationChange(filterLocation === loc ? '' : loc)}
          >
            {loc}
          </button>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button
            className={`btn btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && <span className="filter-dot" />}
          </button>
          <button
            className={`btn btn-arya-filter ${filterAryaVysya ? 'active' : ''}`}
            onClick={() => { setFilterAryaVysya(!filterAryaVysya); setPage(1); }}
          >
            🏅 Arya Vysya
          </button>
          {hasActiveFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              <X size={13} /> Clear All
            </button>
          )}
          <span className="result-count">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="toolbar-right">
          <div className="sort-select">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} />
          </div>
        </div>
      </div>

      {/* ── Advanced Filter Panel ─────────────────────────────────────────── */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-grid">
            <div className="filter-group">
              <label>
                <MapPin size={13} /> Location
              </label>
              <select
                value={filterLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
              >
                <option value="">All Locations</option>
                {ALL_LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sub Location</label>
              <select
                value={filterSubLocation}
                onChange={(e) => { setFilterSubLocation(e.target.value); setPage(1); }}
                disabled={!filterLocation}
              >
                <option value="">
                  {filterLocation ? 'All Sub Locations' : 'Select Location first'}
                </option>
                {subLocations.map((sl) => (
                  <option key={sl} value={sl}>{sl}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>
                <Tag size={13} /> Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">All Categories</option>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sub Category</label>
              <select
                value={filterSubCategory}
                onChange={(e) => { setFilterSubCategory(e.target.value); setPage(1); }}
                disabled={!filterCategory}
              >
                <option value="">
                  {filterCategory ? 'All Sub Categories' : 'Select Category first'}
                </option>
                {subCategories.map((sc) => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>
                <Phone size={13} /> Search by Contact
              </label>
              <input
                type="tel"
                placeholder="Enter contact number..."
                value={search.match(/^\d+$/) ? search : ''}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div className="results-container">
        {loading ? (
          <div className="loading-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="empty-state">
            <Building2 size={64} />
            <h3>No businesses found</h3>
            <p>Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <button className="btn btn-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="business-grid">
            {paginated.map((b) => (
              <BusinessCard
                key={b._id}
                business={b}
                onClick={() => setSelected(b)}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-sm btn-outline"
              disabled={page === 1}
              onClick={() => { setPage(page - 1); window.scrollTo(0, 0); }}
            >
              <ChevronLeft size={15} /> Prev
            </button>

            <div className="page-numbers">
              {(() => {
                const pages: number[] = [];
                const delta = 2;
                for (let i = 1; i <= totalPages; i++) {
                  if (
                    i === 1 ||
                    i === totalPages ||
                    (i >= page - delta && i <= page + delta)
                  ) {
                    pages.push(i);
                  }
                }
                const result: ReactElement[] = [];
                let prev = 0;
                pages.forEach((p) => {
                  if (prev && p - prev > 1) {
                    result.push(
                      <span key={`ellipsis-${p}`} className="page-ellipsis">…</span>
                    );
                  }
                  result.push(
                    <button
                      key={p}
                      className={`page-btn ${p === page ? 'active' : ''}`}
                      onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                    >
                      {p}
                    </button>
                  );
                  prev = p;
                });
                return result;
              })()}
            </div>

            <button
              className="btn btn-sm btn-outline"
              disabled={page === totalPages}
              onClick={() => { setPage(page + 1); window.scrollTo(0, 0); }}
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {selected && (
        <BusinessModal business={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
