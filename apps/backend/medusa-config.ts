import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    vite: (config) => ({
      ...config,
      plugins: [
        ...(config.plugins || []),
        {
          name: 'fakumoya-admin-branding',
          transformIndexHtml() {
            return {
              html: '',
              tags: [
                { tag: 'title', children: 'Fakumoya Bakery Admin' },
                {
                  tag: 'link',
                  attrs: {
                    rel: 'icon',
                    href: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%2328180e%22/%3E%3Ctext x=%2250%22 y=%2268%22 text-anchor=%22middle%22 font-size=%2264%22 font-family=%22Georgia%22 fill=%22%23d79530%22%3EF%3C/text%3E%3C/svg%3E',
                  },
                },
                {
                  tag: 'style',
                  injectTo: 'body',
                  children: `
                    :root {
                      --bg-base: #fff8ec !important;
                      --bg-base-hover: #faedd8 !important;
                      --bg-base-pressed: #f3dfc0 !important;
                      --bg-component: #ffffff !important;
                      --bg-component-hover: #faedd8 !important;
                      --bg-field: #ffffff !important;
                      --bg-field-component: #ffffff !important;
                      --bg-interactive: #a96812 !important;
                      --border-base: #e5cfad !important;
                      --border-strong: #d7b887 !important;
                      --border-interactive: #a96812 !important;
                      --fg-base: #28180e !important;
                      --fg-subtle: #68503b !important;
                      --fg-muted: #78634f !important;
                      --fg-interactive: #a96812 !important;
                      --fg-interactive-hover: #86500e !important;
                      --button-neutral: #ffffff !important;
                      --button-neutral-hover: #faedd8 !important;
                      --button-neutral-pressed: #f3dfc0 !important;
                    }
                    body { background: #fff8ec !important; color: #28180e !important; }
                    .dark {
                      --bg-base: #28180e !important;
                      --bg-base-hover: #483020 !important;
                      --bg-component: #3b2417 !important;
                      --bg-field: #3b2417 !important;
                      --bg-field-component: #3b2417 !important;
                      --fg-base: #fff8ec !important;
                      --fg-subtle: #f3dfc0 !important;
                      --fg-muted: #d7b887 !important;
                      --border-base: #68503b !important;
                    }
                  `,
                },
              ],
            }
          },
        },
      ],
      server: {
        ...config.server,
        host: '0.0.0.0',
        allowedHosts: ['localhost', '.localhost', '127.0.0.1'],
        hmr: {
          port: 5173,
          clientPort: 5173,
        },
      },
    }),
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  }
})
