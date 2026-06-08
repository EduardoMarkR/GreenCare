"use client";

import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = {
  message: string;
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
};

function ButtonContent({
  children,
  loadingText,
}: {
  children: React.ReactNode;
  loadingText?: string;
}) {
  const { pending } = useFormStatus();

  return <>{pending ? loadingText || "Processando..." : children}</>;
}

export default function ConfirmSubmitButton({
  message,
  children,
  className,
  loadingText,
}: ConfirmSubmitButtonProps) {
  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  };

  return (
    <button
      type="submit"
      className={className}
      onClick={handleClick}
    >
      <ButtonContent
        loadingText={loadingText}
      >
        {children}
      </ButtonContent>
    </button>
  );
}