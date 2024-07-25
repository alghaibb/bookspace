import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Section,
  Text,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface ForgotPasswordEmailProps {
  resetToken: string;
  username: string;
}

export const ForgotPasswordEmail = ({
  resetToken,
  username,
}: ForgotPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={heroText}>
          Hi {username},<br />
          You requested to reset your password. Click the link below to reset
          your password:
        </Text>
        <Section style={codeBox}>
          <Link
            href={`${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`}
            style={link}
          >
            Reset Password
          </Link>
        </Section>
        <Text style={text}>
          If you didn&apos;t request this, you can safely ignore this email.
        </Text>
        <Text style={footerText}>
          ©2024 BookSpace. <br />
          All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
);

const footerText = {
  fontSize: "12px",
  color: "#b7b7b7",
  lineHeight: "15px",
  textAlign: "left" as const,
  marginBottom: "50px",
};

const main = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "0px 20px",
};

const h1 = {
  color: "#1d1c1d",
  fontSize: "36px",
  fontWeight: "700",
  margin: "30px 0",
  padding: "0",
  lineHeight: "42px",
};

const heroText = {
  fontSize: "20px",
  lineHeight: "28px",
  marginBottom: "30px",
};

const codeBox = {
  marginBottom: "30px",
  padding: "40px 10px",
};

const link = {
  fontSize: "16px",
  color: "#1d1c1d",
  textDecoration: "underline",
};

const text = {
  color: "#000",
  fontSize: "14px",
  lineHeight: "24px",
};
