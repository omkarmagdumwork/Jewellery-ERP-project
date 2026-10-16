import { useSite } from "../context/SiteContext";
import usePageTitle from "../hooks/usePageTitle";
import EnquiryForm from "../components/EnquiryForm";

export default function Contact() {
  usePageTitle("Contact");
  const { settings } = useSite();

  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-10 md:grid-cols-2 md:py-14">
      <div>
        <h1 className="font-display text-4xl text-velvet-900 md:text-5xl">Contact us</h1>
        <p className="mt-3 max-w-md text-silver-600">
          Visit the store, call us, or send an enquiry and we will get back to you.
        </p>

        <dl className="mt-8 space-y-5">
          {settings.address && (
            <div>
              <dt className="font-display text-lg">Address</dt>
              <dd className="whitespace-pre-line text-silver-600">{settings.address}</dd>
            </div>
          )}
          {settings.workingHours && (
            <div>
              <dt className="font-display text-lg">Working hours</dt>
              <dd className="text-silver-600">{settings.workingHours}</dd>
            </div>
          )}
          {settings.phone && (
            <div>
              <dt className="font-display text-lg">Phone</dt>
              <dd><a href={`tel:${settings.phone}`} className="text-velvet-800 underline">{settings.phone}</a></dd>
            </div>
          )}
          {settings.email && (
            <div>
              <dt className="font-display text-lg">Email</dt>
              <dd><a href={`mailto:${settings.email}`} className="text-velvet-800 underline">{settings.email}</a></dd>
            </div>
          )}
        </dl>

        {settings.mapUrl && (
          <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-velvet mt-8">Open in Maps</a>
        )}
      </div>

      <div>
        <h2 className="font-display text-2xl text-velvet-900">Send an enquiry</h2>
        <div className="mt-4"><EnquiryForm /></div>
      </div>
    </div>
  );
}
