import { useSite } from "../context/SiteContext";
import { ratePerGram } from "../utils";

const purityRank = (p) => parseInt(p, 10) || 0;

// The rate board: the one thing every jeweller's customer looks at first
export default function RateBoard() {
  const { rates, settings } = useSite();
  if (!settings.showRates || rates.length === 0) return null;

  const sorted = [...rates].sort((a, b) => {
    if (a.metal !== b.metal) return a.metal === "Gold" ? -1 : 1;
    return purityRank(b.purity) - purityRank(a.purity);
  });

  const latest = Math.max(...rates.map((r) => new Date(r.date).getTime()).filter(Boolean));
  const updated = Number.isFinite(latest)
    ? new Date(latest).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <section aria-label="Today's rates" className="rate-board border-y border-gold-700/50 bg-velvet-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="font-display text-xl text-silver-100 md:text-2xl">Today's rates per gram</h2>
          {updated && <p className="text-sm text-silver-300">Updated on {updated}</p>}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-px bg-gold-700/30 sm:grid-cols-3 lg:grid-cols-5">
          {sorted.map((r) => {
            const isGold = r.metal === "Gold";
            return (
              <div key={`${r.metal}-${r.purity}`} className="bg-velvet-900 px-4 py-4">
                <dt className={`text-sm ${isGold ? "text-gold-300" : "text-silver-300"}`}>
                  {r.purity} {r.metal.toLowerCase()}
                </dt>
                <dd className={`mt-1 font-display text-2xl tabular-nums md:text-3xl ${isGold ? "gold-text" : "silver-text"}`}>
                  {ratePerGram(r.ratePerGram)}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
