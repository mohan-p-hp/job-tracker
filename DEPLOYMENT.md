# Job Tracker - Deployment Guide

## Free Deployment Options

### Option 1: Heroku (Recommended - Free tier available)

1. **Prerequisites**
   - Heroku account (free)
   - Git installed
   - Node.js 18+

2. **Database Setup**
   - Sign up for [PlanetScale](https://planetscale.com/) (free MySQL database)
   - Create a new database
   - Get connection details

3. **Deploy Steps**

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create new app
heroku create your-job-tracker

# Add PlanetScale database
heroku config:set DB_HOST=your-planetscale-host
heroku config:set DB_USER=your-planetscale-username
heroku config:set DB_PASSWORD=your-planetscale-password
heroku config:set DB_NAME=your-planetscale-database

# Set Node version
heroku config:set NODE_ENV=production

# Deploy
git add .
git commit -m "Ready for deployment"
git push heroku main
```

### Option 2: Vercel + Railway

1. **Frontend on Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

2. **Backend on Railway**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 3: Render.com (Easiest - Free tier)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up for free account

2. **Connect GitHub**
   - Connect your GitHub repository
   - Create a "Web Service"

3. **Configuration**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add environment variables from `.env.example`

## Environment Variables Required

Copy `backend/.env.example` to `backend/.env` and set:

```bash
# Database (use PlanetScale for free MySQL)
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=job_tracker

# Email (optional - for follow-up features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server
NODE_ENV=production
PORT=5000
```

## Database Setup (PlanetScale - Free)

1. Go to [PlanetScale](https://planetscale.com/)
2. Create free account
3. Create new database "job_tracker"
4. Get connection string from dashboard
5. Use these values in your deployment environment

## Custom Domain (Optional)

For each service:
- **Heroku**: `heroku domains:add yourdomain.com`
- **Vercel**: Add custom domain in dashboard
- **Render**: Add custom domain in service settings

## Testing Deployment

After deployment:
1. Visit your app URL
2. Test adding a job application
3. Verify all features work
4. Check mobile responsiveness

## Troubleshooting

- **Build fails**: Check Node version (must be 18+)
- **Database errors**: Verify connection strings
- **CORS issues**: Ensure frontend URL is allowed
- **Email not working**: Check SMTP credentials

## Cost Breakdown (Free Tier)

- **Heroku**: Free tier (sleeps after 30min inactivity)
- **PlanetScale**: Free tier (5GB storage)
- **Vercel**: Free tier (100GB bandwidth)
- **Render**: Free tier (750hrs/month)

Total cost: **$0/month**
