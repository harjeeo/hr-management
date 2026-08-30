import { Header } from '../components/layout/Header'

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex-1 min-w-0">
      <Header title={title} />
      <div className="px-8 pb-8">
        <div className="border border-dashed border-gray-200 rounded-xl h-[70vh] flex items-center justify-center text-gray-400 text-sm">
          {title} page coming soon
        </div>
      </div>
    </div>
  )
}
