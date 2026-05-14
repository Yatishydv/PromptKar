export * from "./user";
export * from "./prompt";
export * from "./blog";

export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
