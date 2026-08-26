import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Module 6: Campus Marketplace Tests', () => {
  let sellerToken: string;
  let buyerToken: string;
  let testProductId: number;
  let testRequestId: number;
  let testConvId: number;

  beforeAll(async () => {
    // Student 2 is seller
    const sRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student2@sbjit.edu.in', password: 'Password@123' });
    sellerToken = sRes.body.data.accessToken;

    // Student 1 is buyer
    const bRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@sbjit.edu.in', password: 'Password@123' });
    buyerToken = bRes.body.data.accessToken;
  });

  it('Seller should be able to create a product listing', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .field('title', 'Casio FX-991EX Classwiz Calculator')
      .field('description', 'High speed scientific calculator with spreadsheet function. Clean and working.')
      .field('category', 'CALCULATOR')
      .field('price', '450')
      .field('condition', 'LIKE_NEW')
      .field('campusInfo', 'Hostel B, Room 204');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain('Casio FX-991EX');
    testProductId = res.body.data.id;
  });

  it('Buyer should be able to search and filter products', async () => {
    const res = await request(app)
      .get('/api/v1/marketplace/products?category=CALCULATOR&search=Casio')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].id).toBe(testProductId);
  });

  it('Buyer should be able to send purchase request to seller', async () => {
    const res = await request(app)
      .post(`/api/v1/marketplace/products/${testProductId}/request`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ message: 'Can we meet at the cafeteria tomorrow at 4 PM for the handover?' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    testRequestId = res.body.data.id;
  });

  it('Seller cannot request to buy their own product', async () => {
    const res = await request(app)
      .post(`/api/v1/marketplace/products/${testProductId}/request`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ message: 'Self purchase' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Seller can accept purchase request -> product becomes RESERVED', async () => {
    const res = await request(app)
      .patch(`/api/v1/marketplace/requests/${testRequestId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');

    // Verify product status is RESERVED
    const pRes = await request(app)
      .get(`/api/v1/marketplace/products/${testProductId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(pRes.body.data.status).toBe('RESERVED');
  });

  it('Buyer and Seller can chat privately about the product', async () => {
    // Start conversation
    const startRes = await request(app)
      .post('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        productId: testProductId,
        initialMessage: 'Hey! I submitted the request. See you tomorrow at the cafe.',
      });

    expect(startRes.status).toBe(201);
    testConvId = startRes.body.data.id;

    // Seller replies
    const replyRes = await request(app)
      .post(`/api/v1/chat/conversations/${testConvId}/messages`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ content: 'Sounds great! I will bring the calculator and battery.' });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.data.content).toContain('Sounds great');

    // Buyer fetches conversation messages
    const msgRes = await request(app)
      .get(`/api/v1/chat/conversations/${testConvId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(msgRes.status).toBe(200);
    expect(msgRes.body.data.messages.length).toBeGreaterThanOrEqual(2);
  });

  it('Seller marks product as SOLD upon physical exchange', async () => {
    const res = await request(app)
      .patch(`/api/v1/marketplace/requests/${testRequestId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(200);

    const pRes = await request(app)
      .get(`/api/v1/marketplace/products/${testProductId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(pRes.body.data.status).toBe('SOLD');
  });
});
