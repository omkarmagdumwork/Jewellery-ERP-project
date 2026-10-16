import { useSite } from "../context/SiteContext";
import { ChatIcon } from "./icons";

export default function WhatsAppButton() {
  const { settings } = useSite();
  const number = (settings.whatsapp || "").replace(/\D/g, "");
  if (!number) return null;

  const text = encodeURIComponent("Hello, I would like to know more about your jewellery.");
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg"
    >
      <ChatIcon className="h-7 w-7" />
    </a>
  );
}
