/* eslint-disable react-hooks/incompatible-library */
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateBooking,
  useRooms,
  useUsersByRole,
} from "@/hooks/useBookings";
import { extractApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    room_id: z.string().min(1, "Choose a room"),
    date: z.string().min(1, "Pick a date"),
    start_time: z.string().min(1, "Start time required"),
    end_time: z.string().min(1, "End time required"),
    purpose: z.string().trim().min(5, "Describe the purpose").max(500),
    expected_attendees: z
      .number({ message: "Must be a number" })
      .int()
      .positive("Must be > 0")
      .max(10000),
    phone_number: z.string().trim().min(7, "Enter a valid phone").max(20),
    faculty_incharge_id: z.string().min(1, "Required"),
    student_coordinator_id: z.string().min(1, "Required"),
    faculty_supervisor_id: z.string().min(1, "Required"),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

type FormValues = z.infer<typeof schema>;

const stepFields: Record<number, (keyof FormValues)[]> = {
  0: ["room_id", "date", "start_time", "end_time"],
  1: ["purpose", "expected_attendees", "phone_number"],
  2: ["faculty_incharge_id", "student_coordinator_id", "faculty_supervisor_id"],
};

const stepTitles = ["Room & Time", "Event Details", "Personnel"];

export default function NewBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { data: rooms, isLoading: loadingRooms } = useRooms(true);
  const { data: faculty, isLoading: loadingFaculty } =
    useUsersByRole("faculty");
  const createMut = useCreateBooking();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      room_id: "",
      date: "",
      start_time: "",
      end_time: "",
      purpose: "",
      expected_attendees: 1,
      phone_number: "",
      faculty_incharge_id: "",
      student_coordinator_id: "",
      faculty_supervisor_id: "",
    },
  });

  const next = async () => {
    const ok = await form.trigger(stepFields[step]);
    if (ok) setStep((s) => Math.min(s + 1, 2));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  // ONLY showing UPDATED onSubmit + small fixes

  const onSubmit = async (values: FormValues) => {
  try {
    await createMut.mutateAsync({
      room_id: values.room_id,
      requester_department_id: "dept-1",
      purpose: values.purpose,
      // Append Z → tells backend this is UTC, prevents naive datetime issue
      start_datetime: `${values.date}T${values.start_time}:00Z`,
      end_datetime:   `${values.date}T${values.end_time}:00Z`,
      expected_attendees: Number(values.expected_attendees),
      faculty_incharge_id:    values.faculty_incharge_id,
      student_coordinator_id: values.student_coordinator_id,
      faculty_supervisor_id:  values.faculty_supervisor_id,
    });

    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.7 },
      colors: ["#6366F1", "#A78BFA", "#22C55E"],
    });

    toast.success("Booking submitted successfully!");
    navigate("/dashboard/faculty");
  } catch (e) {
    toast.error(extractApiError(e, "Could not submit booking"));
  }
};

  const values = form.watch();
  const selectedRoom = rooms?.find((r) => String(r.id) === values.room_id);
  const findUser = (id: string) => faculty?.find((u) => String(u.id) === id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="glass-strong border-border/60">
        <CardContent className="p-6">
          {/* Stepper */}
          <div className="mb-6 flex items-center gap-2">
            {stepTitles.map((label, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      done
                        ? "bg-success text-success-foreground"
                        : active
                          ? "bg-accent-gradient text-accent-foreground shadow-elegant"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <div className="hidden sm:block">
                    <p
                      className={cn(
                        "text-xs uppercase tracking-wide",
                        active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      Step {i + 1}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {label}
                    </p>
                  </div>
                  {i < stepTitles.length - 1 && (
                    <div
                      className={cn(
                        "ml-auto h-0.5 flex-1 rounded transition-colors",
                        i < step ? "bg-success" : "bg-border",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {step === 0 && (
                  <>
                    <Field
                      label="Room"
                      error={form.formState.errors.room_id?.message}
                    >
                      {loadingRooms ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Controller
                          name="room_id"
                          control={form.control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a room" />
                              </SelectTrigger>
                              <SelectContent>
                                {(rooms ?? []).map((r) => (
                                  <SelectItem key={r.id} value={String(r.id)}>
                                    {r.room_number}
                                    {r.name ? ` · ${r.name}` : ""} — capacity{" "}
                                    {r.capacity}
                                  </SelectItem>
                                ))}
                                {rooms && rooms.length === 0 && (
                                  <SelectItem value="no_rooms" disabled>
                                    No rooms available
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      )}
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field
                        label="Date"
                        error={form.formState.errors.date?.message}
                      >
                        <Input type="date" {...form.register("date")} />
                      </Field>
                      <Field
                        label="Start time"
                        error={form.formState.errors.start_time?.message}
                      >
                        <Input type="time" {...form.register("start_time")} />
                      </Field>
                      <Field
                        label="End time"
                        error={form.formState.errors.end_time?.message}
                      >
                        <Input type="time" {...form.register("end_time")} />
                      </Field>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <Field
                      label="Purpose"
                      error={form.formState.errors.purpose?.message}
                    >
                      <Textarea
                        rows={4}
                        maxLength={500}
                        placeholder="What is this booking for?"
                        {...form.register("purpose")}
                      />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        label="Expected attendees"
                        error={
                          form.formState.errors.expected_attendees?.message
                        }
                      >
                        <Input
                          type="number"
                          min={1}
                          {...form.register("expected_attendees", {
                            valueAsNumber: true,
                          })}
                        />
                      </Field>
                      <Field
                        label="Phone number"
                        error={form.formState.errors.phone_number?.message}
                      >
                        <Input
                          type="tel"
                          placeholder="+91 ..."
                          {...form.register("phone_number")}
                        />
                      </Field>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <PersonField
                      name="faculty_incharge_id"
                      label="Faculty in-charge"
                      form={form}
                      faculty={faculty}
                      loading={loadingFaculty}
                    />
                    <PersonField
                      name="student_coordinator_id"
                      label="Student coordinator"
                      form={form}
                      faculty={faculty}
                      loading={loadingFaculty}
                    />
                    <PersonField
                      name="faculty_supervisor_id"
                      label="Faculty supervisor"
                      form={form}
                      faculty={faculty}
                      loading={loadingFaculty}
                    />

                    <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Review
                      </p>
                      <ul className="space-y-1.5">
                        <li>
                          <span className="text-muted-foreground">Room:</span>{" "}
                          {selectedRoom
                            ? `${selectedRoom.room_number}${selectedRoom.name ? " · " + selectedRoom.name : ""}`
                            : "—"}
                        </li>
                        <li>
                          <span className="text-muted-foreground">When:</span>{" "}
                          {values.date} · {values.start_time}–{values.end_time}
                        </li>
                        <li>
                          <span className="text-muted-foreground">
                            Attendees:
                          </span>{" "}
                          {values.expected_attendees}
                        </li>
                        <li>
                          <span className="text-muted-foreground">
                            Purpose:
                          </span>{" "}
                          {values.purpose}
                        </li>
                        <li>
                          <span className="text-muted-foreground">
                            In-charge:
                          </span>{" "}
                          {findUser(values.faculty_incharge_id)?.name || "—"}
                        </li>
                        <li>
                          <span className="text-muted-foreground">
                            Coordinator:
                          </span>{" "}
                          {findUser(values.student_coordinator_id)?.name || "—"}
                        </li>
                        <li>
                          <span className="text-muted-foreground">
                            Supervisor:
                          </span>{" "}
                          {findUser(values.faculty_supervisor_id)?.name || "—"}
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={prev}
                disabled={step === 0 || createMut.isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              {step < 2 ? (
                <Button
                  type="button"
                  onClick={next}
                  className="bg-accent-gradient text-accent-foreground hover:opacity-95"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createMut.isPending}
                  className="bg-accent-gradient text-accent-foreground shadow-elegant hover:opacity-95"
                >
                  {createMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Submit booking
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface PersonFieldProps {
  name:
    | "faculty_incharge_id"
    | "student_coordinator_id"
    | "faculty_supervisor_id";
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  faculty?: { id: string | number; name: string }[];
  loading?: boolean;
}

function PersonField({
  name,
  label,
  form,
  faculty,
  loading,
}: PersonFieldProps) {
  return (
    <Field
      label={label}
      error={form.formState.errors[name]?.message as string | undefined}
    >
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Controller
          name={name}
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent>
                {(faculty ?? []).map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </SelectItem>
                ))}
                {faculty && faculty.length === 0 && (
                  <SelectItem value="no_user" disabled>
                    No users found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        />
      )}
    </Field>
  );
}
