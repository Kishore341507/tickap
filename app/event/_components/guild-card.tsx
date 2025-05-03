import { Card, CardDescription, CardImage } from '@/components/ui/image-card'
import React from 'react'
import { Guild } from '@/types'


interface EventCardProps {
    guild: Guild;
}

export default function GuildCard( { guild } : EventCardProps) {
  return (
    <Card className="border-secondary hover:scale-105 duration-500 ease-in-out"  >
        <CardImage
          ratio={1}
          src={guild.icon ? guild.icon : 'https://cdn.discordapp.com/embed/avatars/0.png'}
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
