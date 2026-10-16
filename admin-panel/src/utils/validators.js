export const isValidPhone = (v) => /^\d{10}$/.test(v);
export const isValidEmail = (v) => !v || /^\S+@\S+\.\S+$/.test(v); // email is optional
export const isValidGstin = (v) => !v || /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(v);
export const isPositive = (v) => Number(v) > 0;