// Builds a { $gte, $lte } filter from ?from=YYYY-MM-DD&to=YYYY-MM-DD
// Defaults to the current month if nothing is passed.
export const getDateRange = (from, to) => {
  const now = new Date();

  const start = from
    ? new Date(from)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const end = to ? new Date(to) : new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};