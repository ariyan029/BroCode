import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

const githubProvider = GitHub({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
    issuer: "https://github.com/login/oauth",
})
githubProvider.issuer = "https://github.com/login/oauth"

export default {
    providers: [
        githubProvider,
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        })
    ]
} satisfies NextAuthConfig