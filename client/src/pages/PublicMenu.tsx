import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UtensilsCrossed } from "lucide-react";
import type { MenuCategory, MenuItem } from "@shared/schema";
import { useEffect, useRef, useState } from "react";

interface MenuResponse {
  merchant: {
    shopName: string;
    logo: string | null;
  };
  categories: Array<MenuCategory & { items: MenuItem[] }>;
}

export default function PublicMenu() {
  const { merchantId } = useParams();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Set initial active category
  useEffect(() => {
    if (data?.categories && data.categories.length > 0 && !activeCategory) {
      setActiveCategory(data.categories[0].id);
    }
  }, [data, activeCategory]);

  // Scroll spy - update active tab based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const scrollPosition = window.scrollY + 200; // Offset for sticky header

      for (const category of data?.categories || []) {
        const element = categoryRefs.current[category.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveCategory(category.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data?.categories]);

  // Handle tab click - scroll to category
  const scrollToCategory = (categoryId: string) => {
    const element = categoryRefs.current[categoryId];
    if (element) {
      const yOffset = -120; // Offset for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveCategory(categoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--menu-background))]">
        <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" data-testid="skeleton-header" />
            <Skeleton className="h-12 w-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--menu-background))] flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[hsl(var(--menu-card))] border-[hsl(var(--menu-card-border))]" data-testid="error-state">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UtensilsCrossed className="w-16 h-16 text-[hsl(var(--menu-muted-foreground))] mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--menu-foreground))]">Menu Not Found</h3>
            <p className="text-[hsl(var(--menu-muted-foreground))] text-center">
              {error?.message || "We couldn't find this menu. Please check the link and try again."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.categories.length === 0) {
    return (
      <div className="min-h-screen bg-[hsl(var(--menu-background))]">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[hsl(var(--menu-accent))] to-[hsl(var(--menu-accent))]/80 py-12">
          <div className="w-full max-w-6xl mx-auto px-6">
            <div className="flex flex-col items-center gap-4 text-center">
              {data.merchant.logo && (
                <img
                  src={data.merchant.logo}
                  alt={data.merchant.shopName}
                  className="w-24 h-24 rounded-lg object-cover shadow-lg"
                  data-testid="merchant-logo"
                />
              )}
              <h1 className="text-4xl font-bold text-[hsl(var(--menu-accent-foreground))]" data-testid="merchant-name">
                {data.merchant.shopName}
              </h1>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto p-6">
          <Card className="border-[hsl(var(--menu-card-border))] bg-[hsl(var(--menu-card))] shadow-sm" data-testid="empty-state">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <UtensilsCrossed className="w-16 h-16 text-[hsl(var(--menu-muted-foreground))] mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--menu-foreground))]">No Menu Available</h3>
              <p className="text-[hsl(var(--menu-muted-foreground))] text-center">
                This merchant hasn't added any menu items yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--menu-background))]" ref={scrollContainerRef}>
      {/* Hero Section with Gradient */}
      <div className="bg-gradient-to-br from-[hsl(var(--menu-accent))] to-[hsl(var(--menu-accent))]/80 py-12">
        <div className="w-full max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            {data.merchant.logo && (
              <img
                src={data.merchant.logo}
                alt={data.merchant.shopName}
                className="w-24 h-24 rounded-lg object-cover shadow-lg"
                data-testid="merchant-logo"
              />
            )}
            <h1 className="text-4xl font-normal text-[hsl(var(--menu-accent-foreground))]" data-testid="merchant-name">
              {data.merchant.shopName}
            </h1>
          </div>
        </div>
      </div>

      {/* Sticky Category Navigation Tabs */}
      <div className="sticky top-0 z-10 bg-[hsl(var(--menu-background))] border-b border-[hsl(var(--menu-card-border))] shadow-sm">
        <div className="w-full max-w-6xl mx-auto px-6 py-4">
          <Tabs value={activeCategory} onValueChange={scrollToCategory}>
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-auto bg-[hsl(var(--menu-muted))] p-1" data-testid="menu-accordion">
                {data.categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="text-base px-6 py-3 data-[state=active]:bg-[hsl(var(--menu-card))] data-[state=active]:text-[hsl(var(--menu-foreground))]"
                    data-testid={`category-${category.id}`}
                  >
                    <span data-testid={`category-name-${category.id}`}>{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      {/* Menu Categories and Items - Open Layout */}
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-12">
          {data.categories.map((category) => (
            <section
              key={category.id}
              ref={(el) => (categoryRefs.current[category.id] = el)}
              className="scroll-mt-32"
            >
              {/* Category Header */}
              <div className="mb-5">
                <h2 className="text-2xl font-normal text-[hsl(var(--menu-foreground))]">
                  {category.name}
                </h2>
                <p className="text-sm font-light text-[hsl(var(--menu-muted-foreground))] mt-1" data-testid={`category-count-${category.id}`}>
                  {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>

              {/* Menu Items */}
              <div className="grid gap-4">
                {category.items.map((item) => (
                  <Card
                    key={item.id}
                    className="border-[hsl(var(--menu-card-border))] bg-[hsl(var(--menu-card))] shadow-sm overflow-hidden hover-elevate"
                    data-testid={`item-${item.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Item Image */}
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                            data-testid={`item-image-${item.id}`}
                          />
                        )}

                        {/* Item Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <h3 className="text-lg font-normal text-[hsl(var(--menu-foreground))]" data-testid={`item-name-${item.id}`}>
                                {item.name}
                              </h3>
                              <span
                                className="text-base font-medium text-[hsl(var(--menu-price))] flex-shrink-0"
                                data-testid={`item-price-${item.id}`}
                              >
                                {formatPrice(item.price)}
                              </span>
                            </div>
                            {item.description && (
                              <p
                                className="text-sm font-light text-[hsl(var(--menu-muted-foreground))] leading-relaxed"
                                data-testid={`item-description-${item.id}`}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
