![header](/images/siwenextauth.png)

# Sign-In with Ethereum and NextAuth.js Example

This Sign-In with Ethereum NextAuth.js example is the result of a code-along tutorial
to help developers get their hands on a fully functional and easy to understand demo.

A full tutorial on how to set up the example can be found [here](https://docs.login.xyz/integrations/nextauth.js).

## Getting Started

### Dependencies 

- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [Node.js](https://nodejs.org/en/)
- [MetaMask extension wallet](https://metamask.io/)
- An Ethereum account in MetaMask

### Setting Up Your Environment

Change the name of `.env.local.example` to `.env.local`, and fill in the following two values:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=somereallysecretsecret
```
## Running the Example

You can use the following commands to run the example:

```bash
yarn install
yarn run dev
```

## Live Demo

A live demo of the example can be found [here](https://siwe-next-auth-example2.vercel.app/).

## License
ISC
