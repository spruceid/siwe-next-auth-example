# Sign-In with Ethereum and NextAuth.js Example

NextAuth.js is an easy to implement, full-stack (client/server) open source 
authentication library originally designed for [Next.js](https://nextjs.org/) 
and [Serverless](https://vercel.com/dashboard). Go to https://next-auth.js.org 
for more information and documentation.

## Getting started

### Requirements
- [Yarn](https://classic.yarnpkg.com/en/docs/getting-started)
- [Node.js](https://nodejs.org/en/)
- [Metamask broswer extension wallet](https://metamask.io/)

First clone the official NextAuth.js example using your terminal:
```
git clone https://github.com/nextauthjs/next-auth-example
```

After cloning, modify the given .env.local.example file, and populate it with the following variables:
```
NEXTAUTH_SECRET=somereallysecretsecret
JWT_SECRET=itshouldbealsoverysecret
# This domain will be used for validation so it must match the front-end domain
DOMAIN=example.com
```
*Note: After this, rename the file to .env. This example will be routed to http://localhost:3000.*

Next Add siwe and wagmi as dependencies. In this example, we're using [Wagmi](https://github.com/tmm/wagmi), 
which is a well-known React hooks library for Ethereum. In your terminal, 
navigate to the project we originally cloned and add the dependencies via the 
following commands: 

```bash
cd next-auth-example
yarn add siwe wagmi
```

Now, modify pages/_app.tsx to inject the WagmiProvider component:
```jsx
import { SessionProvider } from "next-auth/react"
import type { AppProps } from "next/app"
import "./styles.css"
import { WagmiProvider } from "wagmi"

// Use of the <SessionProvider> is mandatory to allow components that call
// `useSession()` anywhere in your application to access the `session` object.
export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider autoConnect>
      <SessionProvider session={pageProps.session} refetchInterval={0}>
        <Component {...pageProps} />
      </SessionProvider>
    </WagmiProvider>
  )
}
```

We're going to now add the provider that will handle the message validation. 
Since it's not possible to sign in using the default page, the original provider
should be removed from the list of providers before rendering. 
Modify pages/api/auth/[...nextauth].ts with the following:

```javascript
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

  // Hides Sign-In with Ethereum from default sign page
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

```

The default sign-in page can't be used because there is no way to hook wagmi to 
listen for clicks on the default sign-in page provided by next-auth, so a custom
page must be created to handle the sign-in flow. Create pages/siwe.tsx and 
populate it with the following:

```javascript
import { getCsrfToken, signIn } from 'next-auth/react'
import { SiweMessage } from 'siwe'
import { useAccount, useConnect, useNetwork, useSignMessage } from 'wagmi'
import Layout from "../components/layout"


function Siwe() {
  const [{ data: connectData }, connect] = useConnect()
  const [, signMessage] = useSignMessage()
  const [{ data: networkData }] = useNetwork()
  const [{ data: accountData }] = useAccount();

  const handleLogin = async () => {
    try {
      await connect(connectData.connectors[0]);
      const callbackUrl = '/protected';
      const message = new SiweMessage({
        domain: window.location.host,
        address: accountData?.address,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId: networkData?.chain?.id,
        nonce: await getCsrfToken()
      });
      const {data: signature, error} = await signMessage({ message: message.prepareMessage() });
      signIn('credentials', { message: JSON.stringify(message), redirect: false, signature, callbackUrl });
    } catch (error) {
      window.alert(error)
    }
  }

  return (
    <Layout>
    <button
      onClick={(e) => {
        e.preventDefault()
        handleLogin()
      }}
    >
      Sign-In with Ethereum
    </button>
    </Layout>
  )
}

Siwe.Layout = Layout

export default Siwe

```

Finally, add a new navigation link that leads to the page we just created. In 
order to do so go to components/header.tsx and add an additional link to the 
list of navigation items:
```diff
+<li className={styles.navItem}>
+    <Link href="/siwe">
+        <a>SIWE</a>
+    </Link>
+</li>
```

Run the application using the following commands:
```bash
yarn
yarn dev
```
