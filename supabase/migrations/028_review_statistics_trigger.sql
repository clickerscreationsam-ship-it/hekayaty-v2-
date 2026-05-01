-- Update trigger to store scaled average (10-50) in products table for 1-decimal precision
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE products
        SET 
            -- Store average * 10 to keep one decimal of precision in an integer column
            rating = COALESCE((SELECT ROUND(AVG(rating)::numeric * 10) FROM reviews WHERE product_id = NEW.product_id), 0),
            review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id)
        WHERE id = NEW.product_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE products
        SET 
            rating = COALESCE((SELECT ROUND(AVG(rating)::numeric * 10) FROM reviews WHERE product_id = OLD.product_id), 0),
            review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = OLD.product_id)
        WHERE id = OLD.product_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_product_rating ON reviews;
CREATE TRIGGER tr_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();
