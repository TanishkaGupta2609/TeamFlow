import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Building, ArrowRight } from 'lucide-react';
import { Input, PasswordInput, Button, Checkbox, useToast } from '../../components/ui';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name) newErrors.name = 'Full name is required';
    if (!email) newErrors.email = 'Work email is required';
    if (!workspaceName) newErrors.workspaceName = 'Organization / Workspace name is required';
    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!terms) newErrors.terms = 'You must accept the terms of service';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Workspace Created!', 'Welcome to TeamFlow.');
      navigate('/dashboard');
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-charcoal">Create TeamFlow Account</h2>
        <p className="text-xs text-charcoal-secondary mt-1">
          Set up your organization workspace in less than two minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          id="reg-name"
          label="Full Name"
          placeholder="e.g. Tanishka Gupta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          leftIcon={<User className="w-4 h-4 text-charcoal-secondary" />}
          required
        />

        <Input
          id="reg-email"
          label="Work Email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4 text-charcoal-secondary" />}
          required
        />

        <Input
          id="reg-ws"
          label="Organization / Workspace Name"
          placeholder="e.g. Acme Studio"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          error={errors.workspaceName}
          leftIcon={<Building className="w-4 h-4 text-charcoal-secondary" />}
          required
        />

        <PasswordInput
          id="reg-password"
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />

        <div className="pt-1">
          <Checkbox
            id="reg-terms"
            label="I accept the TeamFlow Terms of Service and Privacy Policy"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />
          {errors.terms && (
            <p className="text-xs text-status-danger mt-1">{errors.terms}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-3"
          isLoading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Create Workspace &amp; Get Started
        </Button>
      </form>

      <div className="pt-4 border-t border-border text-center text-xs text-charcoal-secondary">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-forest hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
