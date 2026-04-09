const request = require('supertest');
const { buildApp, createTestUser, authHeader } = require('../../__tests__/helpers');

let app;

beforeAll(() => {
  app = buildApp();
});

describe('POST /api/auth/register', () => {
  it('creates a new user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `register-${Date.now()}@example.com`,
        password: 'password123',
        name: 'New User',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('email');
    expect(res.body.user).toHaveProperty('name', 'New User');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('rejects missing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects missing password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `short-${Date.now()}@example.com`, password: '1234567' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  it('rejects duplicate email', async () => {
    const email = `dup-${Date.now()}@example.com`;

    await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'First' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Second' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already/i);
  });

  it('lowercases email', async () => {
    const email = `UPPER-${Date.now()}@EXAMPLE.COM`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email.toLowerCase());
  });
});

describe('POST /api/auth/login', () => {
  let credentials;

  beforeAll(async () => {
    const result = await createTestUser(app);
    credentials = result.credentials;
  });

  it('returns token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', credentials.email);
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user with valid token', async () => {
    const { token, user } = await createTestUser(app);

    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', user.id);
    expect(res.body).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
  });

  it('rejects request without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader('invalid-token'));

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/auth/me', () => {
  it('deletes account and all associated data', async () => {
    const { token } = await createTestUser(app);

    const deleteRes = await request(app)
      .delete('/api/auth/me')
      .set(authHeader(token));

    expect(deleteRes.status).toBe(200);

    // Verify account no longer accessible
    const meRes = await request(app)
      .get('/api/auth/me')
      .set(authHeader(token));

    expect(meRes.status).toBe(401);
  });
});
