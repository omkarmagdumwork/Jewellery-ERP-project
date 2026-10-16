import { Link } from "react-router-dom";
import { isInternal } from "../utils";

// Internal links use the router, external links open normally
export default function CtaLink({ to, className, children }) {
  if (!to) return null;
  if (isInternal(to)) return <Link to={to} className={className}>{children}</Link>;
  return <a href={to} className={className} target="_blank" rel="noopener noreferrer">{children}</a>;
}
