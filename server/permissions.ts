import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { stores } from "@shared/schema";
import { eq } from "drizzle-orm";

// Permission types that match the product selections
export type Permission = 'loyalty' | 'spin' | 'menu' | 'shift' | 'analytics' | 'customers' | 'dashboard';

// Permissions that correspond to per-store PRODUCTS. Access to these requires
// the ACTIVE store (req.storeId) to have the product enabled — this is enforced
// for owners AND subusers so direct URL/API access can't bypass per-store
// product entitlements. Non-product permissions ('customers', 'analytics',
// 'dashboard') are not store-product gated.
const PRODUCT_PERMISSIONS: Permission[] = ['loyalty', 'spin', 'menu', 'shift'];

/**
 * Middleware to check if user has permission to access a feature.
 * - Subusers are limited to the features in their permissions array.
 * - Product features additionally require the active store to have the product
 *   enabled (applies to owners and subusers alike).
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Subuser permission gate: subusers can only access features in their
    // permissions array. Owners bypass this check.
    if (req.session.isSubuser) {
      const permissions = req.session.permissions || [];
      if (!permissions.includes(permission)) {
        return res.status(403).json({
          error: "You don't have permission to access this feature",
          requiredPermission: permission,
        });
      }
    }

    // Per-store product gate: the active store must have the product enabled.
    if (PRODUCT_PERMISSIONS.includes(permission)) {
      const storeId = req.storeId;
      if (!storeId) {
        return res.status(403).json({
          error: "This product is not enabled for the selected store",
          requiredProduct: permission,
        });
      }
      try {
        const [store] = await db
          .select({ selectedProducts: stores.selectedProducts })
          .from(stores)
          .where(eq(stores.id, storeId))
          .limit(1);
        const products = store?.selectedProducts ?? [];
        if (!products.includes(permission)) {
          return res.status(403).json({
            error: "This product is not enabled for the selected store",
            requiredProduct: permission,
          });
        }
      } catch (err) {
        console.error('[requirePermission] product gate DB error:', err);
        return res.status(500).json({ error: "Failed to verify product access" });
      }
    }

    return next();
  };
}

/**
 * Middleware to block access for subusers (owner-only routes)
 */
export function ownerOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.session.isSubuser) {
    return res.status(403).json({ 
      error: "This feature is only available to account owners" 
    });
  }

  next();
}

/**
 * Get user info including subuser status and permissions
 */
export function getUserInfo(req: Request) {
  if (!req.isAuthenticated() || !req.user) {
    return null;
  }

  return {
    user: req.user,
    isSubuser: req.session.isSubuser || false,
    subuserId: req.session.subuserId,
    permissions: req.session.permissions || [],
  };
}
