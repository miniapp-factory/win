"use client";

import { useEffect, useState, useCallback } from "react";

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

  // --- New states for lives & game over ---
  const [lives, setLives] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [highScores, setHighScores] = useState<Record<string, number>>({
    '+': 0,
    '-': 0,
    '*': 0,
    '/': 0,
    'all': 0,
  });

  // Generate a random problem
  const generateProblem = useCallback(() => {
    const ops = operation === "all" ? ["+", "-", "*", "/"] : [operation];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;
    if (op === "/") {
      a = a * b;
    }
    const value = `${a} ${op} ${b}`;
    const answer = eval(value);
    return {
      id: Date.now() + Math.random(),
      value,
      answer,
      y: -50,
      active: false,
    };
  }, [operation]);

  // Add new problem periodically
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      setProblems((prev) => {
        const newProblem = {
          ...generateProblem(),
          active: false,
        };
        const updated = [...prev, newProblem];
        return updated.map((p, index) => ({
          ...p,
          active: index === 0,
        }));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [gameStarted, operation, generateProblem]);

  // Move problems down
  useEffect(() => {
    if (!gameStarted) return;
    let animationFrameId: number;
    const animation = () => {
      setProblems((prev) => {
        const updated = prev
          .map((p) => ({ ...p, y: p.y + Math.floor(window.innerHeight * 0.002) }))
          .filter((p) => {
            if (p.y >= Math.floor(window.innerHeight * 0.8)) {
              // Problem hit the rocket
              setLives((l) => {
                const newLives = l - 1;
                if (newLives <= 0) {
                  setGameOver(true);
                  setGameStarted(false);
                  setProblems([]);
                  return 5; // reset lives on game over
                }
                return newLives;
              });
              return false; // remove problem
            }
            return true;
          });
        if (updated.length > 0) {
          updated[0].active = true;
        }
        return updated;
      });
      animationFrameId = requestAnimationFrame(animation);
    };
    animationFrameId = requestAnimationFrame(animation);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStarted]);

  // Update high score whenever score changes for the current operation
  useEffect(() => {
    if (score > highScores[operation]) {
      setHighScores((prev) => ({
        ...prev,
        [operation]: score,
      }));
    }
  }, [score, operation, highScores]);

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
      setScore((s) => s + 1);
      setProblems((prev) => {
        const newProblems = prev.filter((p) => p.id !== active.id);
        if (newProblems.length > 0) {
          newProblems[0].active = true;
        }
        return newProblems;
      });
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
    <div className="relative w-full mx-auto max-w-4xl h-[calc(100vh-64px)] bg-black text-white overflow-hidden">
      {/* Space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 to-black"></div>

      {/* Rocket */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
        <svg
          width="50"
          height="80"
          viewBox="0 0 50 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Nose cone */}
          <polygon points="25,0 10,20 40,20" fill="red" />
          {/* Body */}
          <rect x="10" y="20" width="30" height="40" fill="orange" />
          {/* Window */}
          <circle cx="25" cy="35" r="5" fill="blue" />
          {/* Fins */}
          <polygon points="10,60 0,70 10,70" fill="turquoise" />
          <polygon points="40,60 50,70 40,70" fill="turquoise" />
          {/* Flame */}
          <path d="M25,70 Q20,75 25,80 Q30,75 25,70" fill="orange" />
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
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2"
      >
        <input
          id="answer-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Answer"
          autoComplete="off"
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out"
        />
      </form>

      {/* Back button – visible only while the game is active */}
      {gameStarted && !gameOver && (
        <button
          onClick={() => {
            setGameStarted(false);
            setProblems([]);
            setScore(0);
            setLives(5);
            setGameOver(false);
          }}
          className="absolute top-4 left-4 z-10 text-white bg-transparent border border-white rounded px-2 py-1"
        >
          Back
        </button>
      )}
      {/* Score */}
      <div className="absolute top-12 right-4 text-xl text-orange-400">
        Score: {score}
      </div>
      <div className="absolute top-4 right-4 text-xl text-green-400">
        High Score: {highScores[operation]}
      </div>

      {/* Lives */}
      <div className="absolute top-12 left-4 text-xl text-red-500">
        Lives: {lives}
      </div>

      {/* Start button & operation selection */}
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-5xl mb-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Math Blast</h1>
          <p className="text-lg mb-4 text-center text-gray-300">A playful 2D math shooter where rockets hit falling math questions.</p>
          <label className="mb-2 text-lg">Choose your Operation</label>
          <select
            value={operation}
            onChange={(e) =>
              setOperation(e.target.value as "+" | "-" | "*" | "/" | "all")
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

      {/* Game Over overlay */}
      {gameOver && (() => {
        const effectiveHighScore = score > highScores[operation] ? score : highScores[operation];
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-red-500 text-3xl font-bold">
            <div className="mb-4 text-orange-400">Score: {score}</div>
            <div className="mb-4 text-green-400">High Score: {effectiveHighScore}</div>
            Game Over
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => {
                // Update high score if current score is higher
                if (score > highScores[operation]) {
                  setHighScores(prev => ({
                    ...prev,
                    [operation]: score
                  }));
                }
                setGameStarted(true);
                setGameOver(false);
                setLives(5);
                setProblems([]);
                setScore(0);
              }}
            >
              Restart
            </button>
          </div>
        );
      })()}

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
