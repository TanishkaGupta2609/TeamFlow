import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders TeamFlow brand name and tagline', () => {
    render(<App />);
    expect(screen.getAllByText(/TeamFlow/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Plan clearly. Work together. Deliver better./i).length).toBeGreaterThan(0);
  });

  it('renders application screens and architectural sections', () => {
    render(<App />);
    expect(screen.getByText(/Stage 02 Frontend Application Implemented/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Project Management/i).length).toBeGreaterThan(0);
  });
});
