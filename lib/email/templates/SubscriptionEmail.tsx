import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components';
import * as React from 'react';

type SubscriptionEventType =
  | 'created'
  | 'updated'
  | 'cancelled'
  | 'renewed';

interface SubscriptionEmailProps {
  userEmail: string;
  planName: string;
  eventType: SubscriptionEventType;
}

const eventMessages: Record<
  SubscriptionEventType,
  { subject: string; heading: string; body: string }
> = {
  created: {
    subject: 'Your subscription is active',
    heading: 'Subscription Activated!',
    body: 'Your subscription to the {planName} plan is now active. You can manage your subscription from the dashboard.'
  },
  updated: {
    subject: 'Your subscription has been updated',
    heading: 'Subscription Updated',
    body: 'Your subscription has been updated to the {planName} plan. Changes will take effect immediately.'
  },
  cancelled: {
    subject: 'Your subscription has been cancelled',
    heading: 'Subscription Cancelled',
    body: 'Your {planName} subscription has been cancelled. You will continue to have access until the end of your current billing period.'
  },
  renewed: {
    subject: 'Your subscription has been renewed',
    heading: 'Subscription Renewed',
    body: 'Your {planName} subscription has been successfully renewed. Thank you for your continued support!'
  }
};

export function SubscriptionEmail({
  userEmail,
  planName,
  eventType
}: SubscriptionEmailProps) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const dashboardUrl = `${baseUrl}/dashboard`;
  const event = eventMessages[eventType];
  const bodyText = event.body.replace('{planName}', planName);

  return (
    <Html>
      <Head />
      <Preview>{event.subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>{event.heading}</Text>
          <Text style={paragraph}>Hi {userEmail},</Text>
          <Text style={paragraph}>{bodyText}</Text>
          <Section style={btnContainer}>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>
          <Text style={paragraph}>
            If you have any questions about your subscription, please don&apos;t
            hesitate to contact our support team.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            You can manage your subscription at any time from{' '}
            <Link href={dashboardUrl}>your dashboard</Link>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '560px'
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  padding: '17px 48px 0'
};

const paragraph = {
  margin: '0 0 15px',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4149',
  padding: '0 48px'
};

const btnContainer = {
  textAlign: 'center' as const,
  padding: '24px 48px'
};

const button = {
  backgroundColor: '#ea580c',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '11px 23px'
};

const hr = {
  borderColor: '#dfe1e4',
  margin: '42px 0 26px'
};

const footer = {
  fontSize: '13px',
  lineHeight: '1.4',
  color: '#9ca3af',
  padding: '0 48px'
};
