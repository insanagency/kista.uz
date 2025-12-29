
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { toast } from 'sonner';
import { Users, Check, Loader2, AlertCircle } from 'lucide-react';

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function JoinFamily() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [familyInfo, setFamilyInfo] = useState(null);

  const handleJoin = useCallback(async (code) => {
    try {
      console.log('Attempting to join family with code:', code);
      setLoading(true);
      setError(null);

      const response = await api.post('/families/join', { code: code.trim().toUpperCase() });

      console.log('Join response:', response.data);
      setFamilyInfo(response.data.family);
      toast.success(response.data.message || t('family.joinSuccess'));

      // Redirect to family page after 2 seconds
      setTimeout(() => {
        navigate('/family');
      }, 2000);
    } catch (err) {
      console.error('Error joining family:', err);

      const errorMsg = err.response?.data?.error || 'Failed to join family';

      if (err.response?.status === 404) {
        setError('Invalid or expired invite code. Please check the code and try again.');
      } else if (err.response?.status === 400) {
        setError(errorMsg);
      } else if (err.response?.status === 403 || err.response?.status === 401) {
        setError('Authentication error. Please log in first.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(errorMsg);
      }

      toast.error(errorMsg);
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setError('No invite code provided in URL');
      setLoading(false);
      return;
    }

    // Auto-join with the code
    handleJoin(code);
  }, [searchParams, handleJoin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 transition-colors">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            Joining Family...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we process your invite
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 transition-colors p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="text-center pt-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">
                Unable to Join Family
              </h2>
              <p className="mb-4 text-muted-foreground">
                {error}
              </p>
              <div className="rounded-lg p-3 mb-6 text-sm text-left bg-muted">
                <p className="text-foreground">
                  <strong>Invite Code:</strong> {searchParams.get('code') || 'Not found'}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    const code = searchParams.get('code');
                    if (code) handleJoin(code);
                  }}
                  className="w-full"
                >
                  Try Again
                </Button>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => navigate('/family')} className="flex-1">
                    Go to Families
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                    Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 transition-colors p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="text-center pt-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100 dark:bg-green-900/20">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              Successfully Joined!
            </h2>
            {familyInfo && (
              <p className="mb-6 text-muted-foreground">
                Welcome to <span className="font-semibold text-foreground">{familyInfo.name}</span>
              </p>
            )}
            <p className="text-sm mb-6 text-muted-foreground">
              Redirecting to family page...
            </p>
            <Button onClick={() => navigate('/family')} className="w-full">
              Go to Family Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
