import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronLeft, ChevronRight, Users, Calendar, Copy, Clock, Pencil, CopyPlus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCrewMemberSchema, insertShiftSchema, insertTimeframePresetSchema, type CrewMember, type Shift, type TimeframePreset } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { getWeekRange, addWeeks as dateAddWeeks } from "@/lib/shiftDates";
import { ShiftSchedule } from "@/components/ShiftSchedule";

type CrewMemberFormValues = z.infer<typeof insertCrewMemberSchema>;
type ShiftFormValues = z.infer<typeof insertShiftSchema>;
type TimeframePresetFormValues = z.infer<typeof insertTimeframePresetSchema>;

const shiftFormSchema = insertShiftSchema.extend({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
}).refine(
  (data) => {
    if (!data.startTime || !data.endTime) return true;
    return data.endTime > data.startTime;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

export default function ShiftsManager() {
  const [isCrewDialogOpen, setIsCrewDialogOpen] = useState(false);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingCrew, setDeletingCrew] = useState<CrewMember | null>(null);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<TimeframePreset | null>(null);
  const [deletingPreset, setDeletingPreset] = useState<TimeframePreset | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copyDialogData, setCopyDialogData] = useState<{ count: number; nextWeekHasShifts: boolean } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const crewForm = useForm<CrewMemberFormValues>({
    resolver: zodResolver(insertCrewMemberSchema),
    defaultValues: {
      name: "",
    },
  });

  const shiftForm = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      employeeName: "",
      employeeRole: "",
      shiftDate: "",
      startTime: "",
      endTime: "",
      notes: "",
    },
  });

  const presetForm = useForm<TimeframePresetFormValues>({
    resolver: zodResolver(insertTimeframePresetSchema),
    defaultValues: {
      name: "",
      startTime: "",
      endTime: "",
    },
  });

  const { data: crewMembers = [], isLoading: crewLoading } = useQuery<CrewMember[]>({
    queryKey: ["/api/crew-members"],
  });

  const { data: timeframePresets = [], isLoading: presetsLoading } = useQuery<TimeframePreset[]>({
    queryKey: ["/api/timeframe-presets"],
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: pinData, isLoading: pinLoading } = useQuery<{ hasPIN: boolean }>({
    queryKey: ["/api/shift-pin"],
  });

  const createCrewMutation = useMutation({
    mutationFn: async (data: CrewMemberFormValues) => {
      return apiRequest("/api/crew-members", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crew-members"] });
      toast({
        title: "Success",
        description: "Crew member added successfully",
      });
      crewForm.reset();
      setIsCrewDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add crew member",
        variant: "destructive",
      });
    },
  });

  const deleteCrewMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/crew-members/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crew-members"] });
      toast({
        title: "Success",
        description: "Crew member deleted successfully",
      });
      setDeletingCrew(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete crew member",
        variant: "destructive",
      });
    },
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: ShiftFormValues) => {
      return apiRequest("/api/shifts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Success",
        description: "Shift created successfully",
      });
      shiftForm.reset();
      setIsShiftDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shift",
        variant: "destructive",
      });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ShiftFormValues }) => {
      return apiRequest(`/api/shifts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Success",
        description: "Shift updated successfully",
      });
      shiftForm.reset();
      setEditingShift(null);
      setIsShiftDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update shift",
        variant: "destructive",
      });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/shifts/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Success",
        description: "Shift deleted successfully",
      });
      setDeletingShift(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete shift",
        variant: "destructive",
      });
    },
  });

  const copyToNextWeekMutation = useMutation({
    mutationFn: async (weekStart: string) => {
      return apiRequest<{ copied: number; nextWeekHadShifts: boolean }>("/api/shifts/copy-to-next-week", {
        method: "POST",
        body: JSON.stringify({ weekStart }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      setCurrentWeek(prev => dateAddWeeks(prev, 1));
      setIsCopyDialogOpen(false);
      toast({
        title: "Shifts Copied",
        description: `${data.copied} shift${data.copied !== 1 ? "s" : ""} copied to next week.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to copy shifts",
        variant: "destructive",
      });
    },
  });

  const updatePinMutation = useMutation({
    mutationFn: async (pin: string) => {
      return apiRequest("/api/shift-pin", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
    },
    onSuccess: (data: { success: boolean; pin: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-pin"] });
      toast({
        title: "PIN Set Successfully",
        description: `Your new PIN is: ${data.pin} - Save this PIN now! You won't be able to see it again.`,
        duration: 10000,
      });
      setNewPin("");
      setIsPinDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update PIN",
        variant: "destructive",
      });
    },
  });

  const createPresetMutation = useMutation({
    mutationFn: async (data: TimeframePresetFormValues) => {
      return apiRequest("/api/timeframe-presets", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframe-presets"] });
      toast({
        title: "Success",
        description: "Timeframe preset created successfully",
      });
      presetForm.reset();
      setIsPresetDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create preset",
        variant: "destructive",
      });
    },
  });

  const updatePresetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TimeframePresetFormValues }) => {
      return apiRequest(`/api/timeframe-presets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframe-presets"] });
      toast({
        title: "Success",
        description: "Timeframe preset updated successfully",
      });
      presetForm.reset();
      setEditingPreset(null);
      setIsPresetDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update preset",
        variant: "destructive",
      });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/timeframe-presets/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeframe-presets"] });
      toast({
        title: "Success",
        description: "Timeframe preset deleted successfully",
      });
      setDeletingPreset(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete preset",
        variant: "destructive",
      });
    },
  });

  const handleCrewSubmit = (values: CrewMemberFormValues) => {
    createCrewMutation.mutate(values);
  };

  const handleShiftSubmit = (values: ShiftFormValues) => {
    if (editingShift) {
      updateShiftMutation.mutate({ id: editingShift.id, data: values });
    } else {
      createShiftMutation.mutate(values);
    }
  };

  const handleAddShift = (date: Date) => {
    setEditingShift(null);
    setSelectedPreset("");
    shiftForm.reset({
      employeeName: "",
      employeeRole: "",
      shiftDate: format(date, "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00",
      notes: "",
    });
    setIsShiftDialogOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setSelectedPreset("");
    shiftForm.reset({
      employeeName: shift.employeeName,
      employeeRole: shift.employeeRole || "",
      shiftDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      notes: shift.notes || "",
    });
    setIsShiftDialogOpen(true);
  };

  const handleDeleteShift = (shift: Shift) => {
    setDeletingShift(shift);
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(dateAddWeeks(currentWeek, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(dateAddWeeks(currentWeek, 1));
  };

  const handleThisWeek = () => {
    setCurrentWeek(new Date());
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length >= 4 && newPin.length <= 6) {
      updatePinMutation.mutate(newPin);
    } else {
      toast({
        title: "Error",
        description: "PIN must be 4-6 digits",
        variant: "destructive",
      });
    }
  };

  const handlePresetSubmit = (values: TimeframePresetFormValues) => {
    if (editingPreset) {
      updatePresetMutation.mutate({ id: editingPreset.id, data: values });
    } else {
      createPresetMutation.mutate(values);
    }
  };

  const handleAddPreset = () => {
    setEditingPreset(null);
    presetForm.reset({
      name: "",
      startTime: "",
      endTime: "",
    });
    setIsPresetDialogOpen(true);
  };

  const handleEditPreset = (preset: TimeframePreset) => {
    setEditingPreset(preset);
    presetForm.reset({
      name: preset.name,
      startTime: preset.startTime,
      endTime: preset.endTime,
    });
    setIsPresetDialogOpen(true);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = timeframePresets.find(p => p.id === presetId);
    if (preset) {
      shiftForm.setValue("startTime", preset.startTime);
      shiftForm.setValue("endTime", preset.endTime);
      setSelectedPreset(presetId);
    }
  };

  const copyLinkToClipboard = async () => {
    if (!user?.shopName) {
      toast({
        title: "Error",
        description: "Shop name not available",
        variant: "destructive",
      });
      return;
    }

    const shareableLink = `${window.location.origin}/${user.shopName}/shifts`;
    
    try {
      await navigator.clipboard.writeText(shareableLink);
      toast({
        title: "Link copied to clipboard!",
        description: "Share this link with your crew members",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const weekRange = getWeekRange(currentWeek);

  const currentWeekShifts = shifts.filter(shift => {
    const d = new Date(shift.shiftDate + "T00:00:00");
    return d >= weekRange.start && d <= weekRange.end;
  });

  const handleCopyToNextWeek = () => {
    const nextWeekStart = dateAddWeeks(weekRange.start, 1);
    const nextWeekEnd = dateAddWeeks(weekRange.end, 1);
    const nextWeekShiftCount = shifts.filter(shift => {
      const d = new Date(shift.shiftDate + "T00:00:00");
      return d >= nextWeekStart && d <= nextWeekEnd;
    }).length;
    setCopyDialogData({ count: currentWeekShifts.length, nextWeekHasShifts: nextWeekShiftCount > 0 });
    setIsCopyDialogOpen(true);
  };

  const handleConfirmCopy = () => {
    const weekStartStr = format(weekRange.start, "yyyy-MM-dd");
    copyToNextWeekMutation.mutate(weekStartStr);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" data-testid="heading-shifts-manager">Shift Manager</h1>
      </div>

      <Card data-testid="card-share-with-crew">
        <CardHeader>
          <CardTitle>Share with Crew</CardTitle>
          <CardDescription>
            Share this link with your employees so they can view their shifts. 
            They will need the PIN to access the schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input 
              value={user?.shopName ? `${window.location.origin}/${user.shopName}/shifts` : ""}
              readOnly
              data-testid="input-shareable-link"
              className="flex-1"
            />
            <Button 
              onClick={copyLinkToClipboard}
              variant="outline"
              data-testid="button-copy-link"
              className="sm:w-auto"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Note: Your crew will need the PIN to view the schedule. Make sure to share it with them securely.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card data-testid="card-crew-roster">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Crew Roster
            </CardTitle>
            <Button
              onClick={() => setIsCrewDialogOpen(true)}
              size="sm"
              data-testid="button-add-crew"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Crew
            </Button>
          </CardHeader>
          <CardContent>
            {crewLoading ? (
              <div className="text-sm text-muted-foreground">Loading crew members...</div>
            ) : crewMembers.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No crew members added yet. Click "Add Crew" to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {crewMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                    data-testid={`crew-card-${member.id}`}
                  >
                    <span className="font-medium" data-testid={`crew-name-${member.id}`}>
                      {member.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingCrew(member)}
                      data-testid={`button-delete-crew-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-pin-management">
          <CardHeader>
            <CardTitle>PIN Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">PIN Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="font-medium text-lg" data-testid="text-current-pin">
                  {pinLoading ? "Loading..." : pinData?.hasPIN ? "PIN is set" : "No PIN set"}
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsPinDialogOpen(true)}
              variant="outline"
              data-testid="button-change-pin"
            >
              {pinData?.hasPIN ? "Regenerate PIN" : "Set PIN"}
            </Button>
            <p className="text-xs text-muted-foreground">
              This PIN is required for crew members to view their shifts on the public shifts page. 
              The PIN cannot be retrieved after it's set - you can only regenerate a new one.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-timeframe-presets">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Timeframe Presets</CardTitle>
            <CardDescription className="mt-1">
              Create preset timeframes to quickly add shifts with common time slots
            </CardDescription>
          </div>
          <Button
            onClick={handleAddPreset}
            size="sm"
            data-testid="button-add-preset"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Preset
          </Button>
        </CardHeader>
        <CardContent>
          {presetsLoading ? (
            <div className="text-sm text-muted-foreground">Loading presets...</div>
          ) : timeframePresets.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No timeframe presets yet. Create presets for faster shift scheduling.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeframePresets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex flex-col p-4 border rounded-lg hover-elevate"
                  data-testid={`preset-card-${preset.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium" data-testid={`preset-name-${preset.id}`}>
                      {preset.name}
                    </h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditPreset(preset)}
                        data-testid={`button-edit-preset-${preset.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeletingPreset(preset)}
                        data-testid={`button-delete-preset-${preset.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid={`preset-time-${preset.id}`}>
                    {preset.startTime} - {preset.endTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-weekly-calendar">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleCopyToNextWeek}
                variant="outline"
                size="sm"
                disabled={currentWeekShifts.length === 0}
                data-testid="button-copy-to-next-week"
                title={currentWeekShifts.length === 0 ? "No shifts this week to copy" : "Copy all shifts to next week"}
              >
                <CopyPlus className="h-4 w-4 mr-1" />
                Copy to Next Week
              </Button>
              <Button
                onClick={handleThisWeek}
                variant="outline"
                size="sm"
                data-testid="button-this-week"
              >
                This Week
              </Button>
              <Button
                onClick={handlePreviousWeek}
                variant="outline"
                size="icon"
                data-testid="button-prev-week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium min-w-[200px] text-center" data-testid="text-week-range">
                {format(weekRange.start, "MMM d")} - {format(weekRange.end, "MMM d, yyyy")}
              </div>
              <Button
                onClick={handleNextWeek}
                variant="outline"
                size="icon"
                data-testid="button-next-week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {shiftsLoading ? (
            <div className="text-sm text-muted-foreground">Loading shifts...</div>
          ) : (
            <ShiftSchedule
              shifts={shifts}
              weekStart={currentWeek}
              onAddShift={handleAddShift}
              onEditShift={handleEditShift}
              onDeleteShift={handleDeleteShift}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isCrewDialogOpen} onOpenChange={setIsCrewDialogOpen}>
        <DialogContent data-testid="dialog-add-crew">
          <DialogHeader>
            <DialogTitle>Add Crew Member</DialogTitle>
          </DialogHeader>
          <Form {...crewForm}>
            <form onSubmit={crewForm.handleSubmit(handleCrewSubmit)} className="space-y-4">
              <FormField
                control={crewForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter crew member name"
                        {...field}
                        data-testid="input-crew-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCrewDialogOpen(false)}
                  data-testid="button-cancel-crew"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCrewMutation.isPending}
                  data-testid="button-submit-crew"
                >
                  {createCrewMutation.isPending ? "Adding..." : "Add Crew Member"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-shift-form">
          <DialogHeader>
            <DialogTitle>{editingShift ? "Edit Shift" : "Add Shift"}</DialogTitle>
          </DialogHeader>
          <Form {...shiftForm}>
            <form onSubmit={shiftForm.handleSubmit(handleShiftSubmit)} className="space-y-4">
              {timeframePresets.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Quick Select Timeframe (Optional)
                  </Label>
                  <Select
                    value={selectedPreset}
                    onValueChange={handlePresetSelect}
                  >
                    <SelectTrigger data-testid="select-timeframe-preset">
                      <SelectValue placeholder="Choose a preset or enter times manually" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeframePresets.map((preset) => (
                        <SelectItem
                          key={preset.id}
                          value={preset.id}
                          data-testid={`option-preset-${preset.id}`}
                        >
                          {preset.name} ({preset.startTime} - {preset.endTime})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={shiftForm.control}
                  name="employeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Name</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-employee-name">
                            <SelectValue placeholder="Select crew member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {crewMembers.map((member) => (
                            <SelectItem
                              key={member.id}
                              value={member.name}
                              data-testid={`option-employee-${member.id}`}
                            >
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={shiftForm.control}
                  name="employeeRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Manager, Cashier"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-employee-role"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={shiftForm.control}
                  name="shiftDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-shift-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Time</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={shiftForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              data-testid="input-start-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={shiftForm.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              data-testid="input-end-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={shiftForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes or instructions"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-shift-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsShiftDialogOpen(false);
                    setEditingShift(null);
                  }}
                  data-testid="button-cancel-shift"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createShiftMutation.isPending || updateShiftMutation.isPending}
                  data-testid="button-submit-shift"
                >
                  {createShiftMutation.isPending || updateShiftMutation.isPending
                    ? "Saving..."
                    : editingShift
                    ? "Update Shift"
                    : "Add Shift"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent data-testid="dialog-pin-form">
          <DialogHeader>
            <DialogTitle>{pinData?.hasPIN ? "Change PIN" : "Set PIN"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">New PIN (4-6 digits)</Label>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4-6 digit PIN"
                data-testid="input-new-pin"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPinDialogOpen(false);
                  setNewPin("");
                }}
                data-testid="button-cancel-pin"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatePinMutation.isPending || newPin.length < 4}
                data-testid="button-submit-pin"
              >
                {updatePinMutation.isPending ? "Saving..." : "Save PIN"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCrew} onOpenChange={() => setDeletingCrew(null)}>
        <AlertDialogContent data-testid="dialog-delete-crew-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Crew Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCrew?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-crew">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCrew && deleteCrewMutation.mutate(deletingCrew.id)}
              data-testid="button-confirm-delete-crew"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingShift} onOpenChange={() => setDeletingShift(null)}>
        <AlertDialogContent data-testid="dialog-delete-shift-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shift for {deletingShift?.employeeName} on{" "}
              {deletingShift && format(new Date(deletingShift.shiftDate), "MMM d, yyyy")}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-shift">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingShift && deleteShiftMutation.mutate(deletingShift.id)}
              data-testid="button-confirm-delete-shift"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
        <DialogContent data-testid="dialog-preset-form">
          <DialogHeader>
            <DialogTitle>{editingPreset ? "Edit Timeframe Preset" : "Add Timeframe Preset"}</DialogTitle>
          </DialogHeader>
          <Form {...presetForm}>
            <form onSubmit={presetForm.handleSubmit(handlePresetSubmit)} className="space-y-4">
              <FormField
                control={presetForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preset Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Morning Shift, Evening Shift"
                        {...field}
                        data-testid="input-preset-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={presetForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          data-testid="input-preset-start-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={presetForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          data-testid="input-preset-end-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPresetDialogOpen(false);
                    setEditingPreset(null);
                  }}
                  data-testid="button-cancel-preset"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPresetMutation.isPending || updatePresetMutation.isPending}
                  data-testid="button-submit-preset"
                >
                  {createPresetMutation.isPending || updatePresetMutation.isPending
                    ? "Saving..."
                    : editingPreset
                    ? "Update Preset"
                    : "Add Preset"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPreset} onOpenChange={() => setDeletingPreset(null)}>
        <AlertDialogContent data-testid="dialog-delete-preset-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timeframe Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPreset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-preset">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPreset && deletePresetMutation.mutate(deletingPreset.id)}
              data-testid="button-confirm-delete-preset"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <AlertDialogContent data-testid="dialog-copy-to-next-week">
          <AlertDialogHeader>
            <AlertDialogTitle>Copy Shifts to Next Week</AlertDialogTitle>
            <AlertDialogDescription>
              {copyDialogData && (
                <>
                  Copy all {copyDialogData.count} shift{copyDialogData.count !== 1 ? "s" : ""} from this week to next week?
                  {copyDialogData.nextWeekHasShifts && (
                    <span className="block mt-2">
                      Next week already has shifts — the copied shifts will be added alongside them.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-copy">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCopy}
              disabled={copyToNextWeekMutation.isPending}
              data-testid="button-confirm-copy"
            >
              {copyToNextWeekMutation.isPending ? "Copying..." : "Copy Shifts"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
