-- Update the orders table to include shipping_email and rename shipping_zip to shipping_gps

-- 1. Add the new shipping_email column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_email text;

-- 2. Rename the shipping_zip column to shipping_gps
ALTER TABLE public.orders 
RENAME COLUMN shipping_zip TO shipping_gps;
