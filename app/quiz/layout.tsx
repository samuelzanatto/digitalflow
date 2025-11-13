export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <main className="mx-auto">
        {children}
      </main>
    </div>
  )
}
