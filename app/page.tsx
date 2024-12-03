import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl text-center">Gmail解析ページ</h1>
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Link href="/api/oauth2" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        OAuth2.0
      </Link>
    </main>
    </div>
  );
}