import { IApiResponse } from "@/types";

export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  const json: IApiResponse<T> = await res.json();
  
  if (!res.ok || !json.success) {
    throw new Error(json.error || "An error occurred while fetching the data.");
  }
  
  return json.data as T;
};

export const apiRequest = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const res = await fetch(url, options);
  const json: IApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error || "An error occurred while processing the request.");
  }

  return json.data as T;
};
