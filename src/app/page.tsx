import PhysikBreakGame from "@/components/game/PhysikBreakGame";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";

export default function Home() {
  const backgroundImage = PlaceHolderImages.find(p => p.id === 'game-background');
  
  return (
    <main className="relative flex h-[100svh] w-screen flex-col items-center justify-center bg-background overflow-hidden">
        {backgroundImage && (
            <Image
                src={backgroundImage.imageUrl}
                alt={backgroundImage.description}
                fill
                className="object-cover z-0"
                data-ai-hint={backgroundImage.imageHint}
                priority
            />
        )}
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          <PhysikBreakGame />
        </div>
    </main>
  );
}
