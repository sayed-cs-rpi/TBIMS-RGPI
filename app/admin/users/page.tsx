'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getDbInstance } from '@/lib/firebase';
import { User, UserRole } from '@/lib/types';
import { Users, Shield, Wrench, Plus } from 'lucide-react';
import { useAdminCreateUser } from '@/lib/auth-hooks';
import {
  cardClass,
  fieldClass,
  pageSubClass,
  pageTitleClass,
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
  statCardClass,
} from '@/components/app-shell';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { adminCreateUser, loading: createLoading } = useAdminCreateUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'complainer' as UserRole,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = roleFilter === 'all' 
    ? users 
    : users.filter(u => u.role === roleFilter);

  const roleStats = {
    total: users.length,
    complainer: users.filter(u => u.role === 'complainer').length,
    technician: users.filter(u => u.role === 'technician').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'technician':
        return <Wrench className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    return 'bg-secondary text-foreground';
  };

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      await adminCreateUser(formData.email, formData.password, formData.name, formData.role);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'complainer' });
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }

  async function fetchUsers() {
    try {
      const db = getDbInstance();
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const userData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as User[];
      setUsers(userData);
    } catch (error) {
      console.error('[v0] Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground/20 border-t-foreground mx-auto"></div>
        <p className="mt-4 text-foreground/60">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={pageTitleClass}>User Management</h2>
          <p className={pageSubClass}>View and manage system users</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className={`flex items-center gap-2 ${primaryBtnClass}`}>
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={statCardClass}>
          <p className="text-sm text-foreground/60 mb-1">Total Users</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{roleStats.total}</p>
        </div>
        <div className={statCardClass}>
          <p className="text-sm text-foreground/60 mb-1">Complainers</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{roleStats.complainer}</p>
        </div>
        <div className={statCardClass}>
          <p className="text-sm text-foreground/60 mb-1">Technicians</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{roleStats.technician}</p>
        </div>
        <div className={statCardClass}>
          <p className="text-sm text-foreground/60 mb-1">Admins</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{roleStats.admin}</p>
        </div>
      </div>

      <div className={`${panelClass} overflow-hidden`}>
        <div className="p-6 border-b border-border/50">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={roleFilter === 'all' ? primaryBtnClass : secondaryBtnClass}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('complainer')}
              className={roleFilter === 'complainer' ? primaryBtnClass : secondaryBtnClass}
            >
              Complainers
            </button>
            <button
              onClick={() => setRoleFilter('technician')}
              className={roleFilter === 'technician' ? primaryBtnClass : secondaryBtnClass}
            >
              Technicians
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={roleFilter === 'admin' ? primaryBtnClass : secondaryBtnClass}
            >
              Admins
            </button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="text-foreground/60 p-6 text-center">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-white/30 dark:bg-white/10">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-foreground/80">Name</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-foreground/80">Email</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-foreground/80">Role</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-foreground/80">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.uid} className="border-b border-border/30 hover:bg-white/20 dark:hover:bg-white/5 transition">
                    <td className="py-4 px-6 text-sm font-medium text-foreground">{user.name}</td>
                    <td className="py-4 px-6 text-sm text-foreground/60">{user.email}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium glass-badge rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-foreground/60">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${cardClass} w-full max-w-md`}>
            <div className="p-6 border-b border-border/50">
              <h3 className="text-xl font-semibold text-foreground">Create New User</h3>
              <p className="text-sm text-foreground/60 mt-1">Fill in the details to create a new user account</p>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-foreground/60">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={`${fieldClass} py-2`}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={`${fieldClass} py-2`}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className={`${fieldClass} py-2`}
                >
                  <option value="complainer">Ticket Creator (Complainer)</option>
                  <option value="technician">Support Technician</option>
                  <option value="admin">Administrator</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className={`${fieldClass} py-2`}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground/80">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`${fieldClass} py-2`}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 glass-button-secondary text-primary rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-2 glass-button text-white transition disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
