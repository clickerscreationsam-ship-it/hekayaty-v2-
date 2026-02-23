import {
  type User, type InsertUser, type Product, type InsertProduct, type Review, type InsertReview,
  type Coupon, type InsertCoupon, type Order, type InsertOrder, type OrderItem,
  type CartItem, type InsertCartItem, type Variant, type InsertVariant,
  type Earning, type InsertEarning, type Payout, type InsertPayout,
  type ShippingRate, type InsertShippingRate, type ShippingAddress, type InsertShippingAddress,
  type Notification, type InsertNotification, type NotificationSettings, type InsertNotificationSettings
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const MemoryStore = createMemoryStore(session);

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase credentials missing during storage initialization.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

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
  createOrder(order: InsertOrder, items: { productId?: number; collectionId?: string; variantId?: number; price: number; quantity: number; creatorId: string }[]): Promise<Order>;
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
  validateCoupon(code: string, writerId?: string): Promise<Coupon | undefined>;
  // Shipping Rates
  getShippingRates(creatorId: string): Promise<ShippingRate[]>;
  createShippingRate(rate: InsertShippingRate): Promise<ShippingRate>;
  deleteShippingRate(id: number): Promise<void>;

  // Shipping Addresses
  getShippingAddresses(userId: string): Promise<ShippingAddress[]>;
  createShippingAddress(address: InsertShippingAddress): Promise<ShippingAddress>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getNotificationSettings(userId: string): Promise<NotificationSettings>;
  updateNotificationSettings(userId: string, updates: Partial<NotificationSettings>): Promise<NotificationSettings>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabaseAdmin.from('users').select('*').eq('username', username).single();
    if (error || !data) return undefined;
    return data as User;
  }

  async listWriters(): Promise<User[]> {
    const { data, error } = await supabaseAdmin.from('users').select('*').in('role', ['writer', 'artist']);
    if (error || !data) return [];
    return data as User[];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabaseAdmin.from('users').insert({
      ...insertUser,
      isActive: true,
      createdAt: new Date()
    }).select().single();
    if (error) throw error;
    return data as User;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const { data, error } = await supabaseAdmin.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as User;
  }

  // Products
  async getProducts(filters?: { writerId?: string; genre?: string; search?: string; type?: string; isPublished?: boolean }): Promise<Product[]> {
    let query = supabaseAdmin.from('products').select('*');
    if (filters?.writerId) query = query.eq('writer_id', filters.writerId);
    if (filters?.genre) query = query.eq('genre', filters.genre);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.isPublished !== undefined) query = query.eq('is_published', filters.isPublished);
    if (filters?.search) query = query.ilike('title', `%${filters.search}%`);

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Product[];
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return data as Product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const { data, error } = await supabaseAdmin.from('products').insert({
      ...product,
      createdAt: new Date()
    }).select().single();
    if (error) throw error;
    return data as Product;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const { data, error } = await supabaseAdmin.from('products').update(product).eq('id', id).select().single();
    if (error) throw error;
    return data as Product;
  }

  async deleteProduct(id: number): Promise<void> {
    const product = await this.getProduct(id);
    const p = product as any;
    if (p && ((p.salesCount ?? 0) > 0 || (p.sales_count ?? 0) > 0)) {
      throw new Error("Cannot delete product with existing sales");
    }
    await supabaseAdmin.from('products').delete().eq('id', id);
  }

  // Variants
  async createVariant(variant: InsertVariant): Promise<Variant> {
    const { data, error } = await supabaseAdmin.from('product_variants').insert(variant).select().single();
    if (error) throw error;
    return data as Variant;
  }

  async getVariants(productId: number): Promise<Variant[]> {
    const { data, error } = await supabaseAdmin.from('product_variants').select('*').eq('product_id', productId);
    if (error || !data) return [];
    return data as Variant[];
  }

  // Social
  async followUser(followerId: string, creatorId: string): Promise<void> {
    await supabaseAdmin.from('follows').insert({ follower_id: followerId, creator_id: creatorId });
  }

  async unfollowUser(followerId: string, creatorId: string): Promise<void> {
    await supabaseAdmin.from('follows').delete().match({ follower_id: followerId, creator_id: creatorId });
  }

  async getFollowers(creatorId: string): Promise<number> {
    const { count, error } = await supabaseAdmin.from('follows').select('*', { count: 'exact', head: true }).eq('creator_id', creatorId);
    return count || 0;
  }

  async getFollowing(userId: string): Promise<string[]> {
    const { data } = await supabaseAdmin.from('follows').select('creator_id').eq('follower_id', userId);
    return data?.map(f => f.creator_id) || [];
  }

  async toggleLike(userId: string, productId: number): Promise<boolean> {
    const { data: existing } = await supabaseAdmin.from('likes').select('*').match({ user_id: userId, product_id: productId }).single();
    if (existing) {
      await supabaseAdmin.from('likes').delete().match({ user_id: userId, product_id: productId });
      return false;
    } else {
      await supabaseAdmin.from('likes').insert({ user_id: userId, product_id: productId });
      return true;
    }
  }

  async getLikes(productId: number): Promise<number> {
    const { count } = await supabaseAdmin.from('likes').select('*', { count: 'exact', head: true }).eq('product_id', productId);
    return count || 0;
  }

  async addToLibrary(userId: string, productId: number): Promise<void> {
    await supabaseAdmin.from('saved_library').insert({ user_id: userId, product_id: productId });
  }

  async getLibrary(userId: string): Promise<Product[]> {
    const { data } = await supabaseAdmin.from('saved_library').select('products(*)').eq('user_id', userId);
    return (data?.map((d: any) => d.products) || []).filter(Boolean) as Product[];
  }

  // Cart
  async getCart(userId: string): Promise<(CartItem & { product?: Product, variant?: Variant })[]> {
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .select('*, product:products(*), variant:product_variants(*)')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data as any;
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const { data, error } = await supabaseAdmin.from('cart_items').insert(item).select().single();
    if (error) throw error;
    return data as CartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const { data, error } = await supabaseAdmin.from('cart_items').update({ quantity }).eq('id', id).select().single();
    if (error) throw error;
    return data as CartItem;
  }

  async removeFromCart(id: number): Promise<void> {
    await supabaseAdmin.from('cart_items').delete().eq('id', id);
  }

  async clearCart(userId: string): Promise<void> {
    await supabaseAdmin.from('cart_items').delete().eq('user_id', userId);
  }

  // Orders
  async createOrder(order: InsertOrder, items: { productId?: number; collectionId?: string; variantId?: number; price: number; quantity: number; creatorId: string }[]): Promise<Order> {
    const { data: ord, error: ordErr } = await supabaseAdmin.from('orders').insert({
      ...order,
      createdAt: new Date()
    }).select().single();
    if (ordErr) throw ordErr;

    const orderItems = items.map(item => ({
      order_id: ord.id,
      product_id: item.productId,
      collection_id: item.collectionId,
      variant_id: item.variantId,
      price: item.price,
      quantity: item.quantity || 1,
      creator_id: item.creatorId,
      fulfillment_status: 'pending'
    }));

    const { error: itemErr } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemErr) throw itemErr;

    return ord as Order;
  }

  async verifyOrder(orderId: number, adminId: string): Promise<Order> {
    const { data, error } = await supabaseAdmin.from('orders').update({ isVerified: true, status: 'paid' }).eq('id', orderId).select().single();
    if (error) throw error;
    return data as Order;
  }

  async listPendingOrders(): Promise<Order[]> {
    const { data } = await supabaseAdmin.from('orders').select('*').eq('isVerified', false);
    return data as Order[] || [];
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const { data } = await supabaseAdmin.from('orders').select('*').eq('id', id).single();
    return data as Order || undefined;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const { data } = await supabaseAdmin.from('order_items').select('*').eq('order_id', orderId);
    return data as OrderItem[] || [];
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const { data } = await supabaseAdmin.from('orders').select('*').eq('user_id', userId).order('createdAt', { ascending: false });
    return data as Order[] || [];
  }

  async getCreatorOrders(creatorId: string): Promise<Order[]> {
    // This is simplified, usually joins or multiple queries are needed
    const { data: itemIds } = await supabaseAdmin.from('order_items').select('order_id').eq('creator_id', creatorId);
    const orderIds = Array.from(new Set(itemIds?.map(i => i.order_id)));
    const { data: orders } = await supabaseAdmin.from('orders').select('*').in('id', orderIds).order('createdAt', { ascending: false });
    return orders as Order[] || [];
  }

  // Economic
  async createEarning(earning: InsertEarning): Promise<Earning> {
    const { data, error } = await supabaseAdmin.from('earnings').insert(earning).select().single();
    if (error) throw error;
    return data as Earning;
  }

  async getEarnings(userId: string): Promise<Earning[]> {
    const { data } = await supabaseAdmin.from('earnings').select('*').eq('creator_id', userId);
    return data as Earning[] || [];
  }

  async createPayout(payout: InsertPayout): Promise<Payout> {
    const { data, error } = await supabaseAdmin.from('payouts').insert(payout).select().single();
    if (error) throw error;
    return data as Payout;
  }

  async getPayouts(userId: string): Promise<Payout[]> {
    const { data } = await supabaseAdmin.from('payouts').select('*').eq('user_id', userId).order('requested_at', { ascending: false });
    return data as Payout[] || [];
  }

  // Reviews
  async getReviews(productId: number): Promise<Review[]> {
    const { data } = await supabaseAdmin.from('reviews').select('*').eq('product_id', productId).order('createdAt', { ascending: false });
    return data as Review[] || [];
  }

  async createReview(review: InsertReview): Promise<Review> {
    const { data, error } = await supabaseAdmin.from('reviews').insert({ ...review, createdAt: new Date() }).select().single();
    if (error) throw error;
    return data as Review;
  }

  // Coupons
  async getCoupons(writerId: string): Promise<Coupon[]> {
    const { data } = await supabaseAdmin.from('coupons').select('*').eq('writerId', writerId);
    return data as Coupon[] || [];
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const { data, error } = await supabaseAdmin.from('coupons').insert({ ...coupon, createdAt: new Date() }).select().single();
    if (error) throw error;
    return data as Coupon;
  }

  async validateCoupon(code: string, writerId?: string): Promise<Coupon | undefined> {
    let query = supabaseAdmin.from('coupons').select('*').eq('code', code);
    if (writerId) query = query.eq('writerId', writerId);

    const { data, error } = await query.single();
    if (error || !data) return undefined;
    return data as Coupon;
  }

  // Shipping
  async getShippingRates(creatorId: string): Promise<ShippingRate[]> {
    const { data } = await supabaseAdmin.from('shipping_rates').select('*').eq('creatorId', creatorId);
    return data as ShippingRate[] || [];
  }

  async createShippingRate(rate: InsertShippingRate): Promise<ShippingRate> {
    const { data, error } = await supabaseAdmin.from('shipping_rates').insert({ ...rate, createdAt: new Date() }).select().single();
    if (error) throw error;
    return data as ShippingRate;
  }

  async deleteShippingRate(id: number): Promise<void> {
    await supabaseAdmin.from('shipping_rates').delete().eq('id', id);
  }

  async getShippingAddresses(userId: string): Promise<ShippingAddress[]> {
    const { data } = await supabaseAdmin.from('shipping_addresses').select('*').eq('userId', userId);
    return data as ShippingAddress[] || [];
  }

  async createShippingAddress(address: InsertShippingAddress): Promise<ShippingAddress> {
    const { data, error } = await supabaseAdmin.from('shipping_addresses').insert({ ...address, createdAt: new Date() }).select().single();
    if (error) throw error;
    return data as ShippingAddress;
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data || !Array.isArray(data)) {
        if (error) console.error("❌ Error fetching notifications:", error);
        return [];
      }

      return data.map((n: any) => ({
        ...n,
        id: n.id,
        userId: n.user_id || n.userId || userId,
        actorId: n.actor_id || n.actorId,
        title: n.title || "",
        content: n.content || "",
        type: n.type || "system",
        priority: n.priority || "low",
        isRead: n.is_read ?? n.isRead ?? false,
        createdAt: n.created_at || n.createdAt || new Date()
      })) as Notification[];
    } catch (err) {
      console.error("❌ Exception in getNotifications:", err);
      return [];
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: notification.userId,
        actor_id: notification.actorId,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        priority: notification.priority,
        link: notification.link,
        metadata: notification.metadata,
        is_read: notification.isRead || false,
        created_at: new Date()
      })
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      userId: data.user_id,
      actorId: data.actor_id,
      isRead: data.is_read,
      createdAt: data.created_at
    } as Notification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', id);
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', userId);
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const { data, error } = await supabaseAdmin
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Create default settings if not exists
        const { data: defaults, error: createError } = await supabaseAdmin
          .from('notification_settings')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) {
          console.error("❌ Failed to create notification settings, returning defaults:", createError);
          return {
            id: 0,
            userId,
            emailNotifications: true,
            pushNotifications: true,
            categories: {
              commerce: true,
              content: true,
              social: true,
              creator: true,
              engagement: true,
              store: true
            },
            updatedAt: new Date()
          } as NotificationSettings;
        }

        return {
          ...defaults,
          userId: defaults.user_id,
          emailNotifications: defaults.email_notifications,
          pushNotifications: defaults.push_notifications,
          updatedAt: defaults.updated_at
        } as NotificationSettings;
      }
      return {
        ...data,
        userId: data.user_id,
        emailNotifications: data.email_notifications,
        pushNotifications: data.push_notifications,
        updatedAt: data.updated_at
      } as NotificationSettings;
    } catch (err) {
      console.error("❌ Exception in getNotificationSettings, returning defaults:", err);
      return {
        id: 0,
        userId,
        emailNotifications: true,
        pushNotifications: true,
        categories: {
          commerce: true,
          content: true,
          social: true,
          creator: true,
          engagement: true,
          store: true
        },
        updatedAt: new Date()
      } as NotificationSettings;
    }
  }

  async updateNotificationSettings(userId: string, updates: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const dbUpdates: any = { ...updates };
    if (updates.emailNotifications !== undefined) dbUpdates.email_notifications = updates.emailNotifications;
    if (updates.pushNotifications !== undefined) dbUpdates.push_notifications = updates.pushNotifications;
    dbUpdates.updated_at = new Date();

    // Remove camelCase keys
    delete dbUpdates.emailNotifications;
    delete dbUpdates.pushNotifications;
    delete dbUpdates.userId;

    const { data, error } = await supabaseAdmin
      .from('notification_settings')
      .update(dbUpdates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      userId: data.user_id,
      emailNotifications: data.email_notifications,
      pushNotifications: data.push_notifications,
      updatedAt: data.updated_at
    } as NotificationSettings;
  }
}

export const storage = new DatabaseStorage();
