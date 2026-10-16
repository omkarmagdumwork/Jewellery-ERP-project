import { Link } from "react-router-dom";
import { money, optimizeImage, purityLabel } from "../utils";
import { GemIcon } from "./icons";
import HeartButton from "./HeartButton";

export default function ProductCard({ product }) {
  const [cover, second] = product.images || [];

  return (
    <div className="group relative">
    <Link to={`/product/${product._id}`} className="block">
      <div className="relative aspect-square overflow-hidden border border-silver-300 bg-silver-100">
        {cover ? (
          <>
            <img src={optimizeImage(cover, 600)} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
            {second && (
              <img src={optimizeImage(second, 600)} alt="" loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            )}
          </>
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-b from-velvet-800 to-velvet-950 text-gold-400">
            <GemIcon className="h-12 w-12" />
          </div>
        )}

        {product.hallmarked && (
          <span className="absolute left-2 top-2 border border-gold-500 bg-white/90 px-2 py-0.5 text-xs text-gold-700">
            Hallmarked
          </span>
        )}
        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-velvet-950/80 py-1.5 text-center text-sm text-silver-100">
            Currently sold out
          </span>
        )}
      </div>

      <div className="mt-3">
        <h3 className="font-display text-lg leading-snug text-ink">{product.name}</h3>
        <p className="text-sm text-silver-600">{purityLabel(product)}, {product.netWeight} g</p>
        {product.estimatedPrice ? (
          <p className="mt-1 font-medium text-velvet-800">
            {money(product.estimatedPrice)} <span className="text-xs font-normal text-silver-600">approx.</span>
          </p>
        ) : null}
      </div>
    </Link>
    <HeartButton product={product} className="absolute right-2 top-2" />
    </div>
  );
}
