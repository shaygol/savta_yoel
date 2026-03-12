import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import OrderModal from "./OrderModal";

const Cart = () => {
  const { items, totalItems, totalAmount, updateQuantity, removeItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative" aria-label={`סל קניות${totalItems > 0 ? `, ${totalItems} פריטים` : ''}`}>
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground" aria-hidden="true">
                {totalItems}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-right">סל הקניות</SheetTitle>
          </SheetHeader>
          
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
              <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
              <p>הסל ריק</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-accent font-bold">₪{item.price}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label={`הפחת כמות ${item.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium" aria-live="polite" aria-label={`כמות: ${item.quantity}`}>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.max_quantity_per_order}
                          aria-label={`הוסף עוד ${item.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                          aria-label={`הסר ${item.name} מהסל`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-left font-bold">
                      ₪{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 pb-20 space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>סה״כ</span>
                  <span>₪{totalAmount}</span>
                </div>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    setIsOpen(false);
                    setShowOrderModal(true);
                  }}
                >
                  המשך להזמנה
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      <OrderModal open={showOrderModal} onOpenChange={setShowOrderModal} />
    </>
  );
};

export default Cart;
