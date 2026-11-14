import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input, Button, useToast } from '../../components/ui';

export const ForgotPasswordPage = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your registered work email');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.info('Reset Link Sent', 'Check your inbox for password reset instructions.');
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-charcoal">Reset Password</h2>
        <p className="text-xs text-charcoal-secondary mt-1">
          Enter your email and we will send you a secure verification link to reset your credentials.
        </p>
      </div>

      {submitted ? (
        <div className="p-5 rounded-xl bg-forest/5 border border-forest/15 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-forest text-white flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5 text-amber-accent" />
          </div>
          <h3 className="font-heading font-bold text-sm text-charcoal">
            Password Reset Instructions Sent
          </h3>
          <p className="text-xs text-charcoal-secondary">
            We sent an email to <strong className="text-charcoal">{email}</strong>. Follow the instructions to choose a new password.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" size="sm" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="forgot-email"
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            leftIcon={<Mail className="w-4 h-4 text-charcoal-secondary" />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Send Reset Instructions
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-secondary hover:text-charcoal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
