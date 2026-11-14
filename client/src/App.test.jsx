import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders TeamFlow brand name and tagline', () => {
    render(<App />);
    expect(screen.getAllByText(/TeamFlow/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Plan clearly. Work together. Deliver better./i).length).toBeGreaterThan(0);
  });

  it('renders design system and architectural sections', () => {
    render(<App />);
    expect(screen.getByText(/Stage 01 Design System/i)).toBeInTheDocument();
    expect(screen.getByText(/Frontend Core/i)).toBeInTheDocument();
  });
});
