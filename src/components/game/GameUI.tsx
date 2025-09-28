import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameState } from '@/lib/types';
import { Loader2, Heart, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameUIProps {
  gameState: GameState;
  score: number;
  level: number;
  lives: number;
  isMuted: boolean;
  onStart: () => void;
  onNextLevel: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  scoreGlow: boolean;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, score, level, lives, isMuted, onStart, onNextLevel, onRestart, onToggleMute, scoreGlow }) => {
  const renderLives = () => {
    return Array.from({ length: lives }).map((_, i) => (
      <Heart key={i} className="inline-block h-5 w-5 sm:h-6 sm:w-6 text-primary fill-current" />
    ));
  };
    
  const Overlay: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-transparent pointer-events-auto">
        {children}
    </div>
  );

  const renderContent = () => {
    switch (gameState) {
      case 'LOADING':
        return (
          <Overlay>
            <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
          </Overlay>
        );
      case 'START_SCREEN':
        return (
          <Overlay>
            <Card className="text-center w-4/5 max-w-md bg-background/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl sm:text-4xl text-primary">PhysikBreak</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xl sm:text-2xl font-bold">Level {level}</p>
                    <div className="text-base sm:text-lg">Click to Launch</div>
                </CardContent>
            </Card>
          </Overlay>
        );
      case 'LEVEL_COMPLETE':
        return (
          <Overlay>
            <Card className="text-center w-4/5 max-w-md bg-background/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl sm:text-4xl text-green-500">Level Complete!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg sm:text-xl">Your score: <span className="font-bold">{score}</span></p>
                    <Button onClick={onNextLevel} size="lg" className="w-full">Next Level</Button>
                </CardContent>
            </Card>
          </Overlay>
        );
      case 'GAME_OVER':
        return (
          <Overlay>
            <Card className="text-center w-4/5 max-w-md bg-background/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl sm:text-4xl text-destructive">Game Over</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg sm:text-xl">Final Score: <span className="font-bold">{score}</span></p>
                    <Button onClick={onRestart} size="lg" className="w-full">Try Again</Button>
                </CardContent>
            </Card>
          </Overlay>
        );
      case 'PLAYING':
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
       <header className="p-2 sm:p-4 flex justify-between items-start text-foreground font-headline text-xl sm:text-2xl">
        <div className={cn("transition-all duration-300", scoreGlow && "text-primary scale-110 drop-shadow-[0_0_8px_hsl(var(--primary))]")}>Score: {score}</div>
        <div className="text-center">
            <div className="font-bold text-primary-foreground" style={{ WebkitTextStroke: '1px hsl(var(--primary))', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Lvl: {level}</div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={onToggleMute} className="pointer-events-auto text-primary focus:outline-none">
                {isMuted ? <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" /> : <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
            {renderLives()}
        </div>
      </header>
      {renderContent()}
    </div>
  );
};

export default GameUI;
