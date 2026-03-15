import { useState } from "react";
import { Plus, Minus, ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useProductRatingSummary } from "@/hooks/useReviews";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ScrollReveal from "@/components/ScrollReveal";
import ProductDetailDialog from "./ProductDetailDialog";

const Menu = () => {
  const { data: products, isLoading, isError, refetch } = useProducts();
  const { data: settings } = useSettings();
  const { data: ratingSummary } = useProductRatingSummary(products);
  const categories = useCategories(products);
  const [activeCategory, setActiveCategory] = useState("הכל");
  const { items, addItem, updateQuantity } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<typeof products extends (infer T)[] | undefined ? T | null : null>(null);

  const menuDescription = settings?.menu_description || "מנות העונה";

  const filteredProducts = activeCategory === "הכל"
    ? products
    : products?.filter(p => p.category === activeCategory);

  const getCartQuantity = (productId: string) => {
    const item = items.find(i => i.id === productId);
    return item?.quantity || 0;
  };

  if (isLoading) {
    return (
      <section id="menu" className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="section-title">התפריט שלנו</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section id="menu" className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="section-title">התפריט שלנו</h2>
          <div className="max-w-sm mx-auto mt-8 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto opacity-40 pointer-events-none" aria-hidden="true">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-sm">לא הצלחנו לטעון את התפריט</p>
            <Button variant="outline" onClick={() => refetch()}>נסה שוב</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="menu" className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <h2 className="section-title">התפריט שלנו</h2>
            <p className="section-subtitle">{menuDescription}</p>
          </ScrollReveal>

          {/* Category Filter */}
          <ScrollReveal direction="up" delay={0.1}>
            <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist" aria-label="סינון לפי קטגוריה">
              {categories.map(category => (
                <button
                  key={category}
                  role="tab"
                  aria-selected={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card text-foreground hover:bg-primary/10"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {filteredProducts?.map((product, index) => {
              const quantity = getCartQuantity(product.id);
              const maxQty = product.max_quantity_per_order || 10;
              const rating = ratingSummary?.[product.id];

              return (
                <ScrollReveal key={product.id} direction="up" delay={index * 0.07}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-card rounded-2xl overflow-hidden shadow-sm cursor-pointer group h-full"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="aspect-square overflow-hidden relative">
                      {product.image_url ? (
                        <>
                          <img
                            src={product.image_url}
                            alt={`${product.name} - ₪${product.price}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center" role="img" aria-label={product.name}>
                          <ShoppingCart className="w-12 h-12 text-muted-foreground/30" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-foreground mb-1 leading-tight text-sm md:text-base">
                        {product.name}
                      </h3>
                      {rating && (
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">{rating.avg.toFixed(1)} ({rating.count})</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-accent font-bold text-lg">₪{product.price}</span>
                        <div onClick={e => e.stopPropagation()}>
                          {quantity === 0 ? (
                            <Button
                              size="sm"
                              onClick={() => addItem({
                                id: product.id,
                                name: product.name,
                                price: Number(product.price),
                                image_url: product.image_url || undefined,
                                max_quantity_per_order: maxQty,
                              })}
                              className="gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              הוסף
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity - 1)} aria-label={`הפחת כמות ${product.name}`}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-bold" aria-live="polite">{quantity}</span>
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= maxQty} aria-label={`הוסף עוד ${product.name}`}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <ProductDetailDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />
    </>
  );
};

export default Menu;
