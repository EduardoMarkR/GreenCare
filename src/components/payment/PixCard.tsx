"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  qrCode?: string | null;
  copyPaste?: string | null;
};

export default function PixCard({ qrCode, copyPaste }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyPix() {
    if (!copyPaste) return;

    await navigator.clipboard.writeText(copyPaste);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2500);
  }

  return (
    <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-7 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#878787]">
        PIX
      </p>

      {qrCode ? (
        <Image
          src={`data:image/png;base64,${qrCode}`}
          alt="QR Code PIX"
          width={256}
          height={256}
          unoptimized
          className="mx-auto mt-6 h-64 w-64 rounded-3xl bg-white p-4 shadow-sm"
        />
      ) : (
        <div className="mt-6 rounded-3xl bg-[#F7F4E7] p-10 text-center text-sm text-[#878787]">
          QR Code indisponível.
        </div>
      )}

      {copyPaste ? (
        <>
          <textarea
            readOnly
            value={copyPaste}
            className="mt-6 h-32 w-full resize-none rounded-3xl border border-[#C6C6C6]/60 bg-[#F7F4E7] p-4 text-sm text-[#08553F] outline-none"
          />

          <button
            type="button"
            onClick={copyPix}
            className="mt-5 w-full rounded-2xl bg-[#08553F] py-4 font-bold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F]"
          >
            {copied ? "PIX copiado!" : "Copiar código PIX"}
          </button>
        </>
      ) : null}
    </div>
  );
}