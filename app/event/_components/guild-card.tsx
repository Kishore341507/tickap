import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardImage, CardTitle } from '@/components/ui/card';
import { Calendar, Gamepad2 } from 'lucide-react';
import React from 'react'

interface Guild {
    name: string;
    icon: string;
  }
  
interface EventCardProps {
    guild: Guild;
}

export default function GuildCard( { guild } : EventCardProps) {
  return (
    <Card className="border-secondary hover:scale-105 duration-500 ease-in-out"  >
        <CardImage
          className=''
          ratio={1}
          src={guild.icon}
          alt={guild.name}
          width={10}
          height={10}
          />
        <CardDescription className="text-center py-2">
          {guild.name}
        </CardDescription>

    </Card>
  )
}
