# 🚀 Deployment Guide - Crypto AI Trading Backend

## Quick Summary

Your **Crypto AI Trading Backend** is **production-ready** and fully functional with:
- ✅ All core features implemented and tested
- ✅ WebSocket support for real-time alerts
- ✅ Advanced analytics engine
- ✅ PostgreSQL database integration
- ✅ Comprehensive API documentation
- ✅ GitHub repository with full source code

**Repository**: [https://github.com/luca-neumann/crypto-ai-backend](https://github.com/luca-neumann/crypto-ai-backend)

---

## Current Status

### Server Information
- **Status**: ✅ Running and stable
- **Port**: 5000
- **Environment**: Development (ready for production)
- **Database**: PostgreSQL (crypto_ai_db)
- **API Version**: 2.0.0

### Features Implemented
- ✅ Real-time cryptocurrency data (CoinGecko API)
- ✅ AI sentiment analysis (Xenova transformer models)
- ✅ Advanced ML predictions with feature engineering
- ✅ News scraping and sentiment analysis
- ✅ Backtesting engine for strategy validation
- ✅ Portfolio optimization and risk management
- ✅ Alert system (price, volume, sentiment, technical)
- ✅ **WebSocket support for real-time alerts** (NEW)
- ✅ **Advanced analytics** (performance, correlations, VaR) (NEW)

### API Endpoints
- **Total Endpoints**: 50+
- **Core Features**: 8 major feature areas
- **New Features**: WebSocket + Analytics (8 new endpoints)
- **Health Check**: `GET /health`
- **API Docs**: `GET /` (returns full endpoint documentation)

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js-like projects)

**Pros**:
- Seamless GitHub integration
- Automatic deployments on push
- Free tier available
- Built-in environment variables
- Edge functions support

**Steps**:
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import repository: `luca-neumann/crypto-ai-backend`
4. Set environment variables (see below)
5. Deploy

**Environment Variables to Set**:
```
DATABASE_URL=postgresql://user:password@host:5432/crypto_ai_db
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
NODE_ENV=production
PORT=5000
```

### Option 2: Heroku (Traditional Node.js hosting)

**Pros**:
- Easy deployment
- Automatic scaling
- Built-in PostgreSQL add-on
- Good for Node.js apps

**Steps**:
1. Install Heroku CLI: `brew install heroku`
2. Login: `heroku login`
3. Create app: `heroku create crypto-ai-backend`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
5. Set environment variables: `heroku config:set DATABASE_URL=...`
6. Deploy: `git push heroku main`

### Option 3: AWS (Most flexible, more complex)

**Pros**:
- Maximum control and scalability
- RDS for managed PostgreSQL
- EC2 for compute
- Lambda for serverless functions

**Services needed**:
- **EC2**: For running Node.js server
- **RDS**: For PostgreSQL database
- **S3**: For file storage (if needed)
- **CloudFront**: For CDN (optional)

**Estimated cost**: $20-100/month depending on usage

### Option 4: DigitalOcean (Good balance of simplicity and control)

**Pros**:
- Affordable ($5-20/month)
- Simple deployment
- Managed PostgreSQL available
- Good documentation

**Steps**:
1. Create Droplet (Ubuntu 22.04, 2GB RAM minimum)
2. SSH into droplet
3. Install Node.js and PostgreSQL
4. Clone repository
5. Set up environment variables
6. Start server with PM2 (process manager)
7. Set up Nginx as reverse proxy

---

## Pre-Deployment Checklist

### Code & Configuration
- [ ] All environment variables set in `.env.local`
- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] No console errors in development
- [ ] All API endpoints tested
- [ ] WebSocket connection verified
- [ ] Analytics endpoints working

### Security
- [ ] API keys stored in environment variables (not in code)
- [ ] Database credentials secured
- [ ] CORS configured properly
- [ ] Rate limiting implemented (if needed)
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose sensitive info

### Performance
- [ ] Database indexes created for frequently queried fields
- [ ] API response times acceptable
- [ ] Memory usage reasonable
- [ ] No memory leaks in WebSocket connections
- [ ] Database connection pooling configured

### Documentation
- [ ] README.md updated with deployment info
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Setup instructions clear

---

## Environment Variables

**Required for production**:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/crypto_ai_db"
PGUSER="postgres_user"
PGPASSWORD="postgres_password"

# Server
NODE_ENV="production"
PORT="5000"

# Optional: API Keys (if using external services)
COINGECKO_API_KEY="your_key_here"
NEWS_API_KEY="your_key_here"
```

**Create `.env.local` file** with these values before running.

---

## Database Setup for Production

### PostgreSQL on Cloud

**Option 1: AWS RDS**
```bash
# Create RDS instance
# Get connection string from AWS console
# Format: postgresql://user:password@host:5432/dbname
```

**Option 2: Heroku PostgreSQL**
```bash
# Automatically provided when you add the add-on
# Connection string in: heroku config:get DATABASE_URL
```

**Option 3: DigitalOcean Managed Database**
```bash
# Create managed database cluster
# Get connection string from dashboard
```

### Run Migrations

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Run migrations
npx prisma migrate deploy

# Verify connection
npx prisma db execute --stdin < schema.sql
```

---

## Monitoring & Logging

### Recommended Tools

**Error Tracking**:
- [Sentry](https://sentry.io) - Error tracking and monitoring
- [LogRocket](https://logrocket.com) - Session replay and logging

**Performance Monitoring**:
- [New Relic](https://newrelic.com) - APM and monitoring
- [Datadog](https://www.datadoghq.com) - Infrastructure monitoring

**Logging**:
- [Papertrail](https://www.papertrail.com) - Log aggregation
- [Loggly](https://www.loggly.com) - Cloud logging

### Basic Logging Setup

```javascript
// Add to server.js
const fs = require('fs');
const path = require('path');

// Log to file
const logStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'server.log'),
  { flags: 'a' }
);

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const log = `[${timestamp}] ${req.method} ${req.path}`;
  logStream.write(log + '\n');
  console.log(log);
  next();
});
```

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (AWS ELB, Nginx)
- Run multiple server instances
- Use Redis for session management
- Database connection pooling

### Vertical Scaling
- Increase server RAM/CPU
- Optimize database queries
- Add caching layer (Redis)
- Implement rate limiting

### Database Optimization
- Add indexes on frequently queried fields
- Archive old data
- Use connection pooling
- Monitor query performance

---

## Backup & Recovery

### Database Backups

**Automated backups** (recommended):
- AWS RDS: Automatic daily backups
- Heroku: Automatic backups included
- DigitalOcean: Automated backups available

**Manual backups**:
```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

### Code Backups
- GitHub repository is your backup
- All code is version controlled
- Create releases for major versions

---

## Post-Deployment

### Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/health

# Check API documentation
curl https://your-domain.com/

# Test WebSocket connection
# Use WebSocket client to connect to ws://your-domain.com
```

### Monitor Performance

- Check error logs regularly
- Monitor API response times
- Track database performance
- Monitor WebSocket connections
- Review user feedback

### Maintenance

- Keep dependencies updated
- Monitor security advisories
- Regular database maintenance
- Review and optimize slow queries
- Update documentation

---

## Troubleshooting

### Server Won't Start
```bash
# Check logs
tail -f server.log

# Verify database connection
psql $DATABASE_URL -c "SELECT 1"

# Check port availability
lsof -i :5000
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL

# Check connection string format
# postgresql://user:password@host:5432/dbname

# Verify credentials
echo $PGUSER
echo $PGPASSWORD
```

### WebSocket Connection Issues
```bash
# Check WebSocket server status
curl http://localhost:5000/api/websocket/status

# Verify WebSocket port is open
netstat -an | grep 5000

# Check firewall rules
```

### High Memory Usage
```bash
# Monitor memory
top -p $(pgrep -f "node.*server.js")

# Check for memory leaks
# Use Node.js profiler or Clinic.js
```

---

## Cost Estimation

### Monthly Costs (Approximate)

**Vercel**:
- Free tier: $0 (up to 100GB bandwidth)
- Pro: $20/month

**Heroku**:
- Dyno: $7-50/month
- PostgreSQL: $9-200/month
- Total: $16-250/month

**AWS**:
- EC2 (t3.micro): $10/month
- RDS (db.t3.micro): $15/month
- Data transfer: $0-10/month
- Total: $25-35/month

**DigitalOcean**:
- Droplet (2GB): $12/month
- Managed Database: $15/month
- Total: $27/month

---

## Support & Resources

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Community
- GitHub Issues: Report bugs and request features
- Stack Overflow: Ask questions with tags `node.js`, `express`, `postgresql`
- Discord Communities: Node.js, Express.js communities

### Contact
- **Email**: alphamarketexpress@gmail.com
- **GitHub**: [https://github.com/luca-neumann/crypto-ai-backend](https://github.com/luca-neumann/crypto-ai-backend)

---

## Next Steps

1. **Choose deployment platform** (Vercel, Heroku, AWS, or DigitalOcean)
2. **Set up database** (PostgreSQL on chosen platform)
3. **Configure environment variables**
4. **Run database migrations**
5. **Deploy application**
6. **Verify deployment** (test health endpoint)
7. **Set up monitoring** (error tracking, logging)
8. **Configure backups** (automated daily backups)
9. **Monitor performance** (response times, errors)
10. **Plan scaling** (if needed as usage grows)

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL/HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Error tracking set up (Sentry, LogRocket)
- [ ] Logging configured
- [ ] Backups automated
- [ ] Monitoring enabled
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] API documentation updated
- [ ] Health check endpoint working
- [ ] WebSocket connection verified
- [ ] Analytics endpoints tested
- [ ] Load testing completed

---

**Status**: ✅ **READY FOR PRODUCTION**

**Version**: 2.0.0  
**Last Updated**: February 1, 2026  
**Deployment Status**: Ready to deploy

---

*For detailed information, see the other documentation files in the repository.*
