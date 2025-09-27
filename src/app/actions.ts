'use server';

import { generateBrickLayout, type GenerateBrickLayoutOutput, type GenerateBrickLayoutInput } from '@/ai/flows/generate-dynamic-brick-layouts';
import type { Brick } from '@/lib/types';

function createFallbackLayout(gameWidth: number, gameHeight: number, brickWidth: number, brickHeight: number, colors: string[]): Brick[] {
    const bricks: Brick[] = [];
    const rows = 5;
    const cols = 10;
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            bricks.push({
                x: c * brickWidth,
                y: r * brickHeight + 50,
                width: brickWidth - 2,
                height: brickHeight - 2,
                color: colors[r % colors.length],
                strength: 1,
                initialStrength: 1,
            });
        }
    }
    return bricks;
}

export async function getBrickLayout(level: number, gameWidth: number, gameHeight: number): Promise<GenerateBrickLayoutOutput> {
  const BRICK_WIDTH = gameWidth / 10;
  const BRICK_HEIGHT = 20;
  const BRICK_COLORS = '#29ABE2,#90EE90,#FF5733,#33FF57,#FF33A1,#A133FF';
  const colorArray = BRICK_COLORS.split(',');

  try {
    const layoutInput: GenerateBrickLayoutInput = {
      level,
      gameWidth,
      gameHeight: gameHeight * 0.5, // Generate bricks in the top half
      brickWidth: BRICK_WIDTH,
      brickHeight: BRICK_HEIGHT,
      brickColors: BRICK_COLORS,
    };
    const layout = await generateBrickLayout(layoutInput);

    if (!layout || !layout.bricks || layout.bricks.length === 0) {
        throw new Error("AI returned empty layout");
    }

    return layout;
  } catch (error) {
    console.error(`AI brick generation failed for level ${level}:`, error);
    console.log("Using fallback layout.");
    const fallbackBricks = createFallbackLayout(gameWidth, gameHeight, BRICK_WIDTH, BRICK_HEIGHT, colorArray);
    return { bricks: fallbackBricks };
  }
}
