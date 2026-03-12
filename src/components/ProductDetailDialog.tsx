import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProductReviews, useAddReview } from "@/hooks/useReviews";
import { useCart } from "@/contexts/CartContext";
import { Plus, Minus, Star, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductDetailDialogProps {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    description?: string | null;
    max_quantity_per_order: number | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          tabIndex={interactive ? 0 : -1}
          aria-label={`${star} כוכבים`}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className="bg-transparent border-none p-0"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= (hover || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            } ${interactive ? "cursor-pointer" : ""}`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
};

const ProductDetailDialog = ({ product, open, onOpenChange }: ProductDetailDialogProps) => {
  const { items, addItem, updateQuantity } = useCart();
  const { data: reviews } = useProductReviews(product?.id || null);
  const addReview = useAddReview();
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  // Fetch gallery images
  const { data: galleryImages } = useQuery({
    queryKey: ['product-images', product?.id],
    enabled: !!product?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product!.id)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  if (!product) return null;

  const allImages = galleryImages && galleryImages.length > 0
    ? galleryImages.map(gi => gi.image_url)
    : product.image_url ? [product.image_url] : [];

  const quantity = items.find(i => i.id === product.id)?.quantity || 0;
  const maxQty = product.max_quantity_per_order || 10;

  const handleAddReview = async () => {
    if (newRating === 0) {
      toast.error("יש לבחור דירוג");
      return;
    }
    try {
      await addReview.mutateAsync({ productId: product.id, rating: newRating, comment: newComment });
      toast.success("הביקורת נוספה!");
      setNewRating(0);
      setNewComment("");
    } catch (err: any) {
      toast.error(err.message || "שגיאה בהוספת ביקורת");
    }
  };

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">{product.name}</DialogTitle>
        </DialogHeader>

        {/* Image Gallery */}
        {allImages.length > 0 && (
          <div className="relative">
            <div
              className={`aspect-square overflow-hidden rounded-xl cursor-zoom-in ${zoomed ? "fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-zoom-out rounded-none" : ""}`}
              onClick={() => setZoomed(!zoomed)}
            >
              <img
                src={allImages[currentImageIndex]}
                alt={product.name}
                className={`object-contain ${zoomed ? "max-w-full max-h-full" : "w-full h-full object-cover"}`}
              />
            </div>
            {!zoomed && allImages.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80"
                  onClick={() => setCurrentImageIndex(i => (i - 1 + allImages.length) % allImages.length)}
                  aria-label="תמונה קודמת"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80"
                  onClick={() => setCurrentImageIndex(i => (i + 1) % allImages.length)}
                  aria-label="תמונה הבאה"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="flex justify-center gap-1.5 mt-2">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${i === currentImageIndex ? "bg-primary" : "bg-muted-foreground/30"}`}
                      onClick={() => setCurrentImageIndex(i)}
                      aria-label={`תמונה ${i + 1} מתוך ${allImages.length}`}
                    />
                  ))}
                </div>
              </>
            )}
            {!zoomed && (
              <button
                className="absolute top-2 left-2 bg-background/80 rounded-full p-1.5"
                onClick={() => setZoomed(true)}
                aria-label="הגדל תמונה"
              >
                <ZoomIn className="w-4 h-4 text-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Price & Cart */}
        <div className="flex items-center justify-between">
          <span className="text-accent font-bold text-2xl">₪{product.price}</span>
          {quantity === 0 ? (
            <Button onClick={() => addItem({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url || undefined, max_quantity_per_order: maxQty })} className="gap-1">
              <Plus className="h-4 w-4" /> הוסף לסל
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity - 1)}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= maxQty}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {product.description && (
          <p className="text-muted-foreground text-sm">{product.description}</p>
        )}

        {/* Rating Summary */}
        {reviews && reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <StarRating rating={Math.round(avgRating)} />
            <span className="text-muted-foreground">({reviews.length} ביקורות)</span>
          </div>
        )}

        {/* Add Review */}
        <div className="border-t border-border pt-4 space-y-3">
          <h4 className="font-bold text-sm">כתוב ביקורת</h4>
          <StarRating rating={newRating} onRate={setNewRating} interactive />
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="שתפו את החוויה שלכם..."
            rows={2}
            maxLength={500}
          />
          <Button size="sm" onClick={handleAddReview} disabled={addReview.isPending}>
            {addReview.isPending ? "שולח..." : "שלח ביקורת"}
          </Button>
        </div>

        {/* Reviews List */}
        {reviews && reviews.length > 0 && (
          <div className="border-t border-border pt-4 space-y-3">
            <h4 className="font-bold text-sm">ביקורות ({reviews.length})</h4>
            {reviews.slice(0, 5).map(review => (
              <div key={review.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{review.profile_name}</span>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                <p className="text-xs text-muted-foreground/60">
                  {new Date(review.created_at).toLocaleDateString("he-IL")}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
