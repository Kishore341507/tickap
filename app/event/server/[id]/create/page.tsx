"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

// Enum types recreated here to match Prisma model
enum Category {
  VedioGame = "VedioGame",
  ESports = "ESports",
  Music = "Music",
  Other = "Other"
}

enum Platform {
  Discord = "Discord",
  TickAp = "TickAp",
  Other = "Other"
}

enum EventStatus {
  Open = "Open",
  Closed = "Closed",
  Cancelled = "Cancelled",
  Live = "Live"
}

// Create a Zod schema for form validation
const eventFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  date: z.date().refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }, {
    message: "Event date must be in the future",
  }),
  start_time: z.string(),
  is_solo: z.boolean().default(false),
  category: z.nativeEnum(Category),
  platform: z.nativeEnum(Platform),
  banner: z.instanceof(Blob).optional(), // Accept Blob for file upload
  prize: z.string().optional(),
  max_teams: z.number().positive().optional(),
  min_team_player: z.number().positive().optional(),
  max_team_player: z.number().positive().optional(),
  rules: z.string().optional(),
  details: z.string().optional(),
  location: z.string().optional(),
  location_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  redirect_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  category_name: z.string().optional(),
  role_id: z.string().optional(),
  manager_id: z.string().optional(),
  channel_id: z.string().optional()
}).refine((data) => {
  // If it's not a solo event, min_team_player and max_team_player must be provided
  if (data.is_solo === false) {
    return data.min_team_player !== undefined && data.max_team_player !== undefined;
  }
  return true;
}, {
  message: "Min players and Max players are required for team events",
  path: ["min_team_player"]
});

// Type for our form values
type EventFormValues = z.infer<typeof eventFormSchema>;

export default function CreateEvent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerPreview, setBannerPreview] = useState("");
  const [roles, setRoles] = useState<{ id: string; name: string; color?: number; position: number }[]>([]);
  const [channels, setChannels] = useState<{ id: string; name: string; position: number }[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);

  // Fetch roles and channels when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingRoles(true);
        setIsLoadingChannels(true);

        // Fetch roles
        const rolesResponse = await fetch(`/api/discord/bot/roles?guildId=${params.id}`);
        if (!rolesResponse.ok) {
          throw new Error('Failed to fetch roles');
        }
        const rolesData = await rolesResponse.json();
        console.log("Roles data:", rolesData);
        // Sort roles by position in descending order (higher position first)
        const sortedRoles = [...rolesData].sort((a, b) => b.position - a.position);
        setRoles(sortedRoles || []);

        // Fetch channels
        const channelsResponse = await fetch(`/api/discord/bot/channels?guildId=${params.id}`);
        if (!channelsResponse.ok) {
          throw new Error('Failed to fetch channels');
        }
        const channelsData = await channelsResponse.json();
        // Filter for text channels and sort by position
        const textChannels = channelsData
          .filter((channel: any) => channel.type === 0)
          .sort((a: any, b: any) => a.position - b.position);
        console.log("Channels data:", channelsData);
        setChannels(textChannels || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch Discord data",
          variant: "destructive",
        });
      } finally {
        setIsLoadingRoles(false);
        setIsLoadingChannels(false);
      }
    };

    fetchData();
  }, [params.id, toast]);

  // Get tomorrow's date for default value
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Use explicit casting to avoid TypeScript errors
  const form = useForm({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      name: "",
      date: tomorrow,
      start_time: "12:00",
      is_solo: false,
      category: Category.VedioGame,
      platform: Platform.Discord,
      prize: "",
      rules: "",
      details: "",
      location: "",
      location_url: "",
      redirect_url: "",
      category_name: "",
      role_id: "",
      manager_id: "",
      channel_id: "",
      banner: new Blob(), // Default to an empty Blob
      max_teams : undefined,
      min_team_player : undefined,
      max_team_player : undefined,
    },
  });

  const isSolo = form.watch("is_solo");

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);
    if (file) {
      form.setValue("banner", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      console.log("File selected:", file);
    }
  };

  // Helper function to convert decimal color to hex
  const decimalToHex = (decimal: number) => {
    return `#${decimal.toString(16).padStart(6, '0')}`;
  };

  async function onSubmit(values: EventFormValues) {
    try {
      setIsSubmitting(true);

      const formData = new FormData();

      // Append all form values to formData
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (value instanceof Blob) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Debug the banner file
      const bannerFile = formData.get("banner");
      console.log("Sending banner file type:", typeof bannerFile);
      console.log("Sending banner file:", bannerFile);

      // Add guild_id from params
      formData.append("guild_id", String(params.id));

      // Add status as "Open"
      formData.append("status", EventStatus.Open);

      const response = await fetch("/api/events", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create event");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
      router.push(`/event/server/${params.id}`);
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Event</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Banner Image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                />
                {bannerPreview && (
                  <div className="mt-2">
                    <Image
                      src={bannerPreview}
                      alt="Banner preview"
                      className="max-h-40 rounded-md object-cover"
                      width={200}
                      height={200}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="py-1" >Event Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date <= today;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="prize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize</FormLabel>
                    <FormControl>
                      <Input placeholder="Prize details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_solo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Solo Event</FormLabel>
                      <FormDescription>
                        Toggle if this is a solo event
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="max_teams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Teams</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="No limit"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isSolo && (
                  <>
                    <FormField
                      control={form.control}
                      name="min_team_player"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Players</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Min players"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_team_player"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Players</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Max players"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rules</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Event rules"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Event details"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Event location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Location URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="redirect_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redirect URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Redirect URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(Category).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Custom category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormLabel>Discord Settings</FormLabel>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="role_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Role</FormLabel>
                        <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={roleOpen}
                                className="w-full justify-between"
                                disabled={isLoadingRoles}
                              >
                                {isLoadingRoles ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : field.value ? (
                                  <span 
                                    style={{ 
                                      color: roles.find(r => r.id === field.value)?.color 
                                        ? decimalToHex(roles.find(r => r.id === field.value)!.color!) 
                                        : undefined,
                                      fontWeight: roles.find(r => r.id === field.value)?.color ? 500 : undefined
                                    }}
                                  >
                                    {roles.find((role) => role.id === field.value)?.name || "Select a role"}
                                  </span>
                                ) : (
                                  "Select a role"
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command className="max-h-[300px] overflow-y-auto">
                              <CommandInput placeholder="Search roles..." />
                              <CommandEmpty>No roles found.</CommandEmpty>
                              <CommandGroup className="overflow-y-auto">
                                <CommandItem
                                  value=""
                                  onSelect={() => {
                                    field.onChange("");
                                    setRoleOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === "" ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  None
                                </CommandItem>
                                {roles.map((role) => (
                                  <CommandItem
                                    key={role.id}
                                    value={role.name}
                                    onSelect={() => {
                                      field.onChange(role.id);
                                      setRoleOpen(false);
                                    }}
                                    className="flex items-center"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === role.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span 
                                      style={{ 
                                        color: role.color ? decimalToHex(role.color) : undefined,
                                        fontWeight: role.color ? 500 : undefined
                                      }}
                                    >
                                      {role.name}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manager_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Manager Role</FormLabel>
                        <Popover open={managerOpen} onOpenChange={setManagerOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={managerOpen}
                                className="w-full justify-between"
                                disabled={isLoadingRoles}
                              >
                                {isLoadingRoles ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : field.value ? (
                                  <span 
                                    style={{ 
                                      color: roles.find(r => r.id === field.value)?.color 
                                        ? decimalToHex(roles.find(r => r.id === field.value)!.color!) 
                                        : undefined,
                                      fontWeight: roles.find(r => r.id === field.value)?.color ? 500 : undefined
                                    }}
                                  >
                                    {roles.find((role) => role.id === field.value)?.name || "Select a role"}
                                  </span>
                                ) : (
                                  "Select a role"
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command className="max-h-[300px] overflow-y-auto">
                              <CommandInput placeholder="Search roles..." />
                              <CommandEmpty>No roles found.</CommandEmpty>
                              <CommandGroup className="overflow-y-auto">
                                <CommandItem
                                  value=""
                                  onSelect={() => {
                                    field.onChange("");
                                    setManagerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === "" ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  None
                                </CommandItem>
                                {roles.map((role) => (
                                  <CommandItem
                                    key={role.id}
                                    value={role.name}
                                    onSelect={() => {
                                      field.onChange(role.id);
                                      setManagerOpen(false);
                                    }}
                                    className="flex items-center"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === role.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span 
                                      style={{ 
                                        color: role.color ? decimalToHex(role.color) : undefined,
                                        fontWeight: role.color ? 500 : undefined
                                      }}
                                    >
                                      {role.name}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="channel_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Channel</FormLabel>
                        <Popover open={channelOpen} onOpenChange={setChannelOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={channelOpen}
                                className="w-full justify-between"
                                disabled={isLoadingChannels}
                              >
                                {isLoadingChannels ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : field.value ? (
                                  channels.find((channel) => channel.id === field.value)?.name || "Select a channel"
                                ) : (
                                  "Select a channel"
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command className="max-h-[300px] overflow-y-auto">
                              <CommandInput placeholder="Search channels..." />
                              <CommandEmpty>No channels found.</CommandEmpty>
                              <CommandGroup className="overflow-y-auto">
                                <CommandItem
                                  value=""
                                  onSelect={() => {
                                    field.onChange("");
                                    setChannelOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === "" ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  None
                                </CommandItem>
                                {channels.map((channel) => (
                                  <CommandItem
                                    key={channel.id}
                                    value={channel.name}
                                    onSelect={() => {
                                      field.onChange(channel.id);
                                      setChannelOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === channel.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {channel.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}