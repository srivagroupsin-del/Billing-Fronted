import { http } from "./base_api/base_api";

export interface RegisterPayload {
    user_id: string;
    name: string;
    email: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface SelectBusinessPayload {
    business_id: number;
}

export interface AuthResponse {
    token?: string;
    message?: string;
    data?: any;
    user?: any;
}

/**
 * Registers a new user.
 * Endpoint: POST /api/auth/register
 */
export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
    return http("auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Authenticates a user and returns a token.
 * Endpoint: POST /api/auth/login
 */
export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
    return http("auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
    });
};

/**
 * Selects a business for the current session.
 * Endpoint: POST /api/auth/select-business
 * Payload: { business_id: number }
 */
export const selectBusiness = async (payload: { business_id: any }): Promise<AuthResponse> => {
    const id = Number(payload.business_id);

    // Debug log to catch "null" or "NaN" issues
    console.log(`🔌 [API] Calling select-business with ID:`, id, `(Original: ${payload.business_id})`);

    if (isNaN(id)) {
        console.error("❌ [API] selectBusiness was called with an invalid ID:", payload.business_id);
        throw new Error("Invalid business ID provided to selection API.");
    }

    return http("auth/select-business", {
        method: "POST",
        body: JSON.stringify({ business_id: id }),
    });
};
