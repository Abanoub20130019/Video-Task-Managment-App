# Video Task Manager - Online Deployment Guide

## Overview
This guide covers deploying the Video Task Manager application from offline to online use with Vercel and MongoDB Atlas.

## Changes Made for Online Deployment

### 1. Service Worker Updates
- **Updated to online-first strategy**: Prioritizes network requests over cached data
- **Reduced aggressive caching**: Only caches essential static assets and read-only API responses
- **Improved error handling**: Better network failure responses
- **Enhanced notifications**: Optimized push notification handling for online use

### 2. Port Configuration
- **Removed hardcoded ports**: Updated `package.json` to use default ports
- **Flexible deployment**: Works with Vercel's dynamic port assignment

### 3. PWA Manifest Updates
- **Online-focused description**: Updated app description for online use
- **Flexible orientation**: Changed from portrait-only to any orientation
- **Enhanced protocol handlers**: Added support for deep linking

### 4. Environment Variables
- **Production configuration**: Created `.env.production` template
- **Vercel-ready URLs**: Updated NEXTAUTH_URL for production deployment

### 5. Security Headers
- **Updated CSP**: Enhanced Content Security Policy for online deployment
- **Vercel compatibility**: Added necessary domains for Vercel hosting

## Deployment Steps

### Prerequisites
- [x] MongoDB Atlas cluster configured and running
- [x] Vercel account created
- [x] Application code updated for online use

### Step 1: Prepare Environment Variables

1. **In Vercel Dashboard**, go to your project settings
2. **Add the following environment variables**:

```bash
# Required Variables
NEXTAUTH_SECRET=your-production-secret-key-here-make-it-long-and-random
NEXTAUTH_URL=https://your-vercel-app-url.vercel.app
MONGODB_URI=mongodb+srv://abanobhakim_db_user:suBvxtocmQ0SKjMS@cluster0.vux2yvb.mongodb.net/video_task_manager?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=production
LOG_LEVEL=warn

# Firebase Configuration (Server-side)
FIREBASE_PROJECT_ID=task-manger-43947
FIREBASE_PRIVATE_KEY=your-firebase-private-key-here
FIREBASE_CLIENT_EMAIL=your-firebase-client-email-here
FIREBASE_API_KEY=AIzaSyCHP_rV8ATLZk7DoCU1ebV51ZRW5LZSzrU
FIREBASE_AUTH_DOMAIN=task-manger-43947.firebaseapp.com
FIREBASE_STORAGE_BUCKET=task-manger-43947.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=67578711347
FIREBASE_APP_ID=1:67578711347:web:c130ebeed13d515a76c246
FIREBASE_MEASUREMENT_ID=G-EMVSJE5S86

# Firebase Client-side Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCHP_rV8ATLZk7DoCU1ebV51ZRW5LZSzrU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=task-manger-43947.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=task-manger-43947
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=task-manger-43947.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=67578711347
NEXT_PUBLIC_FIREBASE_APP_ID=1:67578711347:web:c130ebeed13d515a76c246
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-EMVSJE5S86
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key-for-push-notifications

# Pusher Configuration for Real-time Features
PUSHER_APP_ID=your-pusher-app-id-here
PUSHER_KEY=1d21996394db69a7247d
PUSHER_SECRET=your-pusher-secret-here
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=1d21996394db69a7247d
NEXT_PUBLIC_PUSHER_CLUSTER=ap2

# Optional Variables
REDIS_URL=redis://your-redis-instance
```

### Step 2: Deploy to Vercel

1. **Connect Repository**:
   ```bash
   # If using Vercel CLI
   npm i -g vercel
   vercel login
   vercel --prod
   ```

2. **Or use Vercel Dashboard**:
   - Import your GitHub/GitLab repository
   - Configure build settings (auto-detected for Next.js)
   - Deploy

### Step 3: Verify Deployment

1. **Test Database Connection**:
   - Visit: `https://your-app.vercel.app/api/test-db`
   - Should return: `{"status":"success","message":"Connected to MongoDB successfully!",...}`

2. **Test Application**:
   - Visit: `https://your-app.vercel.app`
   - Verify all features work online

3. **Test PWA Features**:
   - Check service worker registration
   - Test offline fallback (disconnect internet briefly)
   - Verify push notifications (if configured)

## MongoDB Atlas Configuration

### Current Setup
- **Cluster**: `cluster0.vux2yvb.mongodb.net`
- **Database**: `video_task_manager`
- **Collections**: 8 collections (budgets, schedules, resourceallocations, projects, equipment, users, tasks, clients)

### Security
- **Network Access**: Ensure `0.0.0.0/0` is allowed for Vercel deployment
- **Database User**: `abanobhakim_db_user` with read/write permissions

## Performance Optimizations

### 1. Caching Strategy
- **Static assets**: Cached for performance
- **API responses**: Minimal caching for fresh data
- **Database queries**: Consider adding Redis for production

### 2. Service Worker
- **Online-first**: Always tries network before cache
- **Selective caching**: Only caches essential resources
- **Background sync**: Minimal for critical actions only

### 3. Security
- **CSP headers**: Configured for Vercel domains
- **Rate limiting**: In-memory store (consider Redis for production)
- **HTTPS**: Enforced in production

## Monitoring and Maintenance

### 1. Logs
- **Vercel Functions**: Check function logs in Vercel dashboard
- **Application logs**: Set `LOG_LEVEL=warn` for production

### 2. Database Monitoring
- **MongoDB Atlas**: Monitor cluster performance
- **Connection pooling**: Configured with max 10 connections

### 3. Error Tracking
- Consider adding error tracking service (Sentry, LogRocket)
- Monitor API response times and errors

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   ```
   Error: querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net
   ```
   **Solutions**:
   - Verify MongoDB Atlas network access (allow 0.0.0.0/0 for Vercel)
   - Check connection string format exactly matches:
     ```
     mongodb+srv://username:password@cluster0.vux2yvb.mongodb.net/database_name?retryWrites=true&w=majority&appName=Cluster0
     ```
   - Ensure database user permissions are correct
   - Test connection using `/api/test-db` endpoint
   - Check if MongoDB Atlas cluster is running and accessible

2. **Environment Variables**:
   - Verify all required variables are set in Vercel dashboard
   - Check variable names match exactly (case-sensitive)
   - Ensure MONGODB_URI doesn't have extra spaces or characters
   - Redeploy after adding new variables
   - Test locally first with `.env.local`

3. **Service Worker Issues**:
   - Clear browser cache and service worker
   - Check browser console for SW registration errors
   - Verify manifest.json is accessible at `/manifest.json`
   - Check if service worker is properly registered in DevTools

4. **Authentication Issues**:
   - Verify NEXTAUTH_URL matches exact deployment URL
   - Check NEXTAUTH_SECRET is set and sufficiently long
   - Ensure session configuration is correct
   - Test authentication flow in incognito mode

5. **Firebase/Pusher Connection Issues**:
   - Verify all Firebase config variables are set correctly
   - Check Pusher app credentials and cluster region
   - Ensure VAPID key is configured for push notifications
   - Test real-time features after deployment

### Performance Issues

1. **Slow API Responses**:
   - Check MongoDB Atlas cluster tier
   - Consider adding database indexes
   - Implement Redis caching

2. **Large Bundle Size**:
   - Analyze bundle with `npm run build`
   - Consider code splitting
   - Optimize imports

## Next Steps

### Recommended Enhancements

1. **Add Redis Caching**:
   - Improve API response times
   - Better rate limiting
   - Session storage

2. **Implement Error Tracking**:
   - Add Sentry or similar service
   - Monitor production errors
   - Track performance metrics

3. **Add CI/CD Pipeline**:
   - Automated testing
   - Staging environment
   - Automated deployments

4. **Enhanced Security**:
   - Add API rate limiting per user
   - Implement request validation
   - Add audit logging

## Support

For issues or questions:
1. Check Vercel deployment logs
2. Monitor MongoDB Atlas metrics
3. Review browser console for client-side errors
4. Check service worker status in DevTools

---

**Deployment Status**: ✅ Ready for Production
**Last Updated**: 2025-09-07
**Version**: 2.0.0 (Online-First)