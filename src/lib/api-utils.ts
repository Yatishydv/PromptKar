import { NextResponse } from "next/server";
import { IApiResponse } from "@/types";

export function successResponse<T>(data: T, status = 200) {
  const response: IApiResponse<T> = {
    success: true,
    data,
  };
  return NextResponse.json(response, { status });
}

export function errorResponse(message: string, status = 500) {
  const response: IApiResponse = {
    success: false,
    error: message,
  };
  return NextResponse.json(response, { status });
}

export function handleApiError(error: any) {
  console.error("API Error:", error);
  const message = error instanceof Error ? error.message : "Internal Server Error";
  return errorResponse(message);
}
