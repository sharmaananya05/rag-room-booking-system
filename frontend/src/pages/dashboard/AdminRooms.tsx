import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateRoom, useRooms, useToggleRoom } from "@/hooks/useBookings";

const roomSchema = z.object({
  room_number: z.string().trim().min(1).max(40),
  name: z.string().trim().max(100).optional(),
  building: z.string().trim().max(100).optional(),
  floor: z.string().trim().max(20).optional(),
  capacity: z.number({ message: "Required" }).int().positive().max(10000),
  facilities: z.string().trim().max(300).optional(),
});
type RoomForm = z.infer<typeof roomSchema>;

export default function AdminRooms() {
  const { data: rooms, isLoading } = useRooms();
  const create = useCreateRoom();
  const toggle = useToggleRoom();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
  });

  const onSubmit = async (v: RoomForm) => {
    await create.mutateAsync({
      ...v,
      facilities: v.facilities ? v.facilities.split(",").map(s => s.trim()).filter(Boolean) : [],
    });
    reset(); setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Rooms</h2>
          <p className="text-sm text-muted-foreground">Manage all bookable rooms.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent-gradient text-accent-foreground hover:opacity-95">
              <Plus className="mr-2 h-4 w-4" /> Add room
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add a new room</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Room number" error={errors.room_number?.message}><Input {...register("room_number")} /></Field>
                <Field label="Name" error={errors.name?.message}><Input {...register("name")} /></Field>
                <Field label="Building" error={errors.building?.message}><Input {...register("building")} /></Field>
                <Field label="Floor" error={errors.floor?.message}><Input {...register("floor")} /></Field>
                <Field label="Capacity" error={errors.capacity?.message}><Input type="number" min={1} {...register("capacity", { valueAsNumber: true })} /></Field>
              </div>
              <Field label="Facilities (comma separated)" error={errors.facilities?.message}>
                <Input placeholder="Projector, Whiteboard, AC" {...register("facilities")} />
              </Field>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending} className="bg-accent-gradient text-accent-foreground">
                  {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !rooms || rooms.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/40 px-6 py-16 text-center">
          <p className="text-sm font-medium">No rooms yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Click "Add room" to create your first one.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Room</TableHead><TableHead>Name</TableHead><TableHead>Building</TableHead>
                <TableHead>Floor</TableHead><TableHead>Capacity</TableHead><TableHead>Facilities</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((r) => {
                const facilities = Array.isArray(r.facilities) ? r.facilities.join(", ") : (r.facilities || "—");
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.room_number}</TableCell>
                    <TableCell>{r.name || "—"}</TableCell>
                    <TableCell>{r.building || "—"}</TableCell>
                    <TableCell>{r.floor || "—"}</TableCell>
                    <TableCell>{r.capacity}</TableCell>
                    <TableCell className="max-w-70 truncate" title={facilities}>{facilities}</TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={r.is_active !== false}
                        disabled={toggle.isPending}
                        onCheckedChange={(v) => toggle.mutate({ id: r.id, is_active: v })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
