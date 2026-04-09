const request = require('supertest');
const { createApp } = require('../app');

function buildApp() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';
  return createApp();
}

async function createTestUser(app, overrides = {}) {
  const userData = {
    email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'testpassword123',
    name: 'Test User',
    ...overrides,
  };

  const res = await request(app)
    .post('/api/auth/register')
    .send(userData);

  return {
    user: res.body.user,
    token: res.body.token,
    credentials: userData,
  };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { buildApp, createTestUser, authHeader };
