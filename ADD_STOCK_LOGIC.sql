-- RUN THIS IN YOUR SUPABASE SQL EDITOR --

-- 1. Create a function to safely decrement stock quantity
CREATE OR REPLACE FUNCTION decrement_stock_quantity(product_id INT, amount INT)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(0, stock_quantity - amount)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Ensure your existing increment_sales_count exists (optional fallback)
CREATE OR REPLACE FUNCTION increment_sales_count(product_id INT)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET sales_count = COALESCE(sales_count, 0) + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
