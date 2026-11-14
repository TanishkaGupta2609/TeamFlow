import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UserCheck, ArrowRight } from 'lucide-react';
import { PasswordInput, Input, Button, useToast } from '../../components/ui';

export const AcceptInvitePage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('Elena Rostova');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccept = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Invitation Accepted', 'Welcome to TeamFlow Headquarters.');
      navigate('/dashboard');
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-charcoal">Join TeamFlow Headquarters</h2>
        <p className="text-xs text-charcoal-secondary">
          You have been invited by <strong className="text-charcoal">Tanishka Gupta</strong> to join as a <strong className="text-forest">Member</strong>.
        </p>
      </div>

      <form onSubmit={handleAccept} className="space-y-4">
        <Input
          id="inv-email"
          label="Email Address"
          value="elena.rostova@teamflow.io"
          disabled
          helperText="Invited address cannot be changed."
        />

        <Input
          id="inv-name"
          label="Your Full Name"
          value={name}
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
          isLoading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Accept Invitation &amp; Enter Workspace
        </Button>
      </form>
    </div>
  );
};

export default AcceptInvitePage;
