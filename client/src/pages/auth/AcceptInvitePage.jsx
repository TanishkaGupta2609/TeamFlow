import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Building2, UserCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PasswordInput, Input, Button, useToast } from '../../components/ui';
import api from '../../services/api';

export const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!token);
  const [inviteData, setInviteData] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) {
      api
        .get(`/workspaces/invitations/${token}`)
        .then((res) => {
          setInviteData(res.data.data);
          setName(res.data.data?.email?.split('@')[0] || '');
        })
        .catch((err) => {
          setFetchError(err.response?.data?.message || 'Invalid or expired invitation token');
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [token]);

  const handleAccept = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (token) {
        await api.post(`/workspaces/invitations/${token}/accept`);
        toast.success('Invitation Accepted', `Welcome to ${inviteData?.workspace?.name || 'the workspace'}.`);
        navigate('/dashboard');
        return;
      }

      // Offline mock fallback
      toast.success('Invitation Accepted', 'Welcome to TeamFlow Headquarters.');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Acceptance Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchError) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-heading font-extrabold text-charcoal">Invitation Unavailable</h2>
        <p className="text-xs text-charcoal-secondary">{fetchError}</p>
        <Link to="/login" className="inline-block mt-4 text-xs font-bold text-forest hover:underline">
          Return to Sign In
        </Link>
      </div>
    );
  }

  const workspaceName = inviteData?.workspace?.name || 'TeamFlow Headquarters';
  const inviterName = inviteData?.invitedBy?.name || 'Workspace Administrator';
  const invitedRole = inviteData?.role || 'Member';
  const inviteEmail = inviteData?.email || 'collaborator@teamflow.io';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-charcoal">Join {workspaceName}</h2>
        <p className="text-xs text-charcoal-secondary">
          You have been invited by <strong className="text-charcoal">{inviterName}</strong> to join as a{' '}
          <strong className="text-forest capitalize">{invitedRole.toLowerCase()}</strong>.
        </p>
      </div>

      <form onSubmit={handleAccept} className="space-y-4">
        <Input
          id="inv-email"
          label="Email Address"
          value={inviteEmail}
          disabled
          helperText="Invited address cannot be changed."
        />

        <Input
          id="inv-name"
          label="Your Full Name"
          value={name || 'Elena Rostova'}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <PasswordInput
          id="inv-pass"
          label="Create Your Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={loading || fetching}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Accept Invitation &amp; Enter Workspace
        </Button>
      </form>
    </div>
  );
};

export default AcceptInvitePage;
