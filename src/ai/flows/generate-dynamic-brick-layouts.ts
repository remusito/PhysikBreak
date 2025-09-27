'use server';
/**
 * @fileOverview This file defines a Genkit flow to generate dynamic brick layouts for the PhysikBreak game.
 *
 * It includes:
 * - generateBrickLayout - A function that generates a brick layout.
 * - GenerateBrickLayoutInput - The input type for the generateBrickLayout function.
 * - GenerateBrickLayoutOutput - The return type for the generateBrickLayout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBrickLayoutInputSchema = z.object({
  level: z
    .number()
    .describe('The level number for which to generate the brick layout.'),
  gameWidth: z
    .number()
    .describe('The width of the game screen in pixels.'),
  gameHeight: z
    .number()
    .describe('The height of the game screen in pixels.'),
  brickWidth: z.number().describe('The width of a single brick in pixels.'),
  brickHeight: z.number().describe('The height of a single brick in pixels.'),
  brickColors: z
    .string()
    .describe(
      'A comma-separated list of valid CSS color values for the bricks.'
    ),
});
export type GenerateBrickLayoutInput = z.infer<
  typeof GenerateBrickLayoutInputSchema
>;

const GenerateBrickLayoutOutputSchema = z.object({
  bricks: z
    .array(
      z.object({
        x: z.number().describe('The x-coordinate of the brick.'),
        y: z.number().describe('The y-coordinate of the brick.'),
        width: z.number().describe('The width of the brick.'),
        height: z.number().describe('The height of the brick.'),
        color: z.string().describe('The color of the brick.'),
        strength: z.number().describe('The number of hits required to break it.'),
      })
    )
    .describe('An array of brick objects defining the layout.'),
});
export type GenerateBrickLayoutOutput = z.infer<
  typeof GenerateBrickLayoutOutputSchema
>;

export async function generateBrickLayout(
  input: GenerateBrickLayoutInput
): Promise<GenerateBrickLayoutOutput> {
  return generateBrickLayoutFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBrickLayoutPrompt',
  input: {schema: GenerateBrickLayoutInputSchema},
  output: {schema: GenerateBrickLayoutOutputSchema},
  prompt: `You are a game designer specializing in level design for an Arkanoid-style game called PhysikBreak. 
You will generate a brick layout for a specific level, considering the game's dimensions, brick sizes, and available colors.
The layout should be challenging and engaging, with a variety of brick arrangements. As the level increases, the difficulty should increase by including bricks with higher strength.

Level: {{{level}}}
Game Width: {{{gameWidth}}}px
Game Height: {{{gameHeight}}}px
Brick Width: {{{brickWidth}}}px
Brick Height: {{{brickHeight}}}px
Brick Colors: {{{brickColors}}}

Create an array of brick objects with x, y, width, height, color and strength properties. 
- For level 1, all bricks should have a strength of 1.
- For levels 2-5, introduce some bricks with strength 2.
- For levels 6 and above, introduce bricks with strength up to 3 or even 4, and make the layouts more complex.
Ensure that the bricks fit within the game's boundaries. The highest y-coordinate should not exceed gameHeight.

Output the brick layout as a JSON array of brick objects:
{{#each bricks}}
  {{this}}
{{/each}}`,
});

const generateBrickLayoutFlow = ai.defineFlow(
  {
    name: 'generateBrickLayoutFlow',
    inputSchema: GenerateBrickLayoutInputSchema,
    outputSchema: GenerateBrickLayoutOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
