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
import { UserPlus, UserX, Trash2, RefreshCw, Copy, Check } from "lucide-react";
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
}

function CopyableText({ text, className }: { text: string, className?: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div 
      className={`flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={handleCopy}
    >
      <div className="truncate">
        {text}
      </div>
      {isCopied ? (
        <Check className="h-3 w-3 text-green-500 animate-in zoom-in duration-300 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
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
  onDeleteRegistration 
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
              className="group border border-border/50 bg-card/30 rounded-xl px-4 py-1 data-[state=open]:border-border/80 transition-colors"
            >
              <div className="flex items-center justify-between">
                <AccordionTrigger className="flex-1 text-left hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full pr-3 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {registration.team_name || `Team #${regIndex + 1}`}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">
                        #{regIndex + 1}
                      </span>
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
                </div>
              </div>
              <AccordionContent className="pt-2 pb-4 border-t border-border/30 mt-1">
                <div className="space-y-4">
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
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Custom Registration Answers
                      </p>
                      <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2.5">
                        {(() => {
                          try {
                            const extraData = typeof registration.extra === 'string'
                              ? JSON.parse(registration.extra)
                              : registration.extra;
                            
                            return Object.entries(extraData).map(([question, answerObj], index) => {
                              const answer = typeof answerObj === 'string' 
                                ? answerObj 
                                : (answerObj as any)?.toString() || "No response";
                                
                              return (
                                <div key={index} className="space-y-1">
                                  <h4 className="text-xs font-medium text-foreground">{question}</h4>
                                  <div className="bg-background/60 p-2 rounded-lg border border-border/30">
                                    <CopyableText 
                                      text={answer} 
                                      className="text-xs text-muted-foreground whitespace-pre-wrap font-mono"
                                    />
                                  </div>
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