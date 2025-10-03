import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, QrCode } from "lucide-react";
import type { Customer } from "@shared/schema";

export default function CustomersSection() {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => apiRequest<Customer[]>("/api/customers"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Customers</h1>
        <p className="text-muted-foreground text-lg">
          View all customers enrolled in your loyalty program
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="hover-elevate border-card-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{customers.length}</p>
          </CardContent>
        </Card>

        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold">Customer List</CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No customers yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Share your join QR code to get customers enrolled
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-5 border rounded-xl hover-elevate"
                    data-testid={`customer-${customer.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-base font-semibold text-primary">
                          {customer.name?.substring(0, 2).toUpperCase() || "??"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-lg">{customer.name || "Unknown"}</p>
                        {customer.email && (
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                        <QrCode className="h-3.5 w-3.5" />
                        {customer.customerQrCode}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
