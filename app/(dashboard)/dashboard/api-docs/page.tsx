'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">API Documentation</h1>
      <p className="text-sm text-gray-500 mb-4">
        Explore and test the public API. Authenticate by entering your API key in the
        Authorize dialog (X-API-Key header).
      </p>
      <div className="bg-white rounded-lg border overflow-hidden">
        <SwaggerUI url="/api/v1/docs" />
      </div>
    </section>
  );
}
