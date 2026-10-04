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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarIcon,
  Loader2,
  Check,
  ChevronsUpDown,
  Plus,
  Trash,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UploadCloud,
  MapPin,
  Users,
  Trophy,
  Shield,
  Hash,
  Settings2,
  FileText,
  HelpCircle,
  Clock,
  Globe,
  Radio,
} from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
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
  hide_registration_count: z.enum(["teams", "users", "hide"]).default("teams"),
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
      hide_registration_count: "teams",
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
        } else if (key === "hide_registration_count") {
          const translatedValue =
            value === "hide" ? "true" :
            value === "users" ? "null" :
            "false";
          formData.append(key, translatedValue);
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground flex-wrap">
        <Link
          href="/event"
          className="hover:text-foreground transition-colors inline-flex items-center gap-1 group"
        >
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Events</span>
        </Link>
        <ChevronRight className="h-3 w-3 opacity-40" />
        <Link
          href={`/event/server/${params.id}`}
          className="hover:text-foreground transition-colors"
        >
          Server
        </Link>
        <ChevronRight className="h-3 w-3 opacity-40" />
        <span className="text-foreground font-semibold">Create Event</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Create New Event
            </h1>
            <Badge variant="outline" className="text-xs font-medium">
              <Sparkles className="h-3 w-3 mr-1 text-primary" />
              Tournament Creator
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure rules, roster requirements, schedule, Discord roles, and custom registration fields.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
          {/* Card 1: Basic Information & Media */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Basic Details & Media</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Essential identity, category, banner imagery, and prize details.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-semibold">Event Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Apex Legends Fall Championship 2026"
                          className="bg-muted/20 border-border/60 h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/20 border-border/60 h-10">
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
                      <FormLabel className="text-xs font-semibold">Custom Category Subtitle</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Competitive Battle Royale"
                          className="bg-muted/20 border-border/60 h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prize"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-semibold">Prize Pool / Rewards</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. $1,000 Cash Prize + Exclusive Discord Champion Role"
                          className="bg-muted/20 border-border/60 h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        Leave empty if no prize is awarded.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Banner Upload Section */}
              <div className="space-y-3 pt-2">
                <FormLabel className="text-xs font-semibold flex items-center justify-between">
                  <span>Banner Image</span>
                  <span className="text-muted-foreground font-normal">Recommended 1200x500px, Max 2MB</span>
                </FormLabel>

                <div className="relative aspect-[21/9] sm:aspect-[2.5/1] w-full rounded-2xl overflow-hidden border border-dashed border-border/70 bg-muted/10 flex flex-col items-center justify-center p-4 group transition-colors hover:border-primary/50">
                  {bannerPreview ? (
                    <>
                      <Image
                        src={bannerPreview}
                        alt="Banner preview"
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                        <label
                          htmlFor="banner-upload"
                          className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold shadow hover:bg-primary/90 transition-colors"
                        >
                          Change Banner Image
                        </label>
                      </div>
                    </>
                  ) : (
                    <label
                      htmlFor="banner-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-center p-4"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-foreground">
                          Click to upload banner image
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          PNG, JPG, WEBP or GIF up to 2MB
                        </p>
                      </div>
                    </label>
                  )}
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="sr-only"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Schedule & Format */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Schedule & Format</CardTitle>
              </div>
              <CardDescription className="text-xs">
                When the tournament takes place, team roster boundaries, and registration caps.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-semibold">Event Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal bg-muted/20 border-border/60 h-10 text-xs",
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
                      <FormLabel className="text-xs font-semibold">Start Time (24h) *</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="bg-muted/20 border-border/60 h-10 text-xs font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-2 opacity-50" />

              <FormField
                control={form.control}
                name="is_solo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 bg-muted/15 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold">Solo Event</FormLabel>
                      <FormDescription className="text-xs text-muted-foreground">
                        Participants register individually rather than in multi-player teams.
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

              {!isSolo && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <FormField
                    control={form.control}
                    name="min_team_player"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Min Players / Team *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g. 3"
                            className="bg-muted/20 border-border/60 h-10 text-xs"
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
                        <FormLabel className="text-xs font-semibold">Max Players / Team *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g. 5"
                            className="bg-muted/20 border-border/60 h-10 text-xs"
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
                    name="max_teams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Max Total Teams</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Optional team cap"
                            className="bg-muted/20 border-border/60 h-10 text-xs"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Location & External Links */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Location & Links</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Where the competition is hosted (Discord, Voice Channels, physical venue, or tournament portal).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Location Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Discord Voice Channels / Main Stage"
                          className="bg-muted/20 border-border/60 h-10 text-xs"
                          {...field}
                        />
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
                      <FormLabel className="text-xs font-semibold">Location URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://discord.gg/... or twitch.tv/..."
                          className="bg-muted/20 border-border/60 h-10 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="redirect_url"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-semibold">External Registration / Bracket URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://challonge.com/... or https://battlefy.com/..."
                          className="bg-muted/20 border-border/60 h-10 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        Optional link if external bracket or ticketing is used.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Description & Rules */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Description & Rules</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Detailed information and competition guidelines for participants (Markdown supported).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Event Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the tournament format, map rotation, schedule breakdown, and expectations..."
                        className="min-h-[120px] bg-muted/20 border-border/60 text-xs leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Rules & Code of Conduct</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List competitive rules, eligibility, disqualification criteria, and tiebreakers..."
                        className="min-h-[120px] bg-muted/20 border-border/60 text-xs leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card 5: Discord Server Integration */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Discord Server Integration</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Automate role assignments and logging channels directly in your Discord community.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Registration Role */}
                <FormField
                  control={form.control}
                  name="role_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-semibold">Participant Role</FormLabel>
                      <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={roleOpen}
                              className="w-full justify-between bg-muted/20 border-border/60 h-10 text-xs"
                              disabled={isLoadingRoles}
                            >
                              {isLoadingRoles ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : field.value ? (
                                <span
                                  style={{
                                    color: roles.find((r) => r.id === field.value)?.color
                                      ? decimalToHex(roles.find((r) => r.id === field.value)!.color!)
                                      : undefined,
                                    fontWeight: roles.find((r) => r.id === field.value)?.color ? 600 : undefined,
                                  }}
                                >
                                  {roles.find((role) => role.id === field.value)?.name || "Select role"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Select participant role</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command className="max-h-[300px]">
                            <CommandInput placeholder="Search Discord roles..." />
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
                                None (No role assigned)
                              </CommandItem>
                              {roles.map((role) => (
                                <CommandItem
                                  key={role.id}
                                  value={role.name}
                                  onSelect={() => {
                                    field.onChange(role.id);
                                    setRoleOpen(false);
                                  }}
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
                                      fontWeight: role.color ? 600 : undefined,
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
                      <FormDescription className="text-[11px] text-muted-foreground">
                        Automatically given to players upon registration.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Manager Role */}
                <FormField
                  control={form.control}
                  name="manager_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-semibold">Tournament Manager Role</FormLabel>
                      <Popover open={managerOpen} onOpenChange={setManagerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={managerOpen}
                              className="w-full justify-between bg-muted/20 border-border/60 h-10 text-xs"
                              disabled={isLoadingRoles}
                            >
                              {isLoadingRoles ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : field.value ? (
                                <span
                                  style={{
                                    color: roles.find((r) => r.id === field.value)?.color
                                      ? decimalToHex(roles.find((r) => r.id === field.value)!.color!)
                                      : undefined,
                                    fontWeight: roles.find((r) => r.id === field.value)?.color ? 600 : undefined,
                                  }}
                                >
                                  {roles.find((role) => role.id === field.value)?.name || "Select role"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Select manager role</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command className="max-h-[300px]">
                            <CommandInput placeholder="Search Discord roles..." />
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
                                      fontWeight: role.color ? 600 : undefined,
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
                      <FormDescription className="text-[11px] text-muted-foreground">
                        Users with this role can manage registrations and logs.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Log Channel */}
                <FormField
                  control={form.control}
                  name="channel_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-semibold">Audit Log Channel</FormLabel>
                      <Popover open={channelOpen} onOpenChange={setChannelOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={channelOpen}
                              className="w-full justify-between bg-muted/20 border-border/60 h-10 text-xs"
                              disabled={isLoadingChannels}
                            >
                              {isLoadingChannels ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : field.value ? (
                                <span>#{channels.find((c) => c.id === field.value)?.name || "Select channel"}</span>
                              ) : (
                                <span className="text-muted-foreground">Select log channel</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command className="max-h-[300px]">
                            <CommandInput placeholder="Search text channels..." />
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
                                  #{channel.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-[11px] text-muted-foreground">
                        Channel where manager actions and changes are broadcasted.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notification Channel */}
                <FormField
                  control={form.control}
                  name="notification_channel_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-semibold">Notification Channel</FormLabel>
                      <Popover open={notificationChannelOpen} onOpenChange={setNotificationChannelOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={notificationChannelOpen}
                              className="w-full justify-between bg-muted/20 border-border/60 h-10 text-xs"
                              disabled={isLoadingChannels}
                            >
                              {isLoadingChannels ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : field.value ? (
                                <span>#{channels.find((c) => c.id === field.value)?.name || "Select channel"}</span>
                              ) : (
                                <span className="text-muted-foreground">Select notification channel</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command className="max-h-[300px]">
                            <CommandInput placeholder="Search text channels..." />
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
                                  #{channel.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-[11px] text-muted-foreground">
                        Channel where user registrations and invites post updates.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Registration & Team Policies */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Registration Policies & Privacy</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Control participant visibility, proxy registration, and team formation rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hide_registrations"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/15 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-semibold">Hide Registration List</FormLabel>
                        <FormDescription className="text-[11px] text-muted-foreground">
                          Keep registered teams private from the public event page.
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

                <FormField
                  control={form.control}
                  name="hide_registration_count"
                  render={({ field }) => (
                    <FormItem className="rounded-xl border border-border/50 bg-muted/15 p-4 flex flex-col justify-between">
                      <div className="space-y-0.5 mb-2">
                        <FormLabel className="text-xs font-semibold">Count Display</FormLabel>
                        <FormDescription className="text-[11px] text-muted-foreground">
                          Choose what counter to present to users.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          value={field.value}
                          onValueChange={(val) => {
                            if (val) field.onChange(val);
                          }}
                          className="justify-start gap-1"
                        >
                          <ToggleGroupItem value="teams" className="text-xs h-8 px-2.5">
                            Show Teams
                          </ToggleGroupItem>
                          <ToggleGroupItem value="users" className="text-xs h-8 px-2.5">
                            Show Users
                          </ToggleGroupItem>
                          <ToggleGroupItem value="hide" className="text-xs h-8 px-2.5">
                            Hide Count
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {!isSolo && (
                  <>
                    <FormField
                      control={form.control}
                      name="register_for_other"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/15 p-4">
                          <div className="space-y-0.5 pr-2">
                            <FormLabel className="text-xs font-semibold">Register for Others</FormLabel>
                            <FormDescription className="text-[11px] text-muted-foreground">
                              Allow team captains to add other Discord members directly.
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

                    <FormField
                      control={form.control}
                      name="allow_incomplete_teams"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/15 p-4">
                          <div className="space-y-0.5 pr-2">
                            <FormLabel className="text-xs font-semibold">Allow Incomplete Teams</FormLabel>
                            <FormDescription className="text-[11px] text-muted-foreground">
                              Allow registration before reaching min players.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={!registerForOther}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="enable_team_invites"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/15 p-4">
                          <div className="space-y-0.5 pr-2">
                            <FormLabel className="text-xs font-semibold">Enable Team Invites</FormLabel>
                            <FormDescription className="text-[11px] text-muted-foreground">
                              Team leaders can send invites to other users.
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

                    <FormField
                      control={form.control}
                      name="enable_team_requests"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 bg-muted/15 p-4">
                          <div className="space-y-0.5 pr-2">
                            <FormLabel className="text-xs font-semibold">Enable Join Requests</FormLabel>
                            <FormDescription className="text-[11px] text-muted-foreground">
                              Solo players can request to join teams with open slots.
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
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 7: Custom Registration Questions */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base font-semibold">Custom Questions</CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Ask participants for in-game IDs, ranks, or verification during registration ({customQuestions.length}/4 used).
                  </CardDescription>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs shrink-0 self-start sm:self-auto"
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
                        required: false,
                      },
                    ]);
                  }}
                  disabled={customQuestions.length >= 4}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {customQuestions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border/60 rounded-xl bg-muted/10">
                  <HelpCircle className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">No custom questions added</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Click &ldquo;Add Question&rdquo; above to ask for Riot IDs, Steam profile links, or team jerseys.
                  </p>
                </div>
              ) : (
                customQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="border border-border/60 bg-card/50 rounded-xl p-4 relative space-y-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px]">
                          {index + 1}
                        </span>
                        Question #{index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                        onClick={() => {
                          const newQuestions = [...customQuestions];
                          newQuestions.splice(index, 1);
                          setCustomQuestions(newQuestions);
                        }}
                      >
                        <Trash className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">
                          Question Prompt <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={question.question}
                          placeholder="e.g. In-Game Name & Tag"
                          maxLength={45}
                          className="bg-muted/20 border-border/60 h-9 text-xs"
                          onChange={(e) => {
                            const newQuestions = [...customQuestions];
                            newQuestions[index].question = e.target.value;
                            setCustomQuestions(newQuestions);
                          }}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {question.question.length}/45 characters
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">Placeholder Text</label>
                        <Input
                          value={question.placeholder}
                          placeholder="e.g. Player#NA1"
                          maxLength={100}
                          className="bg-muted/20 border-border/60 h-9 text-xs"
                          onChange={(e) => {
                            const newQuestions = [...customQuestions];
                            newQuestions[index].placeholder = e.target.value;
                            setCustomQuestions(newQuestions);
                          }}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {question.placeholder.length}/100 characters
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">Default Value</label>
                        <Textarea
                          value={question.default}
                          placeholder="Optional prefilled text"
                          maxLength={4000}
                          rows={2}
                          className="bg-muted/20 border-border/60 text-xs"
                          onChange={(e) => {
                            const newQuestions = [...customQuestions];
                            newQuestions[index].default = e.target.value;
                            setCustomQuestions(newQuestions);
                          }}
                        />
                      </div>

                      <div className="flex flex-col justify-between space-y-3">
                        <div>
                          <label className="text-xs font-medium text-foreground block mb-1">Answer Format</label>
                          <Select
                            value={String(question.type)}
                            onValueChange={(val) => {
                              const newQuestions = [...customQuestions];
                              newQuestions[index].type = parseInt(val) as 1 | 2;
                              setCustomQuestions(newQuestions);
                            }}
                          >
                            <SelectTrigger className="bg-muted/20 border-border/60 h-9 text-xs">
                              <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Short Single-Line Answer</SelectItem>
                              <SelectItem value="2">Long Paragraph Answer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                          <Switch
                            id={`required-${index}`}
                            checked={question.required}
                            onCheckedChange={(checked) => {
                              const newQuestions = [...customQuestions];
                              newQuestions[index].required = checked;
                              setCustomQuestions(newQuestions);
                            }}
                          />
                          <label htmlFor={`required-${index}`} className="text-xs font-medium cursor-pointer">
                            Required field for registration
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Event...
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