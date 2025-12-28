import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Welcome to Lomba Web</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <Link
            key={num}
            href={`/fitur-${num}`}
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
          >
            <h2 className="text-2xl font-semibold">Fitur {num}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Klik untuk melihat fitur {num}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
