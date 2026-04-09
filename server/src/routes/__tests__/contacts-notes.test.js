const request = require('supertest');
const { buildApp, createTestUser, authHeader } = require('../../__tests__/helpers');

let app, token, companyId, stageId;

beforeAll(async () => {
  app = buildApp();
  const result = await createTestUser(app);
  token = result.token;

  // Create a company for testing
  const companyRes = await request(app)
    .post('/api/companies')
    .set(authHeader(token))
    .send({ name: 'Contacts Notes Corp' });
  companyId = companyRes.body.id;
  stageId = companyRes.body.stages[0].id;
});

describe('Contacts', () => {
  describe('POST /api/contacts/:companyId', () => {
    it('creates a contact', async () => {
      const res = await request(app)
        .post(`/api/contacts/${companyId}`)
        .set(authHeader(token))
        .send({
          name: 'Jane Recruiter',
          role: 'Senior Recruiter',
          email: 'jane@example.com',
          phone: '+1234567890',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Jane Recruiter');
      expect(res.body.role).toBe('Senior Recruiter');
      expect(res.body.email).toBe('jane@example.com');
    });

    it('rejects missing name', async () => {
      const res = await request(app)
        .post(`/api/contacts/${companyId}`)
        .set(authHeader(token))
        .send({ role: 'Recruiter' });

      expect(res.status).toBe(400);
    });

    it('rejects non-existent company', async () => {
      const res = await request(app)
        .post('/api/contacts/999999')
        .set(authHeader(token))
        .send({ name: 'Ghost Contact' });

      expect(res.status).toBe(404);
    });

    it('rejects other user\'s company', async () => {
      const other = await createTestUser(app);
      const otherCompany = await request(app)
        .post('/api/companies')
        .set(authHeader(other.token))
        .send({ name: 'Other Corp' });

      const res = await request(app)
        .post(`/api/contacts/${otherCompany.body.id}`)
        .set(authHeader(token))
        .send({ name: 'Sneaky Contact' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('deletes a contact', async () => {
      const createRes = await request(app)
        .post(`/api/contacts/${companyId}`)
        .set(authHeader(token))
        .send({ name: 'Delete Me' });

      const res = await request(app)
        .delete(`/api/contacts/${createRes.body.id}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('returns 404 for non-existent contact', async () => {
      const res = await request(app)
        .delete('/api/contacts/999999')
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });
  });
});

describe('Notes', () => {
  describe('GET /api/notes/:companyId', () => {
    it('returns notes for a company', async () => {
      // Create a note first
      await request(app)
        .post(`/api/notes/${companyId}`)
        .set(authHeader(token))
        .send({ title: 'Test Note', content: 'Some content', type: 'general' });

      const res = await request(app)
        .get(`/api/notes/${companyId}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('title');
    });
  });

  describe('POST /api/notes/:companyId', () => {
    it('creates a note without stage', async () => {
      const res = await request(app)
        .post(`/api/notes/${companyId}`)
        .set(authHeader(token))
        .send({ title: 'General Note', content: 'Hello', type: 'general' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('General Note');
      expect(res.body.type).toBe('general');
      expect(res.body.stage_id).toBeNull();
    });

    it('creates a note with valid stage_id', async () => {
      const res = await request(app)
        .post(`/api/notes/${companyId}`)
        .set(authHeader(token))
        .send({
          title: 'Stage Note',
          content: 'Linked to stage',
          type: 'feedback',
          stage_id: stageId,
        });

      expect(res.status).toBe(201);
      expect(res.body.stage_id).toBe(stageId);
    });

    it('rejects invalid stage_id (wrong company)', async () => {
      // Create another company to get a different stage
      const otherCompany = await request(app)
        .post('/api/companies')
        .set(authHeader(token))
        .send({ name: 'Other Stage Corp' });
      const otherStageId = otherCompany.body.stages[0].id;

      const res = await request(app)
        .post(`/api/notes/${companyId}`)
        .set(authHeader(token))
        .send({
          title: 'Bad Stage Note',
          content: 'Wrong stage',
          stage_id: otherStageId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid stage/i);
    });

    it('rejects non-existent company', async () => {
      const res = await request(app)
        .post('/api/notes/999999')
        .set(authHeader(token))
        .send({ title: 'Ghost Note' });

      expect(res.status).toBe(404);
    });

    it('defaults title to Untitled', async () => {
      const res = await request(app)
        .post(`/api/notes/${companyId}`)
        .set(authHeader(token))
        .send({ content: 'No title' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Untitled');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('deletes a note', async () => {
      const createRes = await request(app)
        .post(`/api/notes/${companyId}`)
        .set(authHeader(token))
        .send({ title: 'Delete Me' });

      const res = await request(app)
        .delete(`/api/notes/${createRes.body.id}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });

    it('returns 404 for non-existent note', async () => {
      const res = await request(app)
        .delete('/api/notes/999999')
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });
  });
});
