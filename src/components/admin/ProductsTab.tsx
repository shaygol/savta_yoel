import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Images } from "lucide-react";
import ImageUpload from "./ImageUpload";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  available: boolean;
  inventory: number;
  max_quantity_per_order: number;
}

interface GalleryImage {
  id: string;
  image_url: string;
  display_order: number | null;
}

const GallerySection = ({ productId }: { productId: string }) => {
  const queryClient = useQueryClient();
  const [newImageUrl, setNewImageUrl] = useState("");

  const { data: galleryImages, isLoading } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  const addImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const maxOrder = galleryImages?.length ?? 0;
      const { error } = await supabase.from("product_images").insert({
        product_id: productId,
        image_url: imageUrl,
        display_order: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      setNewImageUrl("");
      toast.success("תמונה נוספה לגלריה");
    },
    onError: () => toast.error("שגיאה בהוספת תמונה"),
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      toast.success("תמונה הוסרה");
    },
    onError: () => toast.error("שגיאה במחיקת תמונה"),
  });

  const handleImageUploaded = (url: string) => {
    if (url) addImageMutation.mutate(url);
  };

  return (
    <div className="space-y-3 border-t pt-4 mt-4">
      <Label className="flex items-center gap-1.5 font-bold">
        <Images className="w-4 h-4" />
        גלריית תמונות נוספות
      </Label>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">טוען...</p>
      ) : (
        <>
          {galleryImages && galleryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img src={img.image_url} alt="" className="w-full h-20 object-cover rounded-lg border" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 left-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteImageMutation.mutate(img.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <ImageUpload
            label="הוסף תמונה לגלריה"
            value={newImageUrl}
            onChange={handleImageUploaded}
            folder="products"
          />
        </>
      )}
    </div>
  );
};

const ProductsTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "כללי",
    image_url: "",
    available: true,
    inventory: 0,
    max_quantity_per_order: 10,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase.from("products").update(data).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(editingProduct ? "המוצר עודכן" : "המוצר נוסף");
      resetForm();
    },
    onError: () => toast.error("שגיאה בשמירת המוצר"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("המוצר נמחק");
    },
    onError: () => toast.error("שגיאה במחיקת המוצר"),
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", price: 0, category: "כללי", image_url: "", available: true, inventory: 0, max_quantity_per_order: 10 });
    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category,
      image_url: product.image_url || "",
      available: product.available,
      inventory: product.inventory,
      max_quantity_per_order: product.max_quantity_per_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editingProduct ? { ...formData, id: editingProduct.id } : formData);
  };

  if (isLoading) return <div className="text-center py-8">טוען...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>מוצרים</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף מוצר
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "ערוך מוצר" : "הוסף מוצר חדש"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>שם המוצר</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>תיאור</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>מחיר (₪)</Label>
                    <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>קטגוריה</Label>
                    <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                  </div>
                </div>
                <ImageUpload label="תמונת המוצר" value={formData.image_url} onChange={(url) => setFormData({ ...formData, image_url: url })} folder="products" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>מלאי</Label>
                    <Input type="number" value={formData.inventory} onChange={(e) => setFormData({ ...formData, inventory: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>מקס' להזמנה</Label>
                    <Input type="number" value={formData.max_quantity_per_order} onChange={(e) => setFormData({ ...formData, max_quantity_per_order: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.available} onCheckedChange={(checked) => setFormData({ ...formData, available: checked })} />
                  <Label>זמין למכירה</Label>
                </div>
                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "שומר..." : "שמור"}
                </Button>

                {/* Gallery section - only for existing products */}
                {editingProduct && <GallerySection productId={editingProduct.id} />}
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תמונה</TableHead>
                <TableHead>שם</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>מחיר</TableHead>
                <TableHead>מלאי</TableHead>
                <TableHead>זמין</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    )}
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>₪{product.price}</TableCell>
                  <TableCell>{product.inventory}</TableCell>
                  <TableCell>{product.available ? "כן" : "לא"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(product.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductsTab;
