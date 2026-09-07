'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  createPlace,
  updatePlace,
  deletePlace,
  subscribeToPlaces,
  getUsersByRole,
  countActiveTicketsForPlace,
} from '@/lib/firestore-service';
import { Place, User } from '@/lib/types';
import toast from 'react-hot-toast';
import { Building2, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  cardClass,
  emptyStateClass,
  fieldClass,
  pageSubClass,
  pageTitleClass,
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '@/components/app-shell';

const emptyForm = {
  name: '',
  building: '',
  floor: '',
  locationNumber: '',
  notes: '',
  ownerId: '',
};

export default function AdminRoomsPage() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [complainers, setComplainers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    getUsersByRole('complainer')
      .then(setComplainers)
      .catch(error => {
        console.error('[v0] Error loading complainers:', error);
        toast.error('Failed to load complainers');
      });

    const unsubscribe = subscribeToPlaces(placesData => {
      setPlaces(placesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function openCreate() {
    setEditing(null);
    setFormData(emptyForm);
    setShowModal(true);
  }

  function openEdit(place: Place) {
    setEditing(place);
    setFormData({
      name: place.name,
      building: place.building,
      floor: place.floor,
      locationNumber: place.locationNumber,
      notes: place.notes || '',
      ownerId: place.ownerId,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim() || !formData.building.trim() || !formData.floor.trim() || !formData.locationNumber.trim()) {
      toast.error('Please fill in name, building, floor, and location number');
      return;
    }
    if (!formData.ownerId) {
      toast.error('Please select a complainer account');
      return;
    }

    const owner = complainers.find(c => c.uid === formData.ownerId);
    if (!owner) {
      toast.error('Selected account not found');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        building: formData.building.trim(),
        floor: formData.floor.trim(),
        locationNumber: formData.locationNumber.trim(),
        notes: formData.notes.trim() || undefined,
        ownerId: owner.uid,
        ownerName: owner.name,
        ownerEmail: owner.email,
      };

      if (editing) {
        await updatePlace(editing.id, payload);
        toast.success('Place updated');
      } else {
        await createPlace({
          ...payload,
          createdBy: user.uid,
        });
        toast.success('Place created');
      }

      setShowModal(false);
      setEditing(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error('[v0] Error saving place:', error);
      toast.error('Failed to save place');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(place: Place) {
    const active = await countActiveTicketsForPlace(place.id);
    if (active > 0) {
      toast.error(`Cannot delete: ${active} active ticket(s) use this place`);
      return;
    }
    if (!confirm(`Delete place "${place.name}"?`)) return;

    try {
      await deletePlace(place.id);
      toast.success('Place deleted');
      setPlaces(places.filter(p => p.id !== place.id));
    } catch (error) {
      console.error('[v0] Error deleting place:', error);
      toast.error('Failed to delete place');
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground/20 border-t-foreground mx-auto"></div>
        <p className="mt-4 text-foreground/60">Loading places...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={pageTitleClass}>Places</h2>
          <p className={pageSubClass}>Create places and bind them to complainer accounts</p>
        </div>
        <button onClick={openCreate} className={`flex items-center gap-2 ${primaryBtnClass}`}>
          <Plus className="w-4 h-4" />
          Add Place
        </button>
      </div>

      {places.length === 0 ? (
        <div className={emptyStateClass}>
          <Building2 className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
          <p className="text-foreground/60 mb-2 text-lg">No places yet</p>
          <p className="text-foreground/60">Create a place and bind it to a complainer account.</p>
        </div>
      ) : (
        <div className={`${panelClass} overflow-hidden`}>
          <table className="w-full text-left">
            <thead className="bg-white/30 dark:bg-white/10 border-b border-border/50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-foreground/80">Name</th>
                <th className="px-4 py-3 text-sm font-semibold text-foreground/80">Location</th>
                <th className="px-4 py-3 text-sm font-semibold text-foreground/80">Account</th>
                <th className="px-4 py-3 text-sm font-semibold text-foreground/80">Notes</th>
                <th className="px-4 py-3 text-sm font-semibold text-foreground/80 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {places.map(place => (
                <tr key={place.id} className="border-b border-border/30 last:border-0 hover:bg-white/20 dark:hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-medium text-foreground">{place.name}</td>
                  <td className="px-4 py-3 text-sm text-foreground/60">
                    {place.building} · Floor {place.floor} · #{place.locationNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground/60">
                    <div>{place.ownerName}</div>
                    <div className="text-xs text-foreground/50">{place.ownerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground/50">{place.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(place)}
                        className="p-2 text-foreground/60 hover:text-foreground hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(place)}
                        className="p-2 text-foreground/60 hover:text-destructive hover:bg-red-500/10 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} w-full max-w-lg`}>
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <h3 className="text-xl font-bold text-foreground">
                {editing ? 'Edit Place' : 'Create Place'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-foreground/50 hover:text-foreground/80 hover:bg-white/10 rounded-lg p-1 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={`${fieldClass} py-2`}
                  placeholder="Lab 204"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Building *</label>
                  <input
                    required
                    value={formData.building}
                    onChange={e => setFormData({ ...formData, building: e.target.value })}
                    className={`${fieldClass} py-2`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Floor *</label>
                  <input
                    required
                    value={formData.floor}
                    onChange={e => setFormData({ ...formData, floor: e.target.value })}
                    className={`${fieldClass} py-2`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Location # *</label>
                  <input
                    required
                    value={formData.locationNumber}
                    onChange={e => setFormData({ ...formData, locationNumber: e.target.value })}
                    className={`${fieldClass} py-2`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Bind to account *</label>
                <select
                  required
                  value={formData.ownerId}
                  onChange={e => setFormData({ ...formData, ownerId: e.target.value })}
                  className={`${fieldClass} py-2`}
                >
                  <option value="">Select complainer...</option>
                  {complainers.map(c => (
                    <option key={c.uid} value={c.uid}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
                {complainers.length === 0 && (
                  <p className="text-sm text-foreground/70 mt-1">No complainer accounts found. Create one under Users first.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 glass-input dark:glass-input-dark rounded-lg focus:ring-2 focus:ring-ring h-20"
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 glass-button text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Place'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 glass-button-secondary text-primary font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
