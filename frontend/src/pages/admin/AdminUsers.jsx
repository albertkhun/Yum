import { useState, useEffect } from 'react';
import { Users, Trash2, Shield, User, Store } from 'lucide-react';
import { adminAPI }    from '../../services/api';
import { PageSpinner } from '../../components/common/Spinner';
import EmptyState      from '../../components/common/EmptyState';
import { timeAgo }     from '../../utils/helpers';
import { useAuth }     from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_COLORS = { admin: 'badge-blue', owner: 'badge-orange', user: 'badge-gray' };
const ROLE_ICONS  = { admin: Shield, owner: Store, user: User };

export default function AdminUsers() {
  const { user: me }  = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(null);
  const [filter,  setFilter]  = useState('');

  useEffect(() => {
    setLoading(true);
    adminAPI.getAllUsers(filter ? { role: filter } : {})
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [filter]);

  const changeRole = async (id, role) => {
    setActing(id);
    try {
      await adminAPI.changeUserRole(id, role);
      setUsers((p) => p.map((u) => u._id === id ? { ...u, role } : u));
      toast.success(`Role updated to ${role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setActing(null); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their listings?')) return;
    setActing(id + '_del');
    try {
      await adminAPI.deleteUser(id);
      setUsers((p) => p.filter((u) => u._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed'); }
    finally { setActing(null); }
  };

  return (
    <div className="page-wrapper">
      <div className="flex items-center gap-2 mb-6">
        <Users size={22} className="text-brand" />
        <div>
          <h1 className="section-title">Manage Users</h1>
          <p className="text-gray-500 text-sm">{users.length} users</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
        {[{ label: 'All', val: '' }, { label: 'Users', val: 'user' }, { label: 'Owners', val: 'owner' }, { label: 'Admins', val: 'admin' }].map(({ label, val }) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === val ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-4">User</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-1">Action</div>
          </div>

          <div className="divide-y divide-gray-50">
            {users.map((u) => {
              const RoleIcon = ROLE_ICONS[u.role];
              const isMe = u._id === me?.id;
              return (
                <div key={u._id}
                  className={`flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 px-4 sm:px-5 py-4 sm:py-3.5 hover:bg-gray-50 transition-colors ${isMe ? 'bg-orange-50/50' : ''}`}>
                  {/* Avatar + name */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-sm shrink-0">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {u.name}{isMe && <span className="ml-1.5 text-xs text-brand">(you)</span>}
                      </p>
                      {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-span-3 flex items-center">
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{u.email}</p>
                  </div>

                  {/* Role */}
                  <div className="col-span-2 flex items-center">
                    {isMe ? (
                      <span className={`badge text-xs ${ROLE_COLORS[u.role]}`}><RoleIcon size={11} />{u.role}</span>
                    ) : (
                      <select value={u.role} disabled={acting === u._id} onChange={(e) => changeRole(u._id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white cursor-pointer disabled:opacity-50">
                        <option value="user">user</option>
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </div>

                  {/* Joined */}
                  <div className="col-span-2 flex items-center">
                    <p className="text-xs text-gray-400">{timeAgo(u.createdAt)}</p>
                  </div>

                  {/* Delete */}
                  <div className="col-span-1 flex items-center">
                    {!isMe && (
                      <button onClick={() => deleteUser(u._id)} disabled={acting === u._id + '_del'}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40" title="Delete user">
                        {acting === u._id + '_del'
                          ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
