// app/(dashboard)/my-list/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MyListContent } from "@/components/dashboard/my-list-content"

export default function MyListPage() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-4xl font-bold text-white mb-8">My List</h1>
      
      <Tabs defaultValue="favorites" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-800">
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
        </TabsList>
        
        <TabsContent value="favorites" className="mt-6">
          <MyListContent type="favorites" />
        </TabsContent>
        
        <TabsContent value="watchlist" className="mt-6">
          <MyListContent type="watchlist" />
        </TabsContent>
      </Tabs>
    </div>
  )
}