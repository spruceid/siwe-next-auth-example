# Sign-In with Ethereum and NextAuth.js Example

NextAuth.js is an easy to implement, full-stack (client/server) open source 
authentication library originally designed for (Next.js)[https://nextjs.org/] 
and (Serverless)[https://vercel.com/dashboard]. Go to https://next-auth.js.org 
for more information and documentation.

## Getting started
Start by cloning the official NextAuth.js example:
```
git clone https://github.com/nextauthjs/next-auth-example
```

Create a `.env` file if it doesn't already exists and populate it with the 
following variables:
```
NEXTAUTH_SECRET=somereallysecretsecret
JWT_SECRET=itshouldbealsoverysecret
# This domain will be used for validation so it must match the front-end domain
DOMAIN=example.com
```

Add `siwe` and `wagmi` as dependencies, in this example 
(Wagmi)[https://github.com/tmm/wagmi] is being used, feel free to handle wallet 
interactions using any method.
```
yarn add siwe wagmi
```

Modify `pages/_app.tsx` to inject the `WagmiProvider` component:
```diff
+<WagmiProvider autoConnect>
    <SessionProvider session={pageProps.session} refetchInterval={0}>
        <Component {...pageProps} />
    </SessionProvider>
+</WagmiProvider>
```

Add the provider that will handle the message validation, since it's not 
possible to sign-in using the default page the provider should be removed from 
the list of providers before render, make sure your 
`pages/api/auth/[...nextauth].ts` looks similar to the following:
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

As mentioned the default sign-in page can't be used because there is no way to 
hook Wagmi to listen for clicks, so a custom page must be created to handle the 
sign-in. Create pages/siwe.tsx and add the following to it:
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

Now all left to do is adding a new link to the newly created page, in order to 
do so go to components/header.tsx and add a link to it:
```diff
+<li className={styles.navItem}>
+    <Link href="/siwe">
+        <a>SIWE</a>
+    </Link>
+</li>
```

Run the application and you are now ready to Sign-In with Ethereum, just click 
the SIWE link in the header and the Sign-In with Ethereum button, sign the 
message and you are now authenticated.
