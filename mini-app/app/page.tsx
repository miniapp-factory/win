import { generateMetadata } from "@/lib/farcaster-embed";
export { generateMetadata };

import MathRocketDefender from "@/components/math-rocket-defender";

export default function Home() {
  // NEVER write anything here, only use this page to import components
  return (
    <main className="flex flex-col place-items-center place-content-center grow">
      <MathRocketDefender />
    </main>
  );
}
