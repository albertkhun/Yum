import { useState }    from 'react';
import { GoogleLogin }  from '@react-oauth/google';
import { useNavigate }  from 'react-router-dom';
import { useAuth }      from '../../context/AuthContext';
import GoogleCompleteModal from './GoogleCompleteModal';
import toast from 'react-hot-toast';

export default function GoogleButton() {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [pendingProfile, setPendingProfile] = useState(null); // holds googleProfile for new users

  const handleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLogin(credentialResponse.credential);

      if (data.isNewUser) {
        // Show completion modal with pre-filled data
        setPendingProfile(data.googleProfile);
      } else {
        // Existing user — navigate directly
        toast.success(`Welcome back, ${data.user.name}! 👋`);
        if (!data.user.role)                 navigate('/select-role');
        else if (data.user.role === 'admin') navigate('/admin');
        else if (data.user.role === 'owner') navigate('/owner');
        else                                 navigate('/listings');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    }
  };

  return (
    <>
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => toast.error('Google sign-in failed. Please try again.')}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="360"
          />
        </div>
      </div>

      {/* Completion modal for new Google users */}
      {pendingProfile && (
        <GoogleCompleteModal
          googleProfile={pendingProfile}
          onClose={() => setPendingProfile(null)}
        />
      )}
    </>
  );
}
