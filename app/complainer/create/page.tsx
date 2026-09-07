'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createTicket, getPlacesByOwner, updateTicket } from '@/lib/firestore-service';
import { sendTicketCreatedNotification } from '@/lib/notifications';
import { Place, TicketPriority } from '@/lib/types';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  fieldClass,
  primaryBtnClass,
  secondaryBtnClass,
  cardClass,
  pageTitleClass,
  pageSubClass,
} from '@/components/app-shell';
import { uploadTicketImages } from '@/lib/storage-service';

// const categories = [
//   'Technical Issue',
//   'Student Issue',
//   'Security Issue',
//   'Hall Issue',
//   'Adminiustration Issue',
//   'Account',
//   'Finance',
//   'Feature Request',
//   'Other',
// ];
export const categories = [
  'Technical Issue',
  'Student Issue',
  'Security Issue',
  'Hall Issue',
  'Administration Issue',
  'Academic Issue',
  'Library',
  'Laboratory',
  'Account',
  'Finance',
  'Maintenance',
  'Transport',
  'Internet & Network',
  'Classroom',
  'Examination',
  'Teacher & Staff',
  'Feature Request',
  'Complaint',
  'Suggestion',
  'Other',
];

export default function CreateTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: categories[0],
    priority: 'medium' as TicketPriority,
    phone: '',
    placeId: '',
  });

  useEffect(() => {
    async function loadPlaces() {
      if (!user?.uid) return;
      try {
        const data = await getPlacesByOwner(user.uid);
        setPlaces(data);
        if (data.length === 1) {
          setFormData(prev => ({ ...prev, placeId: data[0].id }));
        }
      } catch (error) {
        console.error('[v0] Error loading places:', error);
        toast.error('Failed to load places');
      } finally {
        setPlacesLoading(false);
      }
    }
    loadPlaces();
  }, [user?.uid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Get selected place if any
      const selectedPlace = places.find(p => p.id === formData.placeId);

      // Create ticket first without images
      const ticketId = await createTicket({
        complainerId: user.uid,
        complainerName: user.name,
        complainerEmail: user.email,
        complainerPhone: formData.phone,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'open',
        category: formData.category,
        placeId: selectedPlace?.id,
        placeName: selectedPlace?.name,
        placeBuilding: selectedPlace?.building,
        placeFloor: selectedPlace?.floor,
        placeNumber: selectedPlace?.locationNumber,
        attachments: [],
        tags: [],
      });

      // Upload images if any
      let imageUrls: string[] = [];
      if (pendingImages.length > 0) {
        imageUrls = await uploadTicketImages(pendingImages, ticketId);
        
        // Update ticket with image URLs
        await updateTicket(ticketId, { attachments: imageUrls });
      }

      await sendTicketCreatedNotification({
        id: ticketId,
        complainerId: user.uid,
        complainerName: user.name,
        complainerEmail: user.email,
        complainerPhone: formData.phone,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'open',
        category: formData.category,
        placeId: selectedPlace?.id,
        placeName: selectedPlace?.name,
        placeBuilding: selectedPlace?.building,
        placeFloor: selectedPlace?.floor,
        placeNumber: selectedPlace?.locationNumber,
        attachments: imageUrls,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success('Ticket created successfully!');
      router.push(`/complainer/${ticketId}`);
    } catch (error) {
      console.error('[v0] Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href="/complainer"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tickets
      </Link>

      <div className={cardClass}>
        <h1 className={pageTitleClass}>Create Ticket</h1>
        <p className={pageSubClass}>Describe the issue you&apos;re experiencing</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Place (Optional)
            </label>
            <select
              disabled={placesLoading}
              value={formData.placeId}
              onChange={e => setFormData({ ...formData, placeId: e.target.value })}
              className={`${fieldClass} disabled:opacity-50`}
            >
              <option value="">{placesLoading ? 'Loading places...' : 'Select a place (optional)...'}</option>
              {places.map(place => (
                <option key={place.id} value={place.id}>
                  {place.name} — {place.building}, Floor {place.floor}, #{place.locationNumber}
                </option>
              ))}
            </select>
            <p className="text-xs text-foreground/50">Where is this issue happening?</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className={fieldClass}
              placeholder="Brief summary of your issue"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className={`${fieldClass} h-32 resize-y`}
              placeholder="Provide detailed information about your issue"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className={fieldClass}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Priority</label>
              <select
                value={formData.priority}
                onChange={e =>
                  setFormData({ ...formData, priority: e.target.value as TicketPriority })
                }
                className={fieldClass}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className={fieldClass}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div className="cursor-not-allowed">
            <p className="text-red-400 font-bold">Images are temporary disabled for storage issue</p>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Images (Optional)</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  disabled
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (pendingImages.length + files.length > 3) {
                      toast.error('Maximum 3 images allowed');
                      return;
                    }
                    setPendingImages([...pendingImages, ...files]);
                  }}

                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-block"
                >
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-foreground/60">
                      {pendingImages.length === 0 ? 'Click to upload images' : `${pendingImages.length}/3 images selected`}
                    </p>
                    <p className="text-xs text-foreground/40">Max 3 images, 2MB each</p>
                  </div>
                </label>
              </div>
              {pendingImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {pendingImages.map((file, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => setPendingImages(pendingImages.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 ${primaryBtnClass}`}
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
            <Link href="/complainer" className={`flex-1 text-center ${secondaryBtnClass}`}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
