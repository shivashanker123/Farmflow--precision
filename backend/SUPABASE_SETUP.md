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

1. Go to your **Supabase Project Dashboard**.
2. Click the green **"Connect"** button in the top right corner.
3. In the modal that opens, select **"ORMs"**.
4. Select **"Supabase (Python)"** or just look for the **URI** tab.
5. Copy the connection string. It should look like this:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
6. **Important:** Replace `[YOUR-PASSWORD]` with the password you created in step 1.

## 3. Get API Credentials (Optional)

1. Go to **Project Settings** (Gear icon at the bottom of the left sidebar).
2. Click on **"API"** in the list.
3. Find **Project URL** and **anon public key**.

## 4. Configure Backend

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
