-- Add method_details column to payouts table
ALTER TABLE payouts 
ADD COLUMN IF NOT EXISTS method_details text;
