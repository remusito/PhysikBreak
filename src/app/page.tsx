import PhysikBreakGame from "@/components/game/PhysikBreakGame";

export default function Home() {
  return (
    <main className="relative flex h-screen w-screen flex-col items-center justify-center bg-background overflow-hidden">
        <PhysikBreakGame />
    </main>
  );
}
