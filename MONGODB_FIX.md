# MongoDB Connection Fix for Vercel Production

## 🚨 Issue Identified
Your Vercel deployment is getting a DNS resolution error because the MongoDB connection string is incorrect in production.

**Error**: `querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net`
**Expected**: Should connect to `cluster0.vux2yvb.mongodb.net`

## 🔧 Immediate Fix Steps

### Step 1: Check Vercel Environment Variables
1. Go to your Vercel Dashboard
2. Navigate to your project
3. Go to **Settings** → **Environment Variables**
4. Find the `MONGODB_URI` variable

### Step 2: Update MongoDB URI in Vercel
**Replace the current MONGODB_URI with exactly this:**

```
mongodb+srv://abanobhakim_db_user:suBvxtocmQ0SKjMS@cluster0.vux2yvb.mongodb.net/video_task_manager?retryWrites=true&w=majority&appName=Cluster0
```

**⚠️ Important Notes:**
- Make sure there are NO extra spaces before or after the URI
- The cluster name must be `cluster0.vux2yvb.mongodb.net` (not `cluster.mongodb.net`)
- Copy-paste exactly as shown above

### Step 3: Redeploy
After updating the environment variable:
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on your latest deployment
3. Or push a new commit to trigger automatic deployment

### Step 4: Verify Fix
1. Wait for deployment to complete
2. Test the signup functionality
3. Check Vercel function logs for any remaining errors

## 🔍 Alternative MongoDB URI Formats

If the above doesn't work, try these alternatives:

### Option 1: Without App Name
```
mongodb+srv://abanobhakim_db_user:suBvxtocmQ0SKjMS@cluster0.vux2yvb.mongodb.net/video_task_manager?retryWrites=true&w=majority
```

### Option 2: With SSL Parameters
```
mongodb+srv://abanobhakim_db_user:suBvxtocmQ0SKjMS@cluster0.vux2yvb.mongodb.net/video_task_manager?retryWrites=true&w=majority&ssl=true
```

### Option 3: Get Fresh URI from MongoDB Atlas
1. Go to MongoDB Atlas Dashboard
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string
5. Replace `<password>` with: `suBvxtocmQ0SKjMS`
6. Replace `<dbname>` with: `video_task_manager`

## 🛠️ MongoDB Atlas Network Access Check

Ensure your MongoDB Atlas allows Vercel connections:

1. **In MongoDB Atlas Dashboard:**
   - Go to **Network Access**
   - Ensure you have an entry for `0.0.0.0/0` (Allow access from anywhere)
   - Or add Vercel's IP ranges if you prefer restricted access

2. **Database User Permissions:**
   - Go to **Database Access**
   - Verify `abanobhakim_db_user` has **Read and write to any database** permissions

## 🧪 Test Connection

After fixing, test with these endpoints:
- `https://your-app.vercel.app/api/test-db` - Should return success
- Try signup again - Should work without DNS errors

## 📋 Verification Checklist

- [ ] MONGODB_URI updated in Vercel environment variables
- [ ] No extra spaces in the connection string
- [ ] Cluster name is `cluster0.vux2yvb.mongodb.net`
- [ ] Database name is `video_task_manager`
- [ ] App redeployed after environment variable change
- [ ] Network access allows 0.0.0.0/0 in MongoDB Atlas
- [ ] Database user has proper permissions
- [ ] Test endpoint `/api/test-db` returns success
- [ ] Signup functionality works

## 🆘 If Still Not Working

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Functions
   - Check the logs for your API routes

2. **Verify Environment Variable:**
   - In Vercel, temporarily add a test API route that returns `process.env.MONGODB_URI`
   - Verify it shows the correct connection string

3. **MongoDB Atlas Status:**
   - Check if your MongoDB Atlas cluster is running
   - Verify cluster region and availability

4. **Alternative Connection Method:**
   - Try using the standard MongoDB connection string (non-SRV) if available
   - Check MongoDB Atlas for connection troubleshooting tools

---

**Expected Result**: After this fix, your signup should work without DNS resolution errors.