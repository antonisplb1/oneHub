import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  Search,
  Trash2,
  Tag,
  Mail,
  ToggleLeft,
  Package,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Gift,
  Store as StoreIcon,
  Plus,
  Star,
} from "lucide-react";

interface StoreDetail {
  id: string;
  shopName: string;
  displayName: string | null;
  selectedProducts: string[];
  hasPin: boolean;
  isPrimary: boolean;
  customerCount: number;
  createdAt: string | null;
}

interface Merchant {
  id: string;
  email: string;
  shopName: string;
  subscriptionStatus: string | null;
  selectedProducts: string[];
  customPrice: number | null;
  chargeFree: boolean;
  customerCount: number;
  storeCount: number;
  storeNames: string[];
  stores: StoreDetail[];
  additionalStores: number;
  expectedPrice: number;
  createdAt: string | null;
  lastLoginAt: string | null;
}

const PRODUCTS: { key: string; label: string }[] = [
  { key: "loyalty", label: "Loyalty Cards" },
  { key: "spin", label: "Spin Wheel" },
  { key: "menu", label: "Menu Builder" },
  { key: "shift", label: "Shift Manager" },
];

const STATUSES = ["active", "trialing", "inactive"];

function statusVariant(status: string | null): "default" | "secondary" | "outline" {
  if (status === "active") return "default";
  if (status === "trialing") return "secondary";
  return "outline";
}

function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MerchantsManager() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ merchants: Merchant[] }>({
    queryKey: ["/api/admin/merchants"],
  });

  const merchants = data?.merchants || [];
  const filtered = merchants.filter((m) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.email.toLowerCase().includes(q) ||
      m.shopName.toLowerCase().includes(q) ||
      m.storeNames.some((n) => n.toLowerCase().includes(q))
    );
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/admin/merchants"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/admin/merchants/${id}`, { method: "DELETE" }),
    onSuccess: (res: any) => {
      toast({ title: "Account deleted", description: res.message });
      invalidate();
    },
    onError: (error: any) =>
      toast({
        title: "Delete failed",
        description: error.data?.error || "Failed to delete account",
        variant: "destructive",
      }),
  });

  const priceMutation = useMutation({
    mutationFn: async ({ id, customPrice }: { id: string; customPrice: number | null }) =>
      apiRequest(`/api/admin/merchants/${id}/price`, {
        method: "PATCH",
        body: JSON.stringify({ customPrice }),
      }),
    onSuccess: (res: any) => {
      toast({ title: "Custom price updated", description: res.message });
      invalidate();
    },
    onError: (error: any) =>
      toast({
        title: "Update failed",
        description: error.data?.error || "Failed to update price",
        variant: "destructive",
      }),
  });

  const resetMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/admin/merchants/${id}/password-reset`, { method: "POST" }),
    onSuccess: (res: any) =>
      toast({ title: "Reset email sent", description: res.message }),
    onError: (error: any) =>
      toast({
        title: "Failed to send email",
        description: error.data?.error || "Failed to send reset email",
        variant: "destructive",
      }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, subscriptionStatus }: { id: string; subscriptionStatus: string }) =>
      apiRequest(`/api/admin/merchants/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ subscriptionStatus }),
      }),
    onSuccess: (res: any) => {
      toast({ title: "Status updated", description: res.message });
      invalidate();
    },
    onError: (error: any) =>
      toast({
        title: "Update failed",
        description: error.data?.error || "Failed to update status",
        variant: "destructive",
      }),
  });

  const chargeFreeMutation = useMutation({
    mutationFn: async ({ id, chargeFree }: { id: string; chargeFree: boolean }) =>
      apiRequest(`/api/admin/merchants/${id}/charge-free`, {
        method: "PATCH",
        body: JSON.stringify({ chargeFree }),
      }),
    onSuccess: (res: any) => {
      toast({ title: "Charge-free updated", description: res.message });
      invalidate();
    },
    onError: (error: any) =>
      toast({
        title: "Update failed",
        description: error.data?.error || "Failed to update charge-free status",
        variant: "destructive",
      }),
  });

  const storeCreateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { shopName: string; displayName: string; selectedProducts: string[] } }) =>
      apiRequest(`/api/admin/merchants/${id}/stores`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (res: any) => {
      toast({ title: "Store created", description: res.message });
      invalidate();
    },
    onError: (error: any) =>
      toast({
        title: "Create failed",
        description: error.data?.error || "Failed to create store",
        variant: "destructive",
      }),
  });

  const storeUpdateMutation = useMutation({
    mutationFn: async ({ id, storeId, body }: { id: string; storeId: string; body: Record<string, unknown> }) =>
      apiRequest(`/api/admin/merchants/${id}/stores/${storeId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: (res: any) => {
      toast({ title: "Store updated", description: res.message });
      invalidate();
    },
    onError: (error: any) =>
      toast({
        title: "Update failed",
        description: error.data?.error || "Failed to update store",
        variant: "destructive",
      }),
  });

  const storeDeleteMutation = useMutation({
    mutationFn: async ({ id, storeId }: { id: string; storeId: string }) =>
      apiRequest(`/api/admin/merchants/${id}/stores/${storeId}`, { method: "DELETE" }),
    onSuccess: (res: any) => {
      toast({ title: "Store deleted", description: res.message });
      invalidate();
    },
    onError: (error: any) =>
      toast({
        title: "Delete failed",
        description: error.data?.error || "Failed to delete store",
        variant: "destructive",
      }),
  });

  return (
    <Card data-testid="card-merchants">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-2xl">Accounts</CardTitle>
            <CardDescription className="mt-1">
              Manage merchant accounts and their individual stores
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, account, or store name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-merchants"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading accounts...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center" data-testid="text-no-merchants">
            {merchants.length === 0 ? "No accounts yet" : "No accounts match your search"}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <MerchantRow
                key={m.id}
                merchant={m}
                expanded={expandedId === m.id}
                onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
                deleteMutation={deleteMutation}
                priceMutation={priceMutation}
                resetMutation={resetMutation}
                statusMutation={statusMutation}
                chargeFreeMutation={chargeFreeMutation}
                storeCreateMutation={storeCreateMutation}
                storeUpdateMutation={storeUpdateMutation}
                storeDeleteMutation={storeDeleteMutation}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RowProps {
  merchant: Merchant;
  expanded: boolean;
  onToggle: () => void;
  deleteMutation: any;
  priceMutation: any;
  resetMutation: any;
  statusMutation: any;
  chargeFreeMutation: any;
  storeCreateMutation: any;
  storeUpdateMutation: any;
  storeDeleteMutation: any;
}

function MerchantRow({
  merchant,
  expanded,
  onToggle,
  deleteMutation,
  priceMutation,
  resetMutation,
  statusMutation,
  chargeFreeMutation,
  storeCreateMutation,
  storeUpdateMutation,
  storeDeleteMutation,
}: RowProps) {
  const m = merchant;
  const [priceInput, setPriceInput] = useState(
    m.customPrice != null ? (m.customPrice / 100).toFixed(2) : ""
  );

  const parsedPrice = priceInput.trim() === "" ? null : Math.round(parseFloat(priceInput) * 100);
  const priceValid = priceInput.trim() === "" || (!isNaN(parsedPrice as number) && (parsedPrice as number) >= 0);

  return (
    <div className="rounded-md border p-4" data-testid={`row-merchant-${m.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium" data-testid={`text-merchant-shop-${m.id}`}>
              {m.shopName}
            </span>
            <Badge variant={statusVariant(m.subscriptionStatus)} data-testid={`badge-status-${m.id}`}>
              {m.subscriptionStatus || "inactive"}
            </Badge>
            {m.customPrice != null ? (
              <Badge variant="outline" data-testid={`badge-price-${m.id}`}>
                {formatPrice(m.customPrice)}/mo (custom)
              </Badge>
            ) : m.expectedPrice > 0 ? (
              <Badge variant="outline" data-testid={`badge-price-${m.id}`}>
                {formatPrice(m.expectedPrice)}/mo
                {m.additionalStores > 0 && ` (+${m.additionalStores} store${m.additionalStores !== 1 ? 's' : ''})`}
              </Badge>
            ) : null}
            {m.chargeFree && (
              <Badge variant="secondary" data-testid={`badge-charge-free-${m.id}`}>
                <Gift className="h-3 w-3 mr-1" /> Charge Free
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate" data-testid={`text-merchant-email-${m.id}`}>
            {m.email}
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            <span data-testid={`text-store-count-${m.id}`}>
              {m.storeCount} store{m.storeCount === 1 ? "" : "s"}
            </span>
            {" · "}
            <span data-testid={`text-customer-count-${m.id}`}>
              {m.customerCount} customer{m.customerCount === 1 ? "" : "s"}
            </span>
            {" · Joined "}
            <span data-testid={`text-merchant-joined-${m.id}`}>{formatDate(m.createdAt)}</span>
            {" · Last login "}
            <span data-testid={`text-merchant-last-login-${m.id}`}>
              {m.lastLoginAt ? formatDate(m.lastLoginAt) : "Never"}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          data-testid={`button-toggle-actions-${m.id}`}
        >
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          Manage
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-6 border-t pt-4">
          {/* ── Stores ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <StoreIcon className="h-4 w-4" /> Stores
              </Label>
              <AddStoreDialog
                merchantId={m.id}
                primaryProducts={m.stores.find((s) => s.isPrimary)?.selectedProducts || m.selectedProducts}
                storeCreateMutation={storeCreateMutation}
              />
            </div>
            <div className="space-y-3">
              {m.stores.map((s) => (
                <StoreCard
                  key={s.id}
                  merchantId={m.id}
                  store={s}
                  canDelete={m.stores.length > 1}
                  storeUpdateMutation={storeUpdateMutation}
                  storeDeleteMutation={storeDeleteMutation}
                />
              ))}
            </div>
          </div>

          {/* ── Billing & account controls ─────────────────────────── */}
          <div className="space-y-5 border-t pt-4">
            {/* Custom price */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" /> Custom Monthly Price
              </Label>
              <p className="text-xs text-muted-foreground">
                Overrides the calculated price (primary store products + €5 per additional store).
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Leave empty for standard"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="max-w-[220px]"
                  data-testid={`input-price-${m.id}`}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="default"
                      disabled={!priceValid || priceMutation.isPending}
                      data-testid={`button-save-price-${m.id}`}
                    >
                      Save Price
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Update custom price?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {parsedPrice == null
                          ? `This will clear the custom price for ${m.shopName}. They will be charged the standard calculated price.`
                          : `This will set ${m.shopName}'s monthly charge to ${formatPrice(parsedPrice)}. Stripe checkout will use this amount.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid={`button-cancel-price-${m.id}`}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => priceMutation.mutate({ id: m.id, customPrice: parsedPrice })}
                        data-testid={`button-confirm-price-${m.id}`}
                      >
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Subscription status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <ToggleLeft className="h-4 w-4" /> Subscription Status
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {STATUSES.map((s) => (
                  <AlertDialog key={s}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={m.subscriptionStatus === s ? "default" : "outline"}
                        size="sm"
                        disabled={statusMutation.isPending}
                        data-testid={`button-status-${s}-${m.id}`}
                      >
                        {s}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Change subscription status?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will set {m.shopName}'s subscription status to "{s}" immediately, without going through Stripe.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid={`button-cancel-status-${s}-${m.id}`}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => statusMutation.mutate({ id: m.id, subscriptionStatus: s })}
                          data-testid={`button-confirm-status-${s}-${m.id}`}
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ))}
              </div>
            </div>

            {/* Charge-free */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Gift className="h-4 w-4" /> Charge Free
              </Label>
              <p className="text-xs text-muted-foreground" data-testid={`text-charge-free-status-${m.id}`}>
                {m.chargeFree
                  ? "This account has full access at no cost. Billing is bypassed."
                  : "This account follows normal billing (active subscription or trial)."}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={m.chargeFree ? "outline" : "default"}
                    size="sm"
                    disabled={chargeFreeMutation.isPending}
                    data-testid={`button-charge-free-toggle-${m.id}`}
                  >
                    {m.chargeFree ? "Turn Off Charge Free" : "Make Charge Free"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {m.chargeFree ? "Turn off charge-free?" : "Make this account charge-free?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {m.chargeFree
                        ? `This returns ${m.shopName} to normal billing. Access will again depend on an active subscription or trial.`
                        : `This cancels ${m.shopName}'s active Stripe subscription (if any) and gives them full access to their products at no cost. They won't be billed or prompted to pay.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid={`button-cancel-charge-free-${m.id}`}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => chargeFreeMutation.mutate({ id: m.id, chargeFree: !m.chargeFree })}
                      data-testid={`button-confirm-charge-free-${m.id}`}
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* ── Send reset & Delete account ────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  disabled={resetMutation.isPending}
                  data-testid={`button-send-reset-${m.id}`}
                >
                  <Mail className="h-4 w-4 mr-2" /> Send Password Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send password reset email?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will email a password reset link to {m.email}. The link is valid for 1 hour.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid={`button-cancel-reset-${m.id}`}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => resetMutation.mutate(m.id)}
                    data-testid={`button-confirm-reset-${m.id}`}
                  >
                    Send Email
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="default"
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-${m.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes {m.shopName} ({m.email}), all {m.storeCount} store
                    {m.storeCount === 1 ? "" : "s"}, and ALL their data — customers, loyalty cards,
                    spins, menu, and shifts. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid={`button-cancel-delete-${m.id}`}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(m.id)}
                    data-testid={`button-confirm-delete-${m.id}`}
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}

interface StoreCardProps {
  merchantId: string;
  store: StoreDetail;
  canDelete: boolean;
  storeUpdateMutation: any;
  storeDeleteMutation: any;
}

function StoreCard({ merchantId, store, canDelete, storeUpdateMutation, storeDeleteMutation }: StoreCardProps) {
  const s = store;
  const [displayName, setDisplayName] = useState(s.displayName || "");
  const [shopName, setShopName] = useState(s.shopName);
  const [productSel, setProductSel] = useState<string[]>(s.selectedProducts);
  const [pinInput, setPinInput] = useState("");

  const pinValid = /^\d{4}$/.test(pinInput);
  const detailsChanged = displayName.trim() !== (s.displayName || "") || shopName.trim() !== s.shopName;
  const detailsValid = displayName.trim().length > 0 && /^[a-z0-9-]+$/.test(shopName.trim());

  const toggleProduct = (key: string) =>
    setProductSel((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );

  const productsChanged =
    productSel.length !== s.selectedProducts.length ||
    productSel.some((p) => !s.selectedProducts.includes(p));

  return (
    <div className="rounded-md border bg-muted/30 p-4 space-y-4" data-testid={`store-card-${s.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium" data-testid={`text-store-name-${s.id}`}>
            {s.displayName || s.shopName}
          </span>
          {s.isPrimary && (
            <Badge variant="default" data-testid={`badge-store-primary-${s.id}`}>
              <Star className="h-3 w-3 mr-1" /> Primary
            </Badge>
          )}
          <span className="text-xs text-muted-foreground" data-testid={`text-store-slug-${s.id}`}>
            /{s.shopName}
          </span>
        </div>
        <span className="text-xs text-muted-foreground" data-testid={`text-store-customers-${s.id}`}>
          {s.customerCount} customer{s.customerCount === 1 ? "" : "s"}
        </span>
      </div>

      {s.isPrimary && (
        <p className="text-xs text-muted-foreground">
          This is the primary store — its products set the account's base price.
        </p>
      )}

      {/* Rename / slug */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Store Details</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            data-testid={`input-store-display-${s.id}`}
          />
          <Input
            placeholder="url-slug"
            value={shopName}
            onChange={(e) => setShopName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            data-testid={`input-store-slug-${s.id}`}
          />
        </div>
        <Button
          size="sm"
          disabled={!detailsChanged || !detailsValid || storeUpdateMutation.isPending}
          onClick={() =>
            storeUpdateMutation.mutate({
              id: merchantId,
              storeId: s.id,
              body: { displayName: displayName.trim(), shopName: shopName.trim() },
            })
          }
          data-testid={`button-save-store-details-${s.id}`}
        >
          Save Details
        </Button>
      </div>

      {/* Products */}
      <div className="space-y-2">
        <Label className="text-xs font-medium flex items-center gap-2">
          <Package className="h-4 w-4" /> Product Access
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {PRODUCTS.map((p) => (
            <div key={p.key} className="flex items-center space-x-2">
              <Checkbox
                id={`product-${p.key}-${s.id}`}
                checked={productSel.includes(p.key)}
                onCheckedChange={() => toggleProduct(p.key)}
                data-testid={`checkbox-product-${p.key}-${s.id}`}
              />
              <Label htmlFor={`product-${p.key}-${s.id}`} className="text-sm font-normal cursor-pointer">
                {p.label}
              </Label>
            </div>
          ))}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              disabled={!productsChanged || storeUpdateMutation.isPending}
              data-testid={`button-save-products-${s.id}`}
            >
              Save Products
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update product access?</AlertDialogTitle>
              <AlertDialogDescription>
                This changes which products "{s.displayName || s.shopName}" can access, applied immediately.
                {s.isPrimary
                  ? " As the primary store, this also updates the account's base price calculation."
                  : " This does not change the account's bill."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid={`button-cancel-products-${s.id}`}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  storeUpdateMutation.mutate({
                    id: merchantId,
                    storeId: s.id,
                    body: { selectedProducts: productSel },
                  })
                }
                data-testid={`button-confirm-products-${s.id}`}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Shift PIN */}
      <div className="space-y-2">
        <Label className="text-xs font-medium flex items-center gap-2">
          <KeyRound className="h-4 w-4" /> Shift Access PIN
        </Label>
        <p className="text-xs text-muted-foreground" data-testid={`text-pin-status-${s.id}`}>
          {s.hasPin
            ? "A PIN is set for this store's public shift schedule."
            : "No PIN is set for this store's public shift schedule."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="max-w-[160px]"
            data-testid={`input-pin-${s.id}`}
          />
          <Button
            size="default"
            disabled={!pinValid || storeUpdateMutation.isPending}
            onClick={() => {
              storeUpdateMutation.mutate({ id: merchantId, storeId: s.id, body: { pin: pinInput } });
              setPinInput("");
            }}
            data-testid={`button-save-pin-${s.id}`}
          >
            Set PIN
          </Button>
          {s.hasPin && (
            <Button
              variant="outline"
              size="default"
              disabled={storeUpdateMutation.isPending}
              onClick={() => {
                storeUpdateMutation.mutate({ id: merchantId, storeId: s.id, body: { pin: null } });
                setPinInput("");
              }}
              data-testid={`button-clear-pin-${s.id}`}
            >
              Clear PIN
            </Button>
          )}
        </div>
      </div>

      {/* Delete store */}
      <div className="border-t pt-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={!canDelete || storeDeleteMutation.isPending}
              data-testid={`button-delete-store-${s.id}`}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete Store
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this store?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes "{s.displayName || s.shopName}" and all of its data —
                customers, loyalty cards, spins, menu, and shifts.
                {s.isPrimary
                  ? " As this is the primary store, the next-oldest store becomes primary and will drive the account's base price."
                  : " This removes the €5/mo charge for this additional store."}
                {" "}This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid={`button-cancel-delete-store-${s.id}`}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => storeDeleteMutation.mutate({ id: merchantId, storeId: s.id })}
                data-testid={`button-confirm-delete-store-${s.id}`}
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {!canDelete && (
          <p className="text-xs text-muted-foreground mt-1">
            Cannot delete the account's only store.
          </p>
        )}
      </div>
    </div>
  );
}

interface AddStoreDialogProps {
  merchantId: string;
  primaryProducts: string[];
  storeCreateMutation: any;
}

function AddStoreDialog({ merchantId, primaryProducts, storeCreateMutation }: AddStoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [shopName, setShopName] = useState("");
  const [productSel, setProductSel] = useState<string[]>(primaryProducts);

  const valid = displayName.trim().length > 0 && /^[a-z0-9-]+$/.test(shopName.trim());

  const toggleProduct = (key: string) =>
    setProductSel((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );

  const reset = () => {
    setDisplayName("");
    setShopName("");
    setProductSel(primaryProducts);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset();
      }}
    >
      <AlertDialogTrigger asChild>
        <Button size="sm" data-testid={`button-add-store-${merchantId}`}>
          <Plus className="h-4 w-4 mr-1" /> Add Store
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add a store</AlertDialogTitle>
          <AlertDialogDescription>
            Each additional store adds a flat €5/mo to the account, regardless of products.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Display Name</Label>
            <Input
              placeholder="Second Location"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              data-testid={`input-new-store-display-${merchantId}`}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">URL Slug</Label>
            <Input
              placeholder="second-location"
              value={shopName}
              onChange={(e) => setShopName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              data-testid={`input-new-store-slug-${merchantId}`}
            />
            <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" /> Product Access
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PRODUCTS.map((p) => (
                <div key={p.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`new-product-${p.key}-${merchantId}`}
                    checked={productSel.includes(p.key)}
                    onCheckedChange={() => toggleProduct(p.key)}
                    data-testid={`checkbox-new-product-${p.key}-${merchantId}`}
                  />
                  <Label htmlFor={`new-product-${p.key}-${merchantId}`} className="text-sm font-normal cursor-pointer">
                    {p.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`button-cancel-add-store-${merchantId}`}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!valid || storeCreateMutation.isPending}
            onClick={() =>
              storeCreateMutation.mutate({
                id: merchantId,
                body: {
                  shopName: shopName.trim(),
                  displayName: displayName.trim(),
                  selectedProducts: productSel,
                },
              })
            }
            data-testid={`button-confirm-add-store-${merchantId}`}
          >
            Create Store
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
