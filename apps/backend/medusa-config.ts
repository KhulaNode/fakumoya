import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    // Medusa merges this return value with its Vite defaults. Return only our
    // additions; returning the supplied config duplicates its React plugin.
    vite: () => ({
      plugins: [
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
  },
  modules: [
    {
      resolve: "@medusajs/medusa/caching",
      options: {
        providers: [
          {
            resolve: "@medusajs/caching-redis",
            id: "caching-redis",
            is_default: true,
            options: { redisUrl: process.env.REDIS_URL },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        jobOptions: {
          removeOnComplete: { age: 3600, count: 1000 },
          removeOnFail: { age: 3600, count: 1000 },
        },
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: { redis: { redisUrl: process.env.REDIS_URL } },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-redis",
            id: "locking-redis",
            is_default: true,
            options: { redisUrl: process.env.REDIS_URL },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/paystack",
            id: "paystack",
            options: {
              secret_key: process.env.PAYSTACK_SECRET_KEY,
              storefront_url: process.env.STOREFRONT_URL,
              bakery_subaccount_code: process.env.PAYSTACK_BAKERY_SUBACCOUNT_CODE,
              revenue_share_secret: process.env.PAYSTACK_REVENUE_SHARE_SECRET,
            },
          },
        ],
      },
    },
    { resolve: "./src/modules/fakumoya-subscription" },
  ],
})
