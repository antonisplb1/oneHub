import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, Mail, Shield, CheckCircle2, XCircle, Store as StoreIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Subuser } from "@shared/schema";
import type { Store } from "@/contexts/StoreContext";

const PERMISSION_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard', description: 'Access to overview and home page' },
  { value: 'customers', label: 'Customers', description: 'View and manage customer list' },
  { value: 'loyalty', label: 'Loyalty Cards', description: 'Manage customer loyalty cards and stamps' },
  { value: 'spin', label: 'Spin Wheel', description: 'Create spin tokens and manage prizes' },
  { value: 'menu', label: 'Menu Builder', description: 'Edit menu categories and items' },
  { value: 'shift', label: 'Shift Manager', description: 'Manage crew members and shifts' },
  { value: 'analytics', label: 'Analytics', description: 'View reports and analytics' },
];

export default function TeamManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingSubuser, setDeletingSubuser] = useState<Subuser | null>(null);
  const [editingSubuser, setEditingSubuser] = useState<Subuser | null>(null);
  const [email, setEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  // null = all stores; array = restricted list
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[] | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: subusersData, isLoading, error } = useQuery<{ subusers: Subuser[] }>({
    queryKey: ["/api/subusers"],
  });

  const { data: storesData = [] } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  // Handle 403 errors - redirect subusers who try to access owner-only features
  useEffect(() => {
    if (error) {
      const errorMessage = error.message || '';
      if (errorMessage.includes('403') || errorMessage.includes('permission') || errorMessage.includes('owner')) {
        toast({
          title: "Access Denied",
          description: "This feature is only available to account owners",
          variant: "destructive",
        });
        setLocation('/dashboard');
      }
    }
  }, [error, toast, setLocation]);

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; permissions: string[]; storeIds: string[] | null }) => {
      return await apiRequest("/api/subusers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subusers"] });
      setIsAddDialogOpen(false);
      setEmail("");
      setSelectedPermissions([]);
      setSelectedStoreIds(null);
      toast({
        title: "Success",
        description: "Team member invited successfully. They will receive an email to set up their account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to invite team member",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, permissions, storeIds }: { id: string; permissions: string[]; storeIds: string[] | null }) => {
      return await apiRequest(`/api/subusers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ permissions, storeIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subusers"] });
      setIsEditDialogOpen(false);
      setEditingSubuser(null);
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/subusers/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subusers"] });
      setDeletingSubuser(null);
      toast({
        title: "Success",
        description: "Team member removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove team member",
        variant: "destructive",
      });
    },
  });

  const handleAddSubuser = () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    // null selectedStoreIds = all stores; send null to backend
    createMutation.mutate({ email, permissions: selectedPermissions, storeIds: selectedStoreIds });
  };

  const handleUpdatePermissions = () => {
    if (!editingSubuser) return;
    updateMutation.mutate({
      id: editingSubuser.id,
      permissions: selectedPermissions,
      storeIds: selectedStoreIds,
    });
  };

  const handleEditClick = (subuser: Subuser) => {
    setEditingSubuser(subuser);
    setSelectedPermissions(subuser.permissions || []);
    setSelectedStoreIds(subuser.storeIds ?? null);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (subuser: Subuser) => {
    setDeletingSubuser(subuser);
  };

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleStoreToggle = (storeId: string) => {
    setSelectedStoreIds((prev) => {
      // null = all stores; convert to explicit list when toggling
      const current = prev ?? storesData.map(s => s.id);
      if (current.includes(storeId)) {
        const next = current.filter(id => id !== storeId);
        // Prevent deselecting the last store — must have at least one
        if (next.length === 0) return current;
        // If all stores are now selected → revert to null (unrestricted)
        return next.length === storesData.length ? null : next;
      } else {
        const next = [...current, storeId];
        return next.length === storesData.length ? null : next;
      }
    });
  };

  const isStoreSelected = (storeId: string): boolean => {
    if (selectedStoreIds === null) return true; // all stores
    return selectedStoreIds.includes(storeId);
  };

  const getStoreLabel = (subuser: Subuser): string => {
    const ids: string[] | null = subuser.storeIds ?? null;
    if (ids === null || ids.length === storesData.length) return "All stores";
    const names = ids
      .map(id => storesData.find(s => s.id === id)?.displayName || id)
      .join(", ");
    return names || "All stores";
  };

  const resetAddDialog = () => {
    setEmail("");
    setSelectedPermissions([]);
    setSelectedStoreIds(null);
    setIsAddDialogOpen(false);
  };

  const resetEditDialog = () => {
    setEditingSubuser(null);
    setSelectedPermissions([]);
    setSelectedStoreIds(null);
    setIsEditDialogOpen(false);
  };

  const multipleStores = storesData.length > 1;

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Team Management</h1>
          <p className="text-muted-foreground">Invite team members and manage their permissions</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          data-testid="button-add-team-member"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage your team members and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="loading-message">
              Loading team members...
            </div>
          ) : !subusersData?.subusers || subusersData.subusers.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-state">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No team members yet</p>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-member">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Team Member
              </Button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  {multipleStores && <TableHead>Store Access</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subusersData.subusers.map((subuser) => (
                  <TableRow key={subuser.id} data-testid={`row-subuser-${subuser.id}`}>
                    <TableCell className="font-medium" data-testid={`text-email-${subuser.id}`}>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {subuser.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subuser.emailVerified ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" data-testid={`badge-verified-${subuser.id}`}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" data-testid={`badge-pending-${subuser.id}`}>
                          <XCircle className="w-3 h-3 mr-1" />
                          Pending Setup
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-permissions-${subuser.id}`}>
                      <div className="flex flex-wrap gap-1">
                        {subuser.permissions && subuser.permissions.length > 0 ? (
                          subuser.permissions.map((perm) => {
                            const permOption = PERMISSION_OPTIONS.find((p) => p.value === perm);
                            return (
                              <Badge key={perm} variant="secondary" data-testid={`badge-permission-${perm}-${subuser.id}`}>
                                {permOption?.label || perm}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-sm text-muted-foreground">No permissions</span>
                        )}
                      </div>
                    </TableCell>
                    {multipleStores && (
                      <TableCell data-testid={`text-stores-${subuser.id}`}>
                        <span className="text-sm text-muted-foreground">{getStoreLabel(subuser)}</span>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(subuser)}
                          data-testid={`button-edit-${subuser.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(subuser)}
                          data-testid={`button-delete-${subuser.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Team Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && resetAddDialog()}>
        <DialogContent data-testid="dialog-add-member">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to a team member. They'll receive an email to set up their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                data-testid="input-email"
                type="email"
                placeholder="team.member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Permissions
              </Label>
              <div className="space-y-3">
                {PERMISSION_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3" data-testid={`checkbox-container-${option.value}`}>
                    <Checkbox
                      id={`add-${option.value}`}
                      checked={selectedPermissions.includes(option.value)}
                      onCheckedChange={() => handlePermissionToggle(option.value)}
                      data-testid={`checkbox-${option.value}`}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`add-${option.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {multipleStores && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <StoreIcon className="w-4 h-4" />
                  Store Access
                </Label>
                <p className="text-sm text-muted-foreground">
                  Which stores can this person access? Leave all checked for unrestricted access.
                </p>
                <div className="space-y-3">
                  {storesData.map((store) => (
                    <div key={store.id} className="flex items-center space-x-3" data-testid={`store-checkbox-container-${store.id}`}>
                      <Checkbox
                        id={`add-store-${store.id}`}
                        checked={isStoreSelected(store.id)}
                        onCheckedChange={() => handleStoreToggle(store.id)}
                        data-testid={`store-checkbox-${store.id}`}
                      />
                      <Label
                        htmlFor={`add-store-${store.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {store.displayName || store.shopName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetAddDialog}
              data-testid="button-cancel-add"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubuser}
              disabled={createMutation.isPending}
              data-testid="button-confirm-add"
            >
              {createMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && resetEditDialog()}>
        <DialogContent data-testid="dialog-edit-permissions">
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Update permissions for {editingSubuser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Permissions
            </Label>
            <div className="space-y-3">
              {PERMISSION_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-3" data-testid={`edit-checkbox-container-${option.value}`}>
                  <Checkbox
                    id={`edit-${option.value}`}
                    checked={selectedPermissions.includes(option.value)}
                    onCheckedChange={() => handlePermissionToggle(option.value)}
                    data-testid={`edit-checkbox-${option.value}`}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={`edit-${option.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {multipleStores && (
              <div className="space-y-3 pt-2">
                <Label className="flex items-center gap-2">
                  <StoreIcon className="w-4 h-4" />
                  Store Access
                </Label>
                <p className="text-sm text-muted-foreground">
                  Which stores can this person access? Leave all checked for unrestricted access.
                </p>
                <div className="space-y-3">
                  {storesData.map((store) => (
                    <div key={store.id} className="flex items-center space-x-3" data-testid={`edit-store-checkbox-container-${store.id}`}>
                      <Checkbox
                        id={`edit-store-${store.id}`}
                        checked={isStoreSelected(store.id)}
                        onCheckedChange={() => handleStoreToggle(store.id)}
                        data-testid={`edit-store-checkbox-${store.id}`}
                      />
                      <Label
                        htmlFor={`edit-store-${store.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {store.displayName || store.shopName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetEditDialog}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              disabled={updateMutation.isPending}
              data-testid="button-confirm-edit"
            >
              {updateMutation.isPending ? "Updating..." : "Update Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSubuser} onOpenChange={(open) => !open && setDeletingSubuser(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deletingSubuser?.email}</strong>? 
              They will lose access to your account immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSubuser && deleteMutation.mutate(deletingSubuser.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
