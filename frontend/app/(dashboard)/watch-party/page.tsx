// app/(dashboard)/watch-party/page.tsx

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Users, Play, Clock, Calendar, Copy, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { watchPartyAPI, WatchParty } from "@/lib/api/watchparty"

export default function WatchPartyPage() {
  const router = useRouter()
  const [parties, setParties] = useState<WatchParty[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'waiting' | 'playing' | 'ended'>('all')

  useEffect(() => {
    loadParties()
  }, [filter])

  const loadParties = async () => {
    try {
      setLoading(true)
      const response = await watchPartyAPI.getMyParties({ status: filter, limit: 50 })
      setParties(response.parties)
    } catch (error) {
      console.error('Failed to load parties:', error)
      toast.error('Failed to load watch parties')
    } finally {
      setLoading(false)
    }
  }

  const copyPartyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Party code copied!')
  }

  const copyPartyLink = (code: string) => {
    const link = `${window.location.origin}/watch-party/${code}`
    navigator.clipboard.writeText(link)
    toast.success('Party link copied!')
  }

  const joinParty = (code: string) => {
    router.push(`/watch-party/${code}`)
  }

  const endParty = async (partyId: string) => {
    try {
      await watchPartyAPI.end(partyId)
      toast.success('Watch party ended')
      loadParties()
    } catch (error) {
      toast.error('Failed to end party')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-600'
      case 'playing': return 'bg-green-600'
      case 'paused': return 'bg-orange-600'
      case 'ended': return 'bg-muted-foreground/30'
      default: return 'bg-muted-foreground/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4" />
      case 'playing': return <Play className="w-4 h-4" />
      case 'ended': return <Calendar className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Watch Parties</h1>
            <p className="text-muted-foreground">Host or join synchronized viewing sessions</p>
          </div>
          <Button
            onClick={() => router.push('/watch-party/create')}
            className="bg-linear-to-r from-primary to-highlight hover:from-primary/90 hover:to-highlight/90"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Party
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'waiting', 'playing', 'ended'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className={filter === status ? 'bg-primary hover:bg-primary/90' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Parties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 bg-card border-border animate-pulse">
                <div className="h-6 bg-secondary rounded mb-4" />
                <div className="h-4 bg-secondary rounded mb-2" />
                <div className="h-4 bg-secondary rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : parties.length === 0 ? (
          <Card className="p-12 bg-card border-border text-center">
            <Users className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No watch parties yet</h3>
            <p className="text-muted-foreground mb-6">Create your first watch party to get started!</p>
            <Button
              onClick={() => router.push('/watch-party/create')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Party
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parties.map((party, index) => (
              <motion.div
                key={party.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-card border-border hover:border-primary transition-all">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={`${getStatusColor(party.status)} text-foreground`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(party.status)}
                        {party.status}
                      </span>
                    </Badge>
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {party.participant_count || 0}/{party.max_participants}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                    {party.title}
                  </h3>

                  {/* Episode Info */}
                  {party.content_type === 'tv_show' && party.season_number && (
                    <p className="text-sm text-muted-foreground mb-3">
                      S{party.season_number}E{party.episode_number}
                    </p>
                  )}

                  {/* Party Code */}
                  <div className="flex items-center gap-2 mb-4 p-3 bg-secondary rounded">
                    <code className="text-primary font-mono font-bold flex-1">
                      {party.party_code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyPartyCode(party.party_code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Created Date */}
                  <p className="text-xs text-muted-foreground mb-4">
                    Created {new Date(party.created_at).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {party.status !== 'ended' && (
                      <>
                        <Button
                          onClick={() => joinParty(party.party_code)}
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Join
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => copyPartyLink(party.party_code)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {party.status !== 'ended' && (
                      <Button
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-600 hover:text-foreground"
                        onClick={() => endParty(party.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}