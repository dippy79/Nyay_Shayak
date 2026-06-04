import request from 'supertest';
import express from 'express';

describe('API scaffold tests (importability)', () => {
  test('GET /api/scraper-status returns 404 in scaffold', async () => {
    const app = express();
    const res = await request(app).get('/api/scraper-status');
    expect(res.status).toBe(404);
  });
});

