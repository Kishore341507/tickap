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
  Edit,
  ExternalLink,
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
  date: z.date().optional(),
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
  status: z.nativeEnum(EventStatus),
  hide_registrations: z.boolean().default(false),
  hide_registration_count: z.enum(["teams", "users", "hide"]).default("teams"),
  allow_incomplete_teams: z.boolean().default(false),
  enable_team_invites: z.boolean().default(true),
  enable_team_requests: z.boolean().default(true),
  register_for_other: z.boolean().default(true),
  auto_team_name: z.boolean().default(true),
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

export default function EditEvent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerPreview, setBannerPreview] = useState("");
  const [roles, setRoles] = useState<{ id: string; name: string; color?: number; position: number }[]>([]);
  const [channels, setChannels] = useState<{ id: string; name: string; position: number }[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [notificationChannelOpen, setNotificationChannelOpen] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [needsBannerUpload, setNeedsBannerUpload] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  // Use form with default values
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      name: "",
      date: undefined,
      start_time: "12:00",
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
      status: EventStatus.Open,
      max_teams: undefined,
      min_team_player: undefined,
      max_team_player: undefined,
      hide_registrations: false,
      hide_registration_count: "teams",
      allow_incomplete_teams: false,
      enable_team_invites: true,
      enable_team_requests: true,
      register_for_other: true,
      auto_team_name: true,
    },
  });

  const isSolo = form.watch("is_solo");
  const registerForOther = form.watch("register_for_other");

  useEffect(() => {
    if (!registerForOther) {
      form.setValue("allow_incomplete_teams", true);
    }
  }, [registerForOther, form]);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events/${params.event_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch event !');
        }
        const data = await response.json();
        setEventData(data.event);
        
        // Format time for the form
        let startTimeFormatted = "12:00";
        if (data.event.start_time) {
          const timeStr = data.event.start_time.toString().padStart(4, '0');
          startTimeFormatted = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;
        }

        // Load custom questions from extra field if they exist
        if (data.event.extra) {
          try {
            const extraData = typeof data.event.extra === 'string' 
              ? JSON.parse(data.event.extra) 
              : data.event.extra;
            
            const loadedQuestions: CustomQuestion[] = [];
            
            // Convert from object format to array format for the UI
            Object.entries(extraData).forEach(([question, details]: [string, any]) => {
              if (loadedQuestions.length < 4) {
                loadedQuestions.push({
                  question,
                  placeholder: details.placeholder || '',
                  default: details.default || '',
                  type: details.type || 1,
                  required: details.required || false
                });
              }
            });
            
            setCustomQuestions(loadedQuestions);
          } catch (error) {
            console.error('Error parsing custom questions:', error);
          }
        }

        // Set form values
        form.reset({
          name: data.event.name,
          date: data.event.date ? new Date(data.event.date) : undefined,
          // get time from data.event.data
          start_time: data.event.date ? new Date(data.event.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined,
          is_solo: data.event.is_solo,
          category: data.event.category,
          platform: data.event.platform,
          prize: data.event.prize || "",
          rules: data.event.rules || "",
          details: data.event.details || "",
          location: data.event.location || "",
          location_url: data.event.location_url || "",
          redirect_url: data.event.redirect_url || "",
          category_name: data.event.category_name || "",
          role_id: data.event.role_id ? data.event.role_id.toString() : "",
          manager_id: data.event.manager_id ? data.event.manager_id.toString() : "",
          channel_id: data.event.channel_id ? data.event.channel_id.toString() : "",
          notification_channel_id: data.event.notification_channel_id ? data.event.notification_channel_id.toString() : "",
          status: data.event.status,
          max_teams: data.event.max_teams ? data.event.max_teams : undefined,
          min_team_player: data.event.min_team_player ? data.event.min_team_player : undefined,
          max_team_player: data.event.max_team_player ? data.event.max_team_player : undefined,
          hide_registrations: data.event.hide_registrations || false,
          hide_registration_count: data.event.hide_registration_count === true ? "hide" : (data.event.hide_registration_count === null ? "users" : "teams"),
          allow_incomplete_teams: data.event.allow_incomplete_teams || false,
          enable_team_invites: data.event.enable_team_invites ?? true,
          enable_team_requests: data.event.enable_team_requests ?? true,
          register_for_other: data.event.register_for_other ?? true,
          auto_team_name: data.event.auto_team_name ?? true,
        });

        // Set banner preview
        if (data.event.banner) {
          setBannerPreview(data.event.banner);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        toast({
          title: "Error",
          description: "Failed to fetch event data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.event_id) {
      fetchEvent();
    }
  }, [params.event_id, form, toast]);

  // Fetch roles and channels
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
        const sortedRoles = [...rolesData].sort((a, b) => b.position - a.position);
        setRoles(sortedRoles || []);

        // Fetch channels
        const channelsResponse = await fetch(`/api/discord/bot/channels?guildId=${params.id}`);
        if (!channelsResponse.ok) {
          throw new Error('Failed to fetch channels');
        }
        const channelsData = await channelsResponse.json();
        const textChannels = channelsData
          .filter((channel: any) => channel.type === 0)
          .sort((a: any, b: any) => a.position - b.position);
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

    if (params.id) {
      fetchData();
    }
  }, [params.id, toast]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      setNeedsBannerUpload(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        if (key === "banner" && !needsBannerUpload) {
          // Skip banner if not changed
          return;
        }
        
        if (value instanceof Date) {
          // formData.append(key, value.toISOString());
          const date = new Date(value);
          const timeParts = values.start_time.split(":");
          date.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
          formData.append(key, date.toISOString());
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
          setIsSubmitting(false);
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
      } else {
        // If all questions were removed, set extra to an empty object
        formData.append("extra", JSON.stringify({}));
      }

      // Add guild_id from params
      formData.append("guild_id", String(params.id));

      // Update the event
      const response = await fetch(`/api/events?id=${params.event_id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update event");
      }

      toast({
        title: "Success",
        description: "Event updated successfully!",
      });
      router.push(`/event/server/${params.id}`);
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-5xl space-y-6">
        <div className="h-4 w-48 bg-muted/40 rounded animate-pulse mb-6" />
        <div className="flex justify-between items-center pb-4 border-b border-border/40">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted/40 rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-muted/20 border border-border/40 rounded-2xl animate-pulse" />
          <div className="h-48 bg-muted/20 border border-border/40 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/event" className="hover:text-foreground transition-colors">
            Events
          </Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <Link href={`/event/server/${params.id}`} className="hover:text-foreground transition-colors font-mono">
            {eventData?.guild?.name || (params.id as string).slice(0, 10)}...
          </Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <Link href={`/event/${params.event_id}`} className="hover:text-foreground transition-colors truncate max-w-[180px]">
            {form.watch("name") || "Event"}
          </Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className="text-foreground font-medium">Edit</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/event/${params.event_id}`}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border/60 hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
          >
            <span>View Public Page</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 text-xs">
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
        </div>
      </div>

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Edit Event</h1>
            <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold border-primary/30 text-primary">
              {form.watch("status") || "Edit Mode"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Update schedule, participant limits, Discord role permissions, and registration settings.
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
                Essential identity, category, status, banner imagery, and prize details.
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Event Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/20 border-border/60 h-10">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(EventStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs text-muted-foreground">
                        Change the lifecycle state of this event.
                      </FormDescription>
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
                          placeholder="e.g. $1,000 Cash Prize + Discord Champion Role"
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
                        className="object-cover"
                        sizes="(max-width: 1200px) 100vw, 1200px"
                      />
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label
                          htmlFor="banner-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/80 hover:bg-background border border-border text-xs font-medium cursor-pointer shadow-sm transition"
                        >
                          <UploadCloud className="h-4 w-4" />
                          Change Image
                        </label>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="rounded-xl h-8 px-3 text-xs"
                          onClick={() => {
                            setBannerPreview("");
                            form.setValue("banner", undefined);
                            setNeedsBannerUpload(true);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </>
                  ) : (
                    <label
                      htmlFor="banner-upload"
                      className="cursor-pointer flex flex-col items-center justify-center text-center p-6 w-full h-full"
                    >
                      <div className="p-3 rounded-full bg-muted/50 mb-3 group-hover:scale-105 transition-transform">
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-semibold">Click to upload banner</span>
                      <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP or GIF up to 2MB</span>
                    </label>
                  )}
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Schedule & Format */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Schedule & Format</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Configure timing, solo vs. team mode, and team composition limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-semibold">Event Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-between text-left font-normal bg-muted/20 border-border/60 h-10",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
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
                      <FormLabel className="text-xs font-semibold">Start Time (24h)</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="bg-muted/20 border-border/60 h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Solo Toggle */}
              <FormField
                control={form.control}
                name="is_solo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Solo Event
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Enable if participants enter as individuals rather than team rosters.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Team Sizing Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="max_teams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Max {isSolo ? "Participants" : "Teams"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="No limit"
                          className="bg-muted/20 border-border/60 h-10"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        Cap registration capacity
                      </FormDescription>
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
                          <FormLabel className="text-xs font-semibold">Min Players / Team</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g. 3"
                              className="bg-muted/20 border-border/60 h-10"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            Minimum team requirement
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_team_player"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Max Players / Team</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g. 5"
                              className="bg-muted/20 border-border/60 h-10"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            Maximum roster allowance
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Location & Links */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Location & External Links</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Where the event takes place, custom links, and redirect destinations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Location Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Discord Voice Stage / Online / Los Angeles, CA"
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
                  name="location_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Location URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://maps.google.com or Discord invite"
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
                  name="redirect_url"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs font-semibold">Redirect / Stream URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://twitch.tv/yourchannel or tournament bracket link"
                          className="bg-muted/20 border-border/60 h-10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        Custom external action button displayed on the public event page.
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
                <CardTitle className="text-base font-semibold">Description & Guidelines</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Provide clear instructions, competition rules, and event details for participants.
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
                        placeholder="Describe the tournament overview, format, schedule breakdown, and exciting features..."
                        className="bg-muted/20 border-border/60 min-h-[130px] resize-y"
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
                    <FormLabel className="text-xs font-semibold">Rules & Regulations</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List conduct guidelines, map picks/bans, disqualification clauses, and fair play standards..."
                        className="bg-muted/20 border-border/60 min-h-[130px] resize-y"
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
                Roles and channels for automatic assignment and real-time bot announcements.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                              className="w-full justify-between bg-muted/20 border-border/60 h-10 font-normal"
                              disabled={isLoadingRoles}
                            >
                              {isLoadingRoles ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : field.value ? (
                                <span
                                  className="truncate font-medium"
                                  style={{
                                    color: roles.find((r) => r.id === field.value)?.color
                                      ? decimalToHex(roles.find((r) => r.id === field.value)!.color!)
                                      : undefined,
                                  }}
                                >
                                  {roles.find((r) => r.id === field.value)?.name || "Select a role"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Select a role</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command className="max-h-[300px] overflow-y-auto">
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
                                  className={cn("mr-2 h-4 w-4", field.value === "" ? "opacity-100" : "opacity-0")}
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
                                    className={cn("mr-2 h-4 w-4", field.value === role.id ? "opacity-100" : "opacity-0")}
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
                      <FormDescription className="text-xs text-muted-foreground">
                        Assigned immediately upon registration.
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
                      <FormLabel className="text-xs font-semibold">Manager / Referee Role</FormLabel>
                      <Popover open={managerOpen} onOpenChange={setManagerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={managerOpen}
                              className="w-full justify-between bg-muted/20 border-border/60 h-10 font-normal"
                              disabled={isLoadingRoles}
                            >
                              {isLoadingRoles ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : field.value ? (
                                <span
                                  className="truncate font-medium"
                                  style={{
                                    color: roles.find((r) => r.id === field.value)?.color
                                      ? decimalToHex(roles.find((r) => r.id === field.value)!.color!)
                                      : undefined,
                                  }}
                                >
                                  {roles.find((r) => r.id === field.value)?.name || "Select a role"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Select a role</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command className="max-h-[300px] overflow-y-auto">
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
                                  className={cn("mr-2 h-4 w-4", field.value === "" ? "opacity-100" : "opacity-0")}
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
                                    className={cn("mr-2 h-4 w-4", field.value === role.id ? "opacity-100" : "opacity-0")}
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
                      <FormDescription className="text-xs text-muted-foreground">
                        Grants registration approval and roster management access.
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
                      <FormLabel className="text-xs font-semibold">Audit Logs Channel</FormLabel>
                      <Popover open={channelOpen} onOpenChange={setChannelOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={channelOpen}
                              className="w-full justify-between bg-muted/20 border-border/60 h-10 font-normal"
                              disabled={isLoadingChannels}
                            >
                              {isLoadingChannels ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : field.value ? (
                                <span className="truncate flex items-center gap-1 font-medium">
                                  <Hash className="h-3.5 w-3.5 opacity-50" />
                                  {channels.find((c) => c.id === field.value)?.name || "Select a channel"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Select a channel</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command className="max-h-[300px] overflow-y-auto">
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
                                  className={cn("mr-2 h-4 w-4", field.value === "" ? "opacity-100" : "opacity-0")}
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
                                    className={cn("mr-2 h-4 w-4", field.value === channel.id ? "opacity-100" : "opacity-0")}
                                  />
                                  #{channel.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-xs text-muted-foreground">
                        Channel where administrative logs will be dispatched.
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
                      <FormLabel className="text-xs font-semibold">Public Announcements Channel</FormLabel>
                      <Popover open={notificationChannelOpen} onOpenChange={setNotificationChannelOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={notificationChannelOpen}
                              className="w-full justify-between bg-muted/20 border-border/60 h-10 font-normal"
                              disabled={isLoadingChannels}
                            >
                              {isLoadingChannels ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : field.value ? (
                                <span className="truncate flex items-center gap-1 font-medium">
                                  <Hash className="h-3.5 w-3.5 opacity-50" />
                                  {channels.find((c) => c.id === field.value)?.name || "Select a channel"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Select a channel</span>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command className="max-h-[300px] overflow-y-auto">
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
                                  className={cn("mr-2 h-4 w-4", field.value === "" ? "opacity-100" : "opacity-0")}
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
                                    className={cn("mr-2 h-4 w-4", field.value === channel.id ? "opacity-100" : "opacity-0")}
                                  />
                                  #{channel.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-xs text-muted-foreground">
                        Channel for registration alerts and invitations.
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
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Registration & Team Policies</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Control public visibility, delegation permissions, and roster assembly rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="hide_registrations"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-semibold">Hide Registered List</FormLabel>
                        <FormDescription className="text-xs">
                          Keep registered roster names hidden from public participants.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hide_registration_count"
                  render={({ field }) => (
                    <FormItem className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-semibold">Registration Count Display</FormLabel>
                        <FormDescription className="text-xs">
                          Choose what counter to present publicly.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          value={field.value}
                          onValueChange={(val) => {
                            if (val) field.onChange(val);
                          }}
                          className="justify-start pt-1"
                        >
                          <ToggleGroupItem value="teams" className="text-xs h-8 px-3">
                            Teams
                          </ToggleGroupItem>
                          <ToggleGroupItem value="users" className="text-xs h-8 px-3">
                            Users
                          </ToggleGroupItem>
                          <ToggleGroupItem value="hide" className="text-xs h-8 px-3">
                            Hidden
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {!isSolo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="register_for_other"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
                        <div className="space-y-0.5 pr-2">
                          <FormLabel className="text-xs font-semibold">Register for Others</FormLabel>
                          <FormDescription className="text-xs">
                            Allow team captains to sign up Discord teammates.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allow_incomplete_teams"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
                        <div className="space-y-0.5 pr-2">
                          <FormLabel className="text-xs font-semibold">Allow Incomplete Teams</FormLabel>
                          <FormDescription className="text-xs">
                            Permit team creation with unfilled rosters.
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
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
                        <div className="space-y-0.5 pr-2">
                          <FormLabel className="text-xs font-semibold">Enable Team Invites</FormLabel>
                          <FormDescription className="text-xs">
                            Allow captains to invite users to their roster.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enable_team_requests"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
                        <div className="space-y-0.5 pr-2">
                          <FormLabel className="text-xs font-semibold">Enable Team Requests</FormLabel>
                          <FormDescription className="text-xs">
                            Allow solo users to request to join open teams.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="auto_team_name"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
                        <div className="space-y-0.5 pr-2">
                          <FormLabel className="text-xs font-semibold">Auto-number Team Names</FormLabel>
                          <FormDescription className="text-xs">
                            Automatically name teams as "Team 1", "Team 2", etc. Participants won't be prompted for a team name.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 7: Custom Registration Questions */}
          <Card className="rounded-2xl border border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
              <div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold">Custom Registration Questions</CardTitle>
                </div>
                <CardDescription className="text-xs mt-1">
                  Collect participant in-game IDs, ranks, or custom survey answers (up to 4 questions).
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium"
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
                Add Question ({customQuestions.length}/4)
              </Button>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {customQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-border/60 rounded-xl py-10 px-4 text-center bg-muted/10">
                  <div className="p-3 rounded-full bg-muted/40 mb-3">
                    <HelpCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">No custom questions added</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Ask participants questions during signup, like Riot ID, Epic Tag, BattleTag, or Discord handle.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="border border-border/60 bg-muted/15 rounded-xl p-4 sm:p-5 relative space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-border/40 pb-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Question #{index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => {
                            const newQuestions = [...customQuestions];
                            newQuestions.splice(index, 1);
                            setCustomQuestions(newQuestions);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold">
                            Question Text <span className="text-primary">*</span>
                          </label>
                          <Input
                            value={question.question}
                            placeholder="e.g. In-Game Riot ID + Tag"
                            maxLength={45}
                            className="bg-muted/20 border-border/60 h-9 text-xs"
                            onChange={(e) => {
                              const newQuestions = [...customQuestions];
                              newQuestions[index].question = e.target.value;
                              setCustomQuestions(newQuestions);
                            }}
                          />
                          <p className="text-[11px] text-muted-foreground text-right">
                            {question.question.length}/45
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold">Placeholder Hint</label>
                          <Input
                            value={question.placeholder}
                            placeholder="e.g. PlayerName#NA1"
                            maxLength={100}
                            className="bg-muted/20 border-border/60 h-9 text-xs"
                            onChange={(e) => {
                              const newQuestions = [...customQuestions];
                              newQuestions[index].placeholder = e.target.value;
                              setCustomQuestions(newQuestions);
                            }}
                          />
                          <p className="text-[11px] text-muted-foreground text-right">
                            {question.placeholder.length}/100
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold">Default Value</label>
                          <Textarea
                            value={question.default}
                            placeholder="Optional default pre-fill value"
                            maxLength={4000}
                            rows={2}
                            className="bg-muted/20 border-border/60 min-h-[64px] text-xs resize-y"
                            onChange={(e) => {
                              const newQuestions = [...customQuestions];
                              newQuestions[index].default = e.target.value;
                              setCustomQuestions(newQuestions);
                            }}
                          />
                        </div>

                        <div className="flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold">Answer Field Type</label>
                            <Select
                              value={String(question.type)}
                              onValueChange={(val) => {
                                const newQuestions = [...customQuestions];
                                newQuestions[index].type = parseInt(val) as 1 | 2;
                                setCustomQuestions(newQuestions);
                              }}
                            >
                              <SelectTrigger className="bg-muted/20 border-border/60 h-9 text-xs">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Short Input (Single Line)</SelectItem>
                                <SelectItem value="2">Long Input (Textarea)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between rounded-lg border border-border/40 p-2.5 bg-background/50">
                            <span className="text-xs font-medium">Mandatory Question</span>
                            <Switch
                              checked={question.required}
                              onCheckedChange={(checked) => {
                                const newQuestions = [...customQuestions];
                                newQuestions[index].required = checked;
                                setCustomQuestions(newQuestions);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sticky Bottom Action Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-lg">
            <div className="text-xs text-muted-foreground hidden sm:block">
              Event will be saved with current configuration.
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[130px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
