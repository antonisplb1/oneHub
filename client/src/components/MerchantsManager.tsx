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
} from "lucide-react";

interface Merchant {
  id: string;
  email: string;
  shopName: string;
  subscriptionStatus: string | null;
  selectedProducts: string[];
  customPrice: number | null;
  customerCount: number;
  createdAt: string | null;
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
      m.shopName.toLowerCase().includes(q)
    );
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/admin/merchants"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/admin/merchants/${id}`, { method: "DELETE" }),
    onSuccess: (res: any) => {
      toast({ title: "Merchant deleted", description: res.message });
      invalidate();
    },
    onError: (error: any) =>
      toast({
        title: "Delete failed",
        description: error.data?.error || "Failed to delete merchant",
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

  const productsMutation = useMutation({
    mutationFn: async ({ id, selectedProducts }: { id: string; selectedProducts: string[] }) =>
      apiRequest(`/api/admin/merchants/${id}/products`, {
        method: "PATCH",
        body: JSON.stringify({ selectedProducts }),
      }),
    onSuccess: (res: any) => {
      toast({ title: "Products updated", description: res.message });
      invalidate();
    },
    onError: (error: any) =>
      toast({
        title: "Update failed",
        description: error.data?.error || "Failed to update products",
        variant: "destructive",
      }),
  });

  return (
    <Card data-testid="card-merchants">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-2xl">Merchants</CardTitle>
            <CardDescription className="mt-1">
              View and manage all registered merchant accounts
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or shop name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-merchants"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading merchants...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center" data-testid="text-no-merchants">
            {merchants.length === 0 ? "No merchants yet" : "No merchants match your search"}
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
                productsMutation={productsMutation}
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
  productsMutation: any;
}

function MerchantRow({
  merchant,
  expanded,
  onToggle,
  deleteMutation,
  priceMutation,
  resetMutation,
  statusMutation,
  productsMutation,
}: RowProps) {
  const m = merchant;
  const [priceInput, setPriceInput] = useState(
    m.customPrice != null ? (m.customPrice / 100).toFixed(2) : ""
  );
  const [pendingStatus, setPendingStatus] = useState(m.subscriptionStatus || "inactive");
  const [productSel, setProductSel] = useState<string[]>(m.selectedProducts);

  const toggleProduct = (key: string) =>
    setProductSel((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
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
            {m.customPrice != null && (
              <Badge variant="outline" data-testid={`badge-price-${m.id}`}>
                {formatPrice(m.customPrice)}/mo
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate" data-testid={`text-merchant-email-${m.id}`}>
            {m.email}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {m.selectedProducts.length === 0 ? (
              <span className="text-xs text-muted-foreground">No products</span>
            ) : (
              m.selectedProducts.map((p) => (
                <Badge key={p} variant="secondary" data-testid={`pill-product-${p}-${m.id}`}>
                  {PRODUCTS.find((x) => x.key === p)?.label || p}
                </Badge>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground pt-1" data-testid={`text-customer-count-${m.id}`}>
            {m.customerCount} customer{m.customerCount === 1 ? "" : "s"}
            {m.createdAt && (
              <span data-testid={`text-merchant-joined-${m.id}`}>
                {" · Joined "}
                {new Date(m.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
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
        <div className="mt-4 space-y-5 border-t pt-4">
          {/* Custom price */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" /> Custom Monthly Price
            </Label>
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
                      onClick={() => setPendingStatus(s)}
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

          {/* Product access */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" /> Product Access
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PRODUCTS.map((p) => (
                <div key={p.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`product-${p.key}-${m.id}`}
                    checked={productSel.includes(p.key)}
                    onCheckedChange={() => toggleProduct(p.key)}
                    data-testid={`checkbox-product-${p.key}-${m.id}`}
                  />
                  <Label htmlFor={`product-${p.key}-${m.id}`} className="text-sm font-normal cursor-pointer">
                    {p.label}
                  </Label>
                </div>
              ))}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={productsMutation.isPending}
                  data-testid={`button-save-products-${m.id}`}
                >
                  Save Products
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Update product access?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will change which products {m.shopName} can access, applied immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid={`button-cancel-products-${m.id}`}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => productsMutation.mutate({ id: m.id, selectedProducts: productSel })}
                    data-testid={`button-confirm-products-${m.id}`}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Send reset & Delete */}
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
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Merchant
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this merchant?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes {m.shopName} ({m.email}) and ALL their data —
                    customers, loyalty cards, spins, menu, and shifts. This cannot be undone.
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
