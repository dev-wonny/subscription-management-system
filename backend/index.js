const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const db = require('./db');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Subscription Management API',
            version: '1.0.0',
            description: 'API for managing customers, plans, subscriptions, and invoices.',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
    },
    apis: ['./index.js'], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Utilities
const calculateNextBillingDate = (startDate, cycle) => {
    const date = new Date(startDate);
    if (cycle === 'MONTHLY') {
        date.setMonth(date.getMonth() + 1);
    } else if (cycle === 'ANNUAL') {
        date.setFullYear(date.getFullYear() + 1);
    }
    return date.toISOString().split('T')[0];
};

// 1. 청구 내역 조회 API
/**
 * @swagger
 * /api/v1/invoices:
 *   get:
 *     summary: Retrieve a list of invoices
 *     tags: [Invoices]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: billing_month
 *         schema:
 *           type: string
 *           example: "2024-01"
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [PAID, PENDING, FAILED]
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [issued_at, billing_month, due_date, payment_date, customer_name, plan_name, payment_status, amount]
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: A list of invoices.
 */
app.get('/api/v1/invoices', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            billing_month,
            payment_status,
            customer_id,
            sort_by = 'issued_at',
            sort_order = 'desc'
        } = req.query;

        const offset = (page - 1) * limit;
        let query = `
      SELECT 
        i.*,
        c.name as customer_name,
        c.email as customer_email,
        p.plan_name as plan_name,
        s.status as subscription_status
      FROM Invoice i
      JOIN Customer c ON i.customer_id = c.customer_id
      JOIN Subscription s ON i.subscription_id = s.subscription_id
      JOIN Plan p ON s.plan_id = p.plan_id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (billing_month) {
            query += ` AND i.billing_month = $${paramCount++}`;
            params.push(billing_month);
        }
        if (payment_status) {
            query += ` AND i.payment_status = $${paramCount++}`;
            params.push(payment_status);
        }
        if (customer_id) {
            query += ` AND i.customer_id = $${paramCount++}`;
            params.push(customer_id);
        }

        // Map sort field to table column
        const fieldMap = {
            issued_at: 'i.issued_at',
            billing_month: 'i.billing_month',
            due_date: 'i.due_date',
            payment_date: 'i.payment_date',
            customer_name: 'c.name',
            plan_name: 'p.plan_name',
            payment_status: 'i.payment_status',
            amount: 'i.amount'
        };
        const finalSortBy = fieldMap[sort_by] || 'i.issued_at';
        const finalSortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${finalSortBy} ${finalSortOrder} LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(limit, offset);

        console.log('Executing query:', query, 'with params:', params);
        const result = await db.query(query, params);

        // Count total items for pagination
        let countQuery = 'SELECT COUNT(*) FROM Invoice i WHERE 1=1';
        const countParams = [];
        let countParamIdx = 1;
        if (billing_month) { countQuery += ` AND i.billing_month = $${countParamIdx++}`; countParams.push(billing_month); }
        if (payment_status) { countQuery += ` AND i.payment_status = $${countParamIdx++}`; countParams.push(payment_status); }
        if (customer_id) { countQuery += ` AND i.customer_id = $${countParamIdx++}`; countParams.push(customer_id); }

        const countResult = await db.query(countQuery, countParams);
        const totalItems = parseInt(countResult.rows[0].count);

        const invoices = result.rows.map(row => ({
            invoice_id: row.invoice_id,
            subscription_id: row.subscription_id,
            customer: {
                customer_id: row.customer_id,
                name: row.customer_name,
                email: row.customer_email
            },
            plan: {
                plan_name: row.plan_name
            },
            billing_month: row.billing_month,
            amount: row.amount,
            payment_status: row.payment_status,
            payment_date: row.payment_date,
            payment_method_token: row.payment_method_token,
            due_date: row.due_date,
            issued_at: row.issued_at,
            created_at: row.created_at,
            subscription_status: row.subscription_status
        }));

        res.json({
            success: true,
            data: {
                invoices,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalItems / limit),
                    total_items: totalItems,
                    items_per_page: parseInt(limit)
                }
            },
            message: "청구 내역을 성공적으로 조회했습니다."
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});

// 2. 청구서 상태 변경 API
/**
 * @swagger
 * /api/v1/invoices/update-status:
 *   post:
 *     summary: Update payment status of an invoice
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoice_id, payment_status]
 *             properties:
 *               invoice_id:
 *                 type: integer
 *               payment_status:
 *                 type: string
 *                 enum: [PAID, PENDING, FAILED]
 *     responses:
 *       200:
 *         description: Invoice status updated successfully.
 */
app.post('/api/v1/invoices/update-status', async (req, res) => {
    try {
        const { invoice_id, payment_status } = req.body;
        if (!invoice_id || !payment_status) {
            return res.status(400).json({ success: false, error: { code: 'MISSING_FIELD', message: 'invoice_id와 payment_status는 필수입니다.' } });
        }

        const query = `
            UPDATE Invoice
            SET payment_status = $1::varchar,
                payment_date = CASE WHEN $1::varchar = 'PAID' THEN CURRENT_TIMESTAMP ELSE payment_date END,
                updated_at = CURRENT_TIMESTAMP
            WHERE invoice_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [payment_status, invoice_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'INVOICE_NOT_FOUND', message: '청구서를 찾을 수 없습니다.' } });
        }

        res.json({ success: true, data: result.rows[0], message: '청구 상태가 업데이트되었습니다.' });
    } catch (err) {
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});

// 2. 구독 추가 API
/**
 * @swagger
 * /api/v1/subscriptions/add:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer_id, plan_id, start_date]
 *             properties:
 *               customer_id:
 *                 type: integer
 *               plan_id:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               payment_method_token:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, TRIAL]
 *     responses:
 *       201:
 *         description: Subscription created successfully.
 */
app.post('/api/v1/subscriptions/add', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { customer_id, plan_id, start_date, payment_method_token, status = 'ACTIVE' } = req.body;

        if (!customer_id || !plan_id || !start_date) {
            return res.status(400).json({ success: false, error: { code: 'MISSING_REQUIRED_FIELD', message: '필수 필드가 누락되었습니다.' } });
        }

        await client.query('BEGIN');

        // Check plan
        const planResult = await client.query('SELECT * FROM Plan WHERE plan_id = $1', [plan_id]);
        if (planResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: { code: 'PLAN_NOT_FOUND', message: '플랜을 찾을 수 없습니다.' } });
        }
        const plan = planResult.rows[0];
        if (!plan.is_active) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: { code: 'PLAN_NOT_ACTIVE', message: '비활성화된 플랜입니다.' } });
        }

        const nextBillingDate = calculateNextBillingDate(start_date, plan.billing_cycle);

        const subInsert = `
      INSERT INTO Subscription (customer_id, plan_id, start_date, next_billing_date, status, payment_method_token)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const subResult = await client.query(subInsert, [customer_id, plan_id, start_date, nextBillingDate, status, payment_method_token]);
        const subscription = subResult.rows[0];

        // Create first invoice if not TRIAL
        if (status !== 'TRIAL') {
            const billingMonth = start_date.substring(0, 7);
            const dueDate = new Date(start_date);
            dueDate.setDate(dueDate.getDate() + 30); // Simple 30 days due date

            const invInsert = `
        INSERT INTO Invoice (subscription_id, customer_id, billing_month, amount, payment_status, due_date, payment_method_token)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
            await client.query(invInsert, [subscription.subscription_id, customer_id, billingMonth, plan.monthly_price, 'PENDING', dueDate.toISOString().split('T')[0], payment_method_token]);
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, data: { subscription }, message: "구독이 성공적으로 추가되었습니다." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        client.release();
    }
});

// 3. 구독 수정 API
/**
 * @swagger
 * /api/v1/subscriptions/modify:
 *   post:
 *     summary: Modify an existing subscription
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subscription_id]
 *             properties:
 *               subscription_id:
 *                 type: integer
 *               plan_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, PAUSED, CANCELED]
 *               payment_method_token:
 *                 type: string
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Subscription modified successfully.
 */
app.post('/api/v1/subscriptions/modify', async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { subscription_id, plan_id, status, payment_method_token, end_date } = req.body;

        if (!subscription_id) {
            return res.status(400).json({ success: false, error: { code: 'MISSING_REQUIRED_FIELD', message: 'subscription_id는 필수입니다.' } });
        }

        await client.query('BEGIN');

        const curSubResult = await client.query('SELECT * FROM Subscription WHERE subscription_id = $1', [subscription_id]);
        if (curSubResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: { code: 'SUBSCRIPTION_NOT_FOUND', message: '구독을 찾을 수 없습니다.' } });
        }
        const currentSub = curSubResult.rows[0];

        if (currentSub.status === 'CANCELED') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: { code: 'SUBSCRIPTION_ALREADY_CANCELED', message: '이미 해지된 구독은 수정할 수 없습니다.' } });
        }

        if (status === 'CANCELED' && !end_date) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: { code: 'END_DATE_REQUIRED', message: '해지 시 종료일은 필수입니다.' } });
        }

        let updateFields = [];
        let params = [];
        let valIdx = 1;

        if (plan_id !== undefined && plan_id !== null && plan_id !== '') {
            updateFields.push(`plan_id = $${valIdx++}`);
            params.push(plan_id);
        }
        if (status) {
            updateFields.push(`status = $${valIdx++}`);
            params.push(status);
            if (status === 'CANCELED') {
                updateFields.push(`next_billing_date = NULL`);
                updateFields.push(`end_date = $${valIdx++}`);
                params.push(end_date || new Date().toISOString().split('T')[0]);
            }
        }
        if (payment_method_token !== undefined) {
            updateFields.push(`payment_method_token = $${valIdx++}`);
            params.push(payment_method_token);
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(subscription_id);
        const updateQuery = `UPDATE Subscription SET ${updateFields.join(', ')} WHERE subscription_id = $${valIdx} RETURNING *`;

        const updatedSubResult = await client.query(updateQuery, params);
        const updatedSub = updatedSubResult.rows[0];

        // Business Logic for Plan Change (Pro-rated billing)
        let changes = {};
        if (plan_id && plan_id != currentSub.plan_id) {
            const oldPlanResult = await client.query('SELECT * FROM Plan WHERE plan_id = $1', [currentSub.plan_id]);
            const newPlanResult = await client.query('SELECT * FROM Plan WHERE plan_id = $1', [plan_id]);
            const oldPlan = oldPlanResult.rows[0];
            const newPlan = newPlanResult.rows[0];

            const priceDiff = parseFloat(newPlan.monthly_price) - parseFloat(oldPlan.monthly_price);
            if (priceDiff > 0) {
                // Create pro-rated invoice
                const billingMonth = new Date().toISOString().substring(0, 7);
                const invInsert = `
          INSERT INTO Invoice (subscription_id, customer_id, billing_month, amount, payment_status, due_date, payment_method_token)
          VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + 7, $6)
        `;
                await client.query(invInsert, [subscription_id, updatedSub.customer_id, billingMonth, priceDiff, 'PENDING', updatedSub.payment_method_token]);
            }
            changes = {
                plan_changed: true,
                previous_plan: oldPlan.plan_name,
                new_plan: newPlan.plan_name,
                price_difference: priceDiff
            };
        }

        await client.query('COMMIT');
        res.json({ success: true, data: { subscription: updatedSub, changes }, message: "구독이 성공적으로 수정되었습니다." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    } finally {
        client.release();
    }
});

// Additional Helpers
app.get('/api/v1/customers', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Customer ORDER BY name');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});

app.get('/api/v1/plans', async (req, res) => {
    try {
        const { all } = req.query;
        let query = 'SELECT * FROM Plan';
        if (all !== 'true') {
            query += ' WHERE is_active = TRUE';
        }
        query += ' ORDER BY monthly_price';
        const result = await db.query(query);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});

/**
 * @swagger
 * /api/v1/plans:
 *   post:
 *     summary: Create a new plan
 *     tags: [Helpers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_name, monthly_price, billing_cycle]
 *             properties:
 *               plan_name:
 *                 type: string
 *               monthly_price:
 *                 type: number
 *               billing_cycle:
 *                 type: string
 *                 enum: [MONTHLY, ANNUAL]
 */
app.post('/api/v1/plans', async (req, res) => {
    try {
        const { plan_name, monthly_price, billing_cycle, is_active = true } = req.body;
        const query = `
            INSERT INTO Plan (plan_name, monthly_price, billing_cycle, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await db.query(query, [plan_name, monthly_price, billing_cycle, is_active]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});

/**
 * @swagger
 * /api/v1/plans/{id}:
 *   put:
 *     summary: Update an existing plan
 *     tags: [Helpers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
app.put('/api/v1/plans/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { plan_name, monthly_price, billing_cycle, is_active } = req.body;

        let updateFields = [];
        let params = [];
        let valIdx = 1;

        if (plan_name) { updateFields.push(`plan_name = $${valIdx++}`); params.push(plan_name); }
        if (monthly_price !== undefined) { updateFields.push(`monthly_price = $${valIdx++}`); params.push(monthly_price); }
        if (billing_cycle) { updateFields.push(`billing_cycle = $${valIdx++}`); params.push(billing_cycle); }
        if (is_active !== undefined) { updateFields.push(`is_active = $${valIdx++}`); params.push(is_active); }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);
        const query = `UPDATE Plan SET ${updateFields.join(', ')} WHERE plan_id = $${valIdx} RETURNING *`;

        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '플랜을 찾을 수 없습니다.' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});

app.get('/api/v1/subscriptions', async (req, res) => {
    /**
     * @swagger
     * /api/v1/customers:
     *   get:
     *     summary: Get all customers
     *     tags: [Helpers]
     * /api/v1/plans:
     *   get:
     *     summary: Get all active plans
     *     tags: [Helpers]
     * /api/v1/subscriptions:
     *   get:
     *     summary: Get all subscriptions
     *     tags: [Helpers]
     */
    try {
        const result = await db.query(`
      SELECT s.*, c.name as customer_name, p.plan_name 
      FROM Subscription s 
      JOIN Customer c ON s.customer_id = c.customer_id 
      JOIN Plan p ON s.plan_id = p.plan_id
      ORDER BY s.created_at DESC
    `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
