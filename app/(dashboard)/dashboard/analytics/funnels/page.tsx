import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getTeamFunnels, getFunnelConversion } from '@/lib/analytics/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelChart } from './FunnelChart';

export default async function FunnelsPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const team = await getTeamForUser();
  if (!team) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
          Funnel Analysis
        </h1>
        <p className="text-gray-500">No team found.</p>
      </section>
    );
  }

  const teamFunnels = await getTeamFunnels(team.id);

  const funnelsWithConversion = await Promise.all(
    teamFunnels.map(async (funnel) => {
      const conversion = await getFunnelConversion(funnel.id);
      return { ...funnel, conversion };
    })
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Funnel Analysis
      </h1>

      {funnelsWithConversion.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No Funnels Configured</h2>
            <p className="text-gray-500 max-w-md">
              Create conversion funnels to track how users progress through key steps in your
              product. Use the{' '}
              <code className="bg-gray-100 px-1 rounded text-sm">
                POST /api/analytics/funnels
              </code>{' '}
              endpoint to define your funnels.
            </p>
            <div className="mt-6 text-left bg-gray-50 rounded-lg p-4 text-sm font-mono max-w-lg w-full">
              <div className="text-gray-500 mb-1">// Example funnel definition</div>
              <pre className="text-gray-700 overflow-x-auto">{`{
  "name": "Signup Funnel",
  "steps": [
    { "name": "Visit", "eventName": "page_view" },
    { "name": "Sign Up", "eventName": "sign_up" },
    { "name": "Onboard", "eventName": "onboarding_complete" }
  ]
}`}</pre>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {funnelsWithConversion.map((funnel) => (
            <Card key={funnel.id}>
              <CardHeader>
                <CardTitle>{funnel.name}</CardTitle>
                <p className="text-sm text-gray-500">
                  Created {new Date(funnel.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                <FunnelChart
                  steps={funnel.conversion.steps}
                  funnelName={funnel.name}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
