// components/Message.tsx
import React from "react";
import { FC } from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimesCircle,
} from "react-icons/fa";

type MessageType = "success" | "error" | "info" | "warning";

interface MessageProps {
  type: MessageType;
  message: string;
}

const messageStyles: Record<
  MessageType,
  { bg: string; border: string; text: string; icon: JSX.Element }
> = {
  success: {
    bg: "bg-green-100",
    border: "border-green-400",
    text: "text-green-700",
    icon: <FaCheckCircle className="text-green-700" />,
  },
  error: {
    bg: "bg-red-100",
    border: "border-red-400",
    text: "text-red-700",
    icon: <FaTimesCircle className="text-red-700" />,
  },
  info: {
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-700",
    icon: <FaInfoCircle className="text-blue-700" />,
  },
  warning: {
    bg: "bg-yellow-100",
    border: "border-yellow-400",
    text: "text-yellow-700",
    icon: <FaExclamationCircle className="text-yellow-700" />,
  },
};

const CustomMessage: FC<MessageProps> = ({ type, message }) => {
  const styles = messageStyles[type];

  return (
    <div
      className={`flex items-center p-4 mb-4 border-l-4 rounded ${styles.bg} ${styles.border}`}
    >
      <div className="mr-3">{styles.icon}</div>
      <div className={`text-sm ${styles.text}`}>{message}</div>
    </div>
  );
};

export default CustomMessage;
