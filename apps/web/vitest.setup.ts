import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Clerk hooks
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'user_123',
    getToken: vi.fn(() => Promise.resolve('mock-token')),
  }),
  useUser: () => ({
    user: { id: 'user_123' },
  }),
}));
