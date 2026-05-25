const { spawn } = require('child_process');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:5000/api';
let serverProcess;

// Helper to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for assertion logging
const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ SUCCESS: ${message}`);
  } else {
    console.error(`❌ FAILED: ${message}`);
    cleanupAndExit(1);
  }
};

const cleanupAndExit = (code) => {
  if (serverProcess) {
    console.log('Stopping test backend server...');
    serverProcess.kill();
  }
  process.exit(code);
};

const runTests = async () => {
  console.log('🚀 Starting Automated Backend Verification Suite...');
  
  // 1. Start backend server
  const serverPath = path.join(__dirname, '..', 'backend', 'src', 'server.js');
  serverProcess = spawn('node', [serverPath], {
    env: { ...process.env, PORT: '5000', NODE_ENV: 'test' },
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString().trim()}`);
  });

  // Give server 3 seconds to spin up and connect to MongoDB
  await delay(3000);

  try {
    // Generate unique credentials for this run
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const testUsername = `qa_tester_${randomSuffix}`;
    const testEmail = `qa_tester_${randomSuffix}@verify.com`;
    const testPassword = 'Password123!';

    let accessToken = '';
    let refreshToken = '';
    let testUserId = '';
    let testPostId = '';
    let parentCommentId = '';
    let childCommentId = '';

    // ==========================================
    // TEST 1: Health Check
    // ==========================================
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, 'Backend health check passed');

    // ==========================================
    // TEST 2: User Registration
    // ==========================================
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: testPassword,
      }),
    });
    const registerData = await registerRes.json();
    assert(registerRes.status === 201 && registerData.success, 'User registered successfully');
    assert(registerData.accessToken && registerData.refreshToken, 'Access and refresh tokens returned on registration');
    
    testUserId = registerData.user._id;

    // ==========================================
    // TEST 3: Duplicate Registration Guard
    // ==========================================
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: testPassword,
      }),
    });
    assert(dupRes.status === 400, 'Duplicate registration rejected');

    // ==========================================
    // TEST 4: User Login
    // ==========================================
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, 'User logged in successfully');
    assert(loginData.accessToken && loginData.refreshToken, 'Access and refresh tokens returned on login');
    
    accessToken = loginData.accessToken;
    refreshToken = loginData.refreshToken;

    // ==========================================
    // TEST 5: Get Current User Profile (Auth Protected)
    // ==========================================
    const profileRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200 && profileData.success, 'Fetch user profile successful');
    assert(profileData.user.username === testUsername, 'Profile returns correct username');

    // ==========================================
    // TEST 6: Refresh Access Token
    // ==========================================
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshData = await refreshRes.json();
    assert(refreshRes.status === 200 && refreshData.success, 'Token refresh cycle successful');
    assert(refreshData.accessToken && refreshData.accessToken !== accessToken, 'New access token generated');
    
    accessToken = refreshData.accessToken; // Update to new access token

    // ==========================================
    // TEST 7: Create Blog Post
    // ==========================================
    const createPostRes = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: 'Verifying Full Stack App Flow in Node',
        content: '# Node Integration Test\n\nThis is an automated markdown post generated during E2E QA.\n\n- Bullet 1\n- Bullet 2',
        tags: 'qa, node, testing',
        coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
      }),
    });
    const createPostData = await createPostRes.json();
    assert(createPostRes.status === 201 && createPostData.success, 'Blog post created successfully');
    assert(createPostData.post.slug === 'verifying-full-stack-app-flow-in-node', 'Correct SEO friendly slug generated');
    assert(createPostData.post.summary.includes('Node Integration Test'), 'Summary auto-generated correctly');
    
    testPostId = createPostData.post._id;

    // ==========================================
    // TEST 8: List Posts & Filter by Tag
    // ==========================================
    const listPostsRes = await fetch(`${BASE_URL}/posts?tag=qa`);
    const listPostsData = await listPostsRes.json();
    assert(listPostsRes.status === 200 && listPostsData.success, 'Posts listed successfully');
    assert(listPostsData.posts.length > 0, 'Returned posts matching the tag filter');
    assert(listPostsData.uniqueTags.includes('qa'), 'Unique tags compiler working');

    // ==========================================
    // TEST 9: Add Root Comment
    // ==========================================
    const parentCommentRes = await fetch(`${BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        post: testPostId,
        content: 'This is an awesome test comment!',
      }),
    });
    const parentCommentData = await parentCommentRes.json();
    assert(parentCommentRes.status === 201 && parentCommentData.success, 'Root level comment added');
    
    parentCommentId = parentCommentData.comment._id;

    // ==========================================
    // TEST 10: Add Nested Comment (Reply)
    // ==========================================
    const childCommentRes = await fetch(`${BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        post: testPostId,
        content: 'Replying to the root comment with nested details',
        parentComment: parentCommentId,
      }),
    });
    const childCommentData = await childCommentRes.json();
    assert(childCommentRes.status === 201 && childCommentData.success, 'Nested child reply comment added');
    
    childCommentId = childCommentData.comment._id;

    // ==========================================
    // TEST 11: Get Nested Comment Tree
    // ==========================================
    const treeRes = await fetch(`${BASE_URL}/comments/post/${testPostId}`);
    const treeData = await treeRes.json();
    assert(treeRes.status === 200 && treeData.success, 'Comment tree fetched successfully');
    assert(treeData.comments.length === 1, 'Top level array contains only root comment');
    assert(treeData.comments[0].replies.length === 1, 'Root comment contains child reply nested');
    assert(treeData.comments[0].replies[0].content.includes('nested details'), 'Child comment reply contains proper content');

    // ==========================================
    // TEST 12: Delete Post & Cascading Comment Delete
    // ==========================================
    const deletePostRes = await fetch(`${BASE_URL}/posts/${testPostId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    assert(deletePostRes.status === 200, 'Blog post deleted successfully by author');

    // Verify comments were cascaded deleted from DB
    const checkCommentsRes = await fetch(`${BASE_URL}/comments/post/${testPostId}`);
    const checkCommentsData = await checkCommentsRes.json();
    assert(checkCommentsData.comments.length === 0, 'Associated comments deleted automatically (cascade delete verified)');

    console.log('\n🌟 ALL 12 INTEGRATION TESTS PASSED SUCCESSFULLY! 🌟\n');
    cleanupAndExit(0);
  } catch (error) {
    console.error('❌ Integration test crashed with error:', error);
    cleanupAndExit(1);
  }
};

runTests();
