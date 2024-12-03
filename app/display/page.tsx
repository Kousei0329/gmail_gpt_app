"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DisplayPage = () => {
  const router = useRouter();
  const [emails, setEmails] = useState<{ subject: string; body: string; importance: string }[]>([]);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState<number | null>(null);

  useEffect(() => {
    // メールデータを取得する関数
    const fetchEmails = async () => {
      try {
        const response = await fetch("/api/emails");
        if (!response.ok) {
          throw new Error("Failed to fetch emails");
        }
        console.log(response)
        const data = await response.json();
        console.log(data);
        setEmails(data);
      } catch (error) {
        console.error("Error fetching emails:", error);
        router.push("/"); // エラーが発生した場合はホームにリダイレクト
      }
    };

    fetchEmails();
  }, [router]);

  const handleEmailClick = (index: number) => {
    setSelectedEmailIndex(selectedEmailIndex === index ? null : index); // クリックされたメールを選択状態にする
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-center mb-6">Emails</h1>
      <ul className="space-y-4 mx-auto max-w-md">
        {emails.map((email, index) => (
          <li
            key={index}
            className={`bg-white shadow-md border border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
              selectedEmailIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
            onClick={() => handleEmailClick(index)} // カードクリック時に状態変更
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">件名：{email.subject}</h2>
            <p className="text-gray-600">重要度: <span className="font-bold">{email.importance}</span></p>

            {/* 本文表示部分 */}
            {selectedEmailIndex === index && (
              <div className="mt-4 text-gray-700">
                <h3 className="text-sm font-semibold mb-2">本文:</h3>
                <p className="text-sm">{email.body}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DisplayPage;
