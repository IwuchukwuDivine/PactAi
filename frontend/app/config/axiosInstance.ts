import axios from "axios";
import axiosRetry from "axios-retry";
import useAuth from "~/composables/useAuth";
import goTo from "~/utils/goTo";

export const createApiClient = () => {
  const config = useRuntimeConfig();
  const { user } = useAuth();

  const instance = axios.create({
    baseURL: config.public.apiBase as string,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use((req) => {
    if (user.value?.id) {
      req.headers["x-owner-id"] = user.value.id;
    }
    return req;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        goTo("/SignIn");
      }
      return Promise.reject(error);
    },
  );

  axiosRetry(instance, {
    retries: 2,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status !== undefined &&
        error.response.status >= 500),
  });

  return instance;
};
