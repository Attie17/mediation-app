import { Button } from '../components/ui/button';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { toTitleCaseName } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetup() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.preferredName || user?.name || 'there';

  const addressValue = React.useMemo(() => {
    const addr = user?.address;
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      return addr.line1 || addr.street || addr.address || '';
    }
    return '';
  }, [user?.address]);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData(e.currentTarget);
      const fullName = toTitleCaseName((data.get('fullName') || '').toString());
      const preferredName = toTitleCaseName((data.get('preferredName') || '').toString());
      const phone = (data.get('phone') || '').toString().trim();
      const addressRaw = (data.get('address') || '').toString().trim();
      const role = (data.get('role') || user?.role || 'divorcee').toString();
      const address = addressRaw ? { line1: addressRaw } : null;
      await updateUser({ name: fullName, preferredName, phone, address, role });
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 md:p-12 text-white">
      <div className="w-full max-w-md">
        <h3 className="text-2xl font-bold mb-4">Welcome {displayName}, please complete your profile</h3>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input name="fullName" type="text" placeholder="Full names" defaultValue={user?.name || ''} className="w-full rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white" />
          <input name="preferredName" type="text" placeholder="How would you like us to address you?" defaultValue={user?.preferredName || ''} className="w-full rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white" />
          <input name="phone" type="tel" placeholder="Phone" defaultValue={user?.phone || ''} className="w-full rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white" />
          <input name="address" type="text" placeholder="Address" defaultValue={addressValue} className="w-full rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white" />
          <select name="role" defaultValue={user?.role || 'divorcee'} className="w-full rounded-md px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white">
            <option value="mediator">Mediator</option>
            <option value="divorcee">Divorcee</option>
            <option value="lawyer">Lawyer</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" disabled={saving} className="w-full" variant="default" size="md">
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
          {error && <div className="text-sm text-red-200">{error}</div>}
        </form>
      </div>
    </div>
  );
}
