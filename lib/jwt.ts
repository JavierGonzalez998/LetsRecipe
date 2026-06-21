import { SignJWT, jwtVerify } from 'jose'

export interface JWTPayload {
  sub: string
  role: 'admin' | 'user'
  name: string
  email: string
}

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me')
const ALG = 'HS256'
export const COOKIE = 'token'
const EXPIRY = '7d'

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}
