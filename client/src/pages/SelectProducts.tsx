import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, Gift, Loader2, UtensilsCrossed, Calendar } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: typeof Ticket;
}

const products: Product[] = [
  {
    id: 'loyalty',
    name: 'Loyalty Cards',
    description: 'Digital loyalty card program with stamp collection and rewards',
    price: 10,
    icon: Ticket,
  },
  {
    id: 'spin',
    name: 'Spin Wheel',
    description: 'Interactive prize wheel campaigns for customer engagement',
    price: 8,
    icon: Gift,
  },
  {
    id: 'menu',
    name: 'Menu Builder',
    description: 'Create and manage your digital menu for customers',
    price: 5,
    icon: UtensilsCrossed,
  },
  {
    id: 'shift',
    name: 'Shift Manager',
    description: 'Employee shift scheduling with weekly calendar and crew management',
    price: 10,
    icon: Calendar,
  },
];

export default function SelectProducts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const selectProductsMutation = useMutation({
    mutationFn: async (products: string[]) => {
      // First, save the selected products
      await apiRequest('/api/user/select-products', {
        method: 'POST',
        body: JSON.stringify({ products }),
      });
      
      // Then, create a checkout session
      const checkoutRes = await apiRequest<{ url: string }>('/api/stripe/create-checkout-session', {
        method: 'POST',
      });
      
      return checkoutRes;
    },
    onSuccess: (data) => {
      toast({
        title: "Products selected",
        description: "Opening checkout in new tab...",
      });
      // Open Stripe checkout in new tab (fixes Replit iframe sandbox restrictions)
      window.open(data.url, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: "Selection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const calculateTotal = () => {
    const sorted = [...selectedProducts].sort();
    
    // All four products - Bundle discount (€24.99 instead of €33)
    if (sorted.length === 4 && sorted.includes('loyalty') && sorted.includes('spin') && sorted.includes('menu') && sorted.includes('shift')) {
      return 24.99;
    }
    // Individual prices for all other combinations
    else {
      return selectedProducts.reduce((total, id) => {
        const product = products.find(p => p.id === id);
        return total + (product?.price || 0);
      }, 0);
    }
  };

  const handleContinue = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product",
        variant: "destructive",
      });
      return;
    }
    selectProductsMutation.mutate(selectedProducts);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle data-testid="text-page-title">Choose Your Products</CardTitle>
              <CardDescription data-testid="text-page-description">
                Select the features you want to include in your subscription
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {products.map((product) => {
            const Icon = product.icon;
            const isSelected = selectedProducts.includes(product.id);
            
            return (
              <Card
                key={product.id}
                className={`cursor-pointer transition-all hover-elevate ${
                  isSelected ? 'border-primary' : ''
                }`}
                onClick={() => toggleProduct(product.id)}
                data-testid={`card-product-${product.id}`}
              >
                <CardContent className="flex items-start gap-4 p-6">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProduct(product.id)}
                      data-testid={`checkbox-product-${product.id}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-product-description-${product.id}`}>
                      {product.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" data-testid={`text-product-price-${product.id}`}>
                      €{product.price}
                    </div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {selectedProducts.length === 4 && selectedProducts.includes('loyalty') && selectedProducts.includes('spin') && selectedProducts.includes('menu') && selectedProducts.includes('shift') && (
            <Card className="bg-primary/5 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary" data-testid="text-bundle-discount">
                      Complete Bundle Discount! 🎉
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Save €8/month when you get all four products
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground line-through">€33</div>
                    <div className="text-2xl font-bold text-primary">€24.99</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedProducts.length === 3 && selectedProducts.includes('loyalty') && selectedProducts.includes('spin') && selectedProducts.includes('menu') && (
            <Card className="bg-primary/5 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary" data-testid="text-bundle-discount">
                      Bundle Discount Applied! 🎉
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Save €7/month when you get all three products
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground line-through">€30</div>
                    <div className="text-2xl font-bold text-primary">€23</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedProducts.length === 2 && selectedProducts.includes('loyalty') && selectedProducts.includes('spin') && (
            <Card className="bg-primary/5 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary" data-testid="text-bundle-discount">
                      Bundle Discount Applied! 🎉
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Save €5/month when you get both products
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground line-through">€25</div>
                    <div className="text-2xl font-bold text-primary">€20</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full flex items-center justify-between p-4 bg-muted rounded-md">
            <span className="font-semibold">Total:</span>
            <span className="text-2xl font-bold" data-testid="text-total-price">
              €{calculateTotal()}/month
            </span>
          </div>
          <Button
            onClick={handleContinue}
            disabled={selectedProducts.length === 0 || selectProductsMutation.isPending}
            className="w-full"
            size="lg"
            data-testid="button-continue"
          >
            {selectProductsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to Payment"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
