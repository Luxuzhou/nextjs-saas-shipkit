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

interface InvitationEmailProps {
  invitedEmail: string;
  teamName: string;
  role: string;
  inviteId: number;
}

export function InvitationEmail({
  invitedEmail,
  teamName,
  role,
  inviteId
}: InvitationEmailProps) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const signUpUrl = `${baseUrl}/sign-up?inviteId=${inviteId}`;

  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to join {teamName} on SaaS Starter</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={heading}>You&apos;re invited!</Text>
          <Text style={paragraph}>Hi {invitedEmail},</Text>
          <Text style={paragraph}>
            You&apos;ve been invited to join <strong>{teamName}</strong> as a{' '}
            <strong>{role}</strong>. Click the button below to accept the
            invitation and create your account.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={signUpUrl}>
              Accept Invitation
            </Button>
          </Section>
          <Text style={paragraph}>
            This invitation will expire in 7 days. If you did not expect this
            invitation, you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If the button above doesn&apos;t work, copy and paste this URL into
            your browser:{' '}
            <Link href={signUpUrl} style={link}>
              {signUpUrl}
            </Link>
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

const link = {
  color: '#ea580c',
  wordBreak: 'break-all' as const
};
