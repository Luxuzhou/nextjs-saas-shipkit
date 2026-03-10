import type { PluginManifest } from './types';

const pluginRegistry = new Map<string, PluginManifest>();

export function registerPlugin(manifest: PluginManifest): void {
  pluginRegistry.set(manifest.slug, manifest);
}

export function getPlugin(slug: string): PluginManifest | undefined {
  return pluginRegistry.get(slug);
}

export function listPlugins(): PluginManifest[] {
  return Array.from(pluginRegistry.values());
}

// ─── Built-in Plugins ──────────────────────────────────────────────────────

export const BUILT_IN_PLUGINS: PluginManifest[] = [
  {
    slug: 'slack',
    name: 'Slack',
    description:
      'Send notifications and alerts to your Slack workspace. Get real-time updates on team activity, billing events, and more.',
    author: 'Slack Technologies',
    version: '1.2.0',
    iconUrl: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg',
    category: 'communication',
    status: 'active',
    requiredScopes: ['read:team', 'read:activity', 'webhooks'],
    docsUrl: 'https://api.slack.com/messaging/webhooks',
    configSchema: {
      type: 'object',
      properties: {
        webhookUrl: {
          type: 'string',
          title: 'Incoming Webhook URL',
          description:
            'The Slack Incoming Webhook URL for your channel. Create one at api.slack.com/apps.',
          format: 'url',
        },
        channel: {
          type: 'string',
          title: 'Channel',
          description: 'Override the default channel (e.g. #alerts). Leave blank to use the webhook default.',
        },
        notifyOnSignup: {
          type: 'boolean',
          title: 'Notify on new signups',
          description: 'Send a message when a new user signs up.',
          default: true,
        },
        notifyOnBilling: {
          type: 'boolean',
          title: 'Notify on billing events',
          description: 'Send a message when a subscription changes.',
          default: true,
        },
      },
      required: ['webhookUrl'],
    },
  },
  {
    slug: 'github',
    name: 'GitHub',
    description:
      'Connect your GitHub repositories to track deployments, link commits to activity logs, and automate workflows.',
    author: 'GitHub, Inc.',
    version: '1.0.0',
    iconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
    category: 'developer',
    status: 'active',
    requiredScopes: ['read:team', 'read:activity'],
    docsUrl: 'https://docs.github.com/en/rest',
    configSchema: {
      type: 'object',
      properties: {
        personalAccessToken: {
          type: 'string',
          title: 'Personal Access Token',
          description: 'A GitHub PAT with repo read access.',
          format: 'password',
        },
        owner: {
          type: 'string',
          title: 'Repository Owner',
          description: 'GitHub username or organisation name.',
        },
        repo: {
          type: 'string',
          title: 'Repository Name',
          description: 'Name of the repository to connect.',
        },
      },
      required: ['personalAccessToken', 'owner', 'repo'],
    },
  },
  {
    slug: 'zapier',
    name: 'Zapier',
    description:
      'Automate workflows by connecting your app to 5,000+ other applications via Zapier triggers and actions.',
    author: 'Zapier Inc.',
    version: '2.0.0',
    iconUrl:
      'https://cdn.worldvectorlogo.com/logos/zapier-1.svg',
    category: 'automation',
    status: 'active',
    requiredScopes: ['read:team', 'read:activity', 'webhooks'],
    docsUrl: 'https://zapier.com/help/doc/how-get-started-zaps',
    configSchema: {
      type: 'object',
      properties: {
        zapierWebhookUrl: {
          type: 'string',
          title: 'Zapier Webhook (Catch Hook) URL',
          description:
            'The webhook URL from your Zapier trigger step. Events will be POSTed here.',
          format: 'url',
        },
        events: {
          type: 'array',
          title: 'Events to send',
          description: 'Which events to forward to Zapier.',
          items: { type: 'string' },
          default: ['SIGN_UP', 'INVITE_TEAM_MEMBER'],
        },
      },
      required: ['zapierWebhookUrl'],
    },
  },
  {
    slug: 'google-analytics',
    name: 'Google Analytics',
    description:
      'Track page views, user engagement, and conversion events in Google Analytics 4.',
    author: 'Google LLC',
    version: '1.1.0',
    iconUrl: 'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png',
    category: 'analytics',
    status: 'active',
    requiredScopes: ['read:team'],
    configSchema: {
      type: 'object',
      properties: {
        measurementId: {
          type: 'string',
          title: 'Measurement ID',
          description: 'Your GA4 Measurement ID (e.g. G-XXXXXXXXXX).',
        },
      },
      required: ['measurementId'],
    },
  },
  {
    slug: 'hubspot',
    name: 'HubSpot CRM',
    description:
      'Sync contacts and companies with HubSpot CRM. Automatically create or update contacts when users sign up.',
    author: 'HubSpot, Inc.',
    version: '1.0.0',
    iconUrl: 'https://cdn.worldvectorlogo.com/logos/hubspot.svg',
    category: 'crm',
    status: 'active',
    requiredScopes: ['read:users', 'write:users'],
    configSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          title: 'HubSpot Private App Token',
          description: 'Create a Private App in HubSpot to obtain a token.',
          format: 'password',
        },
        syncOnSignup: {
          type: 'boolean',
          title: 'Sync contact on signup',
          description: 'Automatically create a HubSpot contact when a new user registers.',
          default: true,
        },
      },
      required: ['apiKey'],
    },
  },
  {
    slug: 'aws-s3',
    name: 'AWS S3',
    description:
      'Store and serve files using Amazon S3 buckets. Integrate with your team storage workflows.',
    author: 'Amazon Web Services',
    version: '1.0.0',
    iconUrl: 'https://cdn.worldvectorlogo.com/logos/amazon-s3.svg',
    category: 'storage',
    status: 'coming_soon',
    requiredScopes: ['read:team'],
    configSchema: {
      type: 'object',
      properties: {
        accessKeyId: {
          type: 'string',
          title: 'AWS Access Key ID',
          format: 'password',
        },
        secretAccessKey: {
          type: 'string',
          title: 'AWS Secret Access Key',
          format: 'password',
        },
        region: {
          type: 'string',
          title: 'Region',
          description: 'e.g. us-east-1',
        },
        bucket: {
          type: 'string',
          title: 'Bucket Name',
        },
      },
      required: ['accessKeyId', 'secretAccessKey', 'region', 'bucket'],
    },
  },
];

// Register all built-in plugins on module load
BUILT_IN_PLUGINS.forEach(registerPlugin);
