const request = require('supertest');
const { buildApp, createTestUser, authHeader } = require('../../__tests__/helpers');

let app, token;

beforeAll(async () => {
  app = buildApp();
  const result = await createTestUser(app);
  token = result.token;
});

describe('POST /api/companies', () => {
  it('creates a company with default stages', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set(authHeader(token))
      .send({ name: 'Test Corp', role: 'Engineer' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Corp');
    expect(res.body.stages).toHaveLength(4);
    expect(res.body.stages.map(s => s.name)).toEqual([
      'CV Review', 'HR Review', 'Technical', 'Client',
    ]);
  });

  it('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set(authHeader(token))
      .send({ role: 'Engineer' });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/companies')
      .send({ name: 'No Auth Corp' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/companies', () => {
  it('lists companies with stages', async () => {
    const res = await request(app)
      .get('/api/companies')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('stages');
  });

  it('only returns own companies', async () => {
    const other = await createTestUser(app);

    await request(app)
      .post('/api/companies')
      .set(authHeader(other.token))
      .send({ name: 'Other User Corp' });

    const res = await request(app)
      .get('/api/companies')
      .set(authHeader(token));

    const names = res.body.map(c => c.name);
    expect(names).not.toContain('Other User Corp');
  });
});

describe('GET /api/companies/:id', () => {
  let companyId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/companies')
      .set(authHeader(token))
      .send({ name: 'Detail Corp' });
    companyId = res.body.id;
  });

  it('returns company with stages, contacts, notes', async () => {
    const res = await request(app)
      .get(`/api/companies/${companyId}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Detail Corp');
    expect(res.body).toHaveProperty('stages');
    expect(res.body).toHaveProperty('contacts');
    expect(res.body).toHaveProperty('notes');
  });

  it('returns 404 for non-existent company', async () => {
    const res = await request(app)
      .get('/api/companies/999999')
      .set(authHeader(token));

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/companies/:id', () => {
  let companyId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/companies')
      .set(authHeader(token))
      .send({ name: 'Update Corp' });
    companyId = res.body.id;
  });

  it('updates company fields', async () => {
    const res = await request(app)
      .put(`/api/companies/${companyId}`)
      .set(authHeader(token))
      .send({ name: 'Updated Corp', status: 'Active', salary: '100k' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Corp');
    expect(res.body.status).toBe('Active');
    expect(res.body.salary).toBe('100k');
  });

  it('partial update keeps existing values', async () => {
    const res = await request(app)
      .put(`/api/companies/${companyId}`)
      .set(authHeader(token))
      .send({ location: 'Remote City' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Corp'); // unchanged
    expect(res.body.location).toBe('Remote City');
  });
});

describe('DELETE /api/companies/:id', () => {
  it('deletes company and cascades', async () => {
    const createRes = await request(app)
      .post('/api/companies')
      .set(authHeader(token))
      .send({ name: 'Delete Corp' });

    const res = await request(app)
      .delete(`/api/companies/${createRes.body.id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    // Verify it's gone
    const getRes = await request(app)
      .get(`/api/companies/${createRes.body.id}`)
      .set(authHeader(token));
    expect(getRes.status).toBe(404);
  });
});

describe('Stages CRUD', () => {
  let companyId, stageId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/companies')
      .set(authHeader(token))
      .send({ name: 'Stages Corp' });
    companyId = res.body.id;
    stageId = res.body.stages[0].id;
  });

  describe('PUT /api/stages/:id', () => {
    it('updates stage status', async () => {
      const res = await request(app)
        .put(`/api/stages/${stageId}`)
        .set(authHeader(token))
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
    });

    it('updates stage feedback', async () => {
      const res = await request(app)
        .put(`/api/stages/${stageId}`)
        .set(authHeader(token))
        .send({ feedback: 'Great interview', interviewer: 'John' });

      expect(res.status).toBe(200);
      expect(res.body.feedback).toBe('Great interview');
      expect(res.body.interviewer).toBe('John');
    });

    it('returns 404 for non-existent stage', async () => {
      const res = await request(app)
        .put('/api/stages/999999')
        .set(authHeader(token))
        .send({ status: 'completed' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/stages/:companyId', () => {
    it('creates a custom stage', async () => {
      const res = await request(app)
        .post(`/api/stages/${companyId}`)
        .set(authHeader(token))
        .send({ name: 'System Design' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('System Design');
      expect(res.body.status).toBe('pending');
    });

    it('rejects duplicate stage name', async () => {
      const res = await request(app)
        .post(`/api/stages/${companyId}`)
        .set(authHeader(token))
        .send({ name: 'System Design' });

      expect(res.status).toBe(409);
    });

    it('rejects empty name', async () => {
      const res = await request(app)
        .post(`/api/stages/${companyId}`)
        .set(authHeader(token))
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('rejects name over 100 chars', async () => {
      const res = await request(app)
        .post(`/api/stages/${companyId}`)
        .set(authHeader(token))
        .send({ name: 'A'.repeat(101) });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/stages/:id', () => {
    it('deletes a stage', async () => {
      // Create an extra stage first
      const createRes = await request(app)
        .post(`/api/stages/${companyId}`)
        .set(authHeader(token))
        .send({ name: 'Temp Stage' });

      const res = await request(app)
        .delete(`/api/stages/${createRes.body.id}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
    });

    it('prevents deleting the last stage', async () => {
      // Create a new company with default stages, then delete all but one
      const newCompany = await request(app)
        .post('/api/companies')
        .set(authHeader(token))
        .send({ name: 'Last Stage Corp' });

      const stages = newCompany.body.stages;

      // Delete all but the last
      for (let i = 0; i < stages.length - 1; i++) {
        await request(app)
          .delete(`/api/stages/${stages[i].id}`)
          .set(authHeader(token));
      }

      // Try to delete the last one
      const res = await request(app)
        .delete(`/api/stages/${stages[stages.length - 1].id}`)
        .set(authHeader(token));

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/last stage/i);
    });
  });
});
