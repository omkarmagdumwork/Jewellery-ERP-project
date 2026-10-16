import { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Spinner from "./Spinner";

const MAX_IMAGES = 8;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Use inside the product edit form: <ProductImages productId={id} />
export default function ProductImages({ productId }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/products/${productId}`);
      const product = data.product || data.data || data;
      setImages(product.images || []);
    } catch {
      toast.error("Failed to load product images");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow choosing the same file again later
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      return toast.error(`A product can have at most ${MAX_IMAGES} images`);
    }
    const bad = files.find((f) => !ALLOWED.includes(f.type) || f.size > MAX_SIZE);
    if (bad) return toast.error("Use JPG, PNG or WebP images under 5 MB");

    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));

    setUploading(true);
    try {
      await api.post(`/cms/products/${productId}/images`, fd);
      toast.success(files.length > 1 ? "Images uploaded" : "Image uploaded");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await api.delete(`/cms/products/${productId}/images/${imageId}`);
      toast.success("Image deleted");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete image");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-3xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Website photos</h2>
          <p className="text-xs text-gray-500">The first photo is the cover on the website. Up to {MAX_IMAGES} photos.</p>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= MAX_IMAGES}
          className="border px-4 py-2 rounded disabled:opacity-50 inline-flex items-center gap-2">
          {uploading && <Spinner className="h-4 w-4 border-2" />}
          {uploading ? "Uploading..." : "Add photos"}
        </button>
        <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload} className="hidden" />
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : images.length === 0 ? (
        <p className="text-sm text-gray-500">No photos yet. Products without photos show a placeholder on the website.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={img._id} className="relative">
              <img src={img.url} alt={`Product photo ${i + 1}`} className="aspect-square w-full object-cover rounded border" loading="lazy" />
              {i === 0 && <span className="absolute left-1 top-1 bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded">Cover</span>}
              <button type="button" onClick={() => handleDelete(img._id)}
                className="absolute right-1 top-1 bg-white/90 text-red-600 text-xs px-1.5 py-0.5 rounded shadow">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
