# إنشاء Admin الأول

## خطوات إنشاء حساب Admin

### 1. من خلال Supabase Dashboard

1. اذهب إلى **Authentication** > **Users** في لوحة Supabase
2. انقر على **Invite user**
3. أدخل البريد الإلكتروني
4. سيتم إرسال رابط دعوة - استخدمه للتسجيل

### 2. من خلال SQL Command

```sql
-- إنشاء admin مباشرة في قاعدة البيانات
INSERT INTO users (username, email, password_hash, bio, created_at, updated_at)
VALUES (
  'admin',
  'admin@example.com',
  crypt('your-secure-password-here', gen_salt('bf')),
  'مسؤول الموقع',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

### 3. عند التطوير المحلي

يمكنك إنشاء script لتسهيل العملية:

```javascript
// scripts/create-admin.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdmin() {
  try {
    // 1. إنشاء مستخدم في Authentication
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'your-secure-password',
      email_confirm: true
    })

    if (authError) throw authError

    console.log('✅ تم إنشاء مستخدم Supabase Auth:', authData.user.id)

    // 2. إنشاء بيانات المستخدم في جدول users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: 'admin',
        email: 'admin@example.com',
        bio: 'مسؤول الموقع',
        is_admin: true
      })
      .select()

    if (userError) throw userError

    console.log('✅ تم إنشاء ملف المستخدم:', userData)

  } catch (error) {
    console.error('❌ خطأ:', error.message)
    process.exit(1)
  }
}

createAdmin()
```

**استخدام:**
```bash
SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/create-admin.js
```

## إضافة حقل is_admin للجدول

إذا لم تضف حقل `is_admin` في البداية:

```sql
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- تعديل الـ Admin الحالي
UPDATE users SET is_admin = TRUE WHERE email = 'admin@example.com';
```

## حماية صفحات Admin

أنشئ middleware للتحقق من الصلاحيات:

```javascript
// src/lib/auth-middleware.js
import { supabase } from './supabase'

export async function checkAdminAccess() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    window.location.href = '/login'
    return false
  }

  // التحقق من أنه admin
  const { data: user, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()

  if (error || !user?.is_admin) {
    window.location.href = '/unauthorized'
    return false
  }

  return true
}
```

## ملاحظات أمان ⚠️

- ❌ لا تستخدم كلمات مرور ضعيفة
- ❌ لا تشارك `SUPABASE_SERVICE_ROLE_KEY` مع أحد
- ✅ استخدم متغيرات البيئة فقط
- ✅ فعّل 2FA عند الإمكان
- ✅ احفظ كلمات المرور في مكان آمن
- ✅ غيّر كلمة المرور الافتراضية فوراً
