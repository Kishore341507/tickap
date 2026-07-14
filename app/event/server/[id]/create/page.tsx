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
import { CalendarIcon, Loader2, Check, ChevronsUpDown, Plus, Trash, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Category , Platform , EventStatus } from "@/types";

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
  channel_id: z.string().optional(),
  notification_channel_id: z.string().optional(),
  hide_registrations: z.boolean().default(false),
  hide_registration_count: z.boolean().default(false),
  allow_incomplete_teams: z.boolean().default(false),
  enable_team_invites: z.boolean().default(true),
  enable_team_requests: z.boolean().default(true),
  register_for_other: z.boolean().default(true),
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

// Type for custom questions
type CustomQuestion = {
  question: string;
  placeholder: string;
  default: string;
  type: 1 | 2; // 1 for short, 2 for long
  required: boolean;
};

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
  const [notificationChannelOpen, setNotificationChannelOpen] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

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
      start_time: "20:00",
      is_solo: false,
      category: Category.VideoGame,
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
      notification_channel_id: "",
      banner: new Blob(), // Default to an empty Blob
      max_teams : undefined,
      min_team_player : undefined,
      max_team_player : undefined,
      hide_registrations: false,
      hide_registration_count: false,
      allow_incomplete_teams: false,
      enable_team_invites: true,
      enable_team_requests: true,
      register_for_other: true,
    },
  });

  const isSolo = form.watch("is_solo");
  const registerForOther = form.watch("register_for_other");

  useEffect(() => {
    if (!registerForOther) {
      form.setValue("allow_incomplete_teams", true);
    }
  }, [registerForOther, form]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);
    if (file) {
      // Check file size (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 2MB",
          variant: "destructive",
        });
        // Reset the file input
        e.target.value = '';
        return;
      }
      
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
          const date = new Date(value);
          const timeParts = values.start_time.split(":");
          date.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
          formData.append(key, date.toISOString());
          console.log("Sending date:", date.toISOString());
        } else if (value instanceof Blob) {
          formData.append(key, value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Add custom questions to the extra field if any exist
      if (customQuestions.length > 0) {
        // Validate that all questions have text
        const invalidQuestions = customQuestions.filter(q => !q.question.trim());
        if (invalidQuestions.length > 0) {
          toast({
            title: "Invalid Questions",
            description: "All questions must have question text",
            variant: "destructive",
          });
          return;
        }
        
        // Create a formatted object to save as extra JSON
        const formattedQuestions = customQuestions.reduce((acc, question, index) => {
          acc[question.question.trim()] = {
            placeholder: question.placeholder,
            default: question.default,
            type: question.type,
            required: question.required
          };
          return acc;
        }, {} as Record<string, any>);
        
        formData.append("extra", JSON.stringify(formattedQuestions));
      }

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
          <h3 className="text-lg font-medium">Event Information</h3>
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
            </div>
          </div>

              <Accordion type="multiple" className="w-full">
                <AccordionItem value="discord-settings" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2 font-semibold justify-start gap-2">
                    Discord Settings
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                      <FormField
                        control={form.control}
                        name="role_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Registration Role</FormLabel>
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
                        <FormDescription>
                          The role that will be assigned to a user upon registering for the event.
                        </FormDescription>
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
                        <FormDescription>
                          Users with this role can manage registrations, add/remove participants, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="channel_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Log Channel</FormLabel>
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
                        <FormDescription>
                          The Discord text channel where logs will be sent.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notification_channel_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Notification channel</FormLabel>
                        <Popover open={notificationChannelOpen} onOpenChange={setNotificationChannelOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={notificationChannelOpen}
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
                                    setNotificationChannelOpen(false);
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
                                      setNotificationChannelOpen(false);
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
                        <FormDescription>
                          The Discord text channel where registration and invite notifications will be sent.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="advance-settings" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2 font-semibold justify-start gap-2">
                    Advance Settings
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 px-1">
                      <FormField
                        control={form.control}
                        name="hide_registrations"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium">Hide Registrations</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hide_registration_count"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-medium">Hide Registration Count</FormLabel>
                          </FormItem>
                        )}
                      />
                      {!isSolo && (
                        <>
                          <FormField
                            control={form.control}
                            name="register_for_other"
                            render={({ field }) => (
                              <FormItem className="rounded-md border p-3 shadow-sm">
                                <div className="flex flex-row items-center space-x-2 mb-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium">Register for others</FormLabel>
                                </div>
                                <FormDescription className="text-xs">
                                  Allow a user to register on behalf of other users (they will be notified on Discord).
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="allow_incomplete_teams"
                            render={({ field }) => (
                              <FormItem className="rounded-md border p-3 shadow-sm">
                                <div className="flex flex-row items-center space-x-2 mb-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      disabled={!registerForOther}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium">Allow Incomplete Teams</FormLabel>
                                </div>
                                <FormDescription className="text-xs">
                                  Allow registration of incomplete teams. Other users can then be invited or request to join.
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="enable_team_invites"
                            render={({ field }) => (
                              <FormItem className="rounded-md border p-3 shadow-sm">
                                <div className="flex flex-row items-center space-x-2 mb-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium">Enable Team Invites</FormLabel>
                                </div>
                                <FormDescription className="text-xs">
                                  Allow team leaders to invite other members if there is space in the team.
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="enable_team_requests"
                            render={({ field }) => (
                              <FormItem className="rounded-md border p-3 shadow-sm">
                                <div className="flex flex-row items-center space-x-2 mb-2">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium">Enable Team Requests</FormLabel>
                                </div>
                                <FormDescription className="text-xs">
                                  Allow other users to request to join a team if there is space available.
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

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

      {/* Custom Questions Section */}
      <div className="mt-8 border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Custom Registration Questions</h2>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (customQuestions.length >= 4) {
                toast({
                  title: "Limit Reached",
                  description: "You can add a maximum of 4 custom questions.",
                  variant: "destructive",
                });
                return;
              }
              setCustomQuestions([
                ...customQuestions,
                {
                  question: "",
                  placeholder: "",
                  default: "",
                  type: 1,
                  required: false
                }
              ]);
            }}
            disabled={customQuestions.length >= 4}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>

        <div className="space-y-4">
          {customQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed rounded-md py-8 px-4">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-center">
                No custom questions added yet. Add up to 4 questions that participants will need to answer during registration.
              </p>
            </div>
          ) : (
            customQuestions.map((question, index) => (
              <div key={index} className="border rounded-md p-4 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    const newQuestions = [...customQuestions];
                    newQuestions.splice(index, 1);
                    setCustomQuestions(newQuestions);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium">
                      Question Text <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={question.question}
                      placeholder="Enter question (max 45 chars)"
                      maxLength={45}
                      onChange={(e) => {
                        const newQuestions = [...customQuestions];
                        newQuestions[index].question = e.target.value;
                        setCustomQuestions(newQuestions);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {question.question.length}/45 characters
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Placeholder Text</label>
                    <Input
                      value={question.placeholder}
                      placeholder="Enter placeholder (max 100 chars)"
                      maxLength={100}
                      onChange={(e) => {
                        const newQuestions = [...customQuestions];
                        newQuestions[index].placeholder = e.target.value;
                        setCustomQuestions(newQuestions);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {question.placeholder.length}/100 characters
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium">Default Value</label>
                    <Textarea
                      value={question.default}
                      placeholder="Enter default value (max 4000 chars)"
                      maxLength={4000}
                      rows={2}
                      onChange={(e) => {
                        const newQuestions = [...customQuestions];
                        newQuestions[index].default = e.target.value;
                        setCustomQuestions(newQuestions);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {question.default.length}/4000 characters
                    </p>
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="text-sm font-medium">Question Type</label>
                      <Select
                        value={String(question.type)}
                        onValueChange={(value) => {
                          const newQuestions = [...customQuestions];
                          newQuestions[index].type = parseInt(value) as 1 | 2;
                          setCustomQuestions(newQuestions);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Short Answer</SelectItem>
                          <SelectItem value="2">Long Answer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <Switch
                        checked={question.required}
                        onCheckedChange={(checked) => {
                          const newQuestions = [...customQuestions];
                          newQuestions[index].required = checked;
                          setCustomQuestions(newQuestions);
                        }}
                      />
                      <label className="text-sm font-medium">Required question</label>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}