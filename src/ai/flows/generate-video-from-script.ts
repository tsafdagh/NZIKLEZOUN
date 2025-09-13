'use server';
/**
 * @fileOverview Ce fichier définit un flux Genkit pour générer une vidéo à partir d'un script.
 *
 * Le flux prend un script en entrée et utilise le modèle Veo pour générer une vidéo.
 * Il gère l'opération asynchrone de génération vidéo, télécharge la vidéo,
 * et la convertit en data URI pour qu'elle soit directement utilisable dans le navigateur.
 *
 * @fileOverview Génère une vidéo à partir d'un script fourni.
 * - generateVideoFromScript - Fonction pour générer la vidéo à partir du script.
 * - GenerateVideoFromScriptInput - Type d'entrée pour la fonction.
 * - GenerateVideoFromScriptOutput - Type de sortie pour la fonction.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {MediaPart} from 'genkit';

// Schéma d'entrée pour le flux, attendant un script sous forme de chaîne de caractères.
const GenerateVideoFromScriptInputSchema = z.object({
  script: z.string().describe('Le script à partir duquel générer la vidéo.'),
  model: z.string().optional().describe('Le modèle vidéo à utiliser (veo-2.0-generate-001 ou veo-3.0-generate-preview).'),
});
export type GenerateVideoFromScriptInput = z.infer<
  typeof GenerateVideoFromScriptInputSchema
>;

// Schéma de sortie, qui contiendra l'URL de la vidéo générée au format data URI.
const GenerateVideoFromScriptOutputSchema = z.object({
  videoUrl: z.string().describe('La vidéo générée, encodée en data URI.'),
});
export type GenerateVideoFromScriptOutput = z.infer<
  typeof GenerateVideoFromScriptOutputSchema
>;

/**
 * Point d'entrée pour le flux de génération de vidéo.
 * @param {GenerateVideoFromScriptInput} input - L'objet contenant le script.
 * @returns {Promise<GenerateVideoFromScriptOutput>} Une promesse qui se résout avec la data URI de la vidéo.
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
    // Détermine le modèle à utiliser. Par défaut, ce sera Veo 2.
    const model = input.model || 'googleai/veo-2.0-generate-001';
    let config: { durationSeconds?: number, aspectRatio: string } = { aspectRatio: '16:9' };

    // Veo 2 permet de configurer la durée, Veo 3 non (elle est par défaut à 8s).
    if (model === 'googleai/veo-2.0-generate-001') {
      config.durationSeconds = 8; // Durée maximale
    }

    // Appel au modèle de génération d'IA (ici, le modèle vidéo Veo de Google).
    let {operation} = await ai.generate({
      model: model as any, // Spécifie le modèle à utiliser.
      prompt: input.script, // Le script est passé comme prompt.
      config,
    });

    // La génération de vidéo est une opération longue. Le modèle renvoie une "opération" à surveiller.
    if (!operation) {
      throw new Error('Le modèle devait retourner une opération');
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

    // Télécharge la vidéo et la convertit en data URI.
    const videoDataUri = await downloadVideoAsDataUri(video);

    // Retourne la data URI de la vidéo.
    return {
      videoUrl: videoDataUri,
    };
  }
);

/**
 * Télécharge une vidéo à partir d'une URL signée et la convertit en data URI.
 * @param {MediaPart} video - L'objet media part contenant l'URL de la vidéo.
 * @returns {Promise<string>} Une promesse qui se résout avec la data URI de la vidéo.
 */
async function downloadVideoAsDataUri(video: MediaPart): Promise<string> {
  const fetch = (await import('node-fetch')).default;
  if (!video.media?.url) {
    throw new Error('URL de la vidéo manquante.');
  }

  // L'URL retournée par Veo est une URL signée qui nécessite la clé d'API pour le téléchargement.
  const videoDownloadResponse = await fetch(
    `${video.media.url}&key=${process.env.GEMINI_API_KEY}`
  );

  if (
    !videoDownloadResponse ||
    videoDownloadResponse.status !== 200 ||
    !videoDownloadResponse.body
  ) {
    throw new Error('Échec du téléchargement de la vidéo');
  }

  // Lit le corps de la réponse en tant que Buffer.
  const videoBuffer = await videoDownloadResponse.arrayBuffer();
  const buffer = Buffer.from(videoBuffer);

  // Détermine le type de contenu, avec une valeur par défaut si non fourni.
  const contentType = video.media.contentType || 'video/mp4';

  // Crée la data URI.
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}
