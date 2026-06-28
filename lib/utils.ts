import { NextResponse } from "next/server"

// Standard API response helpers
export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

// Validate email format
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Validate password strength
export function isValidPassword(password: string): boolean {
  return password.length >= 8
}

// Remove password from user object before sending to client
export function excludePassword<T extends { password?: string }>(user: T): Omit<T, "password"> {
  const { password: _, ...rest } = user
  return rest
}
