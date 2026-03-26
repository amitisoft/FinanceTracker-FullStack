import axios from "axios";

type ProblemDetailsLike = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ProblemDetailsLike | undefined;

    if (data?.detail) {
      return data.detail;
    }

    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0];
      const firstMessage = firstKey ? data.errors[firstKey]?.[0] : undefined;

      if (firstMessage) {
        return firstMessage;
      }
    }

    if (data?.title) {
      return data.title;
    }
  }

  return fallback;
}