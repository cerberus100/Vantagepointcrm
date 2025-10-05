import { render, screen } from '@testing-library/react';
import { MetricCard } from '../MetricCard';
import { Hospital } from 'lucide-react';

describe('MetricCard', () => {
  const mockProps = {
    icon: Hospital,
    label: 'Test Metric',
    value: 123,
    subLabel: 'vs 100 last month',
    trend: { direction: 'up' as const, value: '23%' }
  };

  test('renders metric card with all props', () => {
    render(<MetricCard {...mockProps} />);
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('vs 100 last month')).toBeInTheDocument();
    expect(screen.getByText('23%')).toBeInTheDocument();
  });

  test('renders without optional props', () => {
    const minimalProps = {
      icon: Hospital,
      label: 'Minimal Metric',
      value: 456
    };
    
    render(<MetricCard {...minimalProps} />);
    
    expect(screen.getByText('Minimal Metric')).toBeInTheDocument();
    expect(screen.getByText('456')).toBeInTheDocument();
  });

  test('displays correct trend direction', () => {
    const upTrendProps = {
      ...mockProps,
      trend: { direction: 'up' as const, value: '15%' }
    };
    
    const downTrendProps = {
      ...mockProps,
      trend: { direction: 'down' as const, value: '5%' }
    };
    
    const { rerender } = render(<MetricCard {...upTrendProps} />);
    expect(screen.getByText('15%')).toBeInTheDocument();
    
    rerender(<MetricCard {...downTrendProps} />);
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  test('handles string values', () => {
    const stringValueProps = {
      ...mockProps,
      value: '99%'
    };
    
    render(<MetricCard {...stringValueProps} />);
    expect(screen.getByText('99%')).toBeInTheDocument();
  });
});
