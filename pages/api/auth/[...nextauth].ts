import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getCsrfToken } from "next-auth/react"
import { SiweMessage } from "siwe"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default async function auth(req, res) {
  const providers = [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials) {
        try {
          const siwe = new SiweMessage(JSON.parse(credentials?.message || "{}"))
          const domain = process.env.DOMAIN
          if (siwe.domain !== domain) {
            return null
          }

          if (siwe.nonce !== (await getCsrfToken({ req }))) {
            return null
          }

          await siwe.validate(credentials?.signature || "")
          return {
            id: siwe.address,
          }
        } catch (e) {
          return null
        }
      },
    }),
  ]

  const isDefaultSigninPage =
    req.method === "GET" && req.query.nextauth.includes("signin")

  // Hide Sign-In with Ethereum from default sign page
  if (isDefaultSigninPage) {
    providers.pop()
  }

  return await NextAuth(req, res, {
    // https://next-auth.js.org/configuration/providers/oauth
    providers,
    session: {
      strategy: "jwt",
    },
    jwt: {
      secret: process.env.JWT_SECRET,
    },
    theme: {
      colorScheme: "dark",
    },
    secret: process.env.NEXT_AUTH_SECRET,
    callbacks: {
      async session({ session, token }) {
        session.address = token.sub
        session.user.name = token.sub
        return session
      },
    },
  })
}
