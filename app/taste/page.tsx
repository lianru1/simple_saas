import { createClient } from "@/utils/supabase/server";
import { TasteGallery } from "./taste-gallery";
import type { Skill } from "@/types/skill";

export const metadata = {
  title: "The Cellar — Browse Minted Minds | skmint",
  description:
    "Every bottle holds a mind. Browse AI personas distilled from real people's knowledge, experience, and voice. Find one worth tasting.",
};

export default async function TastePage() {
  const supabase = await createClient();

  const { data: skills } = await supabase
    .from("skills")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Skill[]>();

  const allSkills: Skill[] = skills ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="py-24 border-b">
        <div className="container px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            The Cellar
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto text-pretty">
            Every bottle holds a mind. Find one worth tasting.
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 flex-1">
        <div className="container px-4 md:px-6">
          {allSkills.length === 0 ? (
            /* Empty state */
            <div className="border border-dashed rounded-lg p-16 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20">
              <p className="text-lg font-medium mb-2">
                The cellar is quiet.
              </p>
              <p className="text-sm text-muted-foreground/60 mb-6 max-w-md">
                No one has bottled a mind yet. Be the first to distill your
                expertise into an AI persona the world can talk to.
              </p>
              <a
                href="/brew"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-10 px-6 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Bottle the First Persona
              </a>
            </div>
          ) : (
            <TasteGallery skills={allSkills} />
          )}
        </div>
      </section>
    </div>
  );
}
