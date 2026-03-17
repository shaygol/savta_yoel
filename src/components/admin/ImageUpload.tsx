import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  previewClass?: string;
}

const ImageUpload = ({ value, onChange, folder = "general", label = "תמונה", previewClass }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("נא לבחור קובץ תמונה");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("גודל הקובץ המקסימלי הוא 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success("התמונה הועלתה בהצלחה");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Upload error:", error);
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value ? (
        <div className="relative w-full">
          <img
            src={value}
            alt="Preview"
            className={previewClass ?? "w-full h-32 object-cover rounded-lg border"}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 left-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id={`image-upload-${folder}`}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-24 border-dashed flex flex-col gap-2"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">מעלה...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" />
                <span className="text-sm">לחץ להעלאת תמונה</span>
              </>
            )}
          </Button>
          <Input
            placeholder="או הזן קישור לתמונה"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            dir="ltr"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
