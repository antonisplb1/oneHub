import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/contexts/StoreContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Store, Plus, Trash2, Check, Pencil, Upload, X } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

type StoreEntry = {
  id: string;
  shopName: string;
  displayName: string;
  logo?: string | null;
  cardBackgroundColor?: string | null;
  menuBannerImage?: string | null;
  shiftAccessPin?: string | null;
};

export default function StoresPage() {
  const { stores, activeStoreId, setActiveStoreId } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [shopName, setShopName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreEntry | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editCardBg, setEditCardBg] = useState("#4285F4");
  const [editPin, setEditPin] = useState("");
  const [editLogo, setEditLogo] = useState<string | null>(null);
  const [editBanner, setEditBanner] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => apiRequest("/api/stores", {
      method: "POST",
      body: JSON.stringify({ shopName, displayName: displayName || shopName }),
    }),
    onSuccess: (newStore: any) => {
      setAddOpen(false);
      setShopName("");
      setDisplayName("");
      setActiveStoreId(newStore.id);
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Store created", description: `${newStore.displayName || newStore.shopName} is ready.` });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create store", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, string | null> }) =>
      apiRequest(`/api/stores/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setEditOpen(false);
      setEditingStore(null);
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({ title: "Store updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update store", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (storeId: string) => apiRequest(`/api/stores/${storeId}`, { method: "DELETE" }),
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      if (activeStoreId === deletedId) {
        const remaining = stores.filter(s => s.id !== deletedId);
        if (remaining.length > 0) setActiveStoreId(remaining[0].id);
      }
      toast({ title: "Store deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete store", description: err.message, variant: "destructive" });
    },
  });

  const openEdit = (store: StoreEntry) => {
    setEditingStore(store);
    setEditDisplayName(store.displayName || store.shopName);
    setEditCardBg(store.cardBackgroundColor || "#4285F4");
    setEditPin(store.shiftAccessPin || "");
    setEditLogo(store.logo || null);
    setEditBanner(store.menuBannerImage || null);
    setEditOpen(true);
  };

  const handleImageFile = (file: File, setter: (v: string) => void) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum image size is 5MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = e => setter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!editingStore) return;
    updateMutation.mutate({
      id: editingStore.id,
      data: {
        displayName: editDisplayName,
        cardBackgroundColor: editCardBg,
        shiftAccessPin: editPin || null,
        logo: editLogo,
        menuBannerImage: editBanner,
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-semibold">My Stores</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your store locations. Each store has its own customers, loyalty cards, menu, and more.</p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-store">
                <Plus className="w-4 h-4 mr-2" />
                Add Store
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Store</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="shopName">URL Slug</Label>
                  <Input
                    id="shopName"
                    data-testid="input-store-shopname"
                    placeholder="my-new-store"
                    value={shopName}
                    onChange={e => setShopName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                  />
                  <p className="text-xs text-muted-foreground">Used in public URLs. Lowercase letters, numbers, and hyphens only.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    data-testid="input-store-displayname"
                    placeholder="My New Store"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  data-testid="button-create-store"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !shopName}
                >
                  {createMutation.isPending ? "Creating..." : "Create Store"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {stores.map(store => (
            <Card key={store.id} className={activeStoreId === store.id ? "ring-2 ring-primary" : ""} data-testid={`card-store-${store.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{store.displayName || store.shopName}</CardTitle>
                    <CardDescription className="text-xs">/{store.shopName}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeStoreId === store.id ? (
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-switch-store-${store.id}`}
                      onClick={() => {
                        setActiveStoreId(store.id);
                        queryClient.clear();
                        toast({ title: "Switched store", description: `Now managing ${store.displayName || store.shopName}` });
                      }}
                    >
                      Switch
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    data-testid={`button-edit-store-${store.id}`}
                    onClick={() => openEdit(store as StoreEntry)}
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  {stores.length > 1 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" data-testid={`button-delete-store-${store.id}`}>
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete store?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{store.displayName || store.shopName}</strong> and all its data. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(store.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid={`button-confirm-delete-store-${store.id}`}
                          >
                            Delete Store
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Store Settings Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Store Settings</DialogTitle>
          </DialogHeader>
          {editingStore && (
            <div className="space-y-5 mt-2">
              <div className="space-y-2">
                <Label htmlFor="editDisplayName">Display Name</Label>
                <Input
                  id="editDisplayName"
                  data-testid="input-edit-store-displayname"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">URL slug <span className="font-mono">/{editingStore.shopName}</span> cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {editLogo ? (
                    <div className="relative">
                      <img src={editLogo} alt="Logo preview" className="w-14 h-14 rounded-md object-contain border" />
                      <button
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                        onClick={() => setEditLogo(null)}
                        data-testid="button-clear-store-logo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-md border flex items-center justify-center bg-muted">
                      <Store className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="button-upload-store-logo"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0], setEditLogo)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Menu Banner Image</Label>
                <div className="space-y-2">
                  {editBanner ? (
                    <div className="relative">
                      <img src={editBanner} alt="Banner preview" className="w-full h-24 rounded-md object-cover border" />
                      <button
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                        onClick={() => setEditBanner(null)}
                        data-testid="button-clear-store-banner"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="button-upload-store-banner"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {editBanner ? "Replace Banner" : "Upload Banner"}
                  </Button>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0], setEditBanner)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCardBg">Loyalty Card Colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="editCardBg"
                    data-testid="input-edit-store-cardbg"
                    value={editCardBg}
                    onChange={e => setEditCardBg(e.target.value)}
                    className="h-9 w-12 rounded-md border cursor-pointer p-0.5"
                  />
                  <span className="text-sm text-muted-foreground font-mono">{editCardBg}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPin">Shift Access PIN</Label>
                <Input
                  id="editPin"
                  data-testid="input-edit-store-pin"
                  placeholder="e.g. 1234"
                  maxLength={8}
                  value={editPin}
                  onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-xs text-muted-foreground">Employees use this PIN to view the public shift schedule.</p>
              </div>

              <Button
                className="w-full"
                data-testid="button-save-store-settings"
                onClick={handleSave}
                disabled={updateMutation.isPending || !editDisplayName}
              >
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
