DROP TABLE IF EXISTS Invoice, Subscription, Customer, Plan CASCADE;

-- Plan 테이블
CREATE TABLE IF NOT EXISTS Plan (
    plan_id BIGSERIAL PRIMARY KEY,
    plan_name VARCHAR(100) UNIQUE NOT NULL,
    monthly_price DECIMAL(10, 2) NOT NULL,
    billing_cycle VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer 테이블
CREATE TABLE IF NOT EXISTS Customer (
    customer_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription 테이블
CREATE TABLE IF NOT EXISTS Subscription (
    subscription_id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    payment_method_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES Plan(plan_id) ON DELETE RESTRICT
);

-- Invoice 테이블
CREATE TABLE IF NOT EXISTS Invoice (
    invoice_id BIGSERIAL PRIMARY KEY,
    subscription_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    billing_month VARCHAR(7) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_date TIMESTAMP,
    payment_method_token VARCHAR(255),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES Subscription(subscription_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_plan_name ON Plan(plan_name);
CREATE INDEX IF NOT EXISTS idx_plan_is_active ON Plan(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_email ON Customer(email);
CREATE INDEX IF NOT EXISTS idx_customer_status ON Customer(status);
CREATE INDEX IF NOT EXISTS idx_subscription_customer ON Subscription(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan ON Subscription(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON Subscription(status);
CREATE INDEX IF NOT EXISTS idx_next_billing_date ON Subscription(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_invoice_subscription ON Invoice(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoice_customer ON Invoice(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_billing_month ON Invoice(billing_month);
CREATE INDEX IF NOT EXISTS idx_invoice_payment_status ON Invoice(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON Invoice(due_date);

-- 기존 데이터 초기화 (재실행 시 중복 방지)
TRUNCATE Plan, Customer, Subscription, Invoice RESTART IDENTITY CASCADE;

-- 1. Plan 데이터 (7개)
INSERT INTO Plan (plan_name, monthly_price, billing_cycle, is_active) VALUES
('Free', 0.00, 'MONTHLY', TRUE),
('Basic', 9900.00, 'MONTHLY', TRUE),
('Standard', 14900.00, 'MONTHLY', TRUE),
('Pro', 19900.00, 'MONTHLY', TRUE),
('Premium', 29900.00, 'MONTHLY', TRUE),
('Ultimate', 49900.00, 'MONTHLY', TRUE),
('Enterprise', 99000.00, 'MONTHLY', TRUE),
('Basic Annual', 99000.00, 'ANNUAL', TRUE),
('Pro Annual', 199000.00, 'ANNUAL', TRUE),
('Premium Annual', 299000.00, 'ANNUAL', TRUE);

-- 2. Customer 데이터 (7개)
INSERT INTO Customer (name, email, phone, status) VALUES
('김철수', 'kim@example.com', '010-1234-5678', 'ACTIVE'),
('이영희', 'lee@example.com', '010-2345-6789', 'ACTIVE'),
('박민수', 'park@example.com', '010-3456-7890', 'ACTIVE'),
('최지우', 'choi@example.com', '010-4567-8901', 'ACTIVE'),
('정우성', 'jung@example.com', '010-5678-9012', 'ACTIVE'),
('한효주', 'han@example.com', '010-6789-0123', 'ACTIVE'),
('유재석', 'yoo@example.com', '010-7890-1234', 'ACTIVE');

-- 3. Subscription 데이터 (7개)
INSERT INTO Subscription (customer_id, plan_id, start_date, next_billing_date, status, payment_method_token, end_date) VALUES
(1, 2, '2024-01-01', '2024-02-01', 'ACTIVE', 'tok_kim_1234', NULL),
(2, 4, '2024-01-15', '2024-02-15', 'ACTIVE', 'tok_lee_5678', NULL),
(3, 7, '2024-01-20', '2024-02-20', 'TRIAL', 'tok_park_9012', NULL),
(4, 3, '2024-02-01', '2024-03-01', 'ACTIVE', 'tok_choi_3456', NULL),
(5, 5, '2024-02-10', '2024-03-10', 'ACTIVE', 'tok_jung_7890', NULL),
(6, 6, '2023-12-01', '2023-12-31', 'CANCELED', 'tok_han_1122', '2023-12-31'),
(7, 1, '2024-01-05', '2024-02-05', 'ACTIVE', 'tok_yoo_3344', NULL);

-- 4. Invoice 데이터 (7개 이상)
INSERT INTO Invoice (subscription_id, customer_id, billing_month, amount, payment_status, due_date, payment_method_token, payment_date) VALUES
(1, 1, '2024-01', 9900.00, 'PAID', '2024-01-31', 'tok_kim_first_month', '2024-01-20 10:00:00'),
(1, 1, '2024-02', 9900.00, 'PENDING', '2024-02-29', 'tok_kim_second_month', NULL),
(2, 2, '2024-01', 19900.00, 'PAID', '2024-01-31', 'tok_lee_5678', '2024-01-25 14:30:00'),
(3, 3, '2024-01', 0.00, 'PAID', '2024-01-31', 'tok_park_9012', '2024-01-20 09:00:00'),
(4, 4, '2024-02', 14900.00, 'PAID', '2024-02-28', 'tok_choi_3456', '2024-02-15 11:20:00'),
(5, 5, '2024-02', 29900.00, 'FAILED', '2024-02-25', 'tok_jung_7890', NULL),
(7, 7, '2024-01', 0.00, 'PAID', '2024-01-31', 'tok_yoo_3344', '2024-01-10 16:45:00'),
(6, 6, '2023-12', 49900.00, 'PAID', '2023-12-31', 'tok_han_1122', '2023-12-28 13:10:00');
