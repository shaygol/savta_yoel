import { useState, useRef, lazy, Suspense, useCallback } from "react";
import { Plus, Minus, Trash2, ShoppingCart, ChevronRight, UtensilsCrossed, Percent } from "lucide-react";

const TrayScene3D = lazy(() => import("@/components/TrayScene3D"));
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import OrderModal from "@/components/OrderModal";
import { useSettings } from "@/hooks/useSettings";

interface TrayItem {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  quantity: number;
  max_quantity_per_order: number;
}

interface ItemPosition {
  x: number;
  y: number;
}

const DEFAULT_TRAY_SIZES = [
  { id: "small", label: 'מגש קטן', capacity: 10, minItems: 6, emoji: "🫙", discountPercent: 5 },
  { id: "medium", label: 'מגש בינוני', capacity: 20, minItems: 12, emoji: "🍽️", discountPercent: 10 },
  { id: "large", label: 'מגש גדול', capacity: 40, minItems: 20, emoji: "🪄", discountPercent: 15 },
];

function buildTraySizes(config?: Record<string, { capacity?: number; minItems?: number; discountPercent?: number }>) {
  return DEFAULT_TRAY_SIZES.map(size => {
    const override = config?.[size.id];
    const capacity = override?.capacity ?? size.capacity;
    const minItems = override?.minItems ?? size.minItems;
    const discountPercent = override?.discountPercent ?? size.discountPercent;
    return { ...size, capacity, minItems, discountPercent, description: `${minItems}-${capacity} פריטים` };
  });
}
type TraySizeConfig = ReturnType<typeof buildTraySizes>[0];

function calculateDiscount(traySize: TraySizeConfig, itemsCount: number, subtotal: number) {
  const meetsMinimum = itemsCount >= traySize.minItems;
  const discountPercent = meetsMinimum ? traySize.discountPercent : 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const itemsUntilDiscount = meetsMinimum ? 0 : traySize.minItems - itemsCount;
  return { discountPercent, discountAmount, meetsMinimum, itemsUntilDiscount };
}

const TrayBuilder = () => {
  const { data: products, isLoading } = useProducts();
  const { data: siteSettings } = useSettings();
  const categories = useCategories(products);
  const TRAY_SIZES = buildTraySizes(siteSettings?.tray_discount_config as any);
  const [activeCategory, setActiveCategory] = useState("הכל");
  const [trayItems, setTrayItems] = useState<TrayItem[]>([]);
  const [selectedTraySize, setSelectedTraySize] = useState<TraySizeConfig>(TRAY_SIZES[1]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customPositions, setCustomPositions] = useState<Record<string, ItemPosition>>({});
  const { addItem } = useCart();
  const trayRef = useRef<HTMLDivElement>(null);

  const filteredProducts = activeCategory === "הכל"
    ? products
    : products?.filter(p => p.category === activeCategory);

  const subtotal = trayItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const trayItemsCount = trayItems.reduce((sum, item) => sum + item.quantity, 0);
  const discount = calculateDiscount(selectedTraySize, trayItemsCount, subtotal);
  const trayTotal = subtotal - discount.discountAmount;
  const capacityPercent = Math.min((trayItemsCount / selectedTraySize.capacity) * 100, 100);
  const isOverCapacity = trayItemsCount > selectedTraySize.capacity;

  const handlePositionChange = useCallback((itemId: string, instanceIndex: number, pos: ItemPosition) => {
    setCustomPositions(prev => ({ ...prev, [`${itemId}__${instanceIndex}`]: pos }));
  }, []);

  // Build tray layout for saving with order
  const buildTrayLayout = useCallback(() => {
    return {
      traySize: selectedTraySize.id,
      items: trayItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        image_url: item.image_url,
        // Include all custom positions for this item
        positions: Array.from({ length: Math.min(item.quantity, 4) }, (_, i) => {
          const key = `${item.id}__${i}`;
          return customPositions[key] || null;
        }).filter(Boolean),
      })),
    };
  }, [trayItems, customPositions, selectedTraySize]);

  const addToTray = (product: { id: string; name: string; price: number; image_url: string | null; max_quantity_per_order: number | null }) => {
    setTrayItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      const maxQty = product.max_quantity_per_order || 10;
      if (existing) {
        if (existing.quantity >= maxQty) {
          toast.error(`לא ניתן להוסיף יותר מ-${maxQty} יחידות`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (window.innerWidth < 768 && trayRef.current) {
        trayRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, image_url: product.image_url, quantity: 1, max_quantity_per_order: maxQty }];
    });
    toast.success(`${product.name} נוסף למגש ✨`);
  };

  const removeFromTray = (id: string) => {
    setTrayItems(prev => prev.filter(i => i.id !== id));
    // Clean up positions for removed item
    setCustomPositions(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (key.startsWith(`${id}__`)) delete next[key];
      });
      return next;
    });
  };

  const updateTrayQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeFromTray(id); return; }
    const item = trayItems.find(i => i.id === id);
    if (item && quantity > item.max_quantity_per_order) return;
    setTrayItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearTray = () => {
    setTrayItems([]);
    setCustomPositions({});
    toast.info("המגש נוקה");
  };

  const addTrayToCart = () => {
    if (trayItems.length === 0) return;
    trayItems.forEach(item => {
      addItem({ id: item.id, name: item.name, price: item.price, image_url: item.image_url || undefined, max_quantity_per_order: item.max_quantity_per_order });
      for (let i = 1; i < item.quantity; i++) {
        addItem({ id: item.id, name: item.name, price: item.price, image_url: item.image_url || undefined, max_quantity_per_order: item.max_quantity_per_order });
      }
    });
    setShowOrderModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">דף הבית</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">בונה מגש אירוח</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-3">
            <UtensilsCrossed className="w-4 h-4" />
            חדש! בונה מגש אישי
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">עצב את המגש שלך</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            בחר מוצרים, הרכב את המגש המושלם לאירוע שלך וקבל הצעת מחיר מיידית
          </p>
        </div>

        {/* Tray Size Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {TRAY_SIZES.map(size => (
            <button
              key={size.id}
              onClick={() => setSelectedTraySize(size)}
              className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border-2 transition-all duration-200 ${
                selectedTraySize.id === size.id
                  ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                  : "border-border bg-card hover:border-primary/50 hover:bg-secondary/50"
              }`}
            >
              <span className="text-2xl">{size.emoji}</span>
              <span className="font-bold text-sm">{size.label}</span>
              <span className={`text-xs ${selectedTraySize.id === size.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {size.description}
              </span>
              <span className={`text-xs font-bold ${selectedTraySize.id === size.id ? "text-green-200" : "text-green-600"}`}>
                {size.discountPercent}% הנחה (מינ׳ {size.minItems})
              </span>
            </button>
          ))}
        </div>

        {/* 3D Tray Hero */}
        <div className="mb-8">
          <Suspense fallback={
            <div className="w-full h-[400px] rounded-2xl bg-muted animate-pulse flex items-center justify-center">
              <span className="text-muted-foreground text-sm">טוען תצוגה תלת מימדית...</span>
            </div>
          }>
            <TrayScene3D
              items={trayItems}
              traySize={selectedTraySize.id as 'small' | 'medium' | 'large'}
              onRemoveItem={removeFromTray}
              customPositions={customPositions}
              onPositionChange={handlePositionChange}
            />
          </Suspense>
          <p className="text-center text-xs text-muted-foreground mt-2">
            {trayItems.length === 0 ? 'בחר מוצרים מהרשימה למטה כדי לראות אותם על המגש 🍽️' : 'גרור פריטים לשינוי מיקום • העבר עכבר מעל פריט להסרה 🖱️'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Panel */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl shadow-sm p-4">
              <h2 className="font-bold text-lg text-primary mb-4">בחר מוצרים</h2>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-primary/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredProducts?.map(product => {
                    const inTray = trayItems.find(i => i.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className={`relative bg-background rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group
                          ${inTray ? "border-accent shadow-md" : "border-transparent hover:border-primary/30 hover:shadow-sm"}`}
                        onClick={() => addToTray({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url, max_quantity_per_order: product.max_quantity_per_order })}
                      >
                        {inTray && (
                          <div className="absolute top-2 right-2 z-10">
                            <Badge className="bg-accent text-accent-foreground font-bold px-2 py-0.5 text-xs shadow">
                              {inTray.quantity}✓
                            </Badge>
                          </div>
                        )}
                        <div className="aspect-[4/3] overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="font-medium text-xs leading-tight text-foreground">{product.name}</p>
                          <p className="text-accent font-bold text-sm mt-0.5">₪{product.price}</p>
                        </div>
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tray Panel */}
          <div className="lg:col-span-1" ref={trayRef}>
            <div className="bg-card rounded-2xl shadow-sm p-4 sticky top-24">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg text-primary flex items-center gap-2">
                  <span>{selectedTraySize.emoji}</span>
                  {selectedTraySize.label}
                </h2>
                {trayItems.length > 0 && (
                  <button onClick={clearTray} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                    <Trash2 className="w-3 h-3" />
                    נקה
                  </button>
                )}
              </div>

              {/* Capacity Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{trayItemsCount} / {selectedTraySize.capacity} פריטים</span>
                  <span className={isOverCapacity ? "text-destructive font-medium" : ""}>{Math.round(capacityPercent)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-green-600 z-10"
                    style={{ left: `${(selectedTraySize.minItems / selectedTraySize.capacity) * 100}%` }}
                    title={`מינימום ${selectedTraySize.minItems} פריטים להנחה`}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverCapacity ? "bg-destructive" : discount.meetsMinimum ? "bg-green-500" : capacityPercent > 80 ? "bg-yellow-500" : "bg-accent"
                    }`}
                    style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                  />
                </div>
                {!discount.meetsMinimum && trayItemsCount > 0 && (
                  <p className="text-xs mt-1 text-muted-foreground">
                    🎯 עוד {discount.itemsUntilDiscount} פריטים למינימום הזמנה ({selectedTraySize.discountPercent}% הנחה)
                  </p>
                )}
                {discount.meetsMinimum && (
                  <p className="text-xs mt-1 text-green-600">✅ הנחת {selectedTraySize.discountPercent}% פעילה!</p>
                )}
                {isOverCapacity && (
                  <p className="text-destructive text-xs mt-1">⚠️ חרגת מגודל המגש הנבחר</p>
                )}
              </div>

              {/* Item List */}
              {trayItems.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                  {trayItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-background rounded-xl p-2 border border-border">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        <p className="text-accent text-xs font-bold">₪{(item.price * item.quantity).toFixed(0)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateTrayQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                        <button onClick={() => updateTrayQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" disabled={item.quantity >= item.max_quantity_per_order}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {trayItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-muted-foreground">סה"כ פריטים</span>
                    <span className="font-medium">{trayItemsCount}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-muted-foreground">מחיר לפני הנחה</span>
                    <span className="font-medium">₪{subtotal.toFixed(0)}</span>
                  </div>

                  {discount.meetsMinimum && (
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 my-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-bold text-xs">
                        <Percent className="w-3.5 h-3.5" />
                        הנחת מגש אירוח פעילה!
                      </div>
                      <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                        <span>🎁 הנחת {selectedTraySize.label} ({selectedTraySize.discountPercent}%)</span>
                        <span>-₪{discount.discountAmount.toFixed(0)}</span>
                      </div>
                    </div>
                  )}

                  {!discount.meetsMinimum && trayItemsCount > 0 && (
                    <p className="text-xs text-muted-foreground my-2 text-center">
                      💡 הוסף עוד {discount.itemsUntilDiscount} פריטים וקבל {selectedTraySize.discountPercent}% הנחה!
                    </p>
                  )}

                  <div className="flex justify-between items-center mb-4 mt-2">
                    <span className="font-bold text-foreground">סה"כ לתשלום</span>
                    <div className="text-left">
                      {discount.meetsMinimum && (
                        <span className="text-sm text-muted-foreground line-through mr-2">₪{subtotal.toFixed(0)}</span>
                      )}
                      <span className="font-bold text-xl text-accent">₪{trayTotal.toFixed(0)}</span>
                    </div>
                  </div>
                  <Button onClick={addTrayToCart} className="w-full gap-2 py-6 text-base" disabled={isOverCapacity}>
                    <ShoppingCart className="w-5 h-5" />
                    לסיום הזמנה
                  </Button>
                  {isOverCapacity && (
                    <p className="text-center text-xs text-destructive mt-2">יש להגדיל את גודל המגש או להפחית פריטים</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <OrderModal open={showOrderModal} onOpenChange={setShowOrderModal} trayLayout={buildTrayLayout()} />
    </div>
  );
};

export default TrayBuilder;
