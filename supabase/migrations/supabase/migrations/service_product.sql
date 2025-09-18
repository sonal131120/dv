/*
  # Add Products/Services Section

  1. New Tables
    - `products_services` - Store products/services with rich text content
    - `product_images` - Store multiple images for each product/service
    - `product_inquiries` - Store inquiry contact methods

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own products
    - Allow public read access for published cards

  3. Features
    - Rich text content with formatting
    - Multiple image uploads per product
    - Flexible inquiry contact methods (link, phone, WhatsApp)
*/

-- Create products_services table
CREATE TABLE IF NOT EXISTS products_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES business_cards(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL, -- Rich text content with HTML formatting
  price text, -- Optional price display
  category text, -- Optional category grouping
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products_services(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create product_inquiries table
CREATE TABLE IF NOT EXISTS product_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products_services(id) ON DELETE CASCADE NOT NULL,
  inquiry_type text NOT NULL CHECK (inquiry_type IN ('link', 'phone', 'whatsapp', 'email')),
  contact_value text NOT NULL, -- URL, phone number, WhatsApp number, or email
  button_text text DEFAULT 'Inquire Now',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_services_card_id ON products_services(card_id);
CREATE INDEX IF NOT EXISTS idx_products_services_active ON products_services(is_active);
CREATE INDEX IF NOT EXISTS idx_products_services_featured ON products_services(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_product_id ON product_inquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_product_inquiries_active ON product_inquiries(is_active);

-- Enable Row Level Security
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inquiries ENABLE ROW LEVEL SECURITY;

-- Products/Services policies
CREATE POLICY "Users can manage products for own cards"
  ON products_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = products_services.card_id 
      AND business_cards.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read active products for published cards"
  ON products_services
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM business_cards 
      WHERE business_cards.id = products_services.card_id 
      AND business_cards.is_published = true
    )
  );

-- Product images policies
CREATE POLICY "Users can manage product images for own cards"
  ON product_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products_services ps
      JOIN business_cards bc ON bc.id = ps.card_id
      WHERE ps.id = product_images.product_id 
      AND bc.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read product images for published cards"
  ON product_images
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM products_services ps
      JOIN business_cards bc ON bc.id = ps.card_id
      WHERE ps.id = product_images.product_id 
      AND bc.is_published = true
      AND ps.is_active = true
    )
  );

-- Product inquiries policies
CREATE POLICY "Users can manage product inquiries for own cards"
  ON product_inquiries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products_services ps
      JOIN business_cards bc ON bc.id = ps.card_id
      WHERE ps.id = product_inquiries.product_id 
      AND bc.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read active product inquiries for published cards"
  ON product_inquiries
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM products_services ps
      JOIN business_cards bc ON bc.id = ps.card_id
      WHERE ps.id = product_inquiries.product_id 
      AND bc.is_published = true
      AND ps.is_active = true
    )
  );

-- Function to update updated_at timestamp
CREATE TRIGGER update_products_services_updated_at
  BEFORE UPDATE ON products_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add products count to business_cards table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_cards' AND column_name = 'products_count'
  ) THEN
    ALTER TABLE business_cards ADD COLUMN products_count integer DEFAULT 0;
  END IF;
END $$;

-- Function to update products count
CREATE OR REPLACE FUNCTION update_products_count()
RETURNS trigger AS $$
BEGIN
  UPDATE business_cards 
  SET products_count = (
    SELECT COUNT(*) FROM products_services 
    WHERE card_id = COALESCE(NEW.card_id, OLD.card_id) 
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.card_id, OLD.card_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating products count
CREATE TRIGGER update_products_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products_services
  FOR EACH ROW EXECUTE FUNCTION update_products_count();