import type { Metadata } from "next";
import Link from "next/link";

import {
  SITE_NAME,
  SITE_URL,
  UNNAMED_PLAYGROUND,
  APP_ADMIN_ROLE,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { fetchPlaygroundByIdWithCache } from "@/lib/api/server";
import { Button } from "@/components/ui/button";
import SourceCard from "@/components/source-card";
import MapViewSingle from "@/components/map-view-single";
import ImageCarousel from "@/components/image-carousel";
import { formatEnumString } from "@/lib/utils";
import ClearCacheButton from "./clear-cache-button";
import ReportIssueForm from "./report-issue-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const playground = await fetchPlaygroundByIdWithCache(resolvedParams.id);

  if (!playground) {
    return {
      title: `Playground Not Found | ${SITE_NAME}`,
      description:
        "Looks like this playground took a swing break. Try another one for more fun!",
    };
  }

  const name = playground.name || UNNAMED_PLAYGROUND;
  const title = `${name} | ${SITE_NAME}`;
  const description =
    playground.description ||
    `Explore ${name} details, features, and location.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og/playgrounds/${resolvedParams.id}`,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
      type: "website",
      locale: "en_US",
      url: `${SITE_URL}/playgrounds/${resolvedParams.id}`,
    },
  };
}

export default async function PlaygroundDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const playground = await fetchPlaygroundByIdWithCache(resolvedParams.id);

  if (!playground) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-center text-4xl font-bold">
          404 Playground Not Found
        </h1>
        <p className="text-muted-foreground max-w-md text-center">
          Uh-oh! This playground is really good at hiding. Let&apos;s find our
          way back home!
        </p>
        <Link href="/">
          <Button>Go back home</Button>
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isAdmin = data?.user?.role === APP_ADMIN_ROLE;

  // const googleMapsUrl = playground.address
  //   ? `https://www.google.com/maps/search/${encodeURIComponent(playground.address)}`
  //   : `https://www.google.com/maps/search/?api=1&query=${playground.lat},${playground.lon}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${playground.lat},${playground.lon}`;

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-1 flex-col gap-6 overflow-hidden px-6 py-10">
      {/* Main details */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Left side - Image Carousel */}
        <div className="w-full md:w-1/2">
          {playground.images && playground.images.length > 0 ? (
            <ImageCarousel
              images={playground.images.map((image) => ({
                filename: image.image_url,
                alt: `${playground.name || UNNAMED_PLAYGROUND} photo`,
              }))}
              className="aspect-square md:aspect-[4/3]"
              unoptimized={true}
            />
          ) : (
            <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 md:aspect-[4/3] dark:bg-zinc-800">
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Details */}
        <div className="flex w-full flex-col gap-4 md:w-1/2">
          {/* Name */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <h1 className="text-3xl font-bold">
              {playground.name || UNNAMED_PLAYGROUND}
            </h1>

            {isAdmin && (
              <div className="flex gap-2">
                <ClearCacheButton
                  playgroundId={resolvedParams.id}
                  lat={playground.lat}
                  lon={playground.lon}
                  address={playground.address || ""}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-muted-foreground text-sm font-medium">
              Description
            </h3>
            <p className="text-sm leading-relaxed">
              {playground.description || "No description available"}
            </p>
          </div>

          {/* Parking */}
          <div>
            <h3 className="text-muted-foreground mb-1 text-sm font-medium">
              Parking
            </h3>
            <p className="text-sm leading-relaxed">
              {playground.parking || "No parking information available"}
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-muted-foreground mb-1 text-sm font-medium">
              Features
            </h3>
            <div className="flex flex-wrap gap-2">
              {!playground.features || playground.features.length === 0 ? (
                <p className="text-sm leading-relaxed">No features listed</p>
              ) : (
                playground.features.map((feature: string) => (
                  <span
                    key={feature}
                    className="bg-primary/10 text-primary border-primary/20 rounded-full border px-3 py-1 text-xs font-medium"
                  >
                    {formatEnumString(feature)}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-muted-foreground text-sm font-medium">
              Address
            </h3>
            <p className="text-sm leading-relaxed">
              {playground.address || "Address not available"}
            </p>
          </div>
        </div>
      </div>

      {/* AI Disclaimer and Report Issue */}
      {playground.enriched && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-400">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <p className="mb-2 sm:mb-0">
              <strong>Disclaimer:</strong> Some information on this page was
              generated by Perplexity AI. While we strive for accuracy,
              AI-generated content may contain errors or inaccuracies.
            </p>
            <div className="flex-shrink-0">
              <ReportIssueForm playgroundId={resolvedParams.id} />
            </div>
          </div>
        </div>
      )}

      {/* Report Issue (when no AI disclaimer) */}
      {!playground.enriched && (
        <div className="flex justify-end">
          <ReportIssueForm playgroundId={resolvedParams.id} />
        </div>
      )}

      {/* Location section */}
      <div>
        <h2 className="flex items-center justify-between text-xl font-semibold">
          Location{" "}
          {playground.address && (
            <span className="text-muted-foreground text-sm">
              {" "}
              <Link
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get directions to this playground"
                className="underline"
              >
                Show on Google Maps
              </Link>
            </span>
          )}
        </h2>
        <div className="h-64 w-full overflow-hidden rounded-lg">
          <MapViewSingle playground={playground} />
        </div>
      </div>

      {/* Sources Section */}
      {playground.sources && playground.sources.length > 0 && (
        <div>
          <h2 className="mb-3 text-xl font-semibold">Sources</h2>
          <div className="flex flex-wrap gap-2">
            {playground.sources.map((source, index) => (
              <SourceCard key={index} url={source} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
