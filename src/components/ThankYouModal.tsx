import { Check, CreditCard, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ThankYouModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  payboxUrl?: string;
  bitUrl?: string;
  bitEnabled?: boolean;
  phone?: string;
}

const ThankYouModal = ({
  open,
  onOpenChange,
  totalAmount,
  payboxUrl,
  bitUrl,
  bitEnabled,
  phone,
}: ThankYouModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <DialogTitle className="text-2xl">תודה על הזמנתכם!</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            ההזמנה התקבלה בהצלחה. ניצור איתכם קשר בהקדם.
          </p>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-lg font-bold">סכום לתשלום: ₪{totalAmount}</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium">אפשרויות תשלום:</p>
            
            {payboxUrl && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.open(payboxUrl, '_blank')}
              >
                <CreditCard className="h-4 w-4" />
                תשלום ב-PayBox
              </Button>
            )}

            {bitEnabled && bitUrl && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.open(bitUrl, '_blank')}
              >
                <CreditCard className="h-4 w-4" />
                תשלום ב-Bit
              </Button>
            )}

            {phone && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => window.open(`tel:${phone}`, '_self')}
              >
                <Phone className="h-4 w-4" />
                התקשרו אלינו: {phone}
              </Button>
            )}
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThankYouModal;
