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
      className="fixed bottom-20 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <MessageCircle size={20} aria-hidden="true" />
      <span>WhatsApp Support</span>
    </a>
  );
}
