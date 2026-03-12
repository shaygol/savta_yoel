import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import OrderModal from "./OrderModal";

const FloatingCartButton = () => {
  const { items, totalItems, totalAmount } = useCart();
  const [showOrderModal, setShowOrderModal] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-6 md:w-auto">
        <Button
          onClick={() => setShowOrderModal(true)}
          size="lg"
          className="w-full md:w-auto gap-3 shadow-lg text-base py-6"
          aria-label={`לסיום הזמנה - ${totalItems} פריטים, סה״כ ₪${totalAmount}`}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          <span>לסיום הזמנה</span>
          <span className="bg-primary-foreground/20 px-2 py-1 rounded-full text-sm" aria-hidden="true">
            {totalItems} פריטים | ₪{totalAmount}
          </span>
        </Button>
      </div>
      
      <OrderModal open={showOrderModal} onOpenChange={setShowOrderModal} />
    </>
  );
};

export default FloatingCartButton;