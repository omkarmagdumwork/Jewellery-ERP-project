const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const GemIcon = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M6 4h12l4 5-10 11L2 9z" />
    <path d="M2 9h20M9 4l-2 5 5 11M15 4l2 5-5 11" />
  </svg>
);

export const MenuIcon = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);

export const CloseIcon = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>
);

export const ChatIcon = ({ className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.4A8.4 8.4 0 1 1 21 11.5z" />
  </svg>
);

export const ChevronIcon = ({ className = "h-5 w-5", direction = "right" }) => (
  <svg viewBox="0 0 24 24" className={className} {...base}
    style={{ transform: direction === "left" ? "rotate(180deg)" : undefined }}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const HeartIcon = ({ className = "h-5 w-5", filled = false }) => (
  <svg viewBox="0 0 24 24" className={className} {...base} fill={filled ? "currentColor" : "none"}>
    <path d="M12 21s-7.5-4.6-9.6-9.4A5.4 5.4 0 0 1 12 6.2a5.4 5.4 0 0 1 9.6 5.4C19.5 16.4 12 21 12 21z" />
  </svg>
);
