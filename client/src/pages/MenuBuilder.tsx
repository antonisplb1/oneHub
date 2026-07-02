import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, UtensilsCrossed, Copy, Download, Upload, X, GripVertical } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMenuCategorySchema, insertMenuItemSchema, type MenuCategory, type MenuItem } from "@shared/schema";
import { z } from "zod";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type CategoryFormValues = z.infer<typeof insertMenuCategorySchema>;
// The merchant types a euro decimal (e.g. "9.99") into the form; it is converted
// to integer cents on submit. The stored/API value (MenuItemPayload) is always
// integer cents.
const itemFormSchema = insertMenuItemSchema.extend({
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !Number.isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Enter a valid price"),
});
type ItemFormValues = z.infer<typeof itemFormSchema>;
type MenuItemPayload = z.infer<typeof insertMenuItemSchema>;

interface SortableItemProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
}

function SortableItem({ item, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 border rounded-lg hover-elevate bg-card"
      data-testid={`item-card-${item.id}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-semibold text-lg" data-testid={`item-name-${item.id}`}>
            {item.name}
          </h4>
          <span className="text-sm font-semibold text-primary" data-testid={`item-price-${item.id}`}>
            €{(item.price / 100).toFixed(2)}
          </span>
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground mb-1" data-testid={`item-description-${item.id}`}>
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {(item.imageStorageKey || item.imageUrl) && <span>Has image</span>}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(item)}
          data-testid={`button-edit-item-${item.id}`}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(item)}
          data-testid={`button-delete-item-${item.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function MenuBuilder() {
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MenuCategory | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const { toast } = useToast();

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(insertMenuCategorySchema),
    defaultValues: {
      name: "",
      displayOrder: 0,
    },
  });

  const itemForm = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      displayOrder: 0,
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu-categories"],
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  const { data: qrCodeData, isLoading: qrCodeLoading } = useQuery<{ qrCode: string; url: string }>({
    queryKey: ['/api/menu-qr-code'],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      return apiRequest("/api/menu-categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      categoryForm.reset();
      setIsCategoryDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormValues }) => {
      return apiRequest(`/api/menu-categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      categoryForm.reset();
      setEditingCategory(null);
      setIsCategoryDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/menu-categories/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setDeletingCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: MenuItemPayload) => {
      return apiRequest("/api/menu-items", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      itemForm.reset();
      setIsItemDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create item",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MenuItemPayload }) => {
      return apiRequest(`/api/menu-items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      itemForm.reset();
      setEditingItem(null);
      setIsItemDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/menu-items/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      setDeletingItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const updateItemOrdersMutation = useMutation({
    mutationFn: async (updates: { id: string; displayOrder: number }[]) => {
      return apiRequest("/api/menu-items/reorder", {
        method: "POST",
        body: JSON.stringify({ updates }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder items",
        variant: "destructive",
      });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({ name: "", displayOrder: 0 });
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      displayOrder: category.displayOrder || 0,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleAddItem = (categoryId: string) => {
    setEditingItem(null);
    setUploadedImageUrl("");
    const categoryItems = getItemsForCategory(categoryId);
    const nextDisplayOrder = categoryItems.length > 0
      ? Math.max(...categoryItems.map(item => item.displayOrder || 0)) + 1
      : 0;
    itemForm.reset({
      categoryId,
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      displayOrder: nextDisplayOrder,
    });
    setIsItemDialogOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setUploadedImageUrl("");
    itemForm.reset({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || "",
      price: (item.price / 100).toFixed(2),
      imageUrl: item.imageUrl || "",
      displayOrder: item.displayOrder || 0,
    });
    setIsItemDialogOpen(true);
  };

  const onCategorySubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const onItemSubmit = (data: ItemFormValues) => {
    // Convert the euro-decimal input to integer cents at the edge.
    const payload: MenuItemPayload = {
      ...data,
      price: Math.round(parseFloat(data.price) * 100),
    };
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createItemMutation.mutate(payload);
    }
  };

  const getItemsForCategory = (categoryId: string) => {
    return items.filter(item => item.categoryId === categoryId).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  };

  const handleDragEnd = (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const categoryItems = getItemsForCategory(categoryId);
    const oldIndex = categoryItems.findIndex((item) => item.id === active.id);
    const newIndex = categoryItems.findIndex((item) => item.id === over.id);

    const reorderedItems = arrayMove(categoryItems, oldIndex, newIndex);

    // Update display orders
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      displayOrder: index,
    }));

    updateItemOrdersMutation.mutate(updates);
  };

  const isLoading = categoriesLoading || itemsLoading;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">My Menu</h1>
          <p className="text-muted-foreground text-lg">Manage your menu categories and items</p>
        </div>
        <Button
          onClick={handleAddCategory}
          size="lg"
          data-testid="button-add-category"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {qrCodeLoading ? (
        <Card className="border-card-border shadow-sm">
          <CardContent className="flex justify-center py-16">
            <div className="text-muted-foreground">Loading QR code...</div>
          </CardContent>
        </Card>
      ) : qrCodeData ? (
        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold">Menu QR Code</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Share this QR code with customers to view your menu
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <img 
                src={qrCodeData.qrCode} 
                alt="Menu QR Code"
                className="w-[300px] h-[300px]"
                data-testid="menu-qr-code-image"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Menu URL</Label>
              <div className="flex gap-2">
                <Input 
                  value={qrCodeData.url} 
                  readOnly 
                  data-testid="menu-url-text"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(qrCodeData.url);
                    toast({
                      title: "Copied!",
                      description: "Menu URL copied to clipboard",
                    });
                  }}
                  data-testid="button-copy-menu-url"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => {
                const link = document.createElement('a');
                link.href = qrCodeData.qrCode;
                link.download = 'menu-qr-code.png';
                link.click();
              }}
              className="w-full"
              size="lg"
              data-testid="button-download-menu-qr"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="text-muted-foreground py-4">Loading...</div>
      ) : categories.length === 0 ? (
        <Card className="border-card-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UtensilsCrossed className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No categories yet</h3>
            <p className="text-muted-foreground mb-6">Get started by creating your first menu category</p>
            <Button onClick={handleAddCategory} data-testid="button-add-category-empty">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = getItemsForCategory(category.id);
            return (
              <Card key={category.id} className="border-card-border shadow-sm" data-testid={`category-card-${category.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl font-semibold">{category.name}</CardTitle>
                      <span className="text-sm text-muted-foreground">Order: {category.displayOrder || 0}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddItem(category.id)}
                        data-testid={`button-add-item-${category.id}`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        data-testid={`button-edit-category-${category.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingCategory(category)}
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {categoryItems.length === 0 ? (
                    <p className="text-muted-foreground py-4" data-testid={`empty-items-${category.id}`}>
                      No items in this category yet. Click "Add Item" to get started.
                    </p>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(event, category.id)}
                    >
                      <SortableContext
                        items={categoryItems.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {categoryItems.map((item) => (
                            <SortableItem
                              key={item.id}
                              item={item}
                              onEdit={handleEditItem}
                              onDelete={setDeletingItem}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4 pt-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Main Courses, Desserts"
                        data-testid="input-category-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        data-testid="input-category-display-order"
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="w-full"
                size="lg"
                data-testid="button-submit-category"
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending
                  ? "Saving..."
                  : editingCategory
                  ? "Update Category"
                  : "Create Category"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              {editingItem ? "Edit Item" : "Add Item"}
            </DialogTitle>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4 pt-4">
              <FormField
                control={itemForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Margherita Pizza"
                        data-testid="input-item-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your item..."
                        data-testid="textarea-item-description"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        inputMode="decimal"
                        placeholder="0.00"
                        data-testid="input-item-price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={itemForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Image</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {/* Upload button */}
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880}
                          onGetUploadParameters={async () => {
                            const response = await fetch("/api/menu-images/upload", {
                              method: "POST",
                              credentials: "include",
                            });
                            const data = await response.json();
                            return {
                              method: "PUT" as const,
                              url: data.uploadURL,
                            };
                          }}
                          onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                            if (result.successful && result.successful.length > 0) {
                              const uploadUrl = result.successful[0].uploadURL || "";
                              field.onChange(uploadUrl);
                              setUploadedImageUrl(uploadUrl);
                            }
                          }}
                          buttonClassName="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </ObjectUploader>
                        
                        {/* Show preview if image uploaded */}
                        {(field.value || uploadedImageUrl) && (
                          <div className="relative">
                            <img 
                              src={field.value || uploadedImageUrl} 
                              alt="Menu item preview" 
                              className="w-full h-32 object-cover rounded-md"
                              data-testid="img-item-preview"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                field.onChange("");
                                setUploadedImageUrl("");
                              }}
                              data-testid="button-remove-image"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={createItemMutation.isPending || updateItemMutation.isPending}
                className="w-full"
                size="lg"
                data-testid="button-submit-item"
              >
                {createItemMutation.isPending || updateItemMutation.isPending
                  ? "Saving..."
                  : editingItem
                  ? "Update Item"
                  : "Create Item"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? This will also delete all items in this category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-category">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCategory && deleteCategoryMutation.mutate(deletingCategory.id)}
              disabled={deleteCategoryMutation.isPending}
              data-testid="button-confirm-delete-category"
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-item">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItem && deleteItemMutation.mutate(deletingItem.id)}
              disabled={deleteItemMutation.isPending}
              data-testid="button-confirm-delete-item"
            >
              {deleteItemMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
