import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"
const base = process.env.VITE_BASE_SITE_URL || "/"
// https://vitejs.dev/config/
export default defineConfig({
    base,
    plugins: [
        react({
            jsxImportSource: "@emotion/react",
            babel: {
                presets: ["@emotion/babel-preset-css-prop"],
            },
        }),
    ],
    resolve: {
        alias: [
            {
                find: "@/",
                replacement: `${resolve(__dirname, "src")}/`,
            },
        ],
    },
    envDir: resolve(__dirname, "env"),
})
