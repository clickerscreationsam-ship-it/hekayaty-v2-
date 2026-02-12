import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertOrderSchema, insertCartItemSchema, insertVariantSchema, insertShippingRateSchema, insertShippingAddressSchema } from "@shared/schema";
import { setupAuth, hashPassword } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''; // Fallback to anon if service role missing

  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase credentials missing from environment variables.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Setup Real Auth
  setupAuth(app);

  // DEV AUTH OVERRIDE: Trust X-User-ID header for prototyping compatibility between Supabase frontend and Express backend
  app.use((req, res, next) => {
    // Skip static files or if already authenticated
    if (req.path.startsWith('/api')) {
      const devUserId = req.headers['x-user-id'];
      console.log(`[AuthDebug] ${req.method} ${req.path} - Header: ${devUserId} - ExistingAuth: ${req.isAuthenticated()}`);

      if (devUserId) {
        // Mock the passport user object
        req.user = { id: devUserId as string, username: 'dev_user', role: 'admin' } as any;
        req.isAuthenticated = (() => true) as any;
        console.log(`[AuthDebug] Overriding auth for user ${devUserId}`);
      }
    }
    next();
  });

  // === USERS & SOCIAL ===

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user || user.role === 'admin') return res.status(404).json({ message: "User not found" });

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Get real sales count from Supabase products
      const { data: products } = await supabase
        .from('products')
        .select('sales_count')
        .eq('writer_id', user.id);

      const totalSales = products?.reduce((acc, p) => acc + (p.sales_count || 0), 0) || 0;

      // 2. Get real followers count from Supabase
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);

      // 3. Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      res.json({
        ...user,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        totalSales
      });
    } catch (error) {
      console.error("Error fetching social/sales stats:", error);
      // Fallback to storage values if Supabase fails
      const followers = await storage.getFollowers(user.id);
      const following = await storage.getFollowing(user.id);
      const creatorOrders = await storage.getCreatorOrders(user.id);
      res.json({ ...user, followersCount: followers, followingCount: following.length, totalSales: creatorOrders.length });
    }
  });

  app.get(api.users.listWriters.path, async (req, res) => {
    const writers = await storage.listWriters();
    res.json(writers);
  });

  app.patch("/api/users/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    try {
      // Use partial user schema validation in real app
      const updated = await storage.updateUser(userId, req.body);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Update failed" });
    }
  });

  app.post("/api/social/follow", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { creatorId } = req.body;
    await storage.followUser(userId, creatorId);
    res.sendStatus(200);
  });

  app.post("/api/social/unfollow", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { creatorId } = req.body;
    await storage.unfollowUser(userId, creatorId);
    res.sendStatus(200);
  });

  app.get("/api/social/library", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const library = await storage.getLibrary(userId);
    res.json(library);
  });

  app.post("/api/social/library", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { productId } = req.body;
    await storage.addToLibrary(userId, productId);
    res.sendStatus(200);
  });

  app.post("/api/social/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { productId } = req.body;
    const isLiked = await storage.toggleLike(userId, productId);
    res.json({ isLiked });
  });

  // === PRODUCTS & VARIANTS ===

  app.get(api.products.list.path, async (req, res) => {
    const filters = {
      writerId: req.query.writerId as string,
      genre: req.query.genre as string,
      search: req.query.search as string,
      type: req.query.type as string,
      // If writerId is provided (Dashboard), allow fetching all including drafts (undefined filter).
      // If writerId is NOT provided (Marketplace), FORCE isPublished=true to hide drafts.
      isPublished: req.query.writerId ? undefined : true,
    };
    const products = await storage.getProducts(filters);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    const variants = await storage.getVariants(product.id);
    res.json({ ...product, variants });
  });

  app.post(api.products.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.post("/api/products/:id/variants", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = insertVariantSchema.parse({ ...req.body, productId: Number(req.params.id) });
      const variant = await storage.createVariant(input);
      res.status(201).json(variant);
    } catch (err) {
      res.status(400).json({ message: "Invalid variant data" });
    }
  });

  app.patch(api.products.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), input);
      res.json(product);
    } catch (err) {
      res.status(404).json({ message: "Product not found" });
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  // === DEBUG TOOLS ===

  app.get("/api/debug/dump-tables", async (req, res) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: products } = await supabase.from('products').select('id, title, writer_id').limit(5);
      const { data: earnings } = await supabase.from('earnings').select('*').limit(10);
      const { data: users } = await supabase.from('users').select('id, username').limit(5);
      const { data: orderItems } = await supabase.from('order_items').select('*').limit(5);

      res.json({
        products,
        earnings,
        users,
        orderItems,
        currentUser: req.headers['x-user-id']
      });
    } catch (error) {
      res.status(500).json({ error });
    }
  });


  // === CART ===

  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      // Return empty cart for guests or handle session cart later, for now empty
      return res.json([]);
    }
    const userId = (req.user as any).id;
    const items = await storage.getCart(userId);
    res.json(items);
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    try {
      const input = insertCartItemSchema.parse({ ...req.body, userId });
      const item = await storage.addToCart(input);
      res.json(item);
    } catch (err) {
      res.status(400).json({ message: "Invalid cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.removeFromCart(Number(req.params.id));
    res.sendStatus(200);
  });

  app.patch("/api/cart/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { quantity } = req.body;
    try {
      const item = await storage.updateCartItem(Number(req.params.id), Number(quantity));
      res.json(item);
    } catch (err) {
      res.status(404).json({ message: "Cart item not found" });
    }
  });

  // === ORDERS & CHECKOUT ===

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { items, totalAmount, paymentMethod, paymentProofUrl, paymentReference, shippingAddress, shippingCost, shippingBreakdown } = req.body;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Group items by creator to calculate fees
      // 1. Fetch product details to determine commission rates
      const productIds = items.map((i: any) => i.productId);
      const { data: productsData } = await supabase
        .from('products')
        .select('id, type, writer_id, stock_quantity, title');

      const productMap = new Map(productsData?.map((p: any) => [p.id, p]) || []);

      let totalPlatformFee = 0;
      let totalCreatorEarnings = 0;
      const earningsByCreator = new Map<string, number>();

      // 2. Calculate fees per item based on creator's commission rate
      for (const item of items) {
        const product = productMap.get(item.productId);

        // Stock Check
        if (product?.type === 'physical') {
          const stock = product.stock_quantity ?? 0;
          const requested = item.quantity || 1;
          if (stock < requested) {
            return res.status(400).json({ message: `Insufficient stock for "${product.title}". Only ${stock} left.` });
          }
        }

        // Commission Rates: 20% by default as requested by user
        // We can fetch the creator's specific rate if needed, or use the default 20
        const { data: creator } = await supabase
          .from('users')
          .select('commission_rate')
          .eq('id', item.creatorId)
          .single();

        const rate = creator?.commission_rate || 20;

        const fee = Math.round(item.price * (rate / 100));
        const earning = item.price - fee;

        totalPlatformFee += fee;
        totalCreatorEarnings += earning;

        // Aggregate per creator for later Earnings record creation
        const currentEarning = earningsByCreator.get(item.creatorId) || 0;
        earningsByCreator.set(item.creatorId, currentEarning + earning);
      }

      // 2.1 Add Shipping to Earnings
      if (shippingBreakdown && Array.isArray(shippingBreakdown)) {
        for (const ship of shippingBreakdown) {
          const current = earningsByCreator.get(ship.creatorId) || 0;
          earningsByCreator.set(ship.creatorId, current + (ship.amount || 0));
          totalCreatorEarnings += (ship.amount || 0);
        }
      }

      // 3. Determine initial status
      const isManualPayment = ["instapay", "vodafone_cash", "orange_cash", "etisalat_cash", "bank_transfer"].includes(paymentMethod.toLowerCase());
      const initialStatus = isManualPayment ? "pending" : "paid"; // Use 'pending' for manual payments

      // 4. Create Order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          total_amount: totalAmount,
          platform_fee: totalPlatformFee,
          creator_earnings: totalCreatorEarnings,
          status: initialStatus,
          payment_method: paymentMethod || "card",
          payment_proof_url: paymentProofUrl || null,
          payment_reference: paymentReference || null,
          is_verified: !isManualPayment,
          payment_intent_id: isManualPayment ? `local_${Date.now()}` : `pi_simulated_${Date.now()}`,
          shipping_address: shippingAddress || null,
          shipping_cost: shippingCost || 0
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error("Order creation error:", orderError);
        return res.status(500).json({ message: "Failed to create order" });
      }

      // 5. Create Order Items
      const orderItemsToInsert = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        price: item.price,
        license_type: "standard",
        creator_id: item.creatorId
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) {
        console.error("Order items creation error:", itemsError);
        // Rollback: delete the order
        await supabase.from('orders').delete().eq('id', order.id);
        return res.status(500).json({ message: "Failed to create order items" });
      }

      // 6. Create Earning Records ONLY if paid immediately
      if (initialStatus === "paid") {
        for (const [creatorId, amount] of Array.from(earningsByCreator.entries())) {
          await supabase.from('earnings').insert({
            creator_id: creatorId,
            order_id: order.id,
            amount: amount,
            status: 'pending'
          });
        }

        // INCREMENT SALES COUNT & DECREMENT STOCK
        for (const item of items) {
          try {
            await supabase.rpc('increment_sales_count', { product_id: item.productId });

            // Decrement Stock for physical items
            const product = productMap.get(item.productId);
            if (product?.type === 'physical') {
              await supabase.rpc('decrement_stock_quantity', {
                product_id: item.productId,
                amount: item.quantity || 1
              });
            }
          } catch (e) { console.warn("Could not update counts/stock", e); }
        }
      }

      // Auto-decrement stock for PENDING manual orders too (reservation)
      if (initialStatus === "pending") {
        for (const item of items) {
          const product = productMap.get(item.productId);
          if (product?.type === 'physical') {
            try {
              await supabase.rpc('decrement_stock_quantity', {
                product_id: item.productId,
                amount: item.quantity || 1
              });
            } catch (e) { console.warn("Could not reserve stock", e); }
          }
        }
      }


      // 7. Clear cart in Supabase
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin: Verify Payment & Trigger Earnings
  app.post("/api/admin/orders/:id/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;

    const orderId = parseInt(req.params.id);

    try {
      // Import supabase client at runtime
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Get order from Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status === 'paid') {
        return res.status(400).json({ message: "Order already paid" });
      }

      // 2. Get order items with product and creator info
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(writer_id)
        `)
        .eq('order_id', orderId);

      if (itemsError || !orderItems) {
        console.error("Order items fetch error:", itemsError);
        return res.status(500).json({ message: "Failed to fetch order items" });
      }

      // 3. Group items by creator to calculate earnings
      const itemsByCreator = new Map<string, number>();
      orderItems.forEach((item: any) => {
        const creatorId = item.product?.writer_id || item.creator_id;
        const current = itemsByCreator.get(creatorId) || 0;
        itemsByCreator.set(creatorId, current + item.price);
      });

      // 4. Create earnings for each creator
      for (const [creatorId, totalAmount] of Array.from(itemsByCreator.entries())) {
        // Get creator's commission rate
        const { data: creator } = await supabase
          .from('users')
          .select('commission_rate')
          .eq('id', creatorId)
          .single();

        const commissionRate = creator?.commission_rate || 20;
        const platformFee = Math.round(totalAmount * (commissionRate / 100));
        const earning = totalAmount - platformFee;

        // Insert earning record
        await supabase
          .from('earnings')
          .insert({
            creator_id: creatorId,
            order_id: orderId,
            amount: earning,
            status: 'pending'
          });
      }

      // INCREMENT SALES COUNT for verified items
      // We need to loop orderItems again or map them
      for (const item of orderItems) {
        // Using RPC is safer for atomic increments
        try {
          await supabase.rpc('increment_sales_count', { product_id: item.product_id });
        } catch (e) { console.warn("Could not increment sales count", e); }
      }

      // 5. Update order status to 'paid'
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          is_verified: true
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        console.error("Order update error:", updateError);
        return res.status(500).json({ message: "Failed to update order" });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Admin verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/orders/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending') // Pending status
        .eq('is_verified', false) // Not yet verified by admin
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ message: "Failed to fetch orders" });
      }

      res.json(orders);
    } catch (error) {
      console.error("Pending orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const orders = await storage.getUserOrders(userId);
    res.json(orders);
  });

  app.get("/api/orders/creator", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // In reality, check if user is creator
    const creatorId = (req.user as any).id;
    const orders = await storage.getCreatorOrders(creatorId);
    res.json(orders);
  });

  // === CREATOR ECONOMY ===

  app.get("/api/creator/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get earnings from Supabase
      console.log(`Fetching stats for creator: ${userId}`);
      let { data: earnings, error: earningsError } = await supabase
        .from('earnings')
        .select('*')
        .eq('creator_id', userId);

      console.log(`Found ${earnings?.length || 0} earnings for ${userId}`);

      // AUTO-FIX: Check if earnings exist for placeholder 'user_1' and transfer them
      if (!earnings || earnings.length === 0) {
        console.log("Checking for orphaned 'user_1' earnings...");
        const { data: demoEarnings } = await supabase
          .from('earnings')
          .select('*')
          .eq('creator_id', 'user_1');

        if (demoEarnings && demoEarnings.length > 0) {
          console.log(`Found ${demoEarnings.length} demo earnings. Transferring to ${userId}...`);

          // Transfer earnings
          await supabase
            .from('earnings')
            .update({ creator_id: userId })
            .eq('creator_id', 'user_1');

          // Transfer products
          await supabase
            .from('products')
            .update({ writer_id: userId })
            .eq('writer_id', 'user_1');

          // Refetch earnings for current user
          const { data: newEarnings } = await supabase
            .from('earnings')
            .select('*')
            .eq('creator_id', userId);

          earnings = newEarnings || [];
        }
      }

      const earningsList = earnings || [];

      if (earningsError) {
        console.error("Earnings fetch error:", earningsError);
        return res.json({
          totalEarnings: 0,
          totalPaid: 0,
          currentBalance: 0,
          recentEarnings: []
        });
      }

      // Get payouts from Supabase
      const { data: payouts, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', userId);

      if (payoutsError) {
        console.error("Payouts fetch error:", payoutsError);
      }

      const totalEarnings = earningsList.reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalPaid = (payouts || [])
        .filter(p => p.status === 'processed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const payoutRequests = (payouts || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const currentBalance = totalEarnings - payoutRequests;

      res.json({
        totalEarnings,
        totalPaid,
        currentBalance,
        recentEarnings: earningsList.slice(-5)
      });
    } catch (error) {
      console.error("Creator stats error:", error);
      res.json({
        totalEarnings: 0,
        totalPaid: 0,
        currentBalance: 0,
        recentEarnings: []
      });
    }
  });

  app.post("/api/creator/payouts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { amount, method } = req.body;

    // Validate balance (re-calculate to be safe)
    const earnings = await storage.getEarnings(userId);
    const payouts = await storage.getPayouts(userId);
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalEarnings - totalPayouts;

    if (amount > balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    if (amount < 2000) { // e.g. $20 minimum
      return res.status(400).json({ message: "Minimum payout is $20" });
    }

    const payout = await storage.createPayout({
      userId,
      amount,
      status: "pending",
      method: method || "stripe"
    });

    res.status(201).json(payout);
  });

  app.get("/api/creator/payouts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const payouts = await storage.getPayouts(userId);
    res.json(payouts);
  });

  // === REVIEWS & COUPONS ===

  app.get(api.reviews.list.path, async (req, res) => {
    const reviews = await storage.getReviews(Number(req.params.productId));
    res.json(reviews);
  });

  app.get(api.coupons.list.path, async (req, res) => {
    const coupons = await storage.getCoupons(req.params.writerId);
    res.json(coupons);
  });

  app.post(api.coupons.create.path, async (req, res) => {
    const coupon = await storage.createCoupon(req.body);
    res.status(201).json(coupon);
  });

  app.post("/api/coupons/validate", async (req, res) => {
    const { code, writerId } = req.body;
    const coupon = await storage.validateCoupon(code, writerId);
    if (!coupon) return res.status(404).json({ message: "Invalid coupon" });
    res.json(coupon);
  });

  app.post(api.reviews.create.path, async (req, res) => {
    try {
      const input = api.reviews.create.input.parse(req.body);
      const review = await storage.createReview(input);
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // === PHYSICAL PRODUCTS & SHIPPING ===

  // 1. Manage Shipping Rates (Creator)
  app.get("/api/shipping/rates/:creatorId", async (req, res) => {
    const rates = await storage.getShippingRates(req.params.creatorId);
    res.json(rates);
  });

  app.post("/api/shipping/rates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = insertShippingRateSchema.parse({
        ...req.body,
        creatorId: (req.user as any).id
      });
      const rate = await storage.createShippingRate(input);
      res.status(201).json(rate);
    } catch (err) {
      res.status(400).json({ message: "Invalid shipping rate data" });
    }
  });

  app.delete("/api/shipping/rates/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Ideally check ownership
    await storage.deleteShippingRate(Number(req.params.id));
    res.sendStatus(204);
  });

  // 2. Calculate Shipping Cost (For Checkout)
  app.post("/api/shipping/calculate", async (req, res) => {
    const { items, address, city: directCity } = req.body;

    // Support both formats: { items, address: { city: '...' } } and { items, city: '...' }
    const targetCity = directCity || address?.city;

    if (!items || !targetCity) return res.status(400).json({ message: "Items and city required" });

    try {
      let totalShipping = 0;
      const breakdown: any[] = [];
      const city = String(targetCity).toLowerCase().trim();

      // Group by creator
      const itemsByCreator = new Map<string, any[]>();
      items.forEach((item: any) => {
        const list = itemsByCreator.get(item.creatorId) || [];
        list.push(item);
        itemsByCreator.set(item.creatorId, list);
      });

      // Calculate per creator
      for (const [creatorId, creatorItems] of Array.from(itemsByCreator.entries())) {
        const rates = await storage.getShippingRates(creatorId);

        // Find matching rate for city
        const cityRate = rates.find(r => r.regionName.toLowerCase() === city);
        const defaultRate = rates.find(r =>
          r.regionName.toLowerCase() === 'all' ||
          r.regionName.toLowerCase() === 'default' ||
          r.regionName.toLowerCase() === 'all over egypt'
        );

        const rateToUse = cityRate || defaultRate;

        if (rateToUse) {
          totalShipping += rateToUse.amount;
          breakdown.push({ creatorId, amount: rateToUse.amount, region: rateToUse.regionName });
        } else {
          breakdown.push({ creatorId, amount: 0, region: "Not Covered" });
        }
      }

      res.json({
        total: totalShipping, // Match frontend expectation
        totalShipping,        // Kept for backward compatibility
        breakdown
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Calculation failed" });
    }
  });

  // 3. Fulfillment Endpoints (Creator Dashboard)
  app.get("/api/orders/seller", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          order:orders (
            id, created_at, status, shipping_address, user:users(display_name, email)
          ),
          product:products (
            title, cover_url, type
          )
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error("Fetch seller orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.patch("/api/orders/:orderId/items/fulfill", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { itemIds, trackingNumber, status } = req.body; // status: shipped

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Verify ownership (items must belong to creator)
      // Update items
      const { error } = await supabase
        .from('order_items')
        .update({
          fulfillment_status: status || 'shipped',
          tracking_number: trackingNumber,
          shipped_at: new Date().toISOString()
        })
        .in('id', itemIds)
        .eq('creator_id', userId);

      if (error) throw error;
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ message: "Update failed" });
    }
  });
  // === ADMIN ROUTES ===

  // 1. Get Pending Orders
  app.get("/api/admin/orders/pending", async (req, res) => {
    // Basic role check
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // For dev, trust the role in headers/mock, or check DB if strict
    // const role = (req.user as any).role;
    // if (role !== 'admin') return res.status(403).json({message: "Admin access only"});

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('orders')
        .select(`
                *,
                user:users(id, display_name, email)
            `)
        .eq('status', 'pending')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      console.error("Admin fetch error:", err);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // 2. Verify Order
  app.post("/api/admin/orders/:id/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const orderId = Number(req.params.id);

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 1. Fetch Order & Items
      const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (!order) return res.status(404).json({ message: "Order not found" });

      const { data: items } = await supabase
        .from('order_items')
        .select('*, product:products(writer_id, type)')
        .eq('order_id', orderId);

      if (!items) return res.status(400).json({ message: "No items found" });

      // Fetch writer rates for correct commission calculation
      const writerIds = Array.from(new Set(items.map((i: any) => i.product?.writer_id).filter(Boolean)));
      const { data: writers } = await supabase
        .from('users')
        .select('id, commission_rate')
        .in('id', writerIds as string[]);

      const ratesMap = new Map<string, number>();
      writers?.forEach((w: any) => ratesMap.set(w.id, w.commission_rate));

      // 2. Update Order Status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          is_verified: true
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // 3. Create Earnings
      const earningsByCreator = new Map<string, number>();

      // 3a. Product Sales
      for (const item of items) {
        const product = (item as any).product;
        if (!product) continue;

        const isPhysical = product.type === 'physical';
        const writerRate = ratesMap.get(product.writer_id) ?? 20;
        const rate = isPhysical ? 12 : writerRate;
        const fee = Math.round(item.price * (rate / 100));
        const earning = item.price - fee;

        const current = earningsByCreator.get(product.writer_id) || 0;
        earningsByCreator.set(product.writer_id, current + earning);

        // Increment Sales Count
        await supabase.rpc('increment_sales_count', { product_id: item.product_id });
      }

      // 3b. Shipping (Re-calculate distribution)
      // Only if shipping cost exists
      if (order.shipping_cost > 0 && order.shipping_address) {
        const city = (order.shipping_address as any).city?.toLowerCase().trim();
        const creatorIds = Array.from(earningsByCreator.keys()); // Creators involved

        // Ideally we loop creators and find their rate for this city
        // For MVP simplification: We give the shipping cost to the physical product owner(s)
        // Or we fetch rates again.
        // Let's try to fetch rates for involved creators.
        for (const creatorId of creatorIds) {
          const { data: rates } = await supabase.from('shipping_rates').select('*').eq('creator_id', creatorId);
          if (rates && rates.length > 0) {
            const cityRate = rates.find(r => r.region_name.toLowerCase() === city) ||
              rates.find(r => r.region_name.toLowerCase() === 'all');
            if (cityRate) {
              // Add to earnings
              const current = earningsByCreator.get(creatorId) || 0;
              earningsByCreator.set(creatorId, current + cityRate.amount);
            }
          }
        }
      }

      // 4. Insert Earnings Records
      for (const [creatorId, amount] of Array.from(earningsByCreator.entries())) {
        await supabase.from('earnings').insert({
          creator_id: creatorId,
          order_id: orderId,
          amount: amount,
          status: 'pending' // Earnings are pending until payout
        });
      }

      res.json({ success: true });

    } catch (err) {
      console.error("Verification error:", err);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // 3. Reject Order
  app.post("/api/admin/orders/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const orderId = Number(req.params.id);

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Reject failed" });
    }
  });

  // 4. Get Sellers
  app.get("/api/admin/sellers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['writer', 'artist'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Fetch failed" });
    }
  });

  // 5. Freeze/Unfreeze User
  app.post("/api/admin/users/:id/freeze", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.params.id;
    const { isActive } = req.body;

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Update failed" });
    }
  });

  await seedDatabase();

  // === CREATIVE HUB (PORTFOLIO & COMMISSIONS) ===

  // Portfolios
  app.get("/api/portfolios", async (req, res) => {
    const { artistId, category, page = 1, limit = 12 } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from('portfolios').select('*', { count: 'exact' }).is('deleted_at', null);

    if (artistId) query = query.eq('artist_id', artistId);
    if (category && category !== 'All') query = query.eq('category', category);

    const { data, error, count } = await query
      .order('order_index', { ascending: true })
      .range(from, to);

    if (error) return res.status(500).json({ message: error.message });
    res.json({ data, total: count, page: Number(page) });
  });

  app.post("/api/portfolios", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;

    const { title, description, category, imageUrl, additionalImages, thumbnailUrl, tags, orderIndex, yearCreated } = req.body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.from('portfolios').insert({
      artist_id: userId,
      title,
      description,
      category,
      image_url: imageUrl,
      additional_images: additionalImages,
      thumbnail_url: thumbnailUrl,
      tags,
      order_index: orderIndex || 0,
      year_created: yearCreated
    }).select().single();

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  });

  // Design Requests
  app.get("/api/design-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { artistId, clientId, status, page = 1, limit = 10 } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from('design_requests').select('*, client:users!client_id(display_name, avatar_url), artist:users!artist_id(display_name, avatar_url)', { count: 'exact' });

    // Security: Only participants or admin can see
    const isAdmin = (req.user as any).role === 'admin';
    if (!isAdmin) {
      query = query.or(`client_id.eq.${userId},artist_id.eq.${userId}`);
    }

    if (artistId) query = query.eq('artist_id', artistId);
    if (clientId) query = query.eq('client_id', clientId);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return res.status(500).json({ message: error.message });
    res.json({ data, total: count, page: Number(page) });
  });

  app.get("/api/design-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const isAdmin = (req.user as any).role === 'admin';

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: request, error: reqError } = await supabase
      .from('design_requests')
      .select('*, client:users!client_id(*), artist:users!artist_id(*)')
      .eq('id', req.params.id)
      .single();

    if (reqError || !request) return res.status(404).json({ message: "Request not found" });

    // Auth check
    if (!isAdmin && request.client_id !== userId && request.artist_id !== userId) {
      return res.sendStatus(403);
    }

    const { data: messages, error: msgError } = await supabase
      .from('design_messages')
      .select('*, sender:users!sender_id(display_name, avatar_url)')
      .eq('request_id', req.params.id)
      .order('created_at', { ascending: true });

    res.json({ ...request, messages: messages || [] });
  });

  app.post("/api/design-requests", async (req, res) => {
    try {
      const { artistId, clientId: bodyClientId, title, description, budget, deadline, licenseType, referenceImages, status } = req.body;

      const clientId = (req.user as any)?.id || bodyClientId;

      console.log("[DesignRequests] Request Payload:", {
        sessionUserId: (req.user as any)?.id,
        bodyClientId,
        artistId,
        isAuth: req.isAuthenticated()
      });

      if (!clientId) {
        return res.status(401).json({ message: "Not authenticated. User ID missing." });
      }

      if (!artistId) {
        return res.status(400).json({ message: "Artist ID is required" });
      }

      const { data, error } = await supabase.from('design_requests').insert({
        client_id: String(clientId),
        artist_id: String(artistId),
        title: title || "New Design Inquiry",
        description: description || "Initial chat phase",
        budget: Number(budget || 0),
        deadline: deadline || null,
        license_type: licenseType || 'personal',
        reference_images: referenceImages || [],
        status: status || 'inquiry'
      }).select().single();

      if (error) {
        console.error("[DesignRequests] Supabase Error:", error);
        return res.status(500).json({ message: error.message, detail: error.details, code: error.code });
      }

      res.json(data);
    } catch (err: any) {
      console.error("[DesignRequests] Crash:", err);
      res.status(500).json({ message: "Internal server error during request creation", error: err.message });
    }
  });

  app.patch("/api/design-requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { status, escrowLocked, finalFileUrl } = req.body;

    const { data: request, error: fetchError } = await supabase
      .from('design_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !request) return res.status(404).json({ message: "Request not found" });

    const isArtist = request.artist_id === userId;
    const isClient = request.client_id === userId;
    const isAdmin = (req.user as any).role === 'admin';

    if (!isArtist && !isClient && !isAdmin) return res.sendStatus(403);

    // --- Manual Payment Logic ---
    if (status === 'payment_under_review' && !isClient) {
      return res.status(403).json({ message: "Only clients can submit payment proof." });
    }

    if (status === 'payment_confirmed' && !isAdmin) {
      return res.status(403).json({ message: "Only admins can verify payments." });
    }

    if (status === 'payment_confirmed' && isAdmin) {
      req.body.payment_verified_by = userId;
      req.body.payment_verified_at = new Date();
      req.body.escrow_locked = true; // Mark as secured
    }

    // Artist can only start project if payment is confirmed
    if (status === 'in_progress' && isArtist && request.status !== 'payment_confirmed') {
      return res.status(400).json({ message: "Wait for payment verification before starting." });
    }

    // Deliver Work
    if (status === 'delivered' && isArtist) {
      if (!finalFileUrl) return res.status(400).json({ message: "Delivery requires final file URL" });
    }

    // Handle Revision
    if (status === 'in_progress' && isClient && request.status === 'delivered') {
      // Reverting from delivered to in_progress means revision requested
      // We can also track revision counts if needed
    }

    // Payment Release on Completion
    if (status === 'completed' && isClient) {
      await supabase.from('earnings').insert({
        creator_id: request.artist_id,
        design_request_id: request.id,
        amount: Math.floor(request.budget * 0.8), // 20% platform fee
        status: 'paid'
      });
      // Optionally update artist creator_wallet in real-time
      const { data: artist } = await supabase.from('users').select('creator_wallet').eq('id', request.artist_id).single();
      await supabase.from('users').update({
        creator_wallet: (artist?.creator_wallet || 0) + Math.floor(request.budget * 0.8)
      }).eq('id', request.artist_id);
    }

    // Use the variables destructured at the start of the function
    const { title, description, budget, deadline, licenseType, paymentProofUrl, paymentReference, paymentVerifiedBy, paymentVerifiedAt } = req.body;
    const updateData: any = { updated_at: new Date() };

    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.escrow_locked !== undefined) updateData.escrow_locked = req.body.escrow_locked;
    if (req.body.final_file_url !== undefined) updateData.final_file_url = req.body.final_file_url;

    // Manual Payment Fields
    if (paymentProofUrl) updateData.payment_proof_url = paymentProofUrl;
    if (paymentReference) updateData.payment_reference = paymentReference;
    if (paymentVerifiedBy && isAdmin) updateData.payment_verified_by = paymentVerifiedBy;
    if (paymentVerifiedAt && isAdmin) updateData.payment_verified_at = paymentVerifiedAt;

    // Allow updating core details during negotiation
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (budget !== undefined) updateData.budget = budget;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (licenseType) updateData.license_type = licenseType;

    // Also handle camelCase
    if (status !== undefined && updateData.status === undefined) updateData.status = status;
    if (escrowLocked !== undefined && updateData.escrow_locked === undefined) updateData.escrow_locked = escrowLocked;
    if (finalFileUrl !== undefined && updateData.final_file_url === undefined) updateData.final_file_url = finalFileUrl;
    if (req.body.paymentProofUrl && !updateData.payment_proof_url) updateData.payment_proof_url = req.body.paymentProofUrl;
    if (req.body.paymentReference && !updateData.payment_reference) updateData.payment_reference = req.body.paymentReference;

    const { data, error } = await supabase
      .from('design_requests')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  });

  // Artist Analytics
  app.get("/api/artist/analytics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    if ((req.user as any).role !== 'artist' && (req.user as any).role !== 'admin') return res.sendStatus(403);

    const { data: requests, error } = await supabase
      .from('design_requests')
      .select('*')
      .eq('artist_id', userId);

    if (error) return res.status(500).json({ message: error.message });

    const completed = requests.filter(r => r.status === 'completed');
    const totalRev = completed.reduce((sum, r) => sum + r.budget, 0);
    const completionRate = requests.length > 0 ? (completed.length / requests.length) * 100 : 0;

    res.json({
      totalCommissions: requests.length,
      revenue: totalRev,
      completionRate: Math.round(completionRate),
      activeProject: requests.filter(r => ['accepted', 'in_progress', 'delivered'].includes(r.status)).length
    });
  });

  // Messages
  app.post("/api/design-messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const senderId = (req.user as any).id;

    const { requestId, message, attachmentUrl } = req.body;

    const { data, error } = await supabase.from('design_messages').insert({
      request_id: requestId,
      sender_id: senderId,
      message,
      attachment_url: attachmentUrl
    }).select().single();

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  });

  return httpServer;
}


async function seedDatabase() {
  const writers = await storage.listWriters();
  if (writers.length === 0) {
    const password = await hashPassword("password");

    // Create seed writers
    const jkRowling = await storage.createUser({
      username: "jkrowling",
      password,
      email: "jk@example.com",
      displayName: "J.K. Rowling",
      role: "writer",
      bio: "Creator of the Wizarding World. Bringing magic to life through words.",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      bannerUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1200",
      storeSettings: { themeColor: "#7c3aed", welcomeMessage: "Welcome to my magical corner." }
    });

    const georgeRR = await storage.createUser({
      username: "georgerrmartin",
      password,
      email: "george@example.com",
      displayName: "George R.R. Martin",
      role: "writer",
      bio: "Weaver of complex tales and epic histories.",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
      bannerUrl: "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&q=80&w=1200",
      storeSettings: { themeColor: "#991b1b", welcomeMessage: "Winter is coming." }
    });

    // Create products
    await storage.createProduct({
      writerId: jkRowling.id,
      title: "Harry Potter and the Sorcerer's Stone",
      description: "The boy who lived.",
      price: 1999,
      coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
      type: "ebook",
      genre: "Fantasy",
      isPublished: true,
    });

    await storage.createProduct({
      writerId: jkRowling.id,
      title: "The Tales of Beedle the Bard",
      description: "Classic wizarding fairytales.",
      price: 1299,
      coverUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400",
      type: "ebook",
      genre: "Fantasy",
      isPublished: true,
    });

    await storage.createProduct({
      writerId: georgeRR.id,
      title: "A Game of Thrones",
      description: "In the game of thrones, you win or you die.",
      price: 2499,
      coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
      type: "ebook",
      genre: "Fantasy",
      isPublished: true,
    });

    // Create seed Artist
    const artistUser = await storage.createUser({
      username: "art_alchemist",
      password,
      email: "art@example.com",
      displayName: "Elena The Art Alchemist",
      role: "artist",
      bio: "Crafting visual souls for your stories. Book covers, character designs, and world maps.",
      avatarUrl: "https://images.unsplash.com/photo-1515405295579-ba7f9f92f4e3?auto=format&fit=crop&q=80&w=200",
      bannerUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200",
      storeSettings: { themeColor: "#0ea5e9", welcomeMessage: "Visualizing your imagination." }
    });

    // Create Artist Products (Assets) with Variants
    const coverProduct = await storage.createProduct({
      writerId: artistUser.id,
      title: "Phoenix Rising - Premium Book Cover",
      description: "High-resolution fantasy book cover art. Includes PSD source file and commercial license.",
      price: 4999,
      coverUrl: "https://images.unsplash.com/photo-1626615720335-c54d249f05a9?auto=format&fit=crop&q=80&w=400",
      type: "asset",
      genre: "Cover Art",
      isPublished: true,
      licenseType: "commercial"
    });

    await storage.createVariant({
      productId: coverProduct.id,
      name: "Standard License",
      price: 4999,
      licenseType: "standard",
      type: "digital"
    });

    await storage.createVariant({
      productId: coverProduct.id,
      name: "Extended Commercial License",
      price: 14999,
      licenseType: "extended",
      type: "digital"
    });

    const charPack = await storage.createProduct({
      writerId: artistUser.id,
      title: "RPG Character Pack Vol. 1",
      description: "A collection of 10 unique fantasy character illustrations transparent PNGs.",
      price: 1999,
      coverUrl: "https://images.unsplash.com/photo-1638803040283-7a9bf4f292c9?auto=format&fit=crop&q=80&w=400",
      type: "asset",
      genre: "Illustrations",
      isPublished: true,
      licenseType: "commercial"
    });

    await storage.createProduct({
      writerId: artistUser.id,
      title: "Ancient Map Texture Bundle",
      description: "20+ Parchment and map textures for world builders.",
      price: 999,
      coverUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400",
      type: "asset",
      genre: "Textures",
      isPublished: true,
      licenseType: "standard"
    });
  }
}
