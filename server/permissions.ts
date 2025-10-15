import { Request, Response, NextFunction } from "express";

// Permission types that match the product selections
export type Permission = 'loyalty' | 'spin' | 'menu' | 'shift' | 'analytics';

/**
 * Middleware to check if user has permission to access a feature
 * Owners have access to everything
 * Subusers only have access to features in their permissions array
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // If not a subuser (i.e., owner), allow access to everything
    if (!req.session.isSubuser) {
      return next();
    }

    // Check if subuser has the required permission
    const permissions = req.session.permissions || [];
    if (permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({ 
      error: "You don't have permission to access this feature",
      requiredPermission: permission 
    });
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
