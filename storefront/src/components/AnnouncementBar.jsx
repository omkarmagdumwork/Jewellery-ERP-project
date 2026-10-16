import { useSite } from "../context/SiteContext";

export default function AnnouncementBar() {
  const { settings } = useSite();
  if (!settings.announcement) return null;
  return (
    <div className="bg-velvet-950 px-4 py-2 text-center text-sm text-gold-300">
      {settings.announcement}
    </div>
  );
}
