-- Database schema for TAllY fulfillment MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Materials table
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    variant TEXT,
    sku TEXT UNIQUE NOT NULL,
    on_hand INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER NOT NULL DEFAULT 0,
    cost NUMERIC,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    variant TEXT,
    sku TEXT UNIQUE NOT NULL,
    price NUMERIC,
    bom JSONB, -- Array of {materialId, qty}
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE, -- Generated after insert
    channel TEXT DEFAULT 'MANUAL',
    external_id TEXT,
    customer_name TEXT,
    status TEXT DEFAULT 'PENDING',
    carrier TEXT,
    tracking TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order lines table
CREATE TABLE order_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    qty INTEGER NOT NULL
);

-- Create unique index for deduplication
CREATE UNIQUE INDEX idx_orders_channel_external_id 
ON orders (channel, external_id) 
WHERE external_id IS NOT NULL;

-- Create indexes for performance
CREATE INDEX idx_materials_sku ON materials(sku);
CREATE INDEX idx_materials_archived ON materials(archived);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_archived ON products(archived);
CREATE INDEX idx_orders_code ON orders(code);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_lines_order_id ON order_lines(order_id);

-- Sample data for development
INSERT INTO materials (name, variant, sku, on_hand, reorder_point) VALUES
    ('Gildan T-Shirt', 'Red / M', 'GT-RED-M', 13, 20),
    ('Gildan T-Shirt', 'Red / L', 'GT-RED-L', 46, 24),
    ('Gildan T-Shirt', 'Black / S', 'GT-BLACK-S', 21, 20),
    ('Gildan T-Shirt', 'Black / M', 'GT-BLACK-M', 34, 24),
    ('Gildan T-Shirt', 'Black / L', 'GT-BLACK-L', 27, 24),
    ('Gildan T-Shirt', 'White / S', 'GT-WHITE-S', 34, 24),
    ('Gildan T-Shirt', 'White / M', 'GT-WHITE-M', 51, 24),
    ('Gildan T-Shirt', 'White / L', 'GT-WHITE-L', 29, 24);

INSERT INTO products (name, variant, sku, price, bom) VALUES
    ('Custom Red T-Shirt', 'Medium', 'CRT-M', 29.99, '[{"materialId": null, "qty": 1}]'),
    ('Custom Black T-Shirt', 'Large', 'CBT-L', 29.99, '[{"materialId": null, "qty": 1}]');
