# Schema Reference

## case_notes

| Column     | Type        | Constraints                                         |
|------------|-------------|-----------------------------------------------------|
| id         | uuid        | primary key, default `gen_random_uuid()`            |
| case_id    | bigint      | not null, references `cases(id)` on delete cascade  |
| author_id  | uuid        | not null, references `app_users(id)`                |
| body       | text        | not null                                           |
| created_at | timestamptz | default `now()`                                    |

Indexes:
- `idx_case_notes_case_id_created_at` on `(case_id, created_at DESC)`

## notifications

| Column     | Type        | Constraints                                                           |
|------------|-------------|-----------------------------------------------------------------------|
| id         | uuid        | primary key, default `gen_random_uuid()`                              |
| user_id    | uuid        | not null, references `app_users(id)` on delete cascade                |
| message    | text        | not null                                                              |
| type       | text        | not null, enum values: `info`, `upload`, `participant`, `note`        |
| status     | text        | not null, default `unread`, enum values: `unread`, `read`              |
| created_at | timestamptz | default `now()`                                                       |

Indexes:
- `idx_notifications_user_created_at` on `(user_id, created_at DESC)`
- `idx_notifications_user_status` on `(user_id, status)`
