// app/(dashboard)/lists/create/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft } from "lucide-react"
import { listsAPI } from "@/lib/api/lists"
import { toast } from "sonner"

export default function CreateListPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_public: true,
    is_ranked: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("Please enter a list title")
      return
    }

    setLoading(true)
    try {
      const result = await listsAPI.create({
        title: formData.title,
        description: formData.description || undefined,
        is_public: formData.is_public,
        is_ranked: formData.is_ranked
      })

      toast.success("List created successfully!")
      router.push(`/lists/${result.list.id}`)
    } catch (error: any) {
      console.error("Create list error:", error)
      toast.error(error.response?.data?.error || "Failed to create list")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => router.push('/lists')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lists
        </Button>

        <h1 className="text-4xl font-bold text-white mb-2">Create New List</h1>
        <p className="text-gray-400 mb-8">
          Organize your favorite movies and TV shows into custom lists
        </p>

        {/* Form */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-white mb-2 block">
                List Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Best Sci-Fi Movies"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-white mb-2 block">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what this list is about..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                maxLength={500}
              />
              <p className="text-gray-500 text-sm mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <Label htmlFor="is_public" className="text-white font-semibold">
                  Public List
                </Label>
                <p className="text-gray-400 text-sm">
                  Allow others to view this list
                </p>
              </div>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>

            {/* Ranked Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <Label htmlFor="is_ranked" className="text-white font-semibold">
                  Ranked List
                </Label>
                <p className="text-gray-400 text-sm">
                  Items will be ordered by rank
                </p>
              </div>
              <Switch
                id="is_ranked"
                checked={formData.is_ranked}
                onCheckedChange={(checked) => setFormData({ ...formData, is_ranked: checked })}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/lists')}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create List"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}