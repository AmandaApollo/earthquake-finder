import { Suspense } from "react"
import EarthquakeSearch from "@/components/earthquake-search"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Earthquake Search</h1>
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Suspense fallback={<div className="text-center py-8">Loading map...</div>}>
            <EarthquakeSearch />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}
