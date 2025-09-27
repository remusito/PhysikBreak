import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameState } from '@/lib/types';
import { Loader2, Heart } from 'lucide-react';

interface GameUIProps {
  gameState: GameState;
  score: number;
  level: number;
  lives: number;
  onStart: () => void;
  onNextLevel: () => void;
  onRestart: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, score, level, lives, onStart, onNextLevel, onRestart }) => {
  const renderLives = () => {
    return Array.from({ length: lives }).map((_, i) => (
      <Heart key={i} className="inline-block h-6 w-6 text-primary fill-current" />
    ));
  };
    
  const Overlay: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {children}
    </div>
  );

  const renderContent = () => {
    switch (gameState) {
      case 'LOADING':
        return (
          <Overlay>
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </Overlay>
        );
      case 'START_SCREEN':
        return (
          <Overlay>
            <Card className="text-center w-4/5 max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-4xl text-primary">PhysikBreak</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-2xl font-bold">Level {level}</p>
                    <Button onClick={onStart} size="lg" className="w-full font-bold text-lg">Tap to Start</Button>
                </CardContent>
            </Card>
          </Overlay>
        );
      case 'LEVEL_COMPLETE':
        return (
          <Overlay>
            <Card className="text-center w-4/5 max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-4xl text-green-500">Level Complete!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xl">Your score: <span className="font-bold">{score}</span></p>
                    <Button onClick={onNextLevel} size="lg" className="w-full">Next Level</Button>
                </CardContent>
            </Card>
          </Overlay>
        );
      case 'GAME_OVER':
        return (
          <Overlay>
            <Card className="text-center w-4/5 max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-4xl text-destructive">Game Over</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xl">Final Score: <span className="font-bold">{score}</span></p>
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
    <div className="absolute inset-0 pointer-events-none">
      <header className="p-4 flex justify-between items-center text-foreground font-headline text-2xl">
        <div>Score: {score}</div>
        <div className="flex items-center gap-2">{renderLives()}</div>
        <div className="font-bold text-primary-foreground" style={{ WebkitTextStroke: '1px hsl(var(--primary))', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Lvl: {level}</div>
      </header>
      {renderContent()}
    </div>
  );
};

export default GameUI;
