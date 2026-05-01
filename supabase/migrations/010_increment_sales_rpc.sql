-- Function to safely increment sales count
CREATE OR REPLACE FUNCTION increment_sales_count(product_id INT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET sales_count = COALESCE(sales_count, 0) + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
