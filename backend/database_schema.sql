-- database_schema.sql
-- Food Delivery App Database Schema
-- Created for Node.js + Express + React Native Expo + Neon PostgreSQL

-- ============================================
-- 1. DROP EXISTING TABLES (if re-running)
-- ============================================
DROP TABLE IF EXISTS delivery_tracking CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS earnings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS driver_order_queue CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS restaurant_managers CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;

-- ============================================
-- 2. CREATE ENUM TYPES
-- ============================================
CREATE TYPE user_role AS ENUM ('customer', 'driver', 'restaurant_manager');
CREATE TYPE order_status AS ENUM (
    'pending', 
    'accepted_by_driver', 
    'ordering_at_restaurant',
    'order_ready',
    'picked_up',
    'on_the_way',
    'arrived',
    'delivered',
    'cancelled',
    'no_drivers_available'
);
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'mobile_money', 'cash');
CREATE TYPE driver_status AS ENUM ('available', 'busy', 'offline', 'on_delivery');

-- ============================================
-- 3. CREATE TABLES
-- ============================================

-- Users table (for all user types)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivery_addresses JSONB DEFAULT '[]'::jsonb,
    current_location POINT,
    default_payment_method payment_method DEFAULT 'card',
    favorite_restaurants UUID[],
    dietary_preferences TEXT[],
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_license_number VARCHAR(50) UNIQUE,
    license_expiry_date DATE,
    vehicle_type VARCHAR(50),
    vehicle_registration VARCHAR(50),
    vehicle_color VARCHAR(30),
    vehicle_model VARCHAR(50),
    current_status driver_status DEFAULT 'offline',
    current_location POINT,
    last_location_update TIMESTAMP WITH TIME ZONE,
    is_available BOOLEAN DEFAULT true,
    working_hours JSONB,
    service_radius_km INTEGER DEFAULT 10,
    total_deliveries INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 5.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    bank_account_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restaurant Managers table
CREATE TABLE restaurant_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_ids UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES restaurant_managers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100)[],
    phone_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT NOT NULL,
    location POINT NOT NULL,
    delivery_radius_km INTEGER DEFAULT 5,
    logo_url TEXT,
    cover_image_url TEXT,
    gallery_urls TEXT[],
    opening_hours JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_accepting_orders BOOLEAN DEFAULT true,
    preparation_time_minutes INTEGER DEFAULT 20,
    average_rating DECIMAL(3,2) DEFAULT 5.00,
    total_ratings INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    commission_percentage DECIMAL(5,2) DEFAULT 15.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menus table
CREATE TABLE menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menu Items table
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(8,2) NOT NULL,
    discounted_price DECIMAL(8,2),
    image_url TEXT,
    category VARCHAR(100),
    tags TEXT[],
    is_available BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    ingredients JSONB,
    customizations JSONB,
    calories INTEGER,
    preparation_time_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    status order_status DEFAULT 'pending',
    special_instructions TEXT,
    delivery_instructions TEXT,
    delivery_address JSONB NOT NULL,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    restaurant_notified_at TIMESTAMP WITH TIME ZONE,
    ready_for_pickup_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    driver_acceptance_deadline TIMESTAMP WITH TIME ZONE,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(8,2) NOT NULL,
    tax_amount DECIMAL(8,2) NOT NULL,
    tip_amount DECIMAL(8,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    payment_method payment_method,
    restaurant_rating INTEGER CHECK (restaurant_rating >= 1 AND restaurant_rating <= 5),
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(8,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    special_instructions TEXT,
    selected_options JSONB,
    allergen_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver Order Queue
CREATE TABLE driver_order_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    available_driver_ids UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    seen_by_driver_ids UUID[] DEFAULT '{}'::uuid[],
    declined_by_driver_ids UUID[] DEFAULT '{}'::uuid[],
    is_active BOOLEAN DEFAULT true,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending',
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    payment_details_encrypted TEXT,
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Earnings table
CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission_percentage DECIMAL(5,2),
    commission_amount DECIMAL(10,2),
    net_amount DECIMAL(10,2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    payout_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_type user_role NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    sent_via TEXT[],
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Tracking table
CREATE TABLE delivery_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    location POINT NOT NULL,
    accuracy INTEGER,
    speed DECIMAL(5,2),
    heading INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. CREATE INDEXES
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_customers_user_id ON customers(user_id);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_status ON drivers(current_status);
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);
CREATE INDEX idx_drivers_available ON drivers(is_available) WHERE is_available = true;

CREATE INDEX idx_restaurants_location ON restaurants USING GIST(location);
CREATE INDEX idx_restaurants_active ON restaurants(is_active) WHERE is_active = true;
CREATE INDEX idx_restaurants_manager ON restaurants(manager_id);

CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_menu ON menu_items(menu_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available) WHERE is_available = true;

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_driver ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at DESC);
CREATE INDEX idx_orders_driver_deadline ON orders(driver_acceptance_deadline) WHERE status = 'pending';

CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE INDEX idx_driver_order_queue_active ON driver_order_queue(is_active) WHERE is_active = true;
CREATE INDEX idx_driver_order_queue_expires ON driver_order_queue(expires_at);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX idx_delivery_tracking_created ON delivery_tracking(created_at DESC);

-- ============================================
-- 5. CREATE FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    order_num VARCHAR(20);
    year_part VARCHAR(4);
    seq_num INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM 10)::INTEGER), 0) + 1
    INTO seq_num
    FROM orders
    WHERE order_number LIKE 'ORD-' || year_part || '-%';
    
    order_num := 'ORD-' || year_part || '-' || LPAD(seq_num::VARCHAR, 5, '0');
    NEW.order_number := order_num;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_earnings_updated_at BEFORE UPDATE ON earnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for order number generation
CREATE TRIGGER set_order_number BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================
-- 6. INSERT SAMPLE DATA (Optional)
-- ============================================

-- Uncomment this section to add sample data for testing

/*
-- Sample Restaurant Manager
INSERT INTO users (id, email, phone_number, password_hash, role, first_name, last_name) 
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'manager@example.com', 
    '+1234567890', 
    '$2a$10$hashedpassword', 
    'restaurant_manager', 
    'John', 
    'Doe'
);

INSERT INTO restaurant_managers (id, user_id, restaurant_ids) 
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '{}'
);

-- Sample Restaurant
INSERT INTO restaurants (
    id, 
    manager_id, 
    name, 
    description, 
    address, 
    location, 
    opening_hours, 
    phone_number,
    cuisine_type
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Pizza Palace', 
    'Best pizza in town!', 
    '123 Main Street, City', 
    POINT(40.7128, -74.0060),
    '{"monday": {"open": "10:00", "close": "22:00"}, "tuesday": {"open": "10:00", "close": "22:00"}}',
    '+1234567891',
    ARRAY['Italian', 'Pizza']
);

-- Update manager with restaurant ID
UPDATE restaurant_managers 
SET restaurant_ids = ARRAY['33333333-3333-3333-3333-333333333333']::UUID[]
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Sample Menu
INSERT INTO menus (id, restaurant_id, name, description) 
VALUES (
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'Main Menu',
    'Our delicious main menu'
);

-- Sample Menu Item
INSERT INTO menu_items (
    id, 
    menu_id, 
    restaurant_id, 
    name, 
    description, 
    price, 
    category,
    ingredients
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'Margherita Pizza', 
    'Classic tomato and mozzarella', 
    12.99,
    'Pizza',
    '[{"name": "tomato sauce", "is_allergen": false}, {"name": "mozzarella cheese", "is_allergen": false}]'
);

-- Sample Customer
INSERT INTO users (id, email, phone_number, password_hash, role, first_name, last_name) 
VALUES (
    '66666666-6666-6666-6666-666666666666',
    'customer@example.com', 
    '+1234567892', 
    '$2a$10$hashedpassword', 
    'customer', 
    'Jane', 
    'Smith'
);

INSERT INTO customers (id, user_id, delivery_addresses) 
VALUES (
    '77777777-7777-7777-7777-777777777777',
    '66666666-6666-6666-6666-666666666666',
    '[{"label": "Home", "address": "456 Oak Street, City", "lat": 40.7128, "lng": -74.0050}]'
);

-- Sample Driver
INSERT INTO users (id, email, phone_number, password_hash, role, first_name, last_name) 
VALUES (
    '88888888-8888-8888-8888-888888888888',
    'driver@example.com', 
    '+1234567893', 
    '$2a$10$hashedpassword', 
    'driver', 
    'Mike', 
    'Johnson'
);

INSERT INTO drivers (
    id, 
    user_id, 
    vehicle_type, 
    current_status, 
    current_location,
    is_available
) VALUES (
    '99999999-9999-9999-9999-999999999999',
    '88888888-8888-8888-8888-888888888888',
    'motorcycle',
    'available',
    POINT(40.7130, -74.0055),
    true
);
*/

-- ============================================
-- END OF SCHEMA
-- ============================================