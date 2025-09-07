'use server';
/**
 * @fileOverview Ce fichier définit un flux Genkit pour générer un script de vidéo éducative.
 *
 * Le flux prend un sujet en entrée et renvoie un script structuré.
 *
 * @fileOverview Génère un script de vidéo éducative basé sur un sujet fourni par l'utilisateur.
 *
 * - generateEducationalVideoScript - Une fonction qui génère le script vidéo.
 * - GenerateEducationalVideoScriptInput - Le type d'entrée pour la fonction generateEducationalVideoScript.
 * - GenerateEducationalVideoScriptOutput - Le type de retour pour la fonction generateEducationalVideoScript.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Définit le schéma (la structure attendue) pour les données d'entrée du flux.
// 'z.object' vient de la bibliothèque Zod, utilisée pour la validation de schémas.
const GenerateEducationalVideoScriptInputSchema = z.object({
  // 'topic' doit être une chaîne de caractères. '.describe' ajoute une description pour la documentation.
  topic: z.string().describe('Le sujet pour le script de la vidéo éducative.'),
});
// Crée un type TypeScript à partir du schéma Zod. C'est une bonne pratique pour la sécurité de type.
export type GenerateEducationalVideoScriptInput = z.infer<
  typeof GenerateEducationalVideoScriptInputSchema
>;

// Définit le schéma pour les données de sortie du flux.
const GenerateEducationalVideoScriptOutputSchema = z.object({
  title: z.string().describe('Le titre de la vidéo.'),
  introduction: z.string().describe("L'introduction du script de la vidéo."),
  keyPoints: z.string().describe('Les points clés du script de la vidéo.'),
  practicalExample: z
    .string()
    .describe('Un exemple pratique pour illustrer le sujet.'),
  conclusion: z.string().describe('La conclusion du script de la vidéo.'),
  visualSuggestions: z
    .string()
    .describe('Suggestions visuelles pour chaque section de la vidéo.'),
});

// Crée le type TypeScript pour la sortie.
export type GenerateEducationalVideoScriptOutput = z.infer<
  typeof GenerateEducationalVideoScriptOutputSchema
>;

/**
 * Fonction exportée qui sert de point d'entrée pour exécuter le flux.
 * Elle prend l'entrée, appelle le flux Genkit, et retourne la sortie.
 * @param {GenerateEducationalVideoScriptInput} input - L'objet d'entrée contenant le sujet.
 * @returns {Promise<GenerateEducationalVideoScriptOutput>} Une promesse qui se résout avec le script généré.
 */
export async function generateEducationalVideoScript(
  input: GenerateEducationalVideoScriptInput
): Promise<GenerateEducationalVideoScriptOutput> {
  return generateEducationalVideoScriptFlow(input);
}

// Définit un "Prompt" Genkit. C'est un modèle pour interagir avec le modèle de langage (IA).
const generateEducationalVideoScriptPrompt = ai.definePrompt({
  name: 'generateEducationalVideoScriptPrompt', // Un nom unique pour ce prompt.
  input: {schema: GenerateEducationalVideoScriptInputSchema}, // Le schéma d'entrée.
  output: {schema: GenerateEducationalVideoScriptOutputSchema}, // Le schéma de sortie souhaité.
  // Le texte du prompt lui-même. {{{topic}}} est une syntaxe Handlebars
  // pour insérer la valeur du champ 'topic' de l'entrée.
  prompt: `Vous êtes un expert dans la création de scripts de vidéos éducatives. Votre tâche est de générer un script vidéo complet et engageant basé sur le sujet fourni.

Le script doit inclure les sections suivantes :

1.  Titre: Un titre accrocheur et informatif pour la vidéo.
2.  Introduction: Une introduction engageante qui capte l'attention du spectateur et présente le sujet.
3.  Points Clés: Une décomposition des concepts principaux, expliquée de manière claire et concise.
4.  Exemple Pratique: Un exemple du monde réel pour aider les spectateurs à comprendre l'application pratique du sujet.
5.  Conclusion: Un résumé des points clés à retenir et un appel à l'action.
6.  Suggestions Visuelles: Des idées de visuels (par exemple, animations, graphiques, séquences) pour accompagner chaque section du script.

Sujet: {{{topic}}}

Assurez-vous que le script est bien structuré, facile à comprendre et visuellement attrayant.

Générez le script au format JSON.
`,
});

// Définit le "Flow" (flux) Genkit. Un flux orchestre une ou plusieurs étapes,
// comme appeler un prompt, pour accomplir une tâche.
const generateEducationalVideoScriptFlow = ai.defineFlow(
  {
    name: 'generateEducationalVideoScriptFlow', // Nom unique du flux.
    inputSchema: GenerateEducationalVideoScriptInputSchema, // Schéma d'entrée.
    outputSchema: GenerateEducationalVideoScriptOutputSchema, // Schéma de sortie.
  },
  async input => {
    // Exécute le prompt défini ci-dessus avec l'entrée fournie.
    const {output} = await generateEducationalVideoScriptPrompt(input);
    // Retourne la sortie obtenue du modèle de langage. Le '!' indique à TypeScript que 'output' ne sera pas null.
    return output!;
  }
);
