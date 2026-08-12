export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface AuthErrorResponse {
  message: string | string[];
  error?: string;
  statusCode: number;
}

export type SpaceType = "DESK" | "PRIVATE_OFFICE";

export interface Space {
  id: string;
  name: string;
  city: string;
  type: SpaceType;
  pricePerHour: number;
  capacity: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceQuery {
  city?: string;
  q?: string;
  type?: SpaceType;
  minPrice?: number;
  maxPrice?: number;
}
