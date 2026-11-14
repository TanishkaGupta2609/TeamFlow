import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Input, PasswordInput, Button, Checkbox, useToast } from '../../components/ui';

export const LoginPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('tanishka@teamflow.io');
  const [password, setPassword] = useState('Password123!');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email) newErrors.email = 'Email address is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Welcome Back!', 'Signed into TeamFlow HQ.');
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-charcoal">Sign In to TeamFlow</h2>
        <p className="text-xs text-charcoal-secondary mt-1">
          Enter your credentials to access your organization workspaces.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="auth-email"
          label="Work Email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4 text-charcoal-secondary" />}
          required
        />

        <PasswordInput
          id="auth-password"
          label="Password"
          placeholder="Enter your account password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <Checkbox
            id="remember-me"
            label="Remember me for 30 days"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link
            to="/forgot-password"
            className="font-medium text-forest hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      <div className="pt-4 border-t border-border text-center text-xs text-charcoal-secondary">
        Don&apos;t have an account yet?{' '}
        <Link to="/register" className="font-semibold text-forest hover:underline">
          Create free organization
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
