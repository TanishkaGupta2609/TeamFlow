import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PasswordInput, Button, useToast } from '../../components/ui';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Password Updated', 'Your password has been changed. Please sign in.');
      navigate('/login');
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-charcoal">Set New Password</h2>
        <p className="text-xs text-charcoal-secondary mt-1">
          Please enter and confirm your new secure account password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          id="new-pass"
          label="New Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />

        <PasswordInput
          id="confirm-pass"
          label="Confirm New Password"
          placeholder="Re-type new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
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
          Update Password &amp; Sign In
        </Button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
