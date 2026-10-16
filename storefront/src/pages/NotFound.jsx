import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl text-velvet-900">We could not find that page</h1>
      <p className="mt-3 text-silver-600">The link may be old or mistyped.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="btn-velvet">Go to home</Link>
        <Link to="/collection" className="btn-outline-dark">Browse jewellery</Link>
      </div>
    </div>
  );
}
