import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';

export default function TopBar() {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="px-11 pt-8">
      <div className="border-4 border-black bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-black cursor-pointer" onClick={() => navigate('/dashboard')}>
            Frello
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user?.name}!</span>
            <Button variant="dashed" size="md" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
