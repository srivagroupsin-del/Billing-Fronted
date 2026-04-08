import { BASE_API } from "./api_list";

/**
 * Universal HTTP wrapper
 * - Handles JWT Authorization
 * - Supports JSON & FormData
 * - Centralized 401 handling
 */
export const http = async (
  url: string,
  options: RequestInit & { hideErrorLogging?: boolean } = {}
) => {
  /* =========================
     TOKEN HANDLING
  ========================= */
  const loginToken = localStorage.getItem("auth_token"); // Direct login token
  const businessToken = localStorage.getItem("token");    // Business-specific token

  // Rules:
  // 1. If it's an auth API, use the login token if available.
  // 2. If it's a business API, REQUIRE the business token.
  const isAuthApi = url.includes("auth/");

  // These special APIs might be needed to get the list of businesses BEFORE selection
  const isPreSelectionApi = url.includes("businesses/my-businesses") ||
    url.includes("businesses/business_operation");

  let activeToken = businessToken;

  if (isAuthApi || isPreSelectionApi) {
    activeToken = loginToken || businessToken;
  } else {
    // strict business module enforcement
    if (!businessToken) {
      console.error(`🚨 [HTTP] Blocked: Business token missing for ${url}`);
      throw new Error("Session expired or business not selected. Please re-select your business.");
    }
  }

  // Sanitize token
  if (!activeToken || activeToken === "undefined" || activeToken === "null") {
    activeToken = null;
  }

  const isFormData = options.body instanceof FormData;

  // Normalize Authorization header
  const authHeader = activeToken
    ? (activeToken.startsWith("Bearer ") ? activeToken : `Bearer ${activeToken}`)
    : undefined;

  /* =========================
     HEADERS (SAFE BUILD)
  ========================= */
  const headers = new Headers();

  headers.set("Accept", "application/json");

  // Set JSON content type ONLY if body is not FormData
  if (!isFormData && options.body) {
    headers.set("Content-Type", "application/json");
  }

  // Attach Authorization
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  // Attach Business ID if selected
  const businessId = localStorage.getItem("business_id");
  if (businessId) {
    // Standard and variant headers
    // headers.set("X-Business-Id", businessId);
    // headers.set("X-Business-ID", businessId);
    headers.set("business_id", businessId);
    // headers.set("business-id", businessId);
    // headers.set("BusinessId", businessId);
    headers.set("account_id", businessId); // Some backends use this
    headers.set("id", businessId); // Added variant

    console.log("🏢 Request Headers Synchronized:", {
      business_id: headers.get("business_id"),
      account_id: headers.get("account_id"),
      id: headers.get("id"),
      authSnippet: authHeader?.substring(0, 20) + "..."
    });
  }

  // Merge custom headers safely (do NOT override Authorization)
  if (options.headers) {
    Object.entries(options.headers as Record<string, string>).forEach(
      ([key, value]) => {
        if (key.toLowerCase() !== "authorization") {
          headers.set(key, value);
        }
      }
    );
  }

  /* =========================
     URL NORMALIZATION
  ========================= */
  const normalizedBase = BASE_API.replace(/\/+$/, "");
  const normalizedPath = url.replace(/^\/+/, "");

  // Support absolute URLs if provided
  const finalUrl = url.startsWith("http://") || url.startsWith("https://")
    ? url
    : normalizedBase + "/" + normalizedPath;

  console.log(`📡 [HTTP] ${options.method || "GET"} -> ${finalUrl}`);
  if (activeToken) {
    const type = (activeToken === businessToken) ? "💼 Business" : "🔑 Login";
    const partial = activeToken.length > 20 ? activeToken.substring(0, 15) + "..." : activeToken;
    console.log(`${type} Auth: ${partial}`);
  } else if (!isAuthApi) {
    console.warn("🔐 Auth: No token found");
  }

  const busId = localStorage.getItem("business_id");
  if (busId) {
    console.log(`🏢 Business ID: ${busId}`);
  }

  /* =========================
     FETCH REQUEST
  ========================= */
  const response = await fetch(finalUrl, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // If it failed and is not JSON (like a 404 HTML page saying "Cannot POST /...")
    if (!response.ok) {
      const snippet = text.length > 100 ? text.substring(0, 97) + "..." : text;
      if (!options.hideErrorLogging) {
        console.error(`🔴 [HTTP] Error ${response.status} from ${url}`);
        console.error(`📄 Response Body: ${text}`);
      }
      throw new Error(`${response.status} ${response.statusText || "Error"}: ${snippet}`);
    }
    // If backend returned non-JSON but success (e.g. plain text "OK")
    return text;
  }

  /* =========================
     GLOBAL 401 HANDLING
  ========================= */
  /* =========================
     401 / 403 HANDLING
  ========================= */
  if (response.status === 401 && !url.includes("/auth")) {
    const errorDetail = data?.message || data?.error || (typeof data === 'object' ? JSON.stringify(data) : text) || "No response body";
    console.error(`⛔ [401 Unauthorized]`);
    console.error(`🔗 URL: ${finalUrl}`);
    console.error(`📝 Message: ${errorDetail}`);

    throw new Error(errorDetail);
  }

  /* =========================
     ERROR HANDLING
  ========================= */
  if (!response.ok) {
    const truncatedText = text.length > 200 ? text.substring(0, 197) + "..." : text;
    if (!options.hideErrorLogging) {
      console.error(`❌ [HTTP ERROR] ${response.status} from ${finalUrl}`);
      console.error(`📄 Response: ${truncatedText}`);
    }

    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
};

/**
 * Returns the current logged-in user's ID.
 * Defaults to "1" if not found (legacy fallback).
 */
export const getUserId = (): string => {
  try {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      return String(user.id || user.user_id || "1");
    }
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
  }
  return "1";
};

/**
 * Returns the currently selected business ID.
 * Returns null if no business has been selected yet.
 */
// export const getSelectedBusinessId = (): string | null => {
//   return localStorage.getItem("business_id");
// };

/**
 * Sets the selected business ID.
 */
export const setSelectedBusinessId = (businessId: string | number) => {
  localStorage.setItem("business_id", String(businessId));
};

/**
 * Clears the current session and business selection.
 */
export const logout = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("business_id");
  window.location.href = "/login";
};

/**
 * Utility to manually set session in console for testing
 * Usage: setSession("TOKEN_HERE", { id: 2, email: "..." }, 1)
 */
(window as any).getUserId = getUserId;
// (window as any).getSelectedBusinessId = getSelectedBusinessId;
(window as any).logout = logout;
(window as any).setSession = (token: string, user: any = {}, businessId?: string | number) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  if (businessId) {
    localStorage.setItem("business_id", String(businessId));
  }
  console.log("✅ Session set. Refresh the page to apply.");
};
