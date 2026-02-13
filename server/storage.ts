import {
  type User, type InsertUser, type Product, type InsertProduct, type Review, type InsertReview,
  type Coupon, type InsertCoupon, type Order, type InsertOrder, type OrderItem,
  type CartItem, type InsertCartItem, type Variant, type InsertVariant,
  type Earning, type InsertEarning, type Payout, type InsertPayout,
  type ShippingRate, type InsertShippingRate, type ShippingAddress, type InsertShippingAddress
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  // User/Writer
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  listWriters(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;

  // Products & Variants
  getProducts(filters?: { writerId?: string; genre?: string; search?: string; type?: string; isPublished?: boolean }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  createVariant(variant: InsertVariant): Promise<Variant>;
  getVariants(productId: number): Promise<Variant[]>;

  // Social
  followUser(followerId: string, creatorId: string): Promise<void>;
  unfollowUser(followerId: string, creatorId: string): Promise<void>;
  getFollowers(creatorId: string): Promise<number>;
  getFollowing(userId: string): Promise<string[]>; // Returns creator IDs

  toggleLike(userId: string, productId: number): Promise<boolean>; // Returns true if liked
  getLikes(productId: number): Promise<number>;

  addToLibrary(userId: string, productId: number): Promise<void>;
  getLibrary(userId: string): Promise<Product[]>;

  // Cart
  getCart(userId: string): Promise<(CartItem & { product?: Product, variant?: Variant })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Orders & Earnings
  createOrder(order: InsertOrder, items: { productId?: number; collectionId?: string; variantId?: number; price: number; creatorId: string }[]): Promise<Order>;
  verifyOrder(orderId: number, adminId: string): Promise<Order>;
  listPendingOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  getUserOrders(userId: string): Promise<Order[]>;
  getCreatorOrders(creatorId: string): Promise<Order[]>;

  // Economic System
  createEarning(earning: InsertEarning): Promise<Earning>;
  getEarnings(userId: string): Promise<Earning[]>;
  createPayout(payout: InsertPayout): Promise<Payout>;
  getPayouts(userId: string): Promise<Payout[]>;


  // Reviews
  getReviews(productId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Coupons
  getCoupons(writerId: string): Promise<Coupon[]>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  // Shipping Rates
  getShippingRates(creatorId: string): Promise<ShippingRate[]>;
  createShippingRate(rate: InsertShippingRate): Promise<ShippingRate>;
  deleteShippingRate(id: number): Promise<void>;

  // Shipping Addresses
  getShippingAddresses(userId: string): Promise<ShippingAddress[]>;
  createShippingAddress(address: InsertShippingAddress): Promise<ShippingAddress>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<number, Product>;
  private variants: Map<number, Variant>;
  private reviews: Map<number, Review>;
  private coupons: Map<number, Coupon>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private cart: Map<number, CartItem>;
  private follows: Map<string, boolean>; // simplified "followerId-creatorId": true
  private likes: Map<string, boolean>; // "userId-productId": true
  private library: Map<string, boolean>; // "userId-productId": true
  private earnings: Map<number, Earning>;
  private payouts: Map<number, Payout>;
  private shippingRates: Map<number, ShippingRate>;
  private shippingAddresses: Map<number, ShippingAddress>;

  sessionStore: session.Store;

  private currentUserId = 1;
  private currentProductId = 1;
  private currentVariantId = 1;
  private currentReviewId = 1;
  private currentCouponId = 1;
  private currentOrderId = 1;
  private currentOrderItemId = 1;
  private currentCartId = 1;
  private currentEarningId = 1;
  private currentPayoutId = 1;
  private currentShippingRateId = 1;
  private currentShippingAddressId = 1;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.users = new Map();
    this.products = new Map();
    this.variants = new Map();
    this.reviews = new Map();
    this.coupons = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.cart = new Map();
    this.follows = new Map();
    this.likes = new Map();
    this.library = new Map();
    this.earnings = new Map();
    this.payouts = new Map();
    this.shippingRates = new Map();
    this.shippingAddresses = new Map();
  }

  // User
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async listWriters(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === 'writer' || u.role === 'artist');
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = "user_" + (this.currentUserId++);
    const user: User = {
      ...insertUser,
      id,
      password: insertUser.password ?? null,
      createdAt: new Date(),
      role: insertUser.role || "reader",
      bio: insertUser.bio || null,
      avatarUrl: insertUser.avatarUrl || null,
      bannerUrl: insertUser.bannerUrl || null,
      storeSettings: (insertUser.storeSettings as any) || null,
      stripeAccountId: null,
      subscriptionTier: insertUser.subscriptionTier || 'free',
      commissionRate: insertUser.commissionRate || 20,
      isActive: insertUser.isActive ?? true,
      shippingPolicy: insertUser.shippingPolicy ?? null,
      skills: insertUser.skills ?? null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) throw new Error("User not found");
    const updated = {
      ...existing,
      ...updates,
      storeSettings: (updates.storeSettings !== undefined ? updates.storeSettings : existing.storeSettings) as any
    };
    this.users.set(id, updated);
    return updated;
  }

  // Products
  async getProducts(filters?: { writerId?: string; genre?: string; search?: string; type?: string; isPublished?: boolean }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    if (filters) {
      if (filters.writerId) products = products.filter(p => p.writerId === filters.writerId);
      if (filters.genre) products = products.filter(p => p.genre.toLowerCase() === filters.genre?.toLowerCase());
      if (filters.search) {
        const query = filters.search.toLowerCase();
        products = products.filter(p => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
      }
      if (filters.type) products = products.filter(p => p.type === filters.type);
      if (filters.isPublished !== undefined) products = products.filter(p => p.isPublished === filters.isPublished);
    }
    return products;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = {
      ...insertProduct,
      id,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      type: insertProduct.type || "ebook",
      licenseType: insertProduct.licenseType || "personal",
      fileUrl: insertProduct.fileUrl || null,
      content: insertProduct.content || null,
      isPublished: insertProduct.isPublished ?? false,
      salePrice: insertProduct.salePrice || null,
      saleEndsAt: insertProduct.saleEndsAt || null,
      // Physical columns handling
      stockQuantity: insertProduct.stockQuantity || null,
      weight: insertProduct.weight || null,
      requiresShipping: insertProduct.requiresShipping || false,
      salesCount: insertProduct.salesCount || 0,
      appearanceSettings: (insertProduct.appearanceSettings as any) || null,
      isSerialized: insertProduct.isSerialized ?? false,
      seriesStatus: insertProduct.seriesStatus ?? "ongoing",
      lastChapterUpdatedAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const existing = this.products.get(id);
    if (!existing) throw new Error("Product not found");
    const updated: Product = {
      ...existing,
      ...updates,
      appearanceSettings: updates.appearanceSettings !== undefined ? (updates.appearanceSettings as any) : existing.appearanceSettings
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
  }

  async createVariant(variant: InsertVariant): Promise<Variant> {
    const id = this.currentVariantId++;
    const newVariant: Variant = {
      ...variant,
      id,
      licenseType: variant.licenseType || "standard",
      fileUrl: variant.fileUrl || null,
      type: variant.type || "digital"
    };
    this.variants.set(id, newVariant);
    return newVariant;
  }

  async getVariants(productId: number): Promise<Variant[]> {
    return Array.from(this.variants.values()).filter(v => v.productId === productId);
  }

  // Social
  async followUser(followerId: string, creatorId: string): Promise<void> {
    this.follows.set(`${followerId}-${creatorId}`, true);
  }

  async unfollowUser(followerId: string, creatorId: string): Promise<void> {
    this.follows.delete(`${followerId}-${creatorId}`);
  }

  async getFollowers(creatorId: string): Promise<number> {
    return Array.from(this.follows.keys()).filter(k => k.endsWith(`-${creatorId}`)).length;
  }

  async getFollowing(userId: string): Promise<string[]> {
    return Array.from(this.follows.keys())
      .filter(k => k.startsWith(`${userId}-`))
      .map(k => k.split('-')[1]);
  }

  async toggleLike(userId: string, productId: number): Promise<boolean> {
    const key = `${userId}-${productId}`;
    if (this.likes.has(key)) {
      this.likes.delete(key);
      return false;
    }
    this.likes.set(key, true);
    return true;
  }

  async getLikes(productId: number): Promise<number> {
    return Array.from(this.likes.keys()).filter(k => k.endsWith(`-${productId}`)).length;
  }

  async addToLibrary(userId: string, productId: number): Promise<void> {
    this.library.set(`${userId}-${productId}`, true);
  }

  async getLibrary(userId: string): Promise<Product[]> {
    const productIds = Array.from(this.library.keys())
      .filter(k => k.startsWith(`${userId}-`))
      .map(k => parseInt(k.split('-')[1]));

    // Manual join
    return productIds
      .map(id => this.products.get(id))
      .filter((p): p is Product => !!p);
  }

  // Cart
  async getCart(userId: string): Promise<(CartItem & { product?: Product, variant?: Variant })[]> {
    const items = Array.from(this.cart.values()).filter(i => i.userId === userId);
    return items.map(item => ({
      ...item,
      product: item.productId ? this.products.get(item.productId) : undefined,
      variant: item.variantId ? this.variants.get(item.variantId) : undefined
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const id = this.currentCartId++;
    const newItem: CartItem = {
      ...item,
      id,
      addedAt: new Date(),
      quantity: item.quantity || 1,
      variantId: item.variantId || null,
      productId: item.productId ?? null,
      collectionId: item.collectionId ?? null
    };
    this.cart.set(id, newItem);
    return newItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const item = this.cart.get(id);
    if (!item) throw new Error("Item not found");
    const updated = { ...item, quantity };
    this.cart.set(id, updated);
    return updated;
  }

  async removeFromCart(id: number): Promise<void> {
    this.cart.delete(id);
  }

  async clearCart(userId: string): Promise<void> {
    // Inefficient but works for mem
    const entries = Array.from(this.cart.entries());
    for (const [key, val] of entries) {
      if (val.userId === userId) this.cart.delete(key);
    }
  }

  // Orders
  async createOrder(insertOrder: InsertOrder, items: { productId?: number; collectionId?: string; variantId?: number; price: number; creatorId: string }[]): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = {
      ...insertOrder,
      id,
      paymentIntentId: insertOrder.paymentIntentId || "local_ref_" + id,
      status: insertOrder.status || "pending_verification",
      paymentMethod: insertOrder.paymentMethod || "card",
      paymentProofUrl: insertOrder.paymentProofUrl || null,
      paymentReference: insertOrder.paymentReference || null,
      isVerified: insertOrder.isVerified || false,
      // Physical
      shippingAddress: (insertOrder.shippingAddress as any) || null,
      shippingCost: insertOrder.shippingCost || 0,
      createdAt: new Date()
    };
    this.orders.set(id, order);

    // Create Order Items
    items.forEach(item => {
      const itemId = this.currentOrderItemId++;
      this.orderItems.set(itemId, {
        id: itemId,
        orderId: id,
        productId: item.productId || null,
        collectionId: item.collectionId || null,
        variantId: item.variantId || null,
        price: item.price,
        licenseType: "standard", // simplify for now
        creatorId: item.creatorId,
        fulfillmentStatus: "pending",
        trackingNumber: null,
        shippedAt: null
      });
    });

    return order;
  }

  async verifyOrder(orderId: number, adminId: string): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error("Order not found");

    const updated = { ...order, status: "paid", isVerified: true };
    this.orders.set(orderId, updated);
    return updated;
  }

  async listPendingOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.status === "pending_verification");
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.userId === userId);
  }

  async getCreatorOrders(creatorId: string): Promise<Order[]> {
    // This implies a join in SQL. For memory, we look at orderItems first
    const orderIds = new Set(
      Array.from(this.orderItems.values())
        .filter(i => i.creatorId === creatorId)
        .map(i => i.orderId)
    );

    return Array.from(this.orders.values()).filter(o => orderIds.has(o.id));
  }

  // Economic System
  async createEarning(earning: InsertEarning): Promise<Earning> {
    const id = this.currentEarningId++;
    const newEarning: Earning = {
      ...earning,
      id,
      createdAt: new Date(),
      status: earning.status || "pending",
      orderId: earning.orderId ?? null,
      designRequestId: earning.designRequestId ?? null
    };
    this.earnings.set(id, newEarning);
    return newEarning;
  }

  async getEarnings(userId: string): Promise<Earning[]> {
    return Array.from(this.earnings.values()).filter(e => e.creatorId === userId);
  }

  async createPayout(payout: InsertPayout): Promise<Payout> {
    const id = this.currentPayoutId++;
    const newPayout: Payout = {
      ...payout,
      id,
      status: "pending",
      requestedAt: new Date(),
      processedAt: null,
      method: payout.method || "stripe",
      methodDetails: payout.methodDetails ?? null
    };
    this.payouts.set(id, newPayout);
    return newPayout;
  }

  async getPayouts(userId: string): Promise<Payout[]> {
    return Array.from(this.payouts.values()).filter(p => p.userId === userId);
  }


  // Reviews
  async getReviews(productId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(r => r.productId === productId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = {
      ...insertReview,
      id,
      createdAt: new Date(),
      comment: insertReview.comment || null
    };
    this.reviews.set(id, review);
    return review;
  }

  // Coupons
  async getCoupons(writerId: string): Promise<Coupon[]> {
    return Array.from(this.coupons.values()).filter(c => c.writerId === writerId);
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const id = this.currentCouponId++;
    const newCoupon: Coupon = {
      ...insertCoupon,
      id,
      usageLimit: insertCoupon.usageLimit || null,
      usageCount: 0,
      expiresAt: insertCoupon.expiresAt || null,
      discountType: insertCoupon.discountType || "percentage",
      createdAt: new Date()
    };
    this.coupons.set(id, newCoupon);
    return newCoupon;
  }

  async validateCoupon(code: string, writerId?: string): Promise<Coupon | undefined> {
    return Array.from(this.coupons.values()).find(c => c.code === code && (!writerId || c.writerId === writerId));
  }

  // Shipping Rates
  async getShippingRates(creatorId: string): Promise<ShippingRate[]> {
    return Array.from(this.shippingRates.values()).filter(r => r.creatorId === creatorId);
  }

  async createShippingRate(insertRate: InsertShippingRate): Promise<ShippingRate> {
    const id = this.currentShippingRateId++;
    const rate: ShippingRate = {
      ...insertRate,
      id,
      createdAt: new Date(),
      amount: insertRate.amount || 0,
      deliveryTimeMin: insertRate.deliveryTimeMin || null,
      deliveryTimeMax: insertRate.deliveryTimeMax || null
    };
    this.shippingRates.set(id, rate);
    return rate;
  }

  async deleteShippingRate(id: number): Promise<void> {
    this.shippingRates.delete(id);
  }

  // Shipping Addresses
  async getShippingAddresses(userId: string): Promise<ShippingAddress[]> {
    return Array.from(this.shippingAddresses.values()).filter(a => a.userId === userId);
  }

  async createShippingAddress(insertAddress: InsertShippingAddress): Promise<ShippingAddress> {
    const id = this.currentShippingAddressId++;
    const address: ShippingAddress = {
      ...insertAddress,
      id,
      userId: insertAddress.userId || null,
      createdAt: new Date()
    };
    this.shippingAddresses.set(id, address);
    return address;
  }
}

export const storage = new MemStorage();

