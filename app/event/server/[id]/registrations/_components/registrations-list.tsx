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
import { UserPlus, UserX, Trash2, RefreshCw, Copy, Check, User, Pencil, Ban, CheckCircle2 } from "lucide-react";
import { RegistrationUser , Registration } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface RegistrationsListProps {
  registrations: Registration[];
  isSolo: boolean;
  onAddUser: (registration: Registration) => void;
  onRemoveUser: (registration: Registration, user: RegistrationUser) => void;
  onReplaceUser: (registration: Registration, user: RegistrationUser) => void;
  onDeleteRegistration: (registration: Registration) => void;
  onDisqualifyRegistration: (registration: Registration) => void;
  onEditInputs?: (registration: Registration) => void;
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

export function RegistrationsList({ 
  registrations, 
  isSolo, 
  onAddUser, 
  onRemoveUser,
  onReplaceUser,
  onDeleteRegistration,
  onDisqualifyRegistration,
  onEditInputs 
}: RegistrationsListProps) {
  return (
    <div className="space-y-4">
      {registrations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-muted/10">
          <p className="text-sm font-medium text-foreground">No registrations found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search criteria or add a new registration above.
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full space-y-3">
          {registrations.map((registration, regIndex) => (
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
                <AccordionTrigger className="flex-1 text-left hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full pr-3 gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                      <span className={`font-semibold text-sm truncate ${
                        registration.is_disqualified
                          ? "text-muted-foreground line-through decoration-destructive/70"
                          : "text-foreground"
                      }`}>
                        {registration.team_name || `Team #${regIndex + 1}`}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">
                        #{regIndex + 1}
                      </span>
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
                    <Badge variant="outline" className="text-[11px] font-medium shrink-0 ml-auto">
                      {registration.registrationusers.length}{" "}
                      {registration.registrationusers.length === 1 ? "player" : "players"}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <div className="flex items-center gap-1 shrink-0">
                  {!isSolo && (
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
                    {registration.registrationusers.map((user, uIndex) => (
                      <div
                        key={user.user_id.toString()}
                        className="flex items-center justify-between p-2.5 border border-border/50 bg-card/60 hover:bg-card/90 transition-colors rounded-xl gap-2"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
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
                        {!isSolo && (
                          <div className="flex items-center gap-0.5 shrink-0">
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
                    ))}
                  </div>

                  {/* Custom Responses Section */}
                  {registration.extra && (
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
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}