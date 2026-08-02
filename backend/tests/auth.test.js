const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

describe('Enterprise Authentication Suite', () => {
  let isDbConnected = false;

  beforeAll(async () => {
    jest.setTimeout(10000);
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/enterprise_auth_test';
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      }
      isDbConnected = true;
    } catch (err) {
      console.warn('[Test Setup Warning] Local MongoDB not reachable. Skipping live DB integration assertions.');
      isDbConnected = false;
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test_${Date.now()}@enterprise.local`,
    password: 'Password@123!'
  };

  it('should validate API health endpoint', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('UP');
  });

  it('should register a new user successfully if DB connected', async () => {
    if (!isDbConnected) {
      console.log('Skipping DB integration test: MongoDB not connected.');
      return;
    }

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email.toLowerCase());
  });

  it('should reject duplicate registration for existing email if DB connected', async () => {
    if (!isDbConnected) return;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject login if email is not verified if DB connected', async () => {
    if (!isDbConnected) return;

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error.message).toContain('verify your email');
  });

  it('should allow login after manual verification of user in DB if DB connected', async () => {
    if (!isDbConnected) return;

    await User.updateOne({ email: testUser.email }, { $set: { isVerified: true, status: 'active' } });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
