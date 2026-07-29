import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArabicKeyboard } from './ArabicKeyboard';

const ARABIC_ALPHABET = Array.from('ابتثجحخدذرزسشصضطظعغفقكلمنهوي');

describe('ArabicKeyboard', () => {
  it('renders every letter of the Arabic alphabet as a key', () => {
    render(<ArabicKeyboard onKey={() => {}} onBackspace={() => {}} onEnter={() => {}} />);
    for (const letter of ARABIC_ALPHABET) {
      expect(screen.getByText(letter)).toBeInTheDocument();
    }
  });

  it('calls onKey with the clicked letter', async () => {
    const onKey = vi.fn();
    render(<ArabicKeyboard onKey={onKey} onBackspace={() => {}} onEnter={() => {}} />);
    await userEvent.click(screen.getByText('ق'));
    expect(onKey).toHaveBeenCalledWith('ق');
  });

  it('calls onBackspace and onEnter for their respective controls', async () => {
    const onBackspace = vi.fn();
    const onEnter = vi.fn();
    render(<ArabicKeyboard onKey={() => {}} onBackspace={onBackspace} onEnter={onEnter} />);
    await userEvent.click(screen.getByText(/حذف/));
    await userEvent.click(screen.getByText(/تأكيد/));
    expect(onBackspace).toHaveBeenCalledOnce();
    expect(onEnter).toHaveBeenCalledOnce();
  });

  it('disables all keys when disabled prop is set', () => {
    render(<ArabicKeyboard onKey={() => {}} onBackspace={() => {}} onEnter={() => {}} disabled />);
    expect(screen.getByText('ا').closest('button')).toBeDisabled();
  });
});
