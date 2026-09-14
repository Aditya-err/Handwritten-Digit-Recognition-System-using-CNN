import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DrawingCanvas } from './DrawingCanvas';

// Mock canvas getContext since jsdom doesn't support canvas
beforeEach(() => {
  // Create a mock 2D context
  const mockCtx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  };

  // Mock HTMLCanvasElement.getContext
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    mockCtx as unknown as CanvasRenderingContext2D,
  );

  // Mock toDataURL
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    'data:image/png;base64,mockBase64Data',
  );

  // Mock getBoundingClientRect for coordinate scaling
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 320,
    height: 320,
    right: 320,
    bottom: 320,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
});

describe('DrawingCanvas', () => {
  it('renders the canvas with the correct aria-label', () => {
    const onPredict = vi.fn();
    render(<DrawingCanvas onPredict={onPredict} />);

    const canvas = screen.getByRole('img', {
      name: 'Drawing canvas for digit recognition',
    });
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('renders the Clear button with an accessible label', () => {
    const onPredict = vi.fn();
    render(<DrawingCanvas onPredict={onPredict} />);

    const clearButton = screen.getByRole('button', { name: /clear canvas/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('renders the Predict button with an accessible label when autoPredict is false', () => {
    const onPredict = vi.fn();
    render(<DrawingCanvas onPredict={onPredict} autoPredict={false} />);

    const predictButton = screen.getByRole('button', { name: /predict digit/i });
    expect(predictButton).toBeInTheDocument();
  });

  it('does not render the Predict button when autoPredict is true', () => {
    const onPredict = vi.fn();
    render(<DrawingCanvas onPredict={onPredict} autoPredict={true} />);

    const predictButton = screen.queryByRole('button', { name: /predict digit/i });
    expect(predictButton).not.toBeInTheDocument();
  });

  it('Clear button is disabled when canvas has no content', () => {
    const onPredict = vi.fn();
    render(<DrawingCanvas onPredict={onPredict} />);

    const clearButton = screen.getByRole('button', { name: /clear canvas/i });
    expect(clearButton).toBeDisabled();
  });

  it('calls onClear when Clear button is clicked after drawing', () => {
    const onPredict = vi.fn();
    const onClear = vi.fn();
    render(<DrawingCanvas onPredict={onPredict} onClear={onClear} />);

    const canvas = screen.getByRole('img', {
      name: 'Drawing canvas for digit recognition',
    });

    // Simulate drawing to enable clear
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas);

    const clearButton = screen.getByRole('button', { name: /clear canvas/i });
    expect(clearButton).not.toBeDisabled();

    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('calls onPredict with base64 data when Predict is clicked after drawing', () => {
    const onPredict = vi.fn();
    render(<DrawingCanvas onPredict={onPredict} autoPredict={false} />);

    const canvas = screen.getByRole('img', {
      name: 'Drawing canvas for digit recognition',
    });

    // Simulate drawing
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    const predictButton = screen.getByRole('button', { name: /predict digit/i });
    expect(predictButton).not.toBeDisabled();

    fireEvent.click(predictButton);
    expect(onPredict).toHaveBeenCalledTimes(1);
    expect(onPredict).toHaveBeenCalledWith('data:image/png;base64,mockBase64Data');
  });

  it('disables interactions when disabled prop is true', () => {
    const onPredict = vi.fn();
    render(<DrawingCanvas onPredict={onPredict} disabled={true} />);

    const clearButton = screen.getByRole('button', { name: /clear canvas/i });
    expect(clearButton).toBeDisabled();
  });
});
