"use client";

import { useEffect, useState } from "react";

type Problem = {
  id: number;
  value: string;
  answer: number;
  y: number;
  active: boolean;
};

export default function MathRocketDefender() {
  const [operation, setOperation] = useState<"+" | "-" | "*" | "/" | "all">("all");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Generate a random problem
  const generateProblem = () => {
    const ops = operation === "all" ? ["+", "-", "*", "/"] : [operation];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;
    if (op === "/") {
      // ensure integer division
      a = a * b;
    }
    const value = `${a} ${op} ${b}`;
    const answer = eval(value);
    return {
      id: Date.now() + Math.random(),
      value,
      answer,
      y: -50,
      active: true,
    };
  };

  // Add new problem periodically
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      setProblems((prev) => [...prev, generateProblem()]);
    }, 2000);
    return () => clearInterval(interval);
  }, [gameStarted, operation, generateProblem]);

  // Move problems down
  useEffect(() => {
    if (!gameStarted) return;
    const animation = () => {
      setProblems((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y + 2 }))
          .filter((p) => p.y < 600) // remove if too low
      );
      requestAnimationFrame(animation);
    };
    const raf = requestAnimationFrame(animation);
    return () => cancelAnimationFrame(raf);
  }, [gameStarted]);

  // Handle input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(input);
    if (isNaN(num)) {
      setInput("");
      return;
    }
    const active = problems.find((p) => p.active);
    if (!active) {
      setInput("");
      return;
    }
    if (num === active.answer) {
      // correct
      setScore((s: number) => s + 1);
      setProblems((prev) => prev.filter((p) => p.id !== active.id));
    } else {
      // incorrect: shake input
      const el = document.getElementById("answer-input");
      if (el) el.classList.add("shake");
      setTimeout(() => {
        if (el) el.classList.remove("shake");
      }, 500);
    }
    setInput("");
  };

  return (
    <div className="relative w-full h-[80vh] bg-black text-white overflow-hidden">
      {/* Space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 to-black"></div>
      {/* Rocket */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <svg
          width="50"
          height="80"
          viewBox="0 0 50 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M25 0L0 80H50L25 0Z" fill="orange" />
          <rect x="20" y="60" width="10" height="20" fill="gray" />
        </svg>
      </div>
      {/* Problems */}
      {problems.map((p) => (
        <div
          key={p.id}
          className={`absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold ${
            p.active ? "text-orange-400" : "text-white"
          }`}
          style={{ top: `${p.y}px` }}
        >
          {p.value}
        </div>
      ))}
      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4"
      >
        <input
          id="answer-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Answer"
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
        />
      </form>
      {/* Score */}
      <div className="absolute top-4 left-4 text-xl">
        Score: {score}
      </div>
      {/* Start button */}
      {!gameStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-4xl mb-4">Math Rocket Defender</h1>
          <select
            value={operation}
            onChange={(e) =>
              setOperation(e.target.value as any)
            }
            className="mb-4 p-2 rounded bg-gray-800 text-white border border-gray-600"
          >
            <option value="all">All</option>
            <option value="+">Addition (+)</option>
            <option value="-">Subtraction (-)</option>
            <option value="*">Multiplication (*)</option>
            <option value="/">Division (/)</option>
          </select>
          <button
            onClick={() => setGameStarted(true)}
            className="p-3 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Start Game
          </button>
        </div>
      )}
      <style jsx>{`
        .shake {
          animation: shake 0.5s;
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
