# Sign-In with Ethereum and NextAuth.js Example

This Sign-In with Ethereum NextAuth.js example is the result of a code-along tutorial
to help developers get their hands on a fully functional and easy to understand demo.

The tutorial can be found [here](https://docs.login.xyz).

## Running the Example

Add the following to `.env.local.example` in order to run the application:

```
NEXTAUTH_SECRET=somereallysecretsecret
JWT_SECRET=itshouldbealsoverysecret
DOMAIN=localhost:3000
```

Once updated, rename the file to `.env`. 

You can then use the following commands to run the example:

```bash
yarn install
yarn run dev
```
