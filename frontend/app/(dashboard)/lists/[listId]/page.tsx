// app/(dashboard)/lists/[listId]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trash2, Share2, Lock, Globe } from "lucide-react"
import { listsAPI } from "@/lib/api/lists"
import { getImageUrl } from "@/lib/api/tmdb"
import { toast } from "sonner"

export default function ListDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.listId as string

  const [list, setList] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadList()
  }, [listId])

  const loadList = async () => {
    try {
      setLoading(true)
      const result = await listsAPI.getDetails(listId)
      setList(result.list)
    } catch (error) {
      console.error("Load list error:", error)
      toast.error("Failed to load list")
      router.push('/lists')
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!confirm("Remove this item from the list?")) return

    try {
      await listsAPI.removeItem(listId, itemId)
      toast.success("Item removed")
      loadList() // Reload list
    } catch (error) {
      toast.error("Failed to remove item")
    }
  }

  const deleteList = async () => {
    if (!confirm("Delete this entire list? This cannot be undone.")) return

    try {
      await listsAPI.delete(listId)
      toast.success("List deleted")
      router.push('/lists')
    } catch (error) {
      toast.error("Failed to delete list")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading list...</p>
        </div>
      </div>
    )
  }

  if (!list) return null

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/lists')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lists
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white">{list.title}</h1>
              {list.is_public ? (
                <Badge variant="outline" className="text-green-400 border-green-400">
                  <Globe className="w-3 h-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-400 border-gray-400">
                  <Lock className="w-3 h-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
            {list.description && (
              <p className="text-gray-400 text-lg">{list.description}</p>
            )}
            <p className="text-gray-500 mt-2">
              {list.items?.length || 0} items
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="destructive" onClick={deleteList}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete List
            </Button>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-7xl mx-auto">
        {!list.items || list.items.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800 p-12 text-center">
            <p className="text-gray-400 text-lg">This list is empty</p>
            <p className="text-gray-500 mt-2">
              Add movies and shows using the "Add to List" button on detail pages
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {list.items.map((item: any) => (
              <Card
                key={item.id}
                className="bg-gray-900 border-gray-800 overflow-hidden group relative"
              >
                <div className="aspect-2/3 relative">
                  <Image
                    src={getImageUrl(item.poster_path, 'w500') || '/placeholder.svg'}
                    alt={item.title || item.name || 'Content'}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-white font-semibold line-clamp-1 text-sm">
                    {item.title || item.name || `${item.content_type} #${item.content_id}`}
                  </h3>
                  {item.notes && (
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                      {item.notes}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}