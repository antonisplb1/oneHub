/**
 * Startup migration: ensures every user has at least one store and all
 * feature-table rows have a non-null storeId. Safe to run repeatedly.
 * Also copies legacy branding fields (logo/banner/color/pin) from users
 * into their default store if the store field is still null.
 */
import { db } from "./db";
import { users, stores } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function runStoreMigration() {
  try {
    console.log("[StoreMigration] Starting...");

    // Step 1: Create a default store for every user that has none
    const allUsers = await db.select({
      id: users.id,
      shopName: users.shopName,
      logo: users.logo,
      menuBannerImage: users.menuBannerImage,
      cardBackgroundColor: users.cardBackgroundColor,
      shiftAccessPin: (users as any).shiftAccessPin,
    }).from(users);
    const allStores = await db.select({ userId: stores.userId }).from(stores);
    const usersWithStores = new Set(allStores.map(s => s.userId));

    let created = 0;
    for (const user of allUsers) {
      if (!usersWithStores.has(user.id)) {
        let slug = (user.shopName || `store-${user.id.slice(0, 8)}`)
          .toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!slug) slug = `store-${user.id.slice(0, 8)}`;

        const existing = await db.select({ id: stores.id }).from(stores)
          .where(eq(stores.shopName, slug)).limit(1);
        if (existing.length > 0) slug = `${slug}-${user.id.slice(0, 6)}`;

        await db.insert(stores).values({
          id: nanoid(21),
          userId: user.id,
          shopName: slug,
          displayName: user.shopName || 'My Store',
          logo: user.logo || null,
          menuBannerImage: user.menuBannerImage || null,
          cardBackgroundColor: user.cardBackgroundColor || null,
        });
        created++;
      }
    }
    if (created > 0) console.log(`[StoreMigration] Created ${created} missing stores`);

    // Step 2: Copy legacy branding from users into their default store (if store fields are null)
    const brandingUpdated = await db.execute(sql`
      UPDATE stores s
      SET
        logo = COALESCE(s.logo, u.logo),
        menu_banner_image = COALESCE(s.menu_banner_image, u.menu_banner_image),
        card_background_color = COALESCE(s.card_background_color, u.card_background_color)
      FROM users u
      WHERE s.user_id = u.id
        AND (
          (s.logo IS NULL AND u.logo IS NOT NULL) OR
          (s.menu_banner_image IS NULL AND u.menu_banner_image IS NOT NULL) OR
          (s.card_background_color IS NULL AND u.card_background_color IS NOT NULL)
        )
    `);
    const brandingCount = (brandingUpdated as any).rowCount || 0;
    if (brandingCount > 0) console.log(`[StoreMigration] Copied branding into ${brandingCount} stores`);

    // Step 2b: Backfill per-store products from the account's products (only when
    // the store has no products yet) so existing stores keep their features after
    // the per-store-products migration. This preserves today's behavior.
    const productsUpdated = await db.execute(sql`
      UPDATE stores s
      SET selected_products = u.selected_products
      FROM users u
      WHERE s.user_id = u.id
        AND (s.selected_products IS NULL OR cardinality(s.selected_products) = 0)
        AND u.selected_products IS NOT NULL
        AND cardinality(u.selected_products) > 0
    `);
    const productsCount = (productsUpdated as any).rowCount || 0;
    if (productsCount > 0) console.log(`[StoreMigration] Backfilled products into ${productsCount} stores`);

    // Step 2c: Backfill per-store shift PIN from the account's legacy PIN (only
    // when the store has no PIN yet). Shift PINs are per-store now; the public
    // shift auth no longer falls back to the account-level PIN, so existing
    // stores must inherit the legacy PIN to keep working.
    const pinUpdated = await db.execute(sql`
      UPDATE stores s
      SET shift_access_pin = u.shift_access_pin
      FROM users u
      WHERE s.user_id = u.id
        AND s.shift_access_pin IS NULL
        AND u.shift_access_pin IS NOT NULL
    `);
    const pinCount = (pinUpdated as any).rowCount || 0;
    if (pinCount > 0) console.log(`[StoreMigration] Backfilled shift PIN into ${pinCount} stores`);

    // Step 3: Backfill storeId on all feature tables
    const tableNames = [
      'customers',
      'loyalty_cards',
      'rewards',
      'spin_tokens',
      'spins',
      'menu_categories',
      'menu_items',
      'crew_members',
      'shifts',
      'timeframe_presets',
      'messages',
    ];

    for (const name of tableNames) {
      try {
        const res = await db.execute(sql`
          UPDATE ${sql.identifier(name)}
          SET store_id = (
            SELECT id FROM stores WHERE stores.user_id = ${sql.identifier(name)}.user_id
            ORDER BY stores.created_at ASC LIMIT 1
          )
          WHERE store_id IS NULL
            AND user_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM stores WHERE stores.user_id = ${sql.identifier(name)}.user_id
            )
        `);
        const count = (res as any).rowCount || 0;
        if (count > 0) console.log(`[StoreMigration] Backfilled ${count} rows in ${name}`);
      } catch (err) {
        console.warn(`[StoreMigration] Skipped ${name}:`, (err as Error).message);
      }
    }

    // loyalty_transactions has no direct user_id — backfill via loyalty_cards parent
    try {
      const res = await db.execute(sql`
        UPDATE loyalty_transactions lt
        SET store_id = lc.store_id
        FROM loyalty_cards lc
        WHERE lt.loyalty_card_id = lc.id
          AND lt.store_id IS NULL
          AND lc.store_id IS NOT NULL
      `);
      const count = (res as any).rowCount || 0;
      if (count > 0) console.log(`[StoreMigration] Backfilled ${count} rows in loyalty_transactions`);
    } catch (err) {
      console.warn(`[StoreMigration] Skipped loyalty_transactions:`, (err as Error).message);
    }

    // apple_wallet_devices — backfill via customers parent
    try {
      const res = await db.execute(sql`
        UPDATE apple_wallet_devices awd
        SET store_id = c.store_id
        FROM customers c
        WHERE awd.customer_id = c.id
          AND awd.store_id IS NULL
          AND c.store_id IS NOT NULL
      `);
      const count = (res as any).rowCount || 0;
      if (count > 0) console.log(`[StoreMigration] Backfilled ${count} rows in apple_wallet_devices`);
    } catch (err) {
      console.warn(`[StoreMigration] Skipped apple_wallet_devices:`, (err as Error).message);
    }

    console.log("[StoreMigration] Complete");
  } catch (err) {
    console.error("[StoreMigration] Error:", err);
    // Non-fatal — don't crash startup
  }
}
