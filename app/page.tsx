import TodoList from "@/components/TodoList";

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Todo List</h1>
        <p className="text-gray-500">
          Built with Next.js + Google Apps Script + Google Sheets
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <TodoList />
      </div>

      <footer className="text-center mt-8 text-sm text-gray-400">
        <p>Data stored in Google Sheets</p>
      </footer>
    </main>
  );
}
