// components/media/streaming-modal.tsx

"use client"

import { useState, useEffect } from "react"
import { streamingAPI } from "@/lib/api/streaming"
import { ExternalLink, Loader2, DollarSign, TrendingUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StreamingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: 'movie' | 'tv'
  contentId: number
  title: string
}

interface StreamingOption {
  platform: string
  logo?: string
  type: 'stream' | 'rent' | 'buy' | 'free'
  price?: number
  currency?: string
  quality?: string
  url?: string
}

export function StreamingModal({
  open,
  onOpenChange,
  contentType,
  contentId,
  title,
}: StreamingModalProps) {
  const [loading, setLoading] = useState(false)
  const [streamingOptions, setStreamingOptions] = useState<StreamingOption[]>([])

  useEffect(() => {
    if (open) {
      loadStreamingOptions()
    }
  }, [open, contentId])

  const loadStreamingOptions = async () => {
  setLoading(true)
  try {
    
    // Real API call
    const response = contentType === 'movie'
      ? await streamingAPI.getMovieAvailability(contentId)
      : await streamingAPI.getTVAvailability(contentId)
    
    // Transform API response to component format
    const allOptions: StreamingOption[] = [
      ...response.options.free,
      ...response.options.stream,
      ...response.options.rent,
      ...response.options.buy,
    ]
    
    setStreamingOptions(allOptions)
  } catch (error) {
    console.error('Failed to load streaming options:', error)
    setStreamingOptions([])
  } finally {
    setLoading(false)
  }
}

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stream': return 'bg-green-600'
      case 'free': return 'bg-blue-600'
      case 'rent': return 'bg-orange-600'
      case 'buy': return 'bg-purple-600'
      default: return 'bg-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stream': return <TrendingUp className="w-4 h-4" />
      case 'rent':
      case 'buy': return <DollarSign className="w-4 h-4" />
      default: return null
    }
  }

  const groupedOptions = {
    stream: streamingOptions.filter(o => o.type === 'stream'),
    rent: streamingOptions.filter(o => o.type === 'rent'),
    buy: streamingOptions.filter(o => o.type === 'buy'),
    free: streamingOptions.filter(o => o.type === 'free'),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Where to Watch
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {title}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : streamingOptions.length === 0 ? (
          <div className="py-12 text-center">
            <ExternalLink className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No streaming options available
            </h3>
            <p className="text-gray-400 mb-6">
              This content may not be available in your region yet.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open(`https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Search on JustWatch
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="stream" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="stream" disabled={groupedOptions.stream.length === 0}>
                Stream ({groupedOptions.stream.length})
              </TabsTrigger>
              <TabsTrigger value="rent" disabled={groupedOptions.rent.length === 0}>
                Rent ({groupedOptions.rent.length})
              </TabsTrigger>
              <TabsTrigger value="buy" disabled={groupedOptions.buy.length === 0}>
                Buy ({groupedOptions.buy.length})
              </TabsTrigger>
              <TabsTrigger value="free" disabled={groupedOptions.free.length === 0}>
                Free ({groupedOptions.free.length})
              </TabsTrigger>
            </TabsList>

            {(['stream', 'rent', 'buy', 'free'] as const).map((type) => (
              <TabsContent key={type} value={type} className="space-y-3">
                {groupedOptions[type].map((option, index) => (
                  <Card
                    key={index}
                    className="p-4 bg-gray-800 border-gray-700 hover:border-purple-600 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Platform Logo Placeholder */}
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {option.platform.charAt(0)}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-1">
                            {option.platform}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getTypeColor(option.type)} text-white`}>
                              {getTypeIcon(option.type)}
                              <span className="ml-1">{option.type}</span>
                            </Badge>
                            {option.quality && (
                              <Badge variant="outline" className="border-gray-600">
                                {option.quality}
                              </Badge>
                            )}
                            {option.price && (
                              <span className="text-sm text-gray-400">
                                ${option.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => window.open(option.url, '_blank')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Watch
                      </Button>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            📍 Showing availability for Kenya (KE) • 
            Prices and availability may vary
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}