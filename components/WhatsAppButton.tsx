import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

const DEFAULT_PHONE_NUMBER = "919113340369";
const DEFAULT_MESSAGE = "Hello SoniLearn Team, mujhe test series ke bare me jankari chahiye.";

export default function WhatsAppButton({
  phoneNumber = DEFAULT_PHONE_NUMBER,
  message = DEFAULT_MESSAGE,
}: WhatsAppButtonProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact SoniLearn support on WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md shadow-emerald-900/20 transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 active:scale-95"
    >
      <MessageCircle size={23} aria-hidden="true" />
    </a>
  );
}
