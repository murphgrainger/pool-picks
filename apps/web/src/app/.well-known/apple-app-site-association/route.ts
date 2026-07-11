import { NextResponse } from "next/server";

const AASA = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "F95XPXH63X.com.murphgrainger.poolpicks",
        paths: ["/join/*"],
      },
    ],
  },
};

export function GET() {
  return NextResponse.json(AASA, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
