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

interface WelcomeEmailProps {
  userEmail: string;
  userName?: string;
}

export function WelcomeEmail({ userEmail, userName }: WelcomeEmailProps) {
  const displayName = userName || userEmail;
  const dashboardUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/dashboard`;

  return (
    <Html>
      <Head />
      <Preview>Welcome to SaaS Starter - Get started with your account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>Welcome to SaaS Starter!</Text>
          <Text style={paragraph}>Hi {displayName},</Text>
          <Text style={paragraph}>
            Thanks for signing up! Your account has been created successfully.
            You can now access your dashboard and start exploring all the
            features.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>
          <Text style={paragraph}>
            If you have any questions, feel free to reply to this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            You received this email because you signed up at{' '}
            <Link href={process.env.BASE_URL || 'http://localhost:3000'}>
              SaaS Starter
            </Link>
            .
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
