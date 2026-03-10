import { PluginMarketplace } from '@/components/plugins/PluginMarketplace';

export const metadata = {
  title: 'Integrations',
  description: 'Connect your workspace to popular tools and services.',
};

export default function IntegrationsPage() {
  return <PluginMarketplace />;
}
