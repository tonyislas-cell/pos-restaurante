export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen text-ink flex flex-col bg-transparent">
      {/* Contenido principal admin - Sin sidebar porque la navegación es mediante el dock */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
