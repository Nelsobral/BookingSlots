import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface BookingReminderEmailProps {
  clientName: string;
  businessName: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  duration: number;
  address?: string;
  confirmUrl: string;
  cancelUrl: string;
}

export const BookingReminderEmail = ({
  clientName,
  businessName,
  serviceName,
  staffName,
  date,
  time,
  duration,
  address,
  confirmUrl,
  cancelUrl,
}: BookingReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reminder: Your appointment at {businessName} is coming up</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Appointment Reminder</Heading>
          
          <Text style={text}>Hi {clientName},</Text>
          
          <Text style={text}>
            This is a friendly reminder about your upcoming appointment at <strong>{businessName}</strong>.
          </Text>

          <Section style={appointmentBox}>
            <Text style={appointmentTitle}>Appointment Details</Text>
            <Text style={detail}>
              <strong>Service:</strong> {serviceName}
            </Text>
            <Text style={detail}>
              <strong>Staff:</strong> {staffName}
            </Text>
            <Text style={detail}>
              <strong>Date:</strong> {date}
            </Text>
            <Text style={detail}>
              <strong>Time:</strong> {time}
            </Text>
            <Text style={detail}>
              <strong>Duration:</strong> {duration} minutes
            </Text>
            {address && (
              <Text style={detail}>
                <strong>Location:</strong> {address}
              </Text>
            )}
          </Section>

          <Text style={text}>
            Please confirm or cancel your appointment using the buttons below:
          </Text>

          <Section style={buttonContainer}>
            <Button style={confirmButton} href={confirmUrl}>
              Confirm Appointment
            </Button>
          </Section>

          <Section style={buttonContainer}>
            <Button style={cancelButton} href={cancelUrl}>
              Cancel Appointment
            </Button>
          </Section>

          <Text style={footer}>
            If you have any questions, please contact {businessName} directly.
          </Text>

          <Text style={footer}>
            This is an automated reminder from Booking Service.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingReminderEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 24px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const appointmentBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const appointmentTitle = {
  color: '#991b1b',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const detail = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const buttonContainer = {
  margin: '16px 0',
  textAlign: 'center' as const,
};

const confirmButton = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const cancelButton = {
  backgroundColor: '#6b7280',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
};
