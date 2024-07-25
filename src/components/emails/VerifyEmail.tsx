import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Section,
  Text,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface ConfirmEmailProps {
  verificationOTP: string;
  username: string;
}

export const VerifyEmail = ({
  verificationOTP,
  username,
}: ConfirmEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm your email address</Heading>
        <Text style={heroText}>
          Hi {username},<br />
          Your BookSpace verification code is:
        </Text>
        <Section style={codeBox}>
          <Text style={confirmationCodeText}>{verificationOTP}</Text>
        </Section>
        <Text style={text}>
          If you didn&apos;t request this code, you can safely ignore this
          email.
        </Text>
        <Text style={footerText}>
          ©2024 BookSpace. <br />
          <br />
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
  background: "rgb(245, 244, 245)",
  borderRadius: "4px",
  marginBottom: "30px",
  padding: "40px 10px",
};

const confirmationCodeText = {
  fontSize: "30px",
  textAlign: "center" as const,
  verticalAlign: "middle",
};

const text = {
  color: "#000",
  fontSize: "14px",
  lineHeight: "24px",
};
