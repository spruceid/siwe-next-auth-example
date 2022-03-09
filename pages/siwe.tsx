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
      Sign-in
    </button>
    </Layout>
  )
}

Siwe.Layout = Layout

export default Siwe
