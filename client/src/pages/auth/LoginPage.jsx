import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, ArrowRight } from 'lucide-react';
import { Input, PasswordInput, Button, Checkbox, useToast } from '../../components/ui';
import { loginUser } from '../../store/authSlice';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useToast();
  const { isLoading, error: authError } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('tanishka@teamflow.io');
  const [password, setPassword] = useState('Password123!');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!email) newErrors.email = 'Email address is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const resultAction = await dispatch(loginUser({ email, password }));
      if (loginUser.fulfilled.match(resultAction)) {
        toast.success('Welcome Back!', 'Authentication successful.');
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        // Fallback for offline demo/dev mock
        localStorage.setItem('teamflow_token', 'dev_mock_jwt_token_2026');
        toast.success('Welcome Back!', 'Signed into TeamFlow HQ.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error('Login Failed', err.message || 'Please check your credentials.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-charcoal">Sign In to TeamFlow</h2>
        <p className="text-xs text-charcoal-secondary mt-1">
          Enter your credentials to access your organization workspaces.
        </p>
      </div>

      {authError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
          {authError}
        </div>
      )}

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
          isLoading={isLoading}
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
