# إعداد Supabase وقاعدة البيانات

## 1. إنشاء حساب Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. سجل حساب جديد
3. أنشئ مشروع جديد
4. انتظر حتى يكتمل إنشاء المشروع (قد يستغرق 2-3 دقائق)

## 2. الحصول على بيانات الاتصال

1. من لوحة المشروع، اذهب إلى **Settings** > **API**
2. انسخ المعلومات التالية:
   - **Project URL** - URL المشروع
   - **Anon Public Key** - المفتاح العام
   - **Service Role Key** - مفتاح الخادم (للعمليات الإدارية)

## 3. إنشاء Schema قاعدة البيانات

اتبع هذه الخطوات في SQL Editor في Supabase:

### أولاً: إنشاء جداول المستخدمين والقصص

```sql
-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول القصص
CREATE TABLE IF NOT EXISTS stories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_published BOOLEAN DEFAULT TRUE
);

-- جدول التعليقات
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  story_id BIGINT REFERENCES stories(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الإعجابات
CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  story_id BIGINT REFERENCES stories(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(story_id, user_id)
);

-- جدول المتابعات
CREATE TABLE IF NOT EXISTS followers (
  id BIGSERIAL PRIMARY KEY,
  follower_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  following_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);
```

### ثانياً: إنشاء Indexes لتحسين الأداء

```sql
-- Indexes للبحث والفرز السريع
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_category ON stories(category);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_comments_story_id ON comments(story_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);
```

### ثالثاً: إعدادات الأمان (RLS - Row Level Security)

```sql
-- تفعيل RLS على الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول للمستخدمين
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- سياسات الوصول للقصص
CREATE POLICY "Anyone can view published stories" ON stories FOR SELECT USING (is_published = true);
CREATE POLICY "Users can view their own unpublished stories" ON stories FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can create stories" ON stories FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
CREATE POLICY "Users can update their own stories" ON stories FOR UPDATE USING (user_id::text = auth.uid()::text);

-- سياسات الوصول للتعليقات
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (user_id::text = auth.uid()::text);
```

## 4. إنشاء ملف .env.local

أنشئ ملف `.env.local` في جذر المشروع:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

## 5. تثبيت مكتبة Supabase

```bash
npm install @supabase/supabase-js
```

## 6. إنشاء ملف الاتصال (src/lib/supabase.js)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 7. اختبار الاتصال

أنشئ ملف اختبار بسيط:

```javascript
import { supabase } from './lib/supabase.js'

async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('COUNT')
    if (error) throw error
    console.log('✅ اتصال ناجح مع Supabase!')
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message)
  }
}

testConnection()
```

## ملاحظات مهمة

- ✅ استخدم `VITE_` prefix للمتغيرات في مشاريع Vite
- ✅ لا تضع `VITE_SUPABASE_ANON_KEY` في `.gitignore` لأنه مفتاح عام
- ✅ استخدم `SUPABASE_SERVICE_ROLE_KEY` فقط على الخادم الخلفي
- ✅ فعّل RLS دائماً في الإنتاج للأمان
- ✅ استخدم Migrations للتحديثات المستقبلية على Schema

## المراجع

- [Supabase Docs](https://supabase.com/docs)
- [JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
