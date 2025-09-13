// 'use server' indique que ce fichier s'exécute uniquement sur le serveur.
// C'est une fonctionnalité de Next.js qui permet de créer des "Server Actions".
// Ces fonctions peuvent être appelées directement depuis les composants clients
// sans avoir à créer une API REST manuellement.
'use server';

import {
  generateEducationalVideoScript,
  type GenerateEducationalVideoScriptOutput,
} from '@/ai/flows/generate-educational-video-script';
import {generateVideoFromScript} from '@/ai/flows/generate-video-from-script';
import {z} from 'zod';

// Schéma de validation pour l'entrée de génération de script.
// Utilise Zod pour s'assurer que le sujet a au moins 3 caractères.
const scriptInputSchema = z.object({
  topic: z.string().min(3, 'Le sujet doit contenir au moins 3 caractères.'),
});

// Interface pour structurer la réponse de nos actions serveur.
// Permet d'avoir une réponse cohérente, qu'il y ait succès ou erreur.
interface ActionResult<T> {
  success: boolean; // Indique si l'action a réussi.
  data?: T; // Les données retournées en cas de succès.
  error?: string; // Le message d'erreur en cas d'échec.
}

/**
 * Action serveur pour générer le script vidéo.
 * Elle est appelée depuis le composant client `page.tsx`.
 * @param params - Un objet contenant le `topic` pour le script.
 * @returns Un objet ActionResult avec le script généré ou une erreur.
 */
export async function generateScriptAction(params: {
  topic: string;
}): Promise<ActionResult<GenerateEducationalVideoScriptOutput>> {
  try {
    // 1. Valider les données d'entrée.
    const validation = scriptInputSchema.safeParse(params);
    if (!validation.success) {
      // Si la validation échoue, retourner une erreur.
      return {success: false, error: validation.error.errors[0].message};
    }

    // 2. Appeler le flux Genkit pour générer le script.
    const script = await generateEducationalVideoScript({
      topic: validation.data.topic,
    });
    // 3. Retourner le script en cas de succès.
    return {success: true, data: script};
  } catch (e) {
    // 4. Gérer les erreurs qui pourraient survenir pendant l'appel au flux.
    console.error(e);
    const errorMessage =
      e instanceof Error ? e.message : 'Une erreur inconnue est survenue.';
    return {
      success: false,
      error: `Échec de la génération du script. ${errorMessage}`,
    };
  }
}

/**
 * Action serveur pour générer la vidéo à partir d'un script.
 * @param params - Un objet contenant le `script` complet.
 * @returns Un objet ActionResult avec l'URL de la vidéo ou une erreur.
 */
export async function generateVideoAction(params: {
  script: GenerateEducationalVideoScriptOutput;
  model: string;
}): Promise<ActionResult<{videoUrl: string}>> {
  try {
    // 1. Déstructurer le script pour extraire toutes ses parties.
    const {
      title,
      introduction,
      keyPoints,
      practicalExample,
      conclusion,
      visualSuggestions,
    } = params.script;

    // 2. Concaténer toutes les parties pour former un script complet que le modèle vidéo peut utiliser.
    const fullScript = `
        Titre: ${title}\n\n
        Introduction: ${introduction}\n\n
        Points Clés: ${keyPoints}\n\n
        Exemple Pratique: ${practicalExample}\n\n
        Conclusion: ${conclusion}\n\n
        Suggestions visuelles pour la vidéo: ${visualSuggestions}
        `;

    // 3. Appeler le flux Genkit pour générer la vidéo.
    const result = await generateVideoFromScript({
      script: fullScript,
      model: params.model,
    });
    // 4. Retourner l'URL de la vidéo en cas de succès.
    return {success: true, data: result};
  } catch (e) {
    // 5. Gérer les erreurs. La génération de vidéo peut échouer en cas de forte demande.
    console.error(e);
    const errorMessage =
      e instanceof Error ? e.message : 'Une erreur inconnue est survenue.';
    return {
      success: false,
      error: `Échec de la génération de la vidéo. Cela peut arriver en période de forte demande. Veuillez réessayer plus tard. Détails: ${errorMessage}`,
    };
  }
}
