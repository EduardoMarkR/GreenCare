"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
};

export default function SubmitButton({
  children,
  loadingText = "Processando...",
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? loadingText : children}
    </button>
  );
}