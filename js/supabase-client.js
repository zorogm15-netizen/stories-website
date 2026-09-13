/* ==================== Supabase Configuration ==================== */

const SUPABASE_URL = 'https://tghldskkklmokgvxbtui.supabase.co';
const SUPABASE_KEY = 'sb_publishable_604XnOGwDC7d_NZ_A11uFA_Sg-B7V38';

// Initialize Supabase Client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ==================== Authentication Functions ==================== */

// Check if user is logged in
async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Sign up
async function signUp(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Sign in
async function signIn(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Sign out
async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get current user
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        return null;
    }
}

/* ==================== Admin Role Check ==================== */

// Check if user is admin (Server-side validation through Database)
async function isUserAdmin(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data && (data.role === 'admin' || data.role === 'super_admin');
    } catch (error) {
        console.error('Admin check error:', error);
        return false;
    }
}

// Get user profile
async function getUserProfile(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Profile fetch error:', error);
        return null;
    }
}

/* ==================== Database Operations ==================== */

// Create user profile after signup
async function createUserProfile(userId, email, isAdmin = false) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .insert([
                {
                    id: userId,
                    email,
                    role: isAdmin ? 'admin' : 'user',
                    created_at: new Date(),
                    xp: 0,
                    level: 1
                }
            ]);
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update user profile
async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .update(updates)
            .eq('id', userId);
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ==================== Novels Operations ==================== */

// Get all novels
async function getNovels(published_only = false) {
    try {
        let query = supabaseClient
            .from('novels')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (published_only) {
            query = query.eq('is_published', true);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get single novel
async function getNovel(novelId) {
    try {
        const { data, error } = await supabaseClient
            .from('novels')
            .select('*')
            .eq('id', novelId)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Create novel
async function createNovel(novelData) {
    try {
        const { data, error } = await supabaseClient
            .from('novels')
            .insert([
                {
                    ...novelData,
                    created_at: new Date(),
                    is_published: novelData.is_published ?? false
                }
            ])
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update novel
async function updateNovel(novelId, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('novels')
            .update({
                ...updates,
                updated_at: new Date()
            })
            .eq('id', novelId)
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Delete novel
async function deleteNovel(novelId) {
    try {
        // First delete all chapters
        await supabaseClient
            .from('chapters')
            .delete()
            .eq('novel_id', novelId);
        
        // Then delete the novel
        const { error } = await supabaseClient
            .from('novels')
            .delete()
            .eq('id', novelId);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ==================== Chapters Operations ==================== */

// Get chapters for novel
async function getChapters(novelId, published_only = false) {
    try {
        let query = supabaseClient
            .from('chapters')
            .select('*')
            .eq('novel_id', novelId)
            .order('chapter_number', { ascending: true });
        
        if (published_only) {
            query = query.eq('is_published', true);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get single chapter
async function getChapter(chapterId) {
    try {
        const { data, error } = await supabaseClient
            .from('chapters')
            .select('*')
            .eq('id', chapterId)
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Create chapter
async function createChapter(chapterData) {
    try {
        const { data, error } = await supabaseClient
            .from('chapters')
            .insert([
                {
                    ...chapterData,
                    created_at: new Date(),
                    is_published: chapterData.is_published ?? false
                }
            ])
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update chapter
async function updateChapter(chapterId, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('chapters')
            .update({
                ...updates,
                updated_at: new Date()
            })
            .eq('id', chapterId)
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Delete chapter
async function deleteChapter(chapterId) {
    try {
        const { error } = await supabaseClient
            .from('chapters')
            .delete()
            .eq('id', chapterId);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ==================== File Upload ==================== */

// Upload file (cover image, etc)
async function uploadFile(bucket, file, path) {
    try {
        const { data, error } = await supabaseClient
            .storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });
        
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient
            .storage
            .from(bucket)
            .getPublicUrl(path);
        
        return { success: true, url: publicUrl };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Delete file
async function deleteFile(bucket, path) {
    try {
        const { error } = await supabaseClient
            .storage
            .from(bucket)
            .remove([path]);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ==================== Statistics ==================== */

// Get dashboard statistics
async function getDashboardStats() {
    try {
        const stats = {};
        
        // Count novels
        const { count: novelCount } = await supabaseClient
            .from('novels')
            .select('*', { count: 'exact', head: true });
        stats.novels = novelCount;
        
        // Count chapters
        const { count: chapterCount } = await supabaseClient
            .from('chapters')
            .select('*', { count: 'exact', head: true });
        stats.chapters = chapterCount;
        
        // Count users
        const { count: userCount } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        stats.users = userCount;
        
        // Get latest novels
        const { data: latestNovels } = await supabaseClient
            .from('novels')
            .select('id, title_ar, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        stats.latestNovels = latestNovels;
        
        return { success: true, data: stats };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ==================== Search ==================== */

// Search novels
async function searchNovels(query) {
    try {
        const { data, error } = await supabaseClient
            .from('novels')
            .select('*')
            .or(`title_ar.ilike.%${query}%,title_en.ilike.%${query}%,author.ilike.%${query}%`)
            .eq('is_published', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ==================== Category Operations ==================== */

// Get all categories
async function getCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('order', { ascending: true });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Create category
async function createCategory(categoryData) {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .insert([categoryData])
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update category
async function updateCategory(categoryId, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .update(updates)
            .eq('id', categoryId)
            .select();
        
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Delete category
async function deleteCategory(categoryId) {
    try {
        const { error } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', categoryId);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ==================== Site Settings ==================== */

// Get all settings as a key-value object
async function getSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('settings')
            .select('*');

        if (error) throw error;

        const settingsObj = {};
        (data || []).forEach(row => {
            settingsObj[row.key] = row.value;
        });

        return { success: true, data: settingsObj };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Save a batch of settings (key-value pairs) using upsert
async function saveSettings(settingsObj) {
    try {
        const rows = Object.entries(settingsObj).map(([key, value]) => ({ key, value }));

        const { error } = await supabaseClient
            .from('settings')
            .upsert(rows, { onConflict: 'key' });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ==================== Levels (Reader Ranks) ==================== */

// Get all levels, ordered from lowest to highest
async function getLevels() {
    try {
        const { data, error } = await supabaseClient
            .from('levels')
            .select('*')
            .order('level_number', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ==================== Comments ==================== */

// Get comments for a chapter (oldest first), joined with the commenter's username
async function getComments(chapterId) {
    try {
        const { data, error } = await supabaseClient
            .from('comments')
            .select('id, content, created_at, user_id, profiles ( username, email )')
            .eq('chapter_id', chapterId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Post a new comment on a chapter (must be logged in). Also awards XP (capped per day).
async function addComment(chapterId, content) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            return { success: false, error: 'يجب تسجيل الدخول لإضافة تعليق' };
        }

        const { data, error } = await supabaseClient
            .from('comments')
            .insert([{ chapter_id: chapterId, user_id: user.id, content }])
            .select('id, content, created_at, user_id')
            .single();

        if (error) throw error;

        let xpResult = null;
        try {
            const { data: xpData } = await supabaseClient.rpc('award_comment_xp', { p_comment_id: data.id });
            xpResult = xpData;
        } catch (xpErr) {
            console.error('XP award (comment) failed:', xpErr);
        }

        return { success: true, data, xp: xpResult };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/* ==================== XP / Reading Tracking ==================== */

// Call this once a chapter has actually loaded for a logged-in reader.
// Awards reading XP the first time only; safe to call every time the chapter opens.
async function trackChapterRead(chapterId) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            return { success: false, awarded: false, reason: 'not_authenticated' };
        }

        const { data, error } = await supabaseClient.rpc('award_reading_xp', { p_chapter_id: chapterId });
        if (error) throw error;

        return { success: true, ...data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Fetch the logged-in reader's own profile + matching level info in one call
async function getMyReaderStatus() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return { success: true, data: null };

        const profile = await getUserProfile(user.id);
        if (!profile) return { success: false, error: 'تعذر تحميل الملف الشخصي' };

        const levelsResult = await getLevels();
        const levels = levelsResult.success ? levelsResult.data : [];
        const currentLevel = levels.filter(l => l.min_xp <= profile.xp).pop() || levels[0];
        const nextLevel = levels.find(l => l.min_xp > profile.xp) || null;

        return {
            success: true,
            data: { profile, currentLevel, nextLevel, levels }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
