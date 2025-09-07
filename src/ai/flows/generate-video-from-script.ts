'use server';
/**
 * @fileOverview Ce fichier définit un flux Genkit pour générer une vidéo à partir d'un script.
 *
 * Le flux prend un script en entrée et utilise le modèle Veo pour générer une vidéo.
 * Il gère l'opération asynchrone de génération vidéo.
 *
 * @fileOverview Génère une vidéo à partir d'un script fourni.
 * - generateVideoFromScript - Fonction pour générer la vidéo à partir du script.
 * - GenerateVideoFromScriptInput - Type d'entrée pour la fonction.
 * - GenerateVideoFromScriptOutput - Type de sortie pour la fonction.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as fs from 'fs';
import {Readable} from 'stream';

// Schéma d'entrée pour le flux, attendant un script sous forme de chaîne de caractères.
const GenerateVideoFromScriptInputSchema = z.object({
  script: z
    .string()
    .describe('Le script à partir duquel générer la vidéo.'),
});
export type GenerateVideoFromScriptInput = z.infer<
  typeof GenerateVideoFromScriptInputSchema
>;

// Schéma de sortie, qui contiendra l'URL de la vidéo générée.
const GenerateVideoFromScriptOutputSchema = z.object({
  videoUrl: z.string().describe("L'URL de la vidéo générée."),
});
export type GenerateVideoFromScriptOutput = z.infer<
  typeof GenerateVideoFromScriptOutputSchema
>;

/**
 * Point d'entrée pour le flux de génération de vidéo.
 * @param {GenerateVideoFromScriptInput} input - L'objet contenant le script.
 * @returns {Promise<GenerateVideoFromScriptOutput>} Une promesse qui se résout avec l'URL de la vidéo.
 */
export async function generateVideoFromScript(
  input: GenerateVideoFromScriptInput
): Promise<GenerateVideoFromScriptOutput> {
  return generateVideoFromScriptFlow(input);
}

// Définition du flux Genkit pour la génération de vidéo.
const generateVideoFromScriptFlow = ai.defineFlow(
  {
    name: 'generateVideoFromScriptFlow',
    inputSchema: GenerateVideoFromScriptInputSchema,
    outputSchema: GenerateVideoFromScriptOutputSchema,
  },
  async input => {
    // Appel au modèle de génération d'IA (ici, le modèle vidéo Veo de Google).
    let {operation} = await ai.generate({
      model: 'googleai/veo-2.0-generate-001', // Spécifie le modèle à utiliser.
      prompt: input.script, // Le script est passé comme prompt.
      config: {
        // Configuration spécifique au modèle.
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    // La génération de vidéo est une opération longue. Le modèle renvoie une "opération" à surveiller.
    if (!operation) {
      throw new Error("Le modèle devait retourner une opération");
    }

    // Boucle de surveillance : on vérifie l'état de l'opération jusqu'à ce qu'elle soit terminée.
    while (!operation.done) {
      operation = await ai.checkOperation(operation); // Vérifie le statut.
      // Pause de 5 secondes avant de vérifier à nouveau pour ne pas surcharger le service.
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Si l'opération a échoué, on lance une erreur.
    if (operation.error) {
      throw new Error(
        'échec de la génération de la vidéo: ' + operation.error.message
      );
    }

    // Une fois terminée, le résultat contient la vidéo.
    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video) {
      throw new Error('Impossible de trouver la vidéo générée');
    }

    // Retourne l'URL de la vidéo. L'URL est souvent une data URI (base64).
    return {
      videoUrl: video.media!.url,
    };
  }
);
