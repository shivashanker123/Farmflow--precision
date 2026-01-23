# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and click "New Project"
3. Enter project details:
   - **Name**: farmflow-backend
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

## 2. Get Database Connection String

1. In your Supabase dashboard, go to **Project Settings** (gear icon)
2. Go to **Database** tab
3. Scroll to **Connection String**
4. Select **URI** tab
5. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your database password

## 3. Configure Backend

1. Copy `.env.example` to `.env`:
   ```bash
   cd backend
   copy .env.example .env
   ```

2. Edit `.env` and update:
   ```
   SUPABASE_DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
   GROQ_API_KEY=your-groq-key-here
   ```

## 4. Run Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run server (it will auto-create tables)
python main.py
```

## 5. (Optional) View Database Tables

1. In Supabase dashboard, go to **Table Editor**
2. You should see: `users`, `farm_settings`, `usage_logs`

## Notes

- Supabase provides **500 MB** free storage
- **Automatic backups** included
- **Real-time subscriptions** available
- **Built-in auth** (we're using our own JWT, but you can migrate to Supabase Auth later)
