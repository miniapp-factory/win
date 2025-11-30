import { generateMetadata } from "@/lib/farcaster-embed";
export { generateMetadata };

import { description, title } from "@/lib/metadata";
import MathRocketDefender from "@/components/math-rocket-defender";

export default function Home() {
  return (
    <main className="flex flex-col gap-3 place-items-center place-content-center px-4 grow">
      <span className="text-2xl">{title}</span>
      <span className="text-muted-foreground">{description}</span>
      <MathRocketDefender />
    </main>
  );
}
