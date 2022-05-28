import { getCsrfToken, signIn } from "next-auth/react"
import { useEffect } from "react"
import { SiweMessage } from "siwe"
import { useAccount, useConnect, useNetwork, useSignMessage } from "wagmi"
import { InjectedConnector } from "wagmi/connectors/injected"
import Layout from "../components/layout"

function Siwe() {
  const { connect } = useConnect({ connector: new InjectedConnector() })
  const { signMessageAsync } = useSignMessage()
  const { activeChain } = useNetwork()
  const { data: accountData } = useAccount()

  useEffect(() => {
    if (!accountData) {
      connect()
    }
  }, [accountData])

  const handleLogin = async () => {
    try {
      const callbackUrl = "/protected"
      const message = new SiweMessage({
        domain: window.location.host,
        address: accountData?.address,
        statement: "Sign in with Ethereum to the app.",
        uri: window.location.origin,
        version: "1",
        chainId: activeChain?.id,
        nonce: await getCsrfToken(),
      })
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      })
      signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature,
        callbackUrl,
      })
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
        Sign-in
      </button>
    </Layout>
  )
}

export async function getServerSideProps(context: any) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  }
}

Siwe.Layout = Layout

export default Siwe
