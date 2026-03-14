"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCrush = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      // Pass the text to the result page via sessionStorage for simplicity
      // In a real app we might use a global store or a server action
      sessionStorage.setItem("jargon_input", text);
      router.push("/result");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-neutral-900">
          Stop reading corporate nonsense.
        </h1>
        <p className="text-xl text-neutral-600">
          Jargon Crusher turns fluffy business writing into clear thinking in one
          click.
        </p>

        <div className="w-full mt-10 p-6 bg-white rounded-2xl shadow-sm border border-neutral-200">
          <textarea
            className="w-full h-40 p-4 border border-neutral-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none text-lg"
            placeholder="Paste a LinkedIn post or corporate email here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handleCrush}
            disabled={loading || !text.trim()}
            className="w-full mt-4 bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {loading ? "Crushing..." : "Crush your first paragraph"}
          </button>
        </div>

        <div className="mt-12 text-sm text-neutral-500 flex justify-center space-x-4">
          <span>Available as a Chrome Extension</span>
          <span>•</span>
          <span>100% Free</span>
        </div>
      </div>
    </div>
  );
}
