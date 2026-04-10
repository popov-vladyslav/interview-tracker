require('dotenv').config({ path: require('path').join(__dirname, '../../.env.test') });
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';
