import { pgTable, text, boolean, timestamp, jsonb, integer, serial, uuid, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === 1. USER & IDENTITY ===

export const users = pgTable("users", {
  id: text("id").primaryKey(), // UUID from Supabase Auth
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("reader"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  storeSettings: jsonb("store_settings").$type<{
    themeColor?: string;
    accentColor?: string;
    welcomeMessage?: string;
    font?: string;
    socialLinks?: { platform: string; url: string }[];
    headerLayout?: 'standard' | 'minimal' | 'hero';
  }>(),
  stripeAccountId: text("stripe_account_id"),
  subscriptionTier: text("subscription_tier").default("free"), // free, vip
  commissionRate: integer("commission_rate").default(20), // Percentage (e.g., 20)
  isActive: boolean("is_active").default(true),
  shippingPolicy: text("shipping_policy"),
  skills: text("skills"), // Comma-separated or short description
  createdAt: timestamp("created_at").defaultNow(),
});

// === 2. PRODUCTS & COMMERCE ===

export const products = pgTable("products", {
  id: serial("id").primaryKey(), // SERIAL = number
  writerId: text("writer_id").notNull(), // UUID ref to users
  title: text("title").notNull(),
  description: text("description").notNull(),
  coverUrl: text("cover_url").notNull(),
  fileUrl: text("file_url"),
  content: text("content"), // Extracted text for reader
  type: text("type").notNull().default("ebook"), // ebook, asset, bundle, physical
  genre: text("genre").notNull(),
  isPublished: boolean("is_published").default(false),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  price: integer("price").notNull(),
  salePrice: integer("sale_price"), // Discounted price
  saleEndsAt: timestamp("sale_ends_at"), // When the sale expires
  licenseType: text("license_type").default("personal"),
  // Physical Product Fields
  stockQuantity: integer("stock_quantity"), // Null for digital
  weight: integer("weight"), // In grams
  requiresShipping: boolean("requires_shipping").default(false),
  salesCount: integer("sales_count").default(0),
  appearanceSettings: jsonb("appearance_settings").$type<{
    theme?: 'light' | 'dark' | 'sepia' | 'fantasy' | 'sci-fi' | 'romance';
    fontFamily?: 'serif' | 'sans';
    fontSize?: number;
    lineHeight?: number;
    backgroundColor?: string;
    textColor?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isSerialized: boolean("is_serialized").default(false),
  seriesStatus: text("series_status").default("ongoing"), // ongoing, completed
  lastChapterUpdatedAt: timestamp("last_chapter_updated_at").defaultNow(),
});

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shippingRates = pgTable("shipping_rates", {
  id: serial("id").primaryKey(),
  creatorId: text("creator_id").notNull(),
  regionName: text("region_name").notNull(),
  amount: integer("amount").notNull().default(0),
  deliveryTimeMin: integer("delivery_time_min"),
  deliveryTimeMax: integer("delivery_time_max"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shippingAddresses = pgTable("shipping_addresses", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  city: text("city").notNull(),
  addressLine: text("address_line").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(), // ref to products.id (int)
  name: text("name").notNull(),
  type: text("type").notNull().default("digital"),
  price: integer("price").notNull(),
  licenseType: text("license_type").default("standard"),
  fileUrl: text("file_url"),
});

export const bundles = pgTable("bundles", {
  id: serial("id").primaryKey(),
  creatorId: text("creator_id").notNull(), // UUID ref to users
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  coverUrl: text("cover_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bundleItems = pgTable("bundle_items", {
  id: serial("id").primaryKey(),
  bundleId: integer("bundle_id").notNull(), // ref to bundles.id (int)
  productId: integer("product_id").notNull(), // ref to products.id (int)
});

// === 3. STORY COLLECTIONS (BUNDLES V2) ===

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  writerId: text("writer_id").notNull(), // UUID ref to users
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  price: numeric("price", { precision: 10, scale: 2 }),
  discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  isFree: boolean("is_free").default(false),
  isPublished: boolean("is_published").default(false),
  visibility: text("visibility").default("public"), // public, private
  totalSales: integer("total_sales").default(0),
  estimatedTotalParts: integer("estimated_total_parts"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const collectionItems = pgTable("collection_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionId: uuid("collection_id").notNull(), // ref to collections.id
  storyId: integer("story_id").notNull(), // ref to products.id
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // ref to users.id
  productType: text("product_type").notNull(), // story, collection
  productId: text("product_id").notNull(), // UUID or Int as string
  createdAt: timestamp("created_at").defaultNow(),
});

// === 3. SOCIAL LAYERS ===

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: text("follower_id").notNull(),
  creatorId: text("creator_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  writerId: text("writer_id").notNull(),
  readerId: text("reader_id").notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedLibrary = pgTable("saved_library", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  productId: integer("product_id").notNull(),
  savedAt: timestamp("saved_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: text("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(), // UUID from Supabase
  storeId: text("store_id").notNull(), // UUID of the store owner
  senderId: text("sender_id").notNull(), // UUID of the message sender
  content: text("content").notNull(),
  replyToId: text("reply_to_id"), // UUID of the message being replied to
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === 4. CART & ORDERS ===

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  productId: integer("product_id"),
  collectionId: text("collection_id"),
  variantId: integer("variant_id"),
  quantity: integer("quantity").default(1),
  addedAt: timestamp("added_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  totalAmount: integer("total_amount").notNull(),
  platformFee: integer("platform_fee").notNull(),
  creatorEarnings: integer("creator_earnings").notNull(),
  status: text("status").notNull().default("pending"),
  paymentIntentId: text("payment_intent_id"),
  // Local Payment Fields
  paymentMethod: text("payment_method").default("card"),
  paymentProofUrl: text("payment_proof_url"),
  paymentReference: text("payment_reference"),
  isVerified: boolean("is_verified").default(false),
  // Physical Order Fields
  shippingAddress: jsonb("shipping_address").$type<{
    fullName: string;
    phoneNumber: string;
    city: string;
    addressLine: string;
  }>(),
  shippingCost: integer("shipping_cost").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  variantId: integer("variant_id"),
  price: integer("price").notNull(),
  licenseType: text("license_type"),
  creatorId: text("creator_id").notNull(),
  // Physical/Tracking Fields
  fulfillmentStatus: text("fulfillment_status").default("pending"), // pending, shipped, delivered, cancelled
  trackingNumber: text("tracking_number"),
  shippedAt: timestamp("shipped_at"),
});

export const earnings = pgTable("earnings", {
  id: serial("id").primaryKey(),
  creatorId: text("creator_id").notNull(),
  orderId: integer("order_id"), // Optional: order link
  designRequestId: uuid("design_request_id"), // Optional: commission link
  amount: integer("amount").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default("pending"), // pending, processed, rejected
  method: text("method").default("stripe"),
  methodDetails: text("method_details"), // e.g., Vodafone Cash number, InstaPay address
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// === 5. MARKETING ===

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  writerId: text("writer_id").notNull(),
  code: text("code").notNull(),
  discountType: text("discount_type").default("percentage"),
  discountValue: integer("discount_value").notNull(),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const couponUsage = pgTable("coupon_usage", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull(),
  userId: text("user_id").notNull(),
  orderId: integer("order_id").notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

// === 6. ADMIN SYSTEM ===

export const adminPrivateMessages = pgTable("admin_private_messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminWriterAnnouncements = pgTable("admin_writer_announcements", {
  id: serial("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const designRequests = pgTable("design_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id").notNull(), // Adjusted to text to support MemStorage IDs
  artistId: text("artist_id").notNull(), // Adjusted to text to support MemStorage IDs
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: integer("budget").notNull(), // In EGP
  deadline: timestamp("deadline"),
  licenseType: text("license_type").default("personal"), // personal, commercial
  status: text("status").notNull().default("inquiry"), // inquiry, pending, awaiting_payment, payment_under_review, payment_confirmed, in_progress, delivered, completed, rejected
  paymentProofUrl: text("payment_proof_url"),
  paymentReference: text("payment_reference"),
  paymentVerifiedBy: text("payment_verified_by"),
  paymentVerifiedAt: timestamp("payment_verified_at"),
  escrowLocked: boolean("escrow_locked").default(false),
  referenceImages: jsonb("reference_images"), // Array of strings
  finalFileUrl: text("final_file_url"), // The actual delivery
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: text("artist_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'Cover', 'Character', 'Map', 'UI', 'Branding', 'Other'
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  tags: text("tags"),
  orderIndex: integer("order_index").default(0),
  yearCreated: text("year_created"),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const designMessages = pgTable("design_messages", {
  id: serial("id").primaryKey(),
  requestId: uuid("request_id").notNull(),
  senderId: text("sender_id").notNull(),
  message: text("message").notNull(),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS & TYPES ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, rating: true, reviewCount: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertVariantSchema = createInsertSchema(productVariants).omit({ id: true });
export const insertBundleSchema = createInsertSchema(bundles).omit({ id: true, createdAt: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true, addedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true, totalSales: true });
export const insertCollectionItemSchema = createInsertSchema(collectionItems).omit({ id: true, createdAt: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, createdAt: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true, usageCount: true });
export const insertEarningSchema = createInsertSchema(earnings).omit({ id: true, createdAt: true });
export const insertPayoutSchema = createInsertSchema(payouts).omit({ id: true, requestedAt: true, processedAt: true });
export const insertShippingRateSchema = createInsertSchema(shippingRates).omit({ id: true, createdAt: true });
export const insertShippingAddressSchema = createInsertSchema(shippingAddresses).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertAdminPrivateMessageSchema = createInsertSchema(adminPrivateMessages).omit({ id: true, createdAt: true });
export const insertAdminAnnouncementSchema = createInsertSchema(adminWriterAnnouncements).omit({ id: true, createdAt: true });
export const insertPortfolioSchema = createInsertSchema(portfolios).omit({ id: true, createdAt: true, deletedAt: true });
export const insertDesignRequestSchema = createInsertSchema(designRequests, {
  deadline: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, clientId: true });
export const insertDesignMessageSchema = createInsertSchema(designMessages).omit({ id: true, createdAt: true });


export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export const insertChapterSchema = createInsertSchema(chapters).omit({ id: true, createdAt: true });
export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;

export type Variant = typeof productVariants.$inferSelect;
export type InsertVariant = z.infer<typeof insertVariantSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type Earning = typeof earnings.$inferSelect;
export type InsertEarning = z.infer<typeof insertEarningSchema>;

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;

export type ShippingRate = typeof shippingRates.$inferSelect;
export type InsertShippingRate = z.infer<typeof insertShippingRateSchema>;

export type ShippingAddress = typeof shippingAddresses.$inferSelect;
export type InsertShippingAddress = z.infer<typeof insertShippingAddressSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type AdminPrivateMessage = typeof adminPrivateMessages.$inferSelect;
export type InsertAdminPrivateMessage = z.infer<typeof insertAdminPrivateMessageSchema>;

export type AdminAnnouncement = typeof adminWriterAnnouncements.$inferSelect;
export type InsertAdminAnnouncement = z.infer<typeof insertAdminAnnouncementSchema>;

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type DesignRequest = typeof designRequests.$inferSelect;
export type InsertDesignRequest = z.infer<typeof insertDesignRequestSchema>;

export type DesignMessage = typeof designMessages.$inferSelect;
export type InsertDesignMessage = z.infer<typeof insertDesignMessageSchema>;

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type CollectionItem = typeof collectionItems.$inferSelect;
export type InsertCollectionItem = z.infer<typeof insertCollectionItemSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

// Request Types
export type CreateProductRequest = InsertProduct & { variants?: InsertVariant[] };
export type UpdateProductRequest = Partial<InsertProduct>;
