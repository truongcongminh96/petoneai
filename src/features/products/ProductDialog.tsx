import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import type { ProductFormValues } from "./schema";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  submitLabel?: string;
}

export function ProductDialog({
  open,
  onOpenChange,
  title,
  defaultValues,
  onSubmit,
  submitLabel,
}: ProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ProductForm
          defaultValues={defaultValues}
          onSubmit={async (data) => {
            await onSubmit(data);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
          submitLabel={submitLabel}
        />
      </DialogContent>
    </Dialog>
  );
}
