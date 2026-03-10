import { randomBytes } from 'crypto';
import { db } from '@/lib/db/drizzle';
import { pluginInstallations, pluginApiKeys, plugins } from '@/lib/db/plugins-schema';
import { eq, and } from 'drizzle-orm';
import { getPlugin, listPlugins } from './registry';
import type { PluginHookContext, PluginWithInstallation } from './types';

// ─── Helper: ensure tables exist ───────────────────────────────────────────

async function tablesExist(): Promise<boolean> {
  try {
    await db.select().from(plugins).limit(1);
    return true;
  } catch {
    return false;
  }
}

// ─── Install ───────────────────────────────────────────────────────────────

export async function installPlugin(
  slug: string,
  ctx: PluginHookContext,
  config: Record<string, unknown> = {}
): Promise<{ success: boolean; error?: string }> {
  const manifest = getPlugin(slug);
  if (!manifest) return { success: false, error: `Plugin "${slug}" not found` };

  if (manifest.status === 'coming_soon') {
    return { success: false, error: 'This plugin is not yet available' };
  }

  try {
    if (!(await tablesExist())) {
      return { success: false, error: 'Plugin tables not yet migrated' };
    }

    // Find or create the plugin row
    let pluginRows = await db
      .select()
      .from(plugins)
      .where(eq(plugins.slug, slug))
      .limit(1);

    let pluginId: number;

    if (pluginRows.length === 0) {
      const inserted = await db
        .insert(plugins)
        .values({
          slug: manifest.slug,
          name: manifest.name,
          description: manifest.description,
          author: manifest.author,
          version: manifest.version,
          iconUrl: manifest.iconUrl,
          category: manifest.category,
          status: manifest.status,
          configSchema: manifest.configSchema ?? null,
        })
        .returning({ id: plugins.id });
      pluginId = inserted[0].id;
    } else {
      pluginId = pluginRows[0].id;
    }

    // Check if already installed
    const existing = await db
      .select()
      .from(pluginInstallations)
      .where(
        and(
          eq(pluginInstallations.pluginId, pluginId),
          eq(pluginInstallations.teamId, ctx.teamId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: 'Plugin is already installed' };
    }

    await db.insert(pluginInstallations).values({
      pluginId,
      teamId: ctx.teamId,
      isEnabled: true,
      config,
      installedBy: ctx.userId,
    });

    // TODO: call manifest.hooks?.onInstall(ctx) when hook system is implemented

    return { success: true };
  } catch (err) {
    console.error('[installPlugin]', err);
    return { success: false, error: 'Database error during install' };
  }
}

// ─── Uninstall ─────────────────────────────────────────────────────────────

export async function uninstallPlugin(
  slug: string,
  ctx: PluginHookContext
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await tablesExist())) {
      return { success: false, error: 'Plugin tables not yet migrated' };
    }

    const pluginRows = await db
      .select()
      .from(plugins)
      .where(eq(plugins.slug, slug))
      .limit(1);

    if (pluginRows.length === 0) {
      return { success: false, error: 'Plugin not found' };
    }

    const pluginId = pluginRows[0].id;

    await db
      .delete(pluginInstallations)
      .where(
        and(
          eq(pluginInstallations.pluginId, pluginId),
          eq(pluginInstallations.teamId, ctx.teamId)
        )
      );

    // Also remove API keys for this plugin/team
    await db
      .delete(pluginApiKeys)
      .where(
        and(
          eq(pluginApiKeys.pluginId, pluginId),
          eq(pluginApiKeys.teamId, ctx.teamId)
        )
      );

    // TODO: call manifest.hooks?.onUninstall(ctx) when hook system is implemented

    return { success: true };
  } catch (err) {
    console.error('[uninstallPlugin]', err);
    return { success: false, error: 'Database error during uninstall' };
  }
}

// ─── Update Config ─────────────────────────────────────────────────────────

export async function updatePluginConfig(
  slug: string,
  ctx: PluginHookContext,
  config: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await tablesExist())) {
      return { success: false, error: 'Plugin tables not yet migrated' };
    }

    const pluginRows = await db
      .select()
      .from(plugins)
      .where(eq(plugins.slug, slug))
      .limit(1);

    if (pluginRows.length === 0) {
      return { success: false, error: 'Plugin not found' };
    }

    const pluginId = pluginRows[0].id;

    const result = await db
      .update(pluginInstallations)
      .set({ config, updatedAt: new Date() })
      .where(
        and(
          eq(pluginInstallations.pluginId, pluginId),
          eq(pluginInstallations.teamId, ctx.teamId)
        )
      )
      .returning({ id: pluginInstallations.id });

    if (result.length === 0) {
      return { success: false, error: 'Installation not found' };
    }

    // TODO: call manifest.hooks?.onConfigUpdate({ ...ctx, config })

    return { success: true };
  } catch (err) {
    console.error('[updatePluginConfig]', err);
    return { success: false, error: 'Database error during config update' };
  }
}

// ─── Enable / Disable ──────────────────────────────────────────────────────

async function setEnabled(
  slug: string,
  ctx: PluginHookContext,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await tablesExist())) {
      return { success: false, error: 'Plugin tables not yet migrated' };
    }

    const pluginRows = await db
      .select()
      .from(plugins)
      .where(eq(plugins.slug, slug))
      .limit(1);

    if (pluginRows.length === 0) {
      return { success: false, error: 'Plugin not found' };
    }

    const pluginId = pluginRows[0].id;

    const result = await db
      .update(pluginInstallations)
      .set({ isEnabled: enabled, updatedAt: new Date() })
      .where(
        and(
          eq(pluginInstallations.pluginId, pluginId),
          eq(pluginInstallations.teamId, ctx.teamId)
        )
      )
      .returning({ id: pluginInstallations.id });

    if (result.length === 0) {
      return { success: false, error: 'Installation not found' };
    }

    return { success: true };
  } catch (err) {
    console.error('[setEnabled]', err);
    return { success: false, error: 'Database error' };
  }
}

export const enablePlugin = (slug: string, ctx: PluginHookContext) =>
  setEnabled(slug, ctx, true);

export const disablePlugin = (slug: string, ctx: PluginHookContext) =>
  setEnabled(slug, ctx, false);

// ─── Generate API Key ──────────────────────────────────────────────────────

export async function generateApiKey(
  slug: string,
  ctx: PluginHookContext,
  scopes: string[] = [],
  expiresInDays?: number
): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  try {
    if (!(await tablesExist())) {
      return { success: false, error: 'Plugin tables not yet migrated' };
    }

    const pluginRows = await db
      .select()
      .from(plugins)
      .where(eq(plugins.slug, slug))
      .limit(1);

    if (pluginRows.length === 0) {
      return { success: false, error: 'Plugin not found' };
    }

    const pluginId = pluginRows[0].id;

    const rawKey = `plk_${randomBytes(24).toString('hex')}`;

    const expiresAt =
      expiresInDays != null
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    await db.insert(pluginApiKeys).values({
      pluginId,
      teamId: ctx.teamId,
      apiKey: rawKey,
      scopes,
      expiresAt,
    });

    return { success: true, apiKey: rawKey };
  } catch (err) {
    console.error('[generateApiKey]', err);
    return { success: false, error: 'Database error' };
  }
}

// ─── List installed plugins for a team ────────────────────────────────────

export async function getInstalledPlugins(
  teamId: number
): Promise<PluginWithInstallation[]> {
  const manifests = listPlugins();

  try {
    if (!(await tablesExist())) {
      return manifests.map((m) => ({
        ...m,
        isInstalled: false,
        isEnabled: false,
      }));
    }

    // Get all plugin rows
    const dbPlugins = await db.select().from(plugins);
    const slugToId = new Map(dbPlugins.map((p) => [p.slug, p.id]));

    // Get all installations for this team
    const installations = await db
      .select()
      .from(pluginInstallations)
      .where(eq(pluginInstallations.teamId, teamId));

    const installMap = new Map(
      installations.map((i) => [i.pluginId, i])
    );

    return manifests.map((m) => {
      const pluginId = slugToId.get(m.slug);
      const installation = pluginId ? installMap.get(pluginId) : undefined;

      return {
        ...m,
        isInstalled: !!installation,
        isEnabled: installation?.isEnabled ?? false,
        installedConfig: (installation?.config as Record<string, unknown>) ?? undefined,
        installationId: installation?.id,
      };
    });
  } catch (err) {
    console.error('[getInstalledPlugins]', err);
    return manifests.map((m) => ({
      ...m,
      isInstalled: false,
      isEnabled: false,
    }));
  }
}
