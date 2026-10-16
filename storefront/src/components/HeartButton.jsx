import { useWishlist } from "../context/WishlistContext";
import { HeartIcon } from "./icons";

// Icon only save button for product cards
export default function HeartButton({ product, className = "" }) {
  const { has, toggle } = useWishlist();
  const saved = has(product._id);

  return (
    <button
      type="button"
      onClick={() => toggle(product)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from saved pieces` : `Save ${product.name}`}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 text-velvet-800 ${className}`}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
