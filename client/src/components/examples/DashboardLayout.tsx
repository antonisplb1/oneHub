import DashboardLayout from '../DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardLayoutExample() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">245</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">189</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Spins This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">67</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
