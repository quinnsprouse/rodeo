import { createFileRoute, useRouter } from "@tanstack/react-router";
import { use, useTransition } from "react";
import { SkeletonSuspense } from "skullet/react";

import { Button } from "@/components/ui/button";
import { signVisit, type SignedVisit } from "@/lib/journey";

export const Route = createFileRoute("/journey")({
  staticData: {
    page: {
      title: "Signed visit",
      description: "A page that streams a visit the server signs with its secret.",
      listed: false,
    },
  },
  loader: () => ({ visit: signVisit({ data: { visitor: "rider" } }) }),
  component: JourneyPage,
});

const sampleVisit: SignedVisit = { visitor: "rider", signature: "000000000000" };

function VisitLine({ visit }: { visit: SignedVisit }) {
  return (
    <p>
      Signed for {visit.visitor}: {visit.signature}
    </p>
  );
}

function StreamedVisit({ visit }: { visit: Promise<SignedVisit> }) {
  return <VisitLine visit={use(visit)} />;
}

function JourneyPage() {
  const { visit } = Route.useLoaderData();
  const router = useRouter();
  const [signing, startSigning] = useTransition();
  return (
    <main id="main" className="mx-auto flex min-h-svh max-w-[560px] flex-col gap-l px-l py-xxl">
      <h1 className="text-xl font-heavy">Signed visit</h1>
      <SkeletonSuspense
        label="Loading the signed visit"
        skeleton={<VisitLine visit={sampleVisit} />}
      >
        <StreamedVisit visit={visit} />
      </SkeletonSuspense>
      <Button
        className="self-start"
        disabled={signing}
        onClick={() => startSigning(() => router.invalidate())}
      >
        Sign again
      </Button>
    </main>
  );
}
