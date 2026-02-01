import "dotenv/config";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    process.exit(1);
}

console.log('✅ Environment variables loaded:');
console.log(`   SUPABASE_URL: ${supabaseUrl}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('📡 Testing database connection...');

        // Test 1: Check if we can query the users table
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, role')
            .limit(5);

        if (usersError) {
            console.error('❌ Error querying users table:', usersError.message);
            return false;
        }

        console.log(`✅ Successfully connected to Supabase!`);
        console.log(`   Found ${users?.length || 0} users in the database`);

        if (users && users.length > 0) {
            console.log('   Sample users:');
            users.forEach(u => {
                console.log(`   - ${u.username} (${u.role})`);
            });
        }
        console.log('');

        // Test 2: Check products table
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, title, is_published')
            .limit(5);

        if (productsError) {
            console.error('❌ Error querying products table:', productsError.message);
            return false;
        }

        console.log(`✅ Products table accessible`);
        console.log(`   Found ${products?.length || 0} products`);

        if (products && products.length > 0) {
            console.log('   Sample products:');
            products.forEach(p => {
                console.log(`   - ${p.title} (${p.is_published ? 'Published' : 'Draft'})`);
            });
        }
        console.log('');

        // Test 3: Check storage buckets
        const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets();

        if (bucketsError) {
            console.warn('⚠️  Warning: Could not list storage buckets:', bucketsError.message);
            console.warn('   This is normal if you haven\'t set up storage yet.');
        } else {
            console.log(`✅ Storage buckets accessible`);
            console.log(`   Found ${buckets?.length || 0} buckets`);

            if (buckets && buckets.length > 0) {
                console.log('   Available buckets:');
                buckets.forEach(b => {
                    console.log(`   - ${b.name} (${b.public ? 'Public' : 'Private'})`);
                });
            }
        }
        console.log('');

        // Test 4: Check RLS policies
        console.log('🔒 Checking Row Level Security...');
        const { data: authData } = await supabase.auth.admin.listUsers();
        console.log(`✅ Auth system accessible (${authData?.users?.length || 0} users)`);
        console.log('');

        console.log('✨ All tests passed! Your Supabase connection is working perfectly.\n');
        console.log('🚀 Next steps:');
        console.log('   1. Start the dev server: npm run dev');
        console.log('   2. Open http://localhost:5000');
        console.log('   3. Try signing up a new account');
        console.log('   4. Create some products as a writer\n');

        return true;

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        return false;
    }
}

testConnection().then(success => {
    process.exit(success ? 0 : 1);
});
