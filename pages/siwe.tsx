import { getCsrfToken, signIn } from 'next-auth/react'
import { SiweMessage } from 'siwe'
import { useAccount, useConnect, useNetwork, useSignMessage } from 'wagmi'
import Layout from "../components/layout"


function Siwe() {
  const [{ data: connectData }, connectAsync] = useConnect()
  const [, signMessage] = useSignMessage()

  const handleLogin = async () => {
    try {
      const res = await connectAsync(connectData.connectors[0]);
      const callbackUrl = '/protected';
      const message = new SiweMessage({
        domain: window.location.host,
        address: res.account,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId: res.chain?.id,
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
      Sign-in
    </button>
    </Layout>
  )
}

Siwe.Layout = Layout

export default Siwe
