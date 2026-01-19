"use client";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

// axios instance for foundation kit

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Hardcoded to sandbox for sandbox portal
// For production portal, change this to "production"
const getEnvironment = () => {
  return "sandbox";
};

async function refreshToken() {
  const refreshToken = Cookies.get("refreshToken");
  if (!refreshToken) throw new Error("No refresh token available");

  try {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
      { refresh_token: refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const { access_token } = data;

    // Update cookies
    Cookies.set("accessToken", access_token, {
      expires: 30,
      secure: true,
      sameSite: "Lax",
    });
    Cookies.set("tokenExpiry", Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return access_token;
  } catch (error) {
    console.error(
      "Token refresh failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

function clearAllCookies() {
  Object.keys(Cookies.get()).forEach((cookieName) => {
    Cookies.remove(cookieName, { path: "/" });
  });
}

axiosInstance.interceptors.request.use(
  async (config) => {
    // Add X-Athena-Environment header to all requests
    // Only add to endpoints that need it (rules, filters, patients, athena)
    const needsEnvironmentHeader =
      config.url?.startsWith("/rules/") ||
      config.url?.startsWith("/filters/") ||
      config.url?.startsWith("/patients/") ||
      config.url?.startsWith("/medofficehq/athena/") ||
      config.url?.startsWith("/v1/logs"); // Agent logs

    if (needsEnvironmentHeader) {
      const environment = getEnvironment();
      config.headers["X-Athena-Environment"] = environment;
    }

    // Don't add token for login request
    if (
      config.url === "/auth/user-exists" ||
      config.url === "/auth/login-with-institution" ||
      config.url === "/auth/register"
    ) {
      return config;
    }

    let token = Cookies.get("accessToken");
    const tokenExpiry = Cookies.get("tokenExpiry");

    // Check if token has expired
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
      try {
        token = await refreshToken();
      } catch (error) {
        toast.error("Session expired, please login again");
        clearAllCookies();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/login"
    ) {
      originalRequest._retry = true;
      try {
        const token = await refreshToken();
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        toast.error("Session expired, please login again");
        clearAllCookies();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
