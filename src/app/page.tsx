// "use client" indique à Next.js que ce composant est un "Client Component".
// Cela signifie qu'il peut utiliser des hooks React (comme useState, useEffect)
// et interagir avec le navigateur, contrairement aux "Server Components".
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { GenerateEducationalVideoScriptOutput } from "@/ai/flows/generate-educational-video-script";
import { generateScriptAction, generateVideoAction } from "@/app/actions";
// Import des composants UI réutilisables depuis le dossier /components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/icons";
import { Loader } from "@/components/loader";
// Import des icônes depuis la bibliothèque lucide-react
import {
  FileText,
  Lightbulb,
  Clapperboard,
  BookCheck,
  Film,
  Sparkles,
  ChevronRight,
} from "lucide-react";

// Définit le schéma de validation du formulaire avec Zod.
// Zod est une bibliothèque de validation qui s'intègre bien avec react-hook-form.
const formSchema = z.object({
  topic: z
    .string()
    .min(3, {
      message: "Le sujet doit contenir au moins 3 caractères.",
    })
    .max(100, {
      message: "Le sujet doit faire 100 caractères ou moins.",
    }),
});

// Type TypeScript déduit du schéma Zod pour les valeurs du formulaire.
type FormValues = z.infer<typeof formSchema>;

// Interface pour définir la structure de l'état de notre application.
interface AppState {
  isLoadingScript: boolean; // Vrai si le script est en cours de génération.
  isLoadingVideo: boolean; // Vrai si la vidéo est en cours de génération.
  script: GenerateEducationalVideoScriptOutput | null; // Contiendra le script généré.
  videoUrl: string | null; // Contiendra l'URL de la vidéo générée.
}

// État initial de l'application au chargement de la page.
const initialState: AppState = {
  isLoadingScript: false,
  isLoadingVideo: false,
  script: null,
  videoUrl: null,
};

/**
 * Composant pour l'en-tête de l'application.
 * Un composant est une fonction qui retourne du JSX (une syntaxe similaire à HTML).
 */
function AppHeader() {
  return (
    <header className="flex items-center justify-center gap-3 py-8">
      <Logo className="h-8 w-8 text-primary" />
      <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground sm:text-4xl">
        NziklèZoun
      </h1>
    </header>
  );
}

/**
 * Composant pour le formulaire de saisie du sujet.
 * @param onSubmit - Fonction à appeler lors de la soumission du formulaire.
 * @param isSubmitting - Booléen pour désactiver le bouton pendant la soumission.
 */
function SubjectForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}) {
  // `useForm` est un hook de `react-hook-form` pour gérer l'état du formulaire.
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema), // Utilise Zod pour la validation.
    defaultValues: {
      topic: "", // Valeur initiale du champ 'topic'.
    },
  });

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Créez votre vidéo éducative</CardTitle>
        <CardDescription>
          Entrez un sujet pour générer un script de vidéo éducative avec l'IA.
        </CardDescription>
      </CardHeader>
      {/* Le composant `Form` de `react-hook-form` fournit le contexte du formulaire. */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            {/* `FormField` connecte un champ de formulaire à `react-hook-form`. */}
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sujet</FormLabel>
                  <FormControl>
                    {/* Le `...field` passe les props nécessaires (onChange, onBlur, value) à l'input. */}
                    <Input
                      placeholder="ex: La photosynthèse"
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSubmitting ? "Génération en cours..." : "Générer le script"}
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

/**
 * Composant réutilisable pour afficher une section du script.
 * @param icon - Le composant icône à afficher.
 * @param title - Le titre de la section.
 * @param content - Le contenu de la section.
 */
function ScriptSection({
  icon: Icon,
  title,
  content,
}: {
  icon: React.ElementType;
  title: string;
  content: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold font-headline">{title}</h3>
      </div>
      <p className="text-muted-foreground pl-8">{content}</p>
    </div>
  );
}

/**
 * Composant pour afficher le script généré.
 */
function ScriptDisplay({
  script,
  onGenerateVideo,
  isGenerating,
}: {
  script: GenerateEducationalVideoScriptOutput;
  onGenerateVideo: () => void;
  isGenerating: boolean;
}) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl font-headline">
            {script.title}
          </CardTitle>
        </div>
        <CardDescription>{script.introduction}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ScriptSection
          icon={BookCheck}
          title="Points Clés"
          content={script.keyPoints}
        />
        <ScriptSection
          icon={Lightbulb}
          title="Exemple Pratique"
          content={script.practicalExample}
        />
        <ScriptSection
          icon={Clapperboard}
          title="Conclusion"
          content={script.conclusion}
        />
        <ScriptSection
          icon={Film}
          title="Suggestions Visuelles"
          content={script.visualSuggestions}
        />
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2">
        <Button
          onClick={onGenerateVideo}
          disabled={isGenerating}
          className="w-full sm:w-auto"
        >
          {isGenerating ? "Génération de la vidéo..." : "Accepter & Générer la Vidéo"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Composant pour afficher la vidéo générée.
 */
function VideoDisplay({
  videoUrl,
  onReset,
}: {
  videoUrl: string;
  onReset: () => void;
}) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">Votre vidéo est prête !</CardTitle>
        <CardDescription>
          Regardez la vidéo générée ci-dessous. Vous pouvez la télécharger ou recommencer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
          <video src={videoUrl} controls className="h-full w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onReset} variant="outline">
          Recommencer
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Composant principal de la page d'accueil.
 * Il orchestre l'état et l'affichage des autres composants.
 */
export default function Home() {
  // `useState` est un hook React pour ajouter un état à un composant.
  // `state` contient la valeur actuelle, `setState` est la fonction pour la mettre à jour.
  const [state, setState] = useState<AppState>(initialState);
  // `useToast` est un hook personnalisé pour afficher des notifications (toasts).
  const { toast } = useToast();

  // Fonction pour gérer la soumission du formulaire de script.
  const handleScriptGeneration = async (values: FormValues) => {
    // Met à jour l'état pour afficher un loader.
    setState({ ...initialState, isLoadingScript: true });
    // Appelle l'action serveur `generateScriptAction`.
    const result = await generateScriptAction({ topic: values.topic });

    if (result.success && result.data) {
      // Si la génération réussit, on met à jour l'état avec le script reçu.
      setState((s) => ({ ...s, script: result.data }));
    } else {
      // Sinon, on affiche un message d'erreur.
      toast({
        variant: "destructive",
        title: "Échec de la génération du script",
        description: result.error,
      });
    }
    // Arrête le chargement.
    setState((s) => ({ ...s, isLoadingScript: false }));
  };

  // Fonction pour gérer la demande de génération de vidéo.
  const handleVideoGeneration = async () => {
    if (!state.script) return; // S'assure qu'un script existe.
    setState((s) => ({ ...s, isLoadingVideo: true }));

    // Appelle l'action serveur `generateVideoAction`.
    const result = await generateVideoAction({ script: state.script });

    if (result.success && result.data) {
      // Met à jour l'état avec l'URL de la vidéo.
      setState((s) => ({ ...s, videoUrl: result.data.videoUrl }));
    } else {
      // Affiche une erreur.
      toast({
        variant: "destructive",
        title: "Échec de la génération de la vidéo",
        description: result.error,
      });
    }
    setState((s) => ({ ...s, isLoadingVideo: false }));
  };

  // Fonction pour réinitialiser l'application à son état initial.
  const handleReset = () => {
    setState(initialState);
  };

  // Cette fonction détermine quel composant afficher en fonction de l'état actuel.
  // C'est le principe du "rendu conditionnel" dans React.
  const renderContent = () => {
    if (state.isLoadingScript) {
      return <Loader text="Libérer la créativité, une ligne à la fois..." />;
    }
    if (state.isLoadingVideo) {
      return <Loader text="Donner vie à votre script... Cela peut prendre un moment." />;
    }
    if (state.videoUrl) {
      return <VideoDisplay videoUrl={state.videoUrl} onReset={handleReset} />;
    }
    if (state.script) {
      return (
        <ScriptDisplay
          script={state.script}
          onGenerateVideo={handleVideoGeneration}
          isGenerating={state.isLoadingVideo}
        />
      );
    }
    // Par défaut, on affiche le formulaire de sujet.
    return (
      <SubjectForm
        onSubmit={handleScriptGeneration}
        isSubmitting={state.isLoadingScript}
      />
    );
  };

  // Le JSX retourné par le composant principal.
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-center">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        Propulsé par l'IA Générative
      </footer>
    </div>
  );
}
