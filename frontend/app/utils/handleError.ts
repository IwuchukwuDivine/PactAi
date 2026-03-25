import type { AxiosError } from "axios";

interface ApiErrorData {
  error?: string;
  message?: string;
}

export const handleGetError = (error: AxiosError<ApiErrorData> | Error) => {
  const { addToast } = useToast();
  if (!("response" in error) || error.response === undefined) {
    addToast("error", error.message);
  } else if (error.response?.data?.error) {
    addToast("error", error.response.data.error);
  } else {
    addToast("error", "Something went wrong");
  }
};

export const handleError = (error: AxiosError<ApiErrorData> | Error) => {
  const { addToast } = useToast();
  if ("response" in error && error.response?.data) {
    addToast("error", error.response.data.message ?? "Request failed");
  } else if ("request" in error && error.request) {
    addToast(
      "error",
      "No response received from server. Please try again later.",
    );
  } else {
    addToast("error", "Something went wrong. Please try again later.");
  }
};
