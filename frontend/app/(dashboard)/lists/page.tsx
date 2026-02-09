// app/(dashboard)/lists/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Lock, Globe, Trash2, Eye } from "lucide-react"
import { listsAPI } from "@/lib/api/lists"
import { toast } from "sonner"

export default function ListsPage() {
  const router = useRouter()
  const [lists, setLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      setLoading(true)
      const result = await listsAPI.getMyLists(1, 50)
      setLists(result.lists || [])
    } catch (error) {
      console.error("Load lists error:", error)
      toast.error("Failed to load lists")
    } finally {
      setLoading(false)
    }
  }

  const deleteList = async (listId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return

    try {
      await listsAPI.delete(listId)
      toast.success("List deleted")
      loadLists()
    } catch (error) {
      toast.error("Failed to delete list")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading lists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Lists</h1>
            <p className="text-gray-400">
              Create custom lists to organize your favorite movies and shows
            </p>
          </div>
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => router.push('/lists/create')}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create List
          </Button>
        </div>

        {/* Lists Grid */}
        {lists.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800 p-12 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              No lists yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first list to start organizing your content
            </p>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => router.push('/lists/create')}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First List
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <Card
                key={list.id}
                className="bg-gray-900 border-gray-800 hover:border-purple-600 transition-all group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-purple-400 transition-colors">
                        {list.title}
                      </h3>
                      {list.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {list.description}
                        </p>
                      )}
                    </div>
                    {list.is_public ? (
                      <Badge variant="outline" className="text-green-400 border-green-400 ml-2">
                        <Globe className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-400 border-gray-400 ml-2">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-500 text-sm mb-4">
                    {list.items?.length || 0} items
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/lists/${list.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteList(list.id, list.title)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}