import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertSpotlightItemSchema } from '@shared/schema';

// Public endpoints
export const getPublicSpotlight = async (req: Request, res: Response) => {
  try {
    const items = await storage.getSpotlightItems(true); // activeOnly = true
    res.json(items);
  } catch (err) {
    console.error("[Spotlight Controller] getPublicSpotlight error:", err);
    res.status(500).json({ error: "Failed to fetch spotlight items" });
  }
};

export const getProductSpotlightStatus = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    
    const item = await storage.getSpotlightItemByProductId(productId);
    if (!item) {
      return res.status(404).json({ error: "Product not found in Spotlight" });
    }
    
    res.json(item);
  } catch (err) {
    console.error("[Spotlight Controller] getProductSpotlightStatus error:", err);
    res.status(500).json({ error: "Failed to fetch spotlight status" });
  }
};

// Admin endpoints
export const getAdminSpotlight = async (req: Request, res: Response) => {
  try {
    const items = await storage.getSpotlightItems(false); // all items
    res.json(items);
  } catch (err) {
    console.error("[Spotlight Controller] getAdminSpotlight error:", err);
    res.status(500).json({ error: "Failed to fetch all spotlight items" });
  }
};

export const addSpotlightItem = async (req: Request, res: Response) => {
  try {
    const data = insertSpotlightItemSchema.parse({
      ...req.body,
      createdBy: (req.user as any)?.id || req.headers['x-user-id']
    });
    
    const newItem = await storage.addSpotlightItem(data);
    res.status(201).json(newItem);
  } catch (err: any) {
    console.error("[Spotlight Controller] addSpotlightItem error:", err);
    if (err.errors) console.error("Zod Validation Errors:", err.errors);
    res.status(400).json({ error: "Failed to add spotlight item", details: err.errors });
  }
};

export const updateSpotlightItem = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid spotlight ID" });
    }
    
    const updates = insertSpotlightItemSchema.partial().parse(req.body);
    const updatedItem = await storage.updateSpotlightItem(id, updates);
    res.json(updatedItem);
  } catch (err) {
    console.error("[Spotlight Controller] updateSpotlightItem error:", err);
    res.status(400).json({ error: "Failed to update spotlight item" });
  }
};

export const removeSpotlightItem = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid spotlight ID" });
    }
    
    await storage.removeSpotlightItem(id);
    res.status(204).end();
  } catch (err) {
    console.error("[Spotlight Controller] removeSpotlightItem error:", err);
    res.status(400).json({ error: "Failed to remove spotlight item" });
  }
};
