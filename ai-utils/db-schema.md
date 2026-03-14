# Database Schema

> Source: `src/integrations/supabase/types.ts`
> To refresh, run in Supabase SQL Editor:
> `select table_name, column_name, data_type from information_schema.columns where table_schema = 'public';`

## Tables

### articles
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| title | text | yes | - |
| source | text | yes | - |
| url | text | no | null |
| snippet | text | no | null |
| image_url | text | no | null |
| publication_date | text | no | null |
| display_order | number | no | null |
| created_at | timestamp | auto | now() |
| updated_at | timestamp | auto | now() |

### coupons
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| code | text | yes | - |
| discount_type | text | no | 'percentage' |
| discount_value | number | yes | - |
| active | boolean | no | true |
| max_uses | number | no | null |
| current_uses | number | no | 0 |
| min_order_amount | number | no | null |
| expires_at | timestamp | no | null |
| created_at | timestamp | auto | now() |
| updated_at | timestamp | auto | now() |

### customers
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| name | text | yes | - |
| phone | text | yes | - |
| total_orders_count | number | no | null |
| total_spent_amount | number | no | null |
| last_order_date | timestamp | no | null |
| product_purchase_history | json | no | null |
| created_at | timestamp | auto | now() |
| updated_at | timestamp | auto | now() |

### expenses
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| description | text | yes | - |
| amount | number | yes | - |
| category | text | no | null |
| expense_date | date | no | today |
| receipt_url | text | no | null |
| created_at | timestamp | auto | now() |
| updated_at | timestamp | auto | now() |

### loyalty_points
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| user_id | uuid | yes | - |
| order_id | uuid | no | null |
| transaction_type | text | yes | - |
| points | number | no | 0 |
| description | text | no | null |
| created_at | timestamp | auto | now() |

### orders
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| customer_name | text | yes | - |
| customer_phone | text | yes | - |
| customer_id | uuid | no | null |
| items | json | no | '[]' |
| total_amount | number | no | 0 |
| status | text | no | 'pending' |
| payment_status | text | no | 'pending' |
| notes | text | no | null |
| admin_notes | text | no | null |
| tray_layout | json | no | null |
| is_preparation_counted | boolean | no | null |
| created_at | timestamp | auto | now() |
| updated_at | timestamp | auto | now() |

### product_images
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| product_id | uuid | yes | - |
| image_url | text | yes | - |
| display_order | number | no | null |
| created_at | timestamp | auto | now() |

### products
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| name | text | yes | - |
| price | number | yes | - |
| category | text | no | 'general' |
| description | text | no | null |
| image_url | text | no | null |
| available | boolean | no | true |
| inventory | number | no | null |
| max_quantity_per_order | number | no | null |
| display_order | number | no | null |
| created_at | timestamp | auto | now() |
| updated_at | timestamp | auto | now() |

### profiles
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| user_id | uuid | yes | - |
| name | text | no | null |
| phone | text | no | null |
| created_at | timestamp | auto | now() |
| updated_at | timestamp | auto | now() |

### reviews
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| product_id | uuid | yes | - |
| user_id | uuid | yes | - |
| rating | number | yes | - |
| comment | text | no | null |
| created_at | timestamp | auto | now() |
| updated_at | timestamp | auto | now() |

### settings
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| key | text | yes | - |
| value | json | no | '{}' |
| created_at | timestamp | auto | now() |
| updated_at | timestamp | auto | now() |

### user_roles
| Column | Type | Required | Default |
|--------|------|----------|---------|
| id | uuid | PK | auto |
| user_id | uuid | yes | - |
| role | app_role (enum) | yes | - |
| created_at | timestamp | auto | now() |

## Relationships (Foreign Keys)

| From | Column | To | Column |
|------|--------|----|--------|
| loyalty_points | order_id | orders | id |
| orders | customer_id | customers | id |
| product_images | product_id | products | id |
| reviews | product_id | products | id |

## Enums

### app_role
`"admin"` | `"user"` | `"employee"`

## Database Functions

| Function | Args | Returns |
|----------|------|---------|
| get_user_phone | user_id: uuid | text (phone number) |
| has_role | role: app_role, user_id: uuid | boolean |
| validate_coupon | code: text, order_amount: number | { coupon_id, discount_type, discount_value, valid, error_message } |
