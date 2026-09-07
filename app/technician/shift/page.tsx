'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createShift, subscribeToActiveShifts, updateShift } from '@/lib/firestore-service';
import { Shift } from '@/lib/types';
import toast from 'react-hot-toast';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { cardClass, pageSubClass, pageTitleClass, primaryBtnClass } from '@/components/app-shell';

export default function TechnicianShiftPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStartingShift, setIsStartingShift] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToActiveShifts(data => {
      setShifts(data);
      const myShift = data.find(s => s.technicianId === user.uid && s.isActive);
      setActiveShift(myShift || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  async function handleStartShift() {
    if (!user) return;

    setIsStartingShift(true);
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours

      const shiftId = await createShift({
        technicianId: user.uid,
        startTime: now,
        endTime: endTime,
        isActive: true,
      });

      const newShift: Shift = {
        id: shiftId,
        technicianId: user.uid,
        startTime: now,
        endTime: endTime,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      setActiveShift(newShift);
      toast.success('Shift started!');
    } catch (error) {
      console.error('[v0] Error starting shift:', error);
      toast.error('Failed to start shift');
    } finally {
      setIsStartingShift(false);
    }
  }

  async function handleEndShift() {
    if (!activeShift) return;

    try {
      await updateShift(activeShift.id, {
        isActive: false,
      });

      setActiveShift(null);
      toast.success('Shift ended!');
    } catch (error) {
      console.error('[v0] Error ending shift:', error);
      toast.error('Failed to end shift');
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground/20 border-t-foreground mx-auto"></div>
        <p className="mt-4 text-foreground/60">Loading shift information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={pageTitleClass}>My Shift</h2>
        <p className={pageSubClass}>Manage your work shift</p>
      </div>

      {activeShift ? (
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">Shift Active</h3>
            <div className="w-3 h-3 bg-foreground rounded-full animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Started</p>
              <p className="text-lg font-medium text-foreground">
                {format(activeShift.startTime, 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground/60 mb-1">Ending</p>
              <p className="text-lg font-medium text-foreground">
                {format(activeShift.endTime, 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-5 h-5" />
              <p>
                You are currently available to receive support tickets. Great job staying connected!
              </p>
            </div>
          </div>

          <button
            onClick={handleEndShift}
            className="w-full bg-destructive text-white font-medium px-6 py-3 hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            End Shift
          </button>
        </div>
      ) : (
        <div className={cardClass}>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-2">No Active Shift</h3>
            <p className="text-foreground/60">Start a shift to become available for tickets</p>
          </div>

          <button
            onClick={handleStartShift}
            disabled={isStartingShift}
            className={`w-full ${primaryBtnClass} py-3 flex items-center justify-center gap-2`}
          >
            <LogIn className="w-5 h-5" />
            {isStartingShift ? 'Starting Shift...' : 'Start Shift (8 hours)'}
          </button>

          {shifts.length > 0 && (
            <div className="mt-8 pt-8 border-t border-border">
              <h4 className="text-lg font-semibold text-foreground mb-4">Other Active Shifts</h4>
              <div className="space-y-3">
                {shifts
                  .filter(s => s.technicianId !== user?.uid)
                  .slice(0, 3)
                  .map(shift => (
                    <div key={shift.id} className="p-3 bg-secondary/40 rounded-lg border border-border">
                      <p className="text-sm text-foreground/60">
                        {shift.startTime.toLocaleTimeString()} - {shift.endTime.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
