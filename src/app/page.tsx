"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { GenerateEducationalVideoScriptOutput } from "@/ai/flows/generate-educational-video-script";
import { generateScriptAction, generateVideoAction } from "@/app/actions";
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
import {
  FileText,
  Lightbulb,
  Clapperboard,
  BookCheck,
  Film,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const formSchema = z.object({
  topic: z
    .string()
    .min(3, {
      message: "Topic must be at least 3 characters.",
    })
    .max(100, {
      message: "Topic must be 100 characters or less.",
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface AppState {
  isLoadingScript: boolean;
  isLoadingVideo: boolean;
  script: GenerateEducationalVideoScriptOutput | null;
  videoUrl: string | null;
}

const initialState: AppState = {
  isLoadingScript: false,
  isLoadingVideo: false,
  script: null,
  videoUrl: null,
};

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

function SubjectForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
    },
  });

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Create Your Educational Video</CardTitle>
        <CardDescription>
          Enter a subject to generate an educational video script with AI.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Photosynthesis"
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
              {isSubmitting ? "Generating..." : "Generate Script"}
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

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
          title="Key Points"
          content={script.keyPoints}
        />
        <ScriptSection
          icon={Lightbulb}
          title="Practical Example"
          content={script.practicalExample}
        />
        <ScriptSection
          icon={Clapperboard}
          title="Conclusion"
          content={script.conclusion}
        />
        <ScriptSection
          icon={Film}
          title="Visual Suggestions"
          content={script.visualSuggestions}
        />
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2">
        <Button
          onClick={onGenerateVideo}
          disabled={isGenerating}
          className="w-full sm:w-auto"
        >
          {isGenerating ? "Generating Video..." : "Accept & Generate Video"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

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
        <CardTitle className="font-headline">Your Video is Ready!</CardTitle>
        <CardDescription>
          Watch the generated video below. You can download it or start over.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
          <video src={videoUrl} controls className="h-full w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onReset} variant="outline">
          Start Over
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);
  const { toast } = useToast();

  const handleScriptGeneration = async (values: FormValues) => {
    setState({ ...initialState, isLoadingScript: true });
    const result = await generateScriptAction({ topic: values.topic });

    if (result.success && result.data) {
      setState((s) => ({ ...s, script: result.data }));
    } else {
      toast({
        variant: "destructive",
        title: "Script Generation Failed",
        description: result.error,
      });
    }
    setState((s) => ({ ...s, isLoadingScript: false }));
  };

  const handleVideoGeneration = async () => {
    if (!state.script) return;
    setState((s) => ({ ...s, isLoadingVideo: true }));

    const result = await generateVideoAction({ script: state.script });

    if (result.success && result.data) {
      setState((s) => ({ ...s, videoUrl: result.data.videoUrl }));
    } else {
      toast({
        variant: "destructive",
        title: "Video Generation Failed",
        description: result.error,
      });
    }
    setState((s) => ({ ...s, isLoadingVideo: false }));
  };

  const handleReset = () => {
    setState(initialState);
  };

  const renderContent = () => {
    if (state.isLoadingScript) {
      return <Loader text="Unleashing creativity, one line at a time..." />;
    }
    if (state.isLoadingVideo) {
      return <Loader text="Bringing your script to life... This may take a moment." />;
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
    return (
      <SubjectForm
        onSubmit={handleScriptGeneration}
        isSubmitting={state.isLoadingScript}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-center">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        Powered by Generative AI
      </footer>
    </div>
  );
}
