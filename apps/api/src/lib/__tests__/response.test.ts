import { describe, expect, it, vi } from 'vitest';
import { sendError, sendSuccess } from '../response.js';

describe('response helpers', () => {
  it('returns reply from sendSuccess', () => {
    const sent = { ok: true };
    const reply: any = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnValue(sent),
    };

    const result = sendSuccess(reply, { id: '1' });

    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      data: { id: '1' },
      error: null,
    });
    expect(result).toBe(sent);
  });

  it('returns reply from sendError', () => {
    const sent = { ok: false };
    const reply: any = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnValue(sent),
    };

    const result = sendError(reply, 'FORBIDDEN', 'Denied', 403);

    expect(reply.code).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      data: null,
      error: {
        code: 'FORBIDDEN',
        message: 'Denied',
        details: undefined,
      },
    });
    expect(result).toBe(sent);
  });
});
