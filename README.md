# TALLY - Fulfillment Management MVP

A web-first fulfillment MVP built with Next.js that mirrors the Figma design with a left sidebar for Materials, Products, Fulfillment, and Integrations.

## 🚀 Features

### Materials Management
- ✅ View and search materials inventory
- ✅ Quick increment/decrement stock levels with optimistic UI
- ✅ Add new materials with SKU, variant, and reorder points
- ✅ Low stock warnings when below reorder point

### Products Management  
- ✅ Create products with Bill of Materials (BOM)
- ✅ Real-time sellable quantity calculation based on materials
- ✅ BOM editor with multi-row material selection
- ✅ Product search and SKU management

### Fulfillment
- ✅ Quick order code search (YY-BASE36 format)
- ✅ Create quick orders with customer and products
- ✅ Order status management (Pending → In Progress → Shipped)
- ✅ Mark shipped with carrier and tracking info
- ✅ Auto-generated short order codes

### Integrations
- ✅ CSV import with deduplication on (channel, external_id)
- ✅ Automatic order code generation for imports
- ✅ Import results summary with new/existing orders
- ✅ Future-ready for Shopify, Etsy, WooCommerce, etc.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: TailwindCSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **CSV Processing**: PapaParse
- **Icons**: Lucide React
- **Hosting**: Vercel + Supabase

## 📱 Mobile Responsive

- Collapsible sidebar on mobile with hamburger menu
- Tables convert to card layouts on small screens
- Touch-friendly controls and spacing
- Maintains full functionality across all viewports

## 🗃️ Database Schema

```sql
-- Materials: Raw inventory items
materials (id, name, variant, sku, on_hand, reorder_point, cost, archived)

-- Products: Sellable items with BOM
products (id, name, variant, sku, price, bom, archived)

-- Orders: Customer orders with status tracking
orders (id, code, channel, external_id, customer_name, status, carrier, tracking)

-- Order Lines: Products in each order
order_lines (id, order_id, product_id, qty)
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database.sql`
4. Run the SQL to create tables and sample data

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📋 Usage Guide

### Getting Started

1. **Materials**: Add your raw materials with SKUs and stock levels
2. **Products**: Create sellable products and define their Bill of Materials
3. **Fulfillment**: Search orders by code or create quick orders
4. **Integrations**: Import bulk orders via CSV

### Order Code Format

Orders use the format `YY-BASE36` where:
- `YY` = Last 2 digits of current year
- `BASE36` = Base36 encoding of the order ID

Example: `25-9P7C` for an order created in 2025

### CSV Import Format

Required columns for CSV import:
```
external_id,channel,customer_name,sku,qty
ORDER001,SHOPIFY,John Doe,GT-RED-M,2
ORDER001,SHOPIFY,John Doe,GT-BLACK-L,1
ORDER002,ETSY,Jane Smith,CRT-M,1
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Database Setup

Your Supabase database is already hosted and ready. Just make sure to run the SQL schema once.

## 🔑 Key Business Rules

- **Stock Management**: Quantities never go below 0
- **SKU Uniqueness**: All SKUs must be unique across materials and products
- **Order Status Flow**: PENDING → IN_PROGRESS → SHIPPED (or PENDING → SHIPPED directly)
- **Sellable Calculation**: `min(floor(material.on_hand / qty) for each BOM item)`
- **Import Deduplication**: Same (channel, external_id) won't create duplicates

## 📱 Responsive Design

- **Desktop**: Full sidebar navigation with table layouts
- **Tablet**: Collapsible sidebar with preserved functionality  
- **Mobile**: Hidden sidebar (hamburger menu) with card-based layouts

## 🎯 Architecture Decisions

- **Client-side calculations**: Sellable quantities computed in browser for speed
- **Optimistic updates**: Stock changes update UI immediately with rollback on error
- **Sheet/drawer pattern**: Order details open in slide-out panels
- **Toast notifications**: Non-intrusive success/error feedback
- **UUID primary keys**: Better for distributed systems and imports

## 📦 What's Included

- ✅ Complete UI with sidebar navigation
- ✅ All CRUD operations for materials, products, orders
- ✅ Real-time stock management
- ✅ Order code generation system
- ✅ CSV import with deduplication
- ✅ Mobile responsive design
- ✅ Error handling and user feedback
- ✅ TypeScript for type safety
- ✅ Database schema and sample data

## 🚫 Out of Scope (Future Features)

- Real store OAuth/webhooks integration
- Label printing and shipping integration  
- Customer email notifications
- Image uploads for products
- Role-based permissions
- Partial shipments and returns
- Advanced reporting and analytics

---

**Built with ❤️ using Next.js, Supabase, and shadcn/ui**