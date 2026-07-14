import { format, addDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, TriangleAlert } from "lucide-react";
import type { Shift, CrewMember } from "@shared/schema";
import { getWeekRange } from "@/lib/shiftDates";

interface ShiftScheduleProps {
  shifts: Shift[];
  weekStart: Date;
  onAddShift?: (date: Date) => void;
  onEditShift?: (shift: Shift) => void;
  onDeleteShift?: (shift: Shift) => void;
  branding?: {
    colors?: {
      primary?: string;
      background?: string;
    };
    logo?: string;
  };
  readOnly?: boolean;
  crewMembers?: CrewMember[];
  conflictIds?: Set<string>;
  highlightName?: string;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatShiftTime(shift: Shift): string {
  const overnight = shift.endTime <= shift.startTime;
  return `${shift.startTime} - ${shift.endTime}${overnight ? " (+1)" : ""}`;
}

export function ShiftSchedule({
  shifts,
  weekStart,
  onAddShift,
  onEditShift,
  onDeleteShift,
  branding,
  readOnly = false,
  crewMembers,
  conflictIds,
  highlightName,
}: ShiftScheduleProps) {
  const { start } = getWeekRange(weekStart);

  const getShiftsForDay = (dayOffset: number): Shift[] => {
    const targetDate = addDays(start, dayOffset);
    const targetStr = format(targetDate, "yyyy-MM-dd");
    return shifts.filter(shift => shift.shiftDate === targetStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getDayDate = (dayOffset: number) => addDays(start, dayOffset);

  const getCrewColor = (employeeName: string): string | undefined => {
    if (!crewMembers) return undefined;
    return crewMembers.find(m => m.name === employeeName)?.color || undefined;
  };

  const getCardStyle = (shift: Shift): React.CSSProperties | undefined => {
    const color = getCrewColor(shift.employeeName);
    return color ? { borderLeft: `3px solid ${color}` } : undefined;
  };

  const isDimmed = (shift: Shift): boolean =>
    !!highlightName && shift.employeeName !== highlightName;

  const conflictIcon = (shift: Shift) =>
    conflictIds?.has(shift.id) ? (
      <span
        title="Overlaps with another shift for this employee"
        className="flex-shrink-0 inline-flex"
        data-testid={`icon-conflict-${shift.id}`}
      >
        <TriangleAlert className="h-4 w-4 text-amber-500" />
      </span>
    ) : null;

  return (
    <div className="w-full" data-testid="shift-schedule">
      <div className="hidden md:grid md:grid-cols-7 gap-4">
        {DAYS_OF_WEEK.map((day, index) => {
          const dayDate = getDayDate(index);
          const dayShifts = getShiftsForDay(index);

          return (
            <div key={day} className="flex flex-col gap-2" data-testid={`day-column-${index}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm">{day}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(dayDate, "MMM d")}
                  </div>
                </div>
                {!readOnly && onAddShift && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAddShift(dayDate)}
                    data-testid={`button-add-shift-${index}`}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {dayShifts.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No shifts
                  </div>
                ) : (
                  dayShifts.map((shift) => (
                    <Card
                      key={shift.id}
                      className={`hover-elevate${isDimmed(shift) ? " opacity-40" : ""}`}
                      style={getCardStyle(shift)}
                      data-testid={`shift-card-${shift.id}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <div className="font-semibold text-sm truncate" data-testid={`shift-employee-${shift.id}`}>
                                {shift.employeeName}
                              </div>
                              {conflictIcon(shift)}
                            </div>
                            {shift.employeeRole && (
                              <div className="text-xs text-muted-foreground truncate" data-testid={`shift-role-${shift.id}`}>
                                {shift.employeeRole}
                              </div>
                            )}
                          </div>
                          {!readOnly && (
                            <div className="flex gap-1">
                              {onEditShift && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onEditShift(shift)}
                                  data-testid={`button-edit-shift-${shift.id}`}
                                  className="h-6 w-6"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                              {onDeleteShift && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onDeleteShift(shift)}
                                  data-testid={`button-delete-shift-${shift.id}`}
                                  className="h-6 w-6"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-medium" data-testid={`shift-time-${shift.id}`}>
                          {formatShiftTime(shift)}
                        </div>
                        {shift.notes && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid={`shift-notes-${shift.id}`}>
                            {shift.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="md:hidden space-y-4">
        {DAYS_OF_WEEK.map((day, index) => {
          const dayDate = getDayDate(index);
          const dayShifts = getShiftsForDay(index);

          return (
            <Card key={day} data-testid={`day-card-mobile-${index}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold">{day}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(dayDate, "MMMM d, yyyy")}
                    </div>
                  </div>
                  {!readOnly && onAddShift && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAddShift(dayDate)}
                      data-testid={`button-add-shift-mobile-${index}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {dayShifts.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No shifts scheduled
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className={`p-3 border rounded-lg hover-elevate${isDimmed(shift) ? " opacity-40" : ""}`}
                        style={getCardStyle(shift)}
                        data-testid={`shift-card-mobile-${shift.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <div className="font-semibold truncate" data-testid={`shift-employee-mobile-${shift.id}`}>
                                {shift.employeeName}
                              </div>
                              {conflictIcon(shift)}
                            </div>
                            {shift.employeeRole && (
                              <div className="text-sm text-muted-foreground truncate" data-testid={`shift-role-mobile-${shift.id}`}>
                                {shift.employeeRole}
                              </div>
                            )}
                          </div>
                          {!readOnly && (
                            <div className="flex gap-1">
                              {onEditShift && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditShift(shift)}
                                  data-testid={`button-edit-shift-mobile-${shift.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {onDeleteShift && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteShift(shift)}
                                  data-testid={`button-delete-shift-mobile-${shift.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium" data-testid={`shift-time-mobile-${shift.id}`}>
                          {formatShiftTime(shift)}
                        </div>
                        {shift.notes && (
                          <div className="text-sm text-muted-foreground mt-1" data-testid={`shift-notes-mobile-${shift.id}`}>
                            {shift.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
