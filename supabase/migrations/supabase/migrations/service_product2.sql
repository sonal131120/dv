/*
  # Add Image Links Support for Products/Services

  1. New Tables
    - `product_image_links` - Store image URLs for products/services

  2. Changes
    - Add `text_alignment` column to products_services table for description alignment

  3. Security
    - Enable RLS on product_image_links table
    - Add policies for authenticated users to manage their own product images
    - Allow public read access for published cards
*/

-- Add text_alignment column to products_services table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products_services' AND column_name = 'text_alignment'
  ) THEN
    ALTER TABLE products_services ADD COLUMN text_alignment text DEFAULT 'left' CHECK (text_alignment IN ('left', 'center', 'right'));
  END IF;
END $$;

-- Create product_image_links table
CREATE TABLE IF NOT EXISTS product_image_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products_services(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_image_links_product_id ON product_image_links(product_id);
CREATE INDEX IF NOT EXISTS idx_product_image_links_active ON product_image_links(is_active);
CREATE INDEX IF NOT EXISTS idx_product_image_links_order ON product_image_links(display_order);

-- Enable Row Level Security
ALTER TABLE product_image_links ENABLE ROW LEVEL SECURITY;

-- Product image links policies
CREATE POLICY "Users can manage product image links for own cards"
  ON product_image_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products_services ps
      JOIN business_cards bc ON bc.id = ps.card_id
      WHERE ps.id = product_image_links.product_id 
      AND bc.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read product image links for published cards"
  ON product_image_links
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM products_services ps
      JOIN business_cards bc ON bc.id = ps.card_id
      WHERE ps.id = product_image_links.product_id 
      AND bc.is_published = true
      AND ps.is_active = true
    )
  );