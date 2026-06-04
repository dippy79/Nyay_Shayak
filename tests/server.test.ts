import request from 'supertest';
import express from 'express';

// NOTE: We do not spin up the real server.ts here because it starts listening.
// This scaffold focuses on importability + route-level tests; you can wire the real app later.
// For now, we test that the endpoints return 404 on a minimal express app.

describe('Test scaffold - server routes', () => {
  test('POST /api/interpret-document returns 404 (scaffold)', async () => {
    const app = express();
    const res = await request(app).post('/api/interpret-document').send({});
    expect(res.status).toBe(404);
  });
});

