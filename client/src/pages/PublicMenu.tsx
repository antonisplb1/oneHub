import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed } from "lucide-react";
import type { MenuCategory, MenuItem } from "@shared/schema";

interface MenuResponse {
  merchant: {
    shopName: string;
    logo: string | null;
  };
  categories: Array<MenuCategory & { items: MenuItem[] }>;
}

export default function PublicMenu() {
  const { merchantId } = useParams();

  const { data, isLoading, error } = useQuery<MenuResponse>({
    queryKey: ['/api/menu', merchantId],
    queryFn: async () => {
      const response = await fetch(`/api/menu/${merchantId}`);
      if (!response.ok) {
        throw new Error('Failed to load menu');
      }
      return response.json();
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-48" data-testid="skeleton-header" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md" data-testid="error-state">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UtensilsCrossed className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Menu Not Found</h3>
            <p className="text-muted-foreground text-center">
              {error?.message || "We couldn't find this menu. Please check the link and try again."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.categories.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              {data.merchant.logo && (
                <img
                  src={data.merchant.logo}
                  alt={data.merchant.shopName}
                  className="w-12 h-12 rounded-md object-cover"
                  data-testid="merchant-logo"
                />
              )}
              <h1 className="text-3xl font-semibold" data-testid="merchant-name">
                {data.merchant.shopName}
              </h1>
            </div>
          </div>

          <Card className="border-card-border shadow-sm" data-testid="empty-state">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <UtensilsCrossed className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Menu Available</h3>
              <p className="text-muted-foreground text-center">
                This merchant hasn't added any menu items yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            {data.merchant.logo && (
              <img
                src={data.merchant.logo}
                alt={data.merchant.shopName}
                className="w-12 h-12 rounded-md object-cover"
                data-testid="merchant-logo"
              />
            )}
            <h1 className="text-3xl font-semibold" data-testid="merchant-name">
              {data.merchant.shopName}
            </h1>
          </div>
          <p className="text-muted-foreground">Menu</p>
        </div>

        <Accordion type="multiple" className="space-y-4" data-testid="menu-accordion">
          {data.categories.map((category) => (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="border rounded-lg"
              data-testid={`category-${category.id}`}
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover-elevate">
                <div className="flex items-center justify-between w-full pr-4">
                  <h2 className="text-xl font-semibold text-left" data-testid={`category-name-${category.id}`}>
                    {category.name}
                  </h2>
                  <span className="text-sm text-muted-foreground" data-testid={`category-count-${category.id}`}>
                    {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-4 pt-2">
                  {category.items.map((item) => (
                    <Card
                      key={item.id}
                      className="border-card-border shadow-sm overflow-hidden"
                      data-testid={`item-${item.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                              data-testid={`item-image-${item.id}`}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <h3 className="font-semibold text-lg" data-testid={`item-name-${item.id}`}>
                                {item.name}
                              </h3>
                              <span
                                className="font-semibold text-lg text-primary flex-shrink-0"
                                data-testid={`item-price-${item.id}`}
                              >
                                {formatPrice(item.price)}
                              </span>
                            </div>
                            {item.description && (
                              <p
                                className="text-sm text-muted-foreground"
                                data-testid={`item-description-${item.id}`}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
