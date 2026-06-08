"use client";

type ConfirmSubmitButtonProps = {
  message: string;
  children: React.ReactNode;
  className?: string;
};

export default function ConfirmSubmitButton({
  message,
  children,
  className,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}