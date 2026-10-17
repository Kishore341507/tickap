"use client";

import { useState } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  UserPlus, 
  UserX, 
  Trash2, 
  RefreshCw, 
  Copy, 
  Check, 
  User, 
  Pencil, 
  Ban, 
  CheckCircle2,
  GripVertical,
  ArrowRightLeft,
  ArrowDownToLine,
  AlertTriangle,
} from "lucide-react";
import { RegistrationUser , Registration } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { MoveUserToTeamDialog } from "./move-user-dialog";

interface RegistrationsListProps {
  registrations: Registration[];
  isSolo: boolean;
  maxTeamSize?: number | null;
  minTeamSize?: number | null;
  allowIncompleteTeams?: boolean | null;
  onAddUser: (registration: Registration) => void;
  onRemoveUser: (registration: Registration, user: RegistrationUser) => void;
  onReplaceUser: (registration: Registration, user: RegistrationUser) => void;
  onDeleteRegistration: (registration: Registration) => void;
  onDisqualifyRegistration: (registration: Registration) => void;
  onEditInputs?: (registration: Registration) => void;
  onTransferUser?: (
    sourceRegistration: Registration,
    targetRegistration: Registration,
    user: RegistrationUser
  ) => void;
}

function CopyableText({ 
  text, 
  className,
  truncate = false 
}: { 
  text: string; 
  className?: string;
  truncate?: boolean;
}) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div 
      className={`flex ${truncate ? "items-center gap-1" : "items-start justify-between gap-2"} cursor-pointer hover:opacity-80 transition-opacity ${className || ""}`}
      onClick={handleCopy}
    >
      <div className={truncate ? "truncate" : "break-words whitespace-pre-wrap flex-1 leading-relaxed"}>
        {text}
      </div>
      {isCopied ? (
        <Check className={`h-3 w-3 text-green-500 animate-in zoom-in duration-300 shrink-0 ${truncate ? "" : "mt-0.5"}`} />
      ) : (
        <Copy className={`h-3 w-3 text-muted-foreground shrink-0 ${truncate ? "" : "mt-0.5"}`} />
      )}
    </div>
  );
}

function hasCustomAnswers(extra: any): boolean {
  if (!extra) return false;
  try {
    let data = typeof extra === 'string' ? JSON.parse(extra) : extra;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch {}
    }
    return !!data && typeof data === 'object' && Object.keys(data).length > 0;
  } catch {
    return false;
  }
}

function renderCustomResponses(
  registration: Registration,
  onEditInputs?: (registration: Registration) => void
) {
  if (!registration.extra) return null;

  return (
    <div className="mt-4 pt-3 border-t border-border/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Custom Registration Answers
        </p>
        {onEditInputs && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditInputs(registration);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit custom answers</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Custom Answers</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2.5">
        {(() => {
          try {
            let extraData = typeof registration.extra === 'string'
              ? JSON.parse(registration.extra)
              : registration.extra;
            
            if (typeof extraData === 'string') {
              try { extraData = JSON.parse(extraData); } catch {}
            }
            
            if (!extraData || typeof extraData !== 'object' || Object.keys(extraData).length === 0) {
              return <p className="text-xs text-muted-foreground">No answers provided</p>;
            }

            return Object.entries(extraData).map(([question, answerObj], index) => {
              const isBooleanTrue = answerObj === true || answerObj === "true";
              const isBooleanFalse = answerObj === false || answerObj === "false";
              const isArray = Array.isArray(answerObj);
              const isUserId = typeof answerObj === "string" && /^\d{17,20}$/.test(answerObj.trim());

              return (
                <div key={index} className="space-y-1.5">
                  <h4 className="text-xs font-medium text-foreground">{question}</h4>
                  {isBooleanTrue ? (
                    <div className="pt-0.5">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 text-xs py-1 px-2.5">
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span>Yes / Confirmed</span>
                      </Badge>
                    </div>
                  ) : isBooleanFalse ? (
                    <div className="pt-0.5">
                      <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-border/40 text-xs py-1 px-2.5">
                        <span>No</span>
                      </Badge>
                    </div>
                  ) : isArray ? (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {(answerObj as any[]).map((item: any, idx: number) => {
                        const strItem = typeof item === 'string' || typeof item === 'number' ? String(item) : JSON.stringify(item);
                        const isMemberId = typeof item === 'string' && /^\d{17,20}$/.test(item.trim());
                        return (
                          <Badge key={idx} variant="secondary" className="text-xs py-0.5 px-2 font-mono gap-1">
                            {isMemberId && <User className="h-3 w-3 text-muted-foreground" />}
                            <span>{strItem}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  ) : isUserId ? (
                    <div className="flex items-center gap-2 pt-0.5">
                      <Badge variant="secondary" className="font-mono text-xs gap-1.5 py-1 px-2.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{answerObj as string}</span>
                      </Badge>
                      <CopyableText text={String(answerObj)} className="text-xs text-muted-foreground" truncate />
                    </div>
                  ) : (
                    <div className="bg-background/60 p-2.5 rounded-lg border border-border/30">
                      <CopyableText 
                        text={typeof answerObj === 'string' ? answerObj : JSON.stringify(answerObj)} 
                        className="text-xs text-muted-foreground whitespace-pre-wrap font-sans w-full"
                      />
                    </div>
                  )}
                  {index < Object.entries(extraData).length - 1 && (
                    <Separator className="my-2 opacity-40" />
                  )}
                </div>
              );
            });
          } catch (e) {
            return <p className="text-xs text-muted-foreground">Unable to display custom responses</p>;
          }
        })()}
      </div>
    </div>
  );
}

export function RegistrationsList({ 
  registrations, 
  isSolo, 
  maxTeamSize,
  minTeamSize,
  allowIncompleteTeams,
  onAddUser, 
  onRemoveUser,
  onReplaceUser,
  onDeleteRegistration,
  onDisqualifyRegistration,
  onEditInputs,
  onTransferUser,
}: RegistrationsListProps) {
  const { toast } = useToast();
  const [draggedPlayer, setDraggedPlayer] = useState<{
    user: RegistrationUser;
    sourceRegistration: Registration;
  } | null>(null);
  const [dragOverRegId, setDragOverRegId] = useState<string | null>(null);

  // Mobile / Direct selection transfer dialog
  const [moveModalData, setMoveModalData] = useState<{
    open: boolean;
    sourceRegistration: Registration | null;
    user: RegistrationUser | null;
  }>({
    open: false,
    sourceRegistration: null,
    user: null,
  });
  if (registrations.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-muted/10">
        <p className="text-sm font-medium text-foreground">No registrations found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Try adjusting your search criteria or add a new registration above.
        </p>
      </div>
    );
  }

  const renderActionButtons = (registration: Registration, canAddMember: boolean = false) => (
    <div className="flex items-center gap-1 shrink-0">
      {canAddMember && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddUser(registration);
                }}
              >
                <UserPlus className="h-4 w-4" />
                <span className="sr-only">Add member</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Member</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg transition-colors ${
                registration.is_disqualified
                  ? "text-amber-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                  : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onDisqualifyRegistration(registration);
              }}
            >
              {registration.is_disqualified ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              <span className="sr-only">
                {registration.is_disqualified ? "Re-qualify registration" : "Disqualify registration"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{registration.is_disqualified ? "Re-qualify Team" : "Disqualify Team"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRegistration(registration);
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete registration</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete Registration</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <div className="space-y-3">
      <Accordion type="multiple" className="w-full space-y-3">
        {registrations.map((registration, regIndex) => {
          const isMultiPlayer = (registration.registrationusers?.length || 0) > 1;
          const isSoloItem = isSolo && !isMultiPlayer;
          const user = registration.registrationusers?.[0];
          const hasAnswers = hasCustomAnswers(registration.extra);

          // CASE 1: Solo item with NO custom answers -> Clean static card (no accordion chevron)
          if (isSoloItem && !hasAnswers) {
            return (
              <div
                key={registration.id.toString()}
                className={`border rounded-xl px-4 py-2.5 transition-colors ${
                  registration.is_disqualified
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border/50 bg-card/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-9 w-9 ring-1 ring-border/50 shrink-0">
                      <AvatarImage src={user?.pfp || undefined} alt={user?.user_name || registration.team_name || "User"} />
                      <AvatarFallback className="text-xs">
                        {(user?.user_name || registration.team_name)?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm truncate ${
                          registration.is_disqualified
                            ? "text-muted-foreground line-through decoration-destructive/70"
                            : "text-foreground"
                        }`}>
                          {user?.user_name || registration.team_name || "Unknown User"}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                          #{registration.local_id ?? (regIndex + 1)}
                        </span>
                        {registration.is_disqualified && (
                          <Badge 
                            variant="destructive" 
                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0 h-4.5 bg-destructive/15 text-destructive border-destructive/30 gap-1 shrink-0"
                          >
                            <Ban className="h-2.5 w-2.5" />
                            <span>Disqualified</span>
                          </Badge>
                        )}
                      </div>
                      {user?.user_id && (
                        <CopyableText 
                          text={user.user_id.toString()} 
                          className="text-[11px] text-muted-foreground font-mono mt-0.5"
                          truncate
                        />
                      )}
                    </div>
                  </div>
                  {renderActionButtons(registration, false)}
                </div>
              </div>
            );
          }

          // CASE 2: Solo item WITH custom answers -> Collapsible AccordionItem
          if (isSoloItem && hasAnswers) {
            return (
              <AccordionItem
                key={registration.id.toString()}
                value={registration.id.toString()}
                className={`group border rounded-xl px-4 py-1 transition-colors ${
                  registration.is_disqualified
                    ? "border-destructive/40 bg-destructive/5 data-[state=open]:border-destructive/60"
                    : "border-border/50 bg-card/30 data-[state=open]:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <AccordionTrigger className="flex-1 text-left hover:no-underline py-2.5">
                    <div className="flex items-center justify-between w-full pr-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-9 w-9 ring-1 ring-border/50 shrink-0">
                          <AvatarImage src={user?.pfp || undefined} alt={user?.user_name || registration.team_name || "User"} />
                          <AvatarFallback className="text-xs">
                            {(user?.user_name || registration.team_name)?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold text-sm truncate ${
                              registration.is_disqualified
                                ? "text-muted-foreground line-through decoration-destructive/70"
                                : "text-foreground"
                            }`}>
                              {user?.user_name || registration.team_name || "Unknown User"}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                              #{registration.local_id ?? (regIndex + 1)}
                            </span>
                            {registration.is_disqualified && (
                              <Badge 
                                variant="destructive" 
                                className="text-[10px] uppercase font-bold tracking-wider px-2 py-0 h-4.5 bg-destructive/15 text-destructive border-destructive/30 gap-1 shrink-0"
                              >
                                <Ban className="h-2.5 w-2.5" />
                                <span>Disqualified</span>
                              </Badge>
                            )}
                          </div>
                          {user?.user_id && (
                            <CopyableText 
                              text={user.user_id.toString()} 
                              className="text-[11px] text-muted-foreground font-mono mt-0.5"
                              truncate
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  {renderActionButtons(registration, false)}
                </div>
                <AccordionContent className="pt-2 pb-4 border-t border-border/30 mt-1">
                  <div className="space-y-4">
                    {registration.is_disqualified && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                        <Ban className="h-4 w-4 shrink-0" />
                        <p className="font-medium">
                          This registration is currently disqualified. Player does not possess active tournament roles.
                        </p>
                      </div>
                    )}
                    {renderCustomResponses(registration, onEditInputs)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          }

          // CASE 3: Multi-Player Team (Standard Team Event OR Legacy Team in Solo Event)
          const isSourceTeam =
            draggedPlayer?.sourceRegistration.id.toString() === registration.id.toString();
          const isDragOver =
            dragOverRegId === registration.id.toString() && !isSourceTeam;
          const currentCount = registration.registrationusers?.length || 0;
          const isTargetFull = maxTeamSize ? currentCount >= maxTeamSize : false;

          return (
            <AccordionItem 
              key={registration.id.toString()} 
              value={registration.id.toString()} 
              onDragOver={(e) => {
                if (!draggedPlayer || isSourceTeam) return;
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = isTargetFull ? "none" : "move";
                if (dragOverRegId !== registration.id.toString()) {
                  setDragOverRegId(registration.id.toString());
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  if (dragOverRegId === registration.id.toString()) {
                    setDragOverRegId(null);
                  }
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverRegId(null);
                if (!draggedPlayer || isSourceTeam) return;

                if (isTargetFull) {
                  toast({
                    title: "Team is full",
                    description: `"${registration.team_name || "This team"}" has reached the maximum size of ${maxTeamSize} players.`,
                    variant: "destructive",
                  });
                  return;
                }

                onTransferUser?.(
                  draggedPlayer.sourceRegistration,
                  registration,
                  draggedPlayer.user
                );
                setDraggedPlayer(null);
              }}
              className={`group border rounded-xl px-4 py-1 transition-all ${
                isDragOver
                  ? isTargetFull
                    ? "border-destructive/70 bg-destructive/10 ring-2 ring-destructive/40 shadow-sm"
                    : "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-md"
                  : registration.is_disqualified
                  ? "border-destructive/40 bg-destructive/5 data-[state=open]:border-destructive/60"
                  : draggedPlayer && !isSourceTeam && !isTargetFull
                  ? "border-primary/40 bg-card/30 border-dashed hover:border-primary/70"
                  : "border-border/50 bg-card/30 data-[state=open]:border-border/80"
              }`}
            >
              {/* Drop Target Visual Banner */}
              {isDragOver && (
                <div className="pt-2 animate-in fade-in zoom-in-95 duration-150">
                  {isTargetFull ? (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-destructive/15 text-destructive text-xs font-medium border border-destructive/30">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Team reached maximum capacity ({currentCount}/{maxTeamSize} players)</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-primary/15 text-primary text-xs font-semibold border border-primary/30">
                      <div className="flex items-center gap-1.5">
                        <ArrowDownToLine className="h-3.5 w-3.5 shrink-0 animate-bounce" />
                        <span>Drop to move <strong>{draggedPlayer?.user.user_name || "player"}</strong> here</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-primary/20 text-primary border-primary/30">
                        {currentCount + 1} / {maxTeamSize || "∞"} players
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <AccordionTrigger className="flex-1 text-left hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full pr-3 gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                      <span className={`font-semibold text-sm truncate ${
                        registration.is_disqualified
                          ? "text-muted-foreground line-through decoration-destructive/70"
                          : "text-foreground"
                      }`}>
                        {registration.team_name || `Team #${registration.local_id ?? (regIndex + 1)}`}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">
                        #{registration.local_id ?? (regIndex + 1)}
                      </span>
                      {isSolo && isMultiPlayer && (
                        <Badge variant="outline" className="text-[10px] font-normal bg-amber-500/10 text-amber-500 border-amber-500/30">
                          Team ({registration.registrationusers.length} players)
                        </Badge>
                      )}
                      {registration.is_disqualified && (
                        <Badge 
                          variant="destructive" 
                          className="text-[10px] uppercase font-bold tracking-wider px-2 py-0 h-4.5 bg-destructive/15 text-destructive border-destructive/30 gap-1"
                        >
                          <Ban className="h-2.5 w-2.5" />
                          <span>Disqualified</span>
                        </Badge>
                      )}
                    </div>
                    {!isSolo && (
                      <Badge variant="outline" className="text-[11px] font-medium shrink-0 ml-auto">
                        {registration.registrationusers.length}{" "}
                        {registration.registrationusers.length === 1 ? "player" : "players"}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                {renderActionButtons(registration, !isSolo)}
              </div>
              <AccordionContent className="pt-2 pb-4 border-t border-border/30 mt-1">
                <div className="space-y-4">
                  {registration.is_disqualified && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                      <Ban className="h-4 w-4 shrink-0" />
                      <p className="font-medium">
                        This registration is currently disqualified. Team members do not possess active tournament roles.
                      </p>
                    </div>
                  )}

                  {/* Team Members Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {registration.registrationusers.map((user, uIndex) => {
                      const isBeingDragged =
                        draggedPlayer?.user.user_id.toString() === user.user_id.toString() &&
                        draggedPlayer.sourceRegistration.id.toString() === registration.id.toString();

                      return (
                        <div
                          key={user.user_id.toString()}
                          className={`user-card-item group/player flex items-center justify-between p-2.5 border rounded-xl gap-2 transition-all ${
                            isBeingDragged
                              ? "opacity-30 border-primary ring-2 ring-primary/40 scale-[0.98] bg-primary/5"
                              : "border-border/50 bg-card/60 hover:bg-card/90"
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            {!isSolo && (
                              <div
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  e.dataTransfer.setData(
                                    "application/json",
                                    JSON.stringify({
                                      userId: user.user_id.toString(),
                                      sourceRegId: registration.id.toString(),
                                    })
                                  );
                                  e.dataTransfer.effectAllowed = "move";
                                  const cardElement = e.currentTarget.closest(".user-card-item") as HTMLElement;
                                  if (cardElement && e.dataTransfer.setDragImage) {
                                    e.dataTransfer.setDragImage(cardElement, 20, 20);
                                  }
                                  setDraggedPlayer({ user, sourceRegistration: registration });
                                }}
                                onDragEnd={() => {
                                  setDraggedPlayer(null);
                                  setDragOverRegId(null);
                                }}
                                title="Drag to move player"
                                className="touch-none shrink-0 p-1 -ml-1 rounded hover:bg-muted/60 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground transition-colors"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                            )}
                            <Avatar className="h-8 w-8 ring-1 ring-border/50 shrink-0">
                              <AvatarImage src={user.pfp || undefined} alt={user.user_name || "User"} />
                              <AvatarFallback className="text-xs">
                                {user.user_name 
                                  ? user.user_name.substring(0, 2).toUpperCase() 
                                  : "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-xs text-foreground truncate">
                                  {user.user_name || "Unknown User"}
                                </p>
                                {!isSolo && uIndex === 0 && (
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-normal">
                                    Captain
                                  </Badge>
                                )}
                              </div>
                              <CopyableText 
                                text={user.user_id.toString()} 
                                className="text-[11px] text-muted-foreground font-mono"
                                truncate
                              />
                            </div>
                          </div>
                          {(!isSolo || isMultiPlayer) && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              {!isSolo && registrations.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMoveModalData({
                                      open: true,
                                      sourceRegistration: registration,
                                      user,
                                    });
                                  }}
                                  title="Move to another team"
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5" />
                                  <span className="sr-only">Move player to team</span>
                                </Button>
                              )}
                              {!isSolo && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
                                  onClick={() => onReplaceUser(registration, user)}
                                  title="Replace player"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  <span className="sr-only">Replace user</span>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                                onClick={() => onRemoveUser(registration, user)}
                                title="Remove player"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                <span className="sr-only">Remove user</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Responses Section */}
                  {renderCustomResponses(registration, onEditInputs)}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Accessible Move to Team Dialog */}
      <MoveUserToTeamDialog
        open={moveModalData.open}
        onClose={() => setMoveModalData({ open: false, sourceRegistration: null, user: null })}
        onMove={(source, target, user) => {
          onTransferUser?.(source, target, user);
        }}
        sourceRegistration={moveModalData.sourceRegistration}
        user={moveModalData.user}
        registrations={registrations}
        maxTeamSize={maxTeamSize}
      />
    </div>
  );
}