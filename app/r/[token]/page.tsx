import type { Metadata } from "next";
import { KitnaChahiye } from "@/components/KitnaChahiye";
import { breakdownRows, cityFromKey, fmt, model as buildModel } from "@/lib/cost-model";
import { decodeAnswers } from "@/lib/token";

interface Params {
  params: { token: string };
}

// The number, the city, and one breakdown fact must be rendered server-side so
// the share preview carries the real figure — not a client-rendered placeholder.
// Permitted on the card: the number, the city, one breakdown fact, the URL.
// Never the pincode, the age, or the salary.
export function generateMetadata({ params }: Params): Metadata {
  const answers = decodeAnswers(params.token);
  const city = cityFromKey(answers.cityKey);
  const m = buildModel(answers, city);
  const rows = breakdownRows(answers, m);
  const cityName = city.known ? city.name : "an Indian city";
  const topFact = rows.length ? `${rows[0].label} alone is ${fmt(rows[0].amt)} of that.` : "";

  const title = `${fmt(m.total)} a month, in hand — Kitna Chahiye`;
  const description = `What a life in ${cityName} actually costs. ${topFact} Find out what yours costs.`.trim();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/r/${params.token}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function SharedResult({ params }: Params) {
  const answers = decodeAnswers(params.token);
  const city = cityFromKey(answers.cityKey);
  return <KitnaChahiye initialAnswers={answers} initialCity={city} startAtResult />;
}
