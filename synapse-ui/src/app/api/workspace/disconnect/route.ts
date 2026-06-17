import { NextResponse } from "next/server";
import { TRANSPORT_COOKIE } from "@/types/constants";

export async function POST() {
  const response = NextResponse.json({
    message: "Workspace disconnected.",
  });

  response.cookies.delete(TRANSPORT_COOKIE);

  return response;
}
