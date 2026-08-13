-- Add paystack_reference column to orders table for webhook tracking

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS paystack_reference text UNIQUE;
