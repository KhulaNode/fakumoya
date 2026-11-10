import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261110142048 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "fakumoya_subscription" ("id" text not null, "email" text not null, "first_name" text null, "last_name" text null, "phone" text null, "status" text check ("status" in ('pending', 'active', 'past_due', 'canceling', 'cancelled')) not null default 'pending', "initial_reference" text not null, "paystack_subscription_code" text null, "paystack_email_token" text null, "manage_token_hash" text not null, "monthly_amount_cents" integer not null default 62000, "loaves_per_month" integer not null default 24, "deliveries_per_month" integer not null default 12, "khulanode_share_cents" integer not null default 7200, "settlement_mode" text check ("settlement_mode" in ('manual_review', 'provider_split_confirmed')) not null default 'manual_review', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fakumoya_subscription_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fakumoya_subscription_initial_reference_unique" ON "fakumoya_subscription" ("initial_reference") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fakumoya_subscription_paystack_subscription_code_unique" ON "fakumoya_subscription" ("paystack_subscription_code") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fakumoya_subscription_manage_token_hash_unique" ON "fakumoya_subscription" ("manage_token_hash") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fakumoya_subscription_deleted_at" ON "fakumoya_subscription" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`create table if not exists "fakumoya_subscription_invoice" ("id" text not null, "subscription_id" text not null, "paystack_reference" text not null, "status" text check ("status" in ('pending', 'paid', 'failed')) not null default 'pending', "amount_cents" integer not null, "khulanode_share_cents" integer not null, "bakery_net_cents" integer not null, "paid_at" timestamptz null, "medusa_order_id" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fakumoya_subscription_invoice_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fakumoya_subscription_invoice_paystack_reference_unique" ON "fakumoya_subscription_invoice" ("paystack_reference") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fakumoya_subscription_invoice_deleted_at" ON "fakumoya_subscription_invoice" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "fakumoya_subscription_invoice" cascade;`)
    this.addSql(`drop table if exists "fakumoya_subscription" cascade;`)
  }
}
