import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./ui/button";
import { Loader2 } from "lucide-react";

interface LoadingProps extends ButtonProps {
  isLoading: boolean;
}

export default function Loading({
  isLoading,
  disabled,
  className,
  ...props
}: LoadingProps) {
  return (
    <Button
      disabled={isLoading || disabled}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {isLoading && <Loader2 className="size-5 animate-spin" />}
      {props.children}
    </Button>
  );
}
