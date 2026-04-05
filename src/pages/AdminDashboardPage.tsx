import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit2, Trash2, Download, Upload, FileSpreadsheet,
  Building2, RefreshCw, X, AlertTriangle, Eye, RotateCcw,
  Trash, ChevronDown, ChevronUp, MapPin, Phone, Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BusinessForm from '../components/BusinessForm';
import BusinessModal from '../components/BusinessModal';
import {
  fetchAllBusinesses, fetchTrash, addBusiness, updateBusiness,
  softDeleteBusiness, restoreBusiness, bulkInsertBusinesses,
} from '../services/mongodb';
import {
  downloadBusinessesAsExcel, downloadExcelTemplate, parseExcelFile,
} from '../services/excel';
import type { Business } from '../types';
import { ALL_LOCATIONS, ALL_CATEGORIES } from '../types';
import toast from 'react-hot-toast';

type View = 'list' | 'add' | 'edit' | 'trash';

function formatDate(iso?: string) {
  if (!iso) return '–';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso || '–'; }
}

export default function AdminDashboardPage() {
  const { isAdminLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [trash, setTrash] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<View>('list');
  const [editTarget, setEditTarget] = useState<Business | null>(null);
  const [viewTarget, setViewTarget] = useState<Business | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
  const [search, setSearch] = useState('');
  const [filterLoc, setFilterLoc] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterAryaVysya, setFilterAryaVysya] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<Business[] | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdminLoggedIn) { navigate('/admin/login'); return; }
    loadData();
  }, [isAdminLoggedIn]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, trashData] = await Promise.all([
        fetchAllBusinesses(),
        fetchTrash(),
      ]);
      setBusinesses(data);
      setTrash(trashData);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleAdd = async (data: Business) => {
    setSaving(true);
    try {
      const created = await addBusiness(data);
      setBusinesses((prev) => [created, ...prev]);
      setView('list');
      toast.success('✅ Business added successfully!');
    } catch {
      toast.error('Failed to add business');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: Business) => {
    if (!editTarget?._id) return;
    setSaving(true);
    try {
      await updateBusiness(editTarget._id, data);
      setBusinesses((prev) =>
        prev.map((b) => (b._id === editTarget._id ? { ...b, ...data, updatedAt: new Date().toISOString() } : b))
      );
      setView('list');
      setEditTarget(null);
      toast.success('✅ Business updated!');
    } catch {
      toast.error('Failed to update business');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    setSaving(true);
    try {
      await softDeleteBusiness(deleteTarget._id);
      const deleted = { ...deleteTarget, isDeleted: true, deletedAt: new Date().toISOString() };
      setBusinesses((prev) => prev.filter((b) => b._id !== deleteTarget._id));
      setTrash((prev) => [deleted, ...prev]);
      setDeleteTarget(null);
      toast.success('🗑️ Moved to trash');
    } catch {
      toast.error('Failed to delete business');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (id: string) => {
    setSaving(true);
    try {
      await restoreBusiness(id);
      const item = trash.find((b) => b._id === id);
      if (item) {
        const restored = { ...item, isDeleted: false, deletedAt: undefined };
        setTrash((prev) => prev.filter((b) => b._id !== id));
        setBusinesses((prev) => [restored, ...prev]);
      }
      toast.success('✅ Business restored!');
    } catch {
      toast.error('Failed to restore business');
    } finally {
      setSaving(false);
    }
  };

  // ── Excel Import ──────────────────────────────────────────────────────────
  const handleImportFile = async (file: File) => {
    setImportLoading(true);
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        toast.error('No valid rows found. Check the file format.');
        return;
      }
      setImportPreview(parsed);
    } catch {
      toast.error('Failed to parse file. Use the template format.');
    } finally {
      setImportLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    setImportLoading(true);
    try {
      await bulkInsertBusinesses(importPreview);
      await loadData();
      setImportPreview(null);
      toast.success(`✅ ${importPreview.length} businesses imported!`);
    } catch {
      toast.error('Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = businesses.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.businessName.toLowerCase().includes(q) ||
      b.contactNumber.includes(q) ||
      (b.address || '').toLowerCase().includes(q) ||
      b.location.toLowerCase().includes(q) ||
      b.subLocation.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.subCategory.toLowerCase().includes(q);
    const matchLoc = !filterLoc || b.location === filterLoc;
    const matchCat = !filterCat || b.category === filterCat;
    const matchArya = !filterAryaVysya || b.isAryaVysya === true;
    return matchSearch && matchLoc && matchCat && matchArya;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: businesses.length,
    locations: new Set(businesses.map((b) => b.location)).size,
    categories: new Set(businesses.map((b) => b.category)).size,
    trash: trash.length,
  };

  // ── Add / Edit views ──────────────────────────────────────────────────────
  if (view === 'add') {
    return (
      <div className="admin-page">
        <div className="admin-form-header">
          <button className="btn btn-ghost" onClick={() => setView('list')}>
            ← Back to List
          </button>
          <h2>Add New Business</h2>
        </div>
        <BusinessForm onSave={handleAdd} onCancel={() => setView('list')} loading={saving} />
      </div>
    );
  }

  if (view === 'edit' && editTarget) {
    return (
      <div className="admin-page">
        <div className="admin-form-header">
          <button className="btn btn-ghost" onClick={() => { setView('list'); setEditTarget(null); }}>
            ← Back to List
          </button>
          <h2>Edit: {editTarget.businessName}</h2>
        </div>
        <BusinessForm
          initial={editTarget}
          onSave={handleEdit}
          onCancel={() => { setView('list'); setEditTarget(null); }}
          loading={saving}
        />
      </div>
    );
  }

  // ── Trash view ────────────────────────────────────────────────────────────
  if (view === 'trash') {
    return (
      <div className="admin-page">
        <div className="admin-form-header">
          <button className="btn btn-ghost" onClick={() => setView('list')}>
            ← Back to List
          </button>
          <h2>🗑️ Trash ({trash.length})</h2>
        </div>
        <p className="trash-note">
          Deleted businesses are stored here and can be restored. They are not permanently deleted.
        </p>
        {trash.length === 0 ? (
          <div className="empty-state">
            <Trash size={48} />
            <h3>Trash is empty</h3>
            <p>Deleted businesses will appear here</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Contact</th>
                  <th>Deleted On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {trash.map((b) => (
                  <tr key={b._id} className="trash-row">
                    <td><strong>{b.businessName}</strong></td>
                    <td>{b.subLocation}, {b.location}</td>
                    <td>{b.category}</td>
                    <td>{b.contactNumber}</td>
                    <td className="text-sm text-muted">{formatDate(b.deletedAt)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleRestore(b._id!)}
                        disabled={saving}
                        title="Restore"
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Main list view ────────────────────────────────────────────────────────
  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage all businesses in Karimnagar Business Marketplace</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setView('trash')}>
            <Trash size={15} /> Trash ({trash.length})
          </button>
          <button className="btn btn-primary" onClick={() => setView('add')}>
            <Plus size={18} /> Add Business
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <Building2 size={28} />
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Businesses</div>
          </div>
        </div>
        <div className="stat-card stat-green">
          <MapPin size={28} />
          <div>
            <div className="stat-value">{stats.locations}</div>
            <div className="stat-label">Locations</div>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <Tag size={28} />
          <div>
            <div className="stat-value">{stats.categories}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <Trash size={28} />
          <div>
            <div className="stat-value">{stats.trash}</div>
            <div className="stat-label">In Trash</div>
          </div>
        </div>
      </div>

      {/* Excel Tools */}
      <div className="excel-tools">
        <h3><FileSpreadsheet size={18} /> Excel Tools</h3>
        <div className="excel-buttons">
          <button className="btn btn-outline" onClick={downloadExcelTemplate}>
            <FileSpreadsheet size={15} /> Download Template
          </button>
          <button
            className="btn btn-outline"
            onClick={() => importRef.current?.click()}
            disabled={importLoading}
          >
            <Upload size={15} />
            {importLoading ? 'Processing...' : 'Import Excel'}
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) handleImportFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <button
            className="btn btn-outline"
            onClick={() => downloadBusinessesAsExcel(businesses)}
            disabled={businesses.length === 0}
          >
            <Download size={15} /> Export All ({businesses.length})
          </button>
          {filtered.length !== businesses.length && filtered.length > 0 && (
            <button
              className="btn btn-outline"
              onClick={() =>
                downloadBusinessesAsExcel(filtered, 'filtered_businesses.xlsx')
              }
            >
              <Download size={15} /> Export Filtered ({filtered.length})
            </button>
          )}
          <button className="btn btn-ghost" onClick={loadData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Import Preview */}
      {importPreview && (
        <div className="import-preview">
          <div className="import-preview-header">
            <h3>Import Preview – {importPreview.length} businesses found</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setImportPreview(null)}>
              <X size={16} />
            </button>
          </div>
          <div className="import-preview-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Business Name</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.slice(0, 10).map((b, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{b.businessName}</td>
                    <td>{b.contactNumber}</td>
                    <td>{b.subLocation ? `${b.subLocation}, ` : ''}{b.location}</td>
                    <td>{b.category}</td>
                  </tr>
                ))}
                {importPreview.length > 10 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      ...and {importPreview.length - 10} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="import-preview-actions">
            <button className="btn btn-secondary" onClick={() => setImportPreview(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={confirmImport}
              disabled={importLoading}
            >
              {importLoading ? 'Importing...' : `Confirm Import (${importPreview.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by name, contact, location, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={filterLoc}
          onChange={(e) => setFilterLoc(e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All Locations</option>
          {ALL_LOCATIONS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All Categories</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          className={`btn btn-arya-filter btn-sm ${filterAryaVysya ? 'active' : ''}`}
          onClick={() => setFilterAryaVysya(!filterAryaVysya)}
        >
          🏅 Arya Vysya
        </button>
        <span className="result-count">
          {filtered.length} of {businesses.length}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-state">
          <RefreshCw size={32} className="spin" />
          <p>Loading businesses...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>{businesses.length === 0 ? 'No businesses yet' : 'No results found'}</h3>
          <p>
            {businesses.length === 0
              ? 'Add your first business or import from Excel'
              : 'Try a different search or filter'}
          </p>
          {businesses.length === 0 && (
            <button className="btn btn-primary" onClick={() => setView('add')}>
              <Plus size={16} /> Add First Business
            </button>
          )}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Business Name</th>
                <th>Location</th>
                <th>Category</th>
                <th>Contact</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, idx) => (
                <>
                  <tr key={b._id} className={expandedRow === b._id ? 'row-expanded' : ''}>
                    <td className="text-muted text-sm">{idx + 1}</td>
                    <td>
                      <div className="table-business-name">
                        {b.images?.[0] ? (
                          <img src={b.images[0]} alt="" className="table-thumb" />
                        ) : (
                          <div className="table-thumb-placeholder">
                            {b.businessName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{b.businessName}</div>
                          {b.address && (
                            <div className="text-sm text-muted truncate" style={{ maxWidth: 180 }}>
                              {b.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{b.subLocation}</div>
                      <div className="text-sm text-muted">{b.location}</div>
                    </td>
                    <td>
                      <span className="cat-badge">{b.category}</span>
                      {b.subCategory && (
                        <div className="text-sm text-muted">{b.subCategory}</div>
                      )}
                    </td>
                    <td>
                      <a href={`tel:${b.contactNumber}`} className="contact-link">
                        <Phone size={13} /> {b.contactNumber}
                      </a>
                    </td>
                    <td className="text-sm text-muted">{formatDate(b.createdAt)}</td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="action-btn action-expand"
                          title="Expand"
                          onClick={() =>
                            setExpandedRow(expandedRow === b._id ? null : b._id!)
                          }
                        >
                          {expandedRow === b._id ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                        <button
                          className="action-btn action-view"
                          title="View"
                          onClick={() => setViewTarget(b)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="action-btn action-edit"
                          title="Edit"
                          onClick={() => {
                            setEditTarget(b);
                            setView('edit');
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="action-btn action-delete"
                          title="Move to Trash"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded row */}
                  {expandedRow === b._id && (
                    <tr key={`${b._id}-exp`} className="expanded-row">
                      <td colSpan={7}>
                        <div className="expanded-content">
                          {b.messageLink && (
                            <div className="exp-item">
                              <span className="exp-label">Message Link:</span>
                              <a href={b.messageLink} target="_blank" rel="noreferrer" className="exp-link">
                                {b.messageLink}
                              </a>
                            </div>
                          )}
                          {b.postersLink && (
                            <div className="exp-item">
                              <span className="exp-label">Poster:</span>
                              <a href={b.postersLink} target="_blank" rel="noreferrer" className="exp-link">
                                {b.postersLink}
                              </a>
                              <img
                                src={b.postersLink}
                                alt="poster"
                                className="exp-poster-thumb"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          {b.images && b.images.length > 0 && (
                            <div className="exp-item">
                              <span className="exp-label">Images ({b.images.length}):</span>
                              <div className="exp-images">
                                {b.images.map((img, i) => (
                                  <img key={i} src={img} alt={`img-${i}`} className="exp-img-thumb" />
                                ))}
                              </div>
                            </div>
                          )}
                          {!b.messageLink && !b.postersLink && (!b.images || b.images.length === 0) && (
                            <span className="text-muted text-sm">No additional media</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewTarget && (
        <BusinessModal business={viewTarget} onClose={() => setViewTarget(null)} />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <AlertTriangle size={36} />
            </div>
            <h3>Move to Trash?</h3>
            <p>
              Are you sure you want to move{' '}
              <strong>"{deleteTarget.businessName}"</strong> to trash?
            </p>
            <p className="confirm-note">
              ℹ️ The record will be moved to trash and can be restored later.
            </p>
            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Moving...' : '🗑️ Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
