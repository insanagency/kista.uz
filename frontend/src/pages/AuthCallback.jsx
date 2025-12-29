import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

export default function AuthCallback() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        toast.error(t('auth.googleLoginFailed'));
        navigate('/login');
        return;
      }

      if (token && userParam) {
        try {
          // Save token and set axios header
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Parse user data from URL parameter
          const userData = JSON.parse(decodeURIComponent(userParam));

          // Save user data
          localStorage.setItem('user', JSON.stringify(userData));

          // Show welcome message
          toast.success(t('auth.welcomeBack'));

          // Redirect to dashboard
          window.location.href = '/dashboard';
        } catch (err) {
          console.error('Error processing OAuth callback:', err);
          toast.error(t('auth.authFailed'));
          navigate('/login');
        }
      } else {
        toast.error(t('auth.authFailed'));
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}

