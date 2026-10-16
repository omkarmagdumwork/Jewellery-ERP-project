import ProductCard from "./ProductCard";

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-square animate-pulse bg-silver-200" />
          <div className="mt-3 h-4 w-3/4 animate-pulse bg-silver-200" />
          <div className="mt-2 h-3 w-1/2 animate-pulse bg-silver-200" />
        </div>
      ))}
    </div>
  );
}

export default function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}
