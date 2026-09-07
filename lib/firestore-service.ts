import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Query,
  QueryConstraint,
  updateDoc,
  deleteDoc,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getDbInstance } from './firebase';
import { Ticket, TicketMessage, Shift, User, Place, UserRole } from './types';

function mapTicketDoc(id: string, data: Record<string, unknown>): Ticket {
  return {
    id,
    ...data,
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    resolvedAt: (data.resolvedAt as { toDate?: () => Date })?.toDate?.(),
  } as Ticket;
}

function mapPlaceDoc(id: string, data: Record<string, unknown>): Place {
  return {
    id,
    name: (data.name as string) || '',
    building: (data.building as string) || '',
    floor: (data.floor as string) || '',
    locationNumber: (data.locationNumber as string) || '',
    notes: data.notes as string | undefined,
    ownerId: (data.ownerId as string) || '',
    ownerName: (data.ownerName as string) || '',
    ownerEmail: (data.ownerEmail as string) || '',
    createdBy: (data.createdBy as string) || '',
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.() || new Date(),
  };
}

// Tickets
export async function createTicket(ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) {
  const database = getDbInstance();
  const ticketRef = doc(collection(database, 'tickets'));
  const now = new Date();
  const payload: Record<string, unknown> = {
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };
  for (const [key, value] of Object.entries(ticket)) {
    if (value !== undefined) payload[key] = value;
  }
  await setDoc(ticketRef, payload);
  return ticketRef.id;
}

export async function getTicket(ticketId: string) {
  const database = getDbInstance();
  const docRef = doc(database, 'tickets', ticketId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return mapTicketDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
  }
  return null;
}

export async function getTickets(constraints: QueryConstraint[]) {
  const database = getDbInstance();
  const q = query(collection(database, 'tickets'), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => mapTicketDoc(d.id, d.data() as Record<string, unknown>));
}

export async function getTicketsByComplainer(complainerId: string) {
  return getTickets([where('complainerId', '==', complainerId), orderBy('createdAt', 'desc')]);
}

export async function getTicketsByTechnician(technicianId: string) {
  return getTickets([where('assignedToId', '==', technicianId), orderBy('createdAt', 'desc')]);
}

export async function getUnassignedTickets() {
  // Firestore cannot query for missing fields reliably; load open tickets and filter.
  const openTickets = await getTickets([
    where('status', '==', 'open'),
    orderBy('createdAt', 'desc'),
  ]);
  return openTickets.filter(t => !t.assignedToId);
}

export async function assignTicket(
  ticketId: string,
  technicianId: string,
  technicianName: string
) {
  await updateTicket(ticketId, {
    assignedToId: technicianId,
    assignedToName: technicianName,
    status: 'assigned',
  });
}

export function subscribeToTickets(
  constraints: QueryConstraint[],
  onUpdate: (tickets: Ticket[]) => void
): Unsubscribe {
  const q = query(collection(getDbInstance(), 'tickets'), ...constraints);
  return onSnapshot(q, querySnapshot => {
    const tickets = querySnapshot.docs.map(d =>
      mapTicketDoc(d.id, d.data() as Record<string, unknown>)
    );
    onUpdate(tickets);
  });
}

export function subscribeToTicket(
  ticketId: string,
  onUpdate: (ticket: Ticket | null) => void
): Unsubscribe {
  const docRef = doc(getDbInstance(), 'tickets', ticketId);
  return onSnapshot(docRef, docSnap => {
    if (docSnap.exists()) {
      onUpdate(mapTicketDoc(docSnap.id, docSnap.data() as Record<string, unknown>));
    } else {
      onUpdate(null);
    }
  });
}

export async function updateTicket(ticketId: string, updates: Partial<Ticket>) {
  const ticketRef = doc(getDbInstance(), 'tickets', ticketId);
  const payload: Record<string, unknown> = {
    updatedAt: Timestamp.fromDate(new Date()),
  };

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || value === undefined) {
      continue;
    }
    if (value instanceof Date) {
      payload[key] = Timestamp.fromDate(value);
    } else {
      payload[key] = value;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(ticketRef, payload as any);
}

// Places
export async function createPlace(
  place: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>
) {
  const placeRef = doc(collection(getDbInstance(), 'places'));
  const now = new Date();
  await setDoc(placeRef, {
    ...place,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
  return placeRef.id;
}

export async function getPlace(placeId: string) {
  const docRef = doc(getDbInstance(), 'places', placeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return mapPlaceDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
  }
  return null;
}

export async function getPlaces() {
  const q = query(collection(getDbInstance(), 'places'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => mapPlaceDoc(d.id, d.data() as Record<string, unknown>));
}

export function subscribeToPlaces(onUpdate: (places: Place[]) => void): Unsubscribe {
  const q = query(collection(getDbInstance(), 'places'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, querySnapshot => {
    onUpdate(
      querySnapshot.docs.map(d => mapPlaceDoc(d.id, d.data() as Record<string, unknown>))
    );
  });
}

export async function getPlacesByOwner(ownerId: string) {
  const q = query(collection(getDbInstance(), 'places'), where('ownerId', '==', ownerId));
  const querySnapshot = await getDocs(q);
  const places = querySnapshot.docs.map(d => mapPlaceDoc(d.id, d.data() as Record<string, unknown>));
  return places.sort((a, b) => a.name.localeCompare(b.name));
}

export async function updatePlace(placeId: string, updates: Partial<Place>) {
  const placeRef = doc(getDbInstance(), 'places', placeId);
  const { id: _id, createdAt: _c, ...safeUpdates } = updates as Partial<Place> & {
    id?: string;
    createdAt?: Date;
  };
  await updateDoc(placeRef, {
    ...safeUpdates,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

export async function deletePlace(placeId: string) {
  await deleteDoc(doc(getDbInstance(), 'places', placeId));
}

export async function countActiveTicketsForPlace(placeId: string) {
  const tickets = await getTickets([where('placeId', '==', placeId)]);
  return tickets.filter(t =>
    t.status === 'open' || t.status === 'assigned' || t.status === 'in_progress'
  ).length;
}

// Users
export async function getUsersByRole(role: UserRole) {
  const q = query(collection(getDbInstance(), 'users'), where('role', '==', role));
  const querySnapshot = await getDocs(q);
  const users = querySnapshot.docs.map(d => {
    const data = d.data();
    return {
      uid: d.id,
      email: data.email || '',
      name: data.name || '',
      role: data.role as UserRole,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
      avatar: data.avatar,
      fcmToken: data.fcmToken,
    } as User;
  });
  return users.sort((a, b) => a.name.localeCompare(b.name));
}

// Ticket Messages
export async function addTicketMessage(message: Omit<TicketMessage, 'id' | 'createdAt'>) {
  const messageRef = doc(collection(getDbInstance(), 'tickets', message.ticketId, 'messages'));
  await setDoc(messageRef, {
    ...message,
    createdAt: Timestamp.fromDate(new Date()),
  });
  return messageRef.id;
}

export async function getTicketMessages(ticketId: string) {
  const q = query(
    collection(getDbInstance(), 'tickets', ticketId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
  })) as TicketMessage[];
}

export function subscribeToTicketMessages(
  ticketId: string,
  onUpdate: (messages: TicketMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(getDbInstance(), 'tickets', ticketId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, querySnapshot => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    })) as TicketMessage[];
    onUpdate(messages);
  });
}

// Shifts
export async function createShift(shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) {
  const shiftRef = doc(collection(getDbInstance(), 'shifts'));
  const now = new Date();
  await setDoc(shiftRef, {
    ...shift,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
  return shiftRef.id;
}

function mapShiftDoc(id: string, data: Record<string, unknown>): Shift {
  return {
    id,
    ...data,
    startTime: (data.startTime as { toDate?: () => Date })?.toDate?.() || new Date(),
    endTime: (data.endTime as { toDate?: () => Date })?.toDate?.() || new Date(),
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() || new Date(),
    updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.() || new Date(),
  } as Shift;
}

export async function getActiveShifts() {
  const q = query(collection(getDbInstance(), 'shifts'), where('isActive', '==', true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d =>
    mapShiftDoc(d.id, d.data() as Record<string, unknown>)
  );
}

export function subscribeToActiveShifts(onUpdate: (shifts: Shift[]) => void): Unsubscribe {
  const q = query(collection(getDbInstance(), 'shifts'), where('isActive', '==', true));
  return onSnapshot(q, querySnapshot => {
    onUpdate(
      querySnapshot.docs.map(d => mapShiftDoc(d.id, d.data() as Record<string, unknown>))
    );
  });
}

export async function updateShift(shiftId: string, updates: Partial<Shift>) {
  const shiftRef = doc(getDbInstance(), 'shifts', shiftId);
  await updateDoc(shiftRef, {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date()),
  });
}

// Analytics
export async function getTicketStats() {
  const allTickets = await getTickets([]);
  
  const stats = {
    total: allTickets.length,
    open: allTickets.filter(t => t.status === 'open').length,
    assigned: allTickets.filter(t => t.status === 'assigned').length,
    inProgress: allTickets.filter(t => t.status === 'in_progress').length,
    resolved: allTickets.filter(t => t.status === 'resolved').length,
    closed: allTickets.filter(t => t.status === 'closed').length,
  };

  return stats;
}
