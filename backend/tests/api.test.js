const request = require('supertest');
const app = require('../index');
const db = require('../db');

describe('Subscription Management API Tests', () => {
    // 테스팅 후 DB 연결 종료
    afterAll(async () => {
        await db.pool.end();
    });

    describe('GET /api/v1/invoices', () => {
        it('should return a list of invoices', async () => {
            const res = await request(app).get('/api/v1/invoices');
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.invoices)).toBe(true);
        });

        it('should filter invoices by payment_status', async () => {
            const res = await request(app)
                .get('/api/v1/invoices')
                .query({ payment_status: 'PAID' });

            expect(res.statusCode).toEqual(200);
            res.body.data.invoices.forEach(inv => {
                expect(inv.payment_status).toBe('PAID');
            });
        });
    });

    describe('GET /api/v1/customers', () => {
        it('should return a list of customers', async () => {
            const res = await request(app).get('/api/v1/customers');
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            if (res.body.data.length > 0) {
                expect(res.body.data[0]).toHaveProperty('name');
                expect(res.body.data[0]).toHaveProperty('email');
            }
        });
    });
});
