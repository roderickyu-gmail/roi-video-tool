# ROI Video Tool - Supabase Database Architecture

## 📋 Overview

This is a comprehensive database architecture for the ROI Video Tool, designed to support:
- 🎬 Multi-variant video production and management
- 📊 Performance tracking and analytics
- 🧪 A/B testing and experimentation
- 👥 Team collaboration and multi-tenancy
- 🎯 UTM tracking and attribution
- 🤖 AI-powered content optimization

## 🏗 Architecture Highlights

### Core Design Principles

1. **Multi-tenancy**: Organization-based isolation with RLS
2. **Performance**: Partitioned tables, materialized views, and strategic indexes
3. **Scalability**: JSONB fields for flexibility, UUID keys for distribution
4. **Security**: Row-Level Security, audit logging, and role-based access
5. **Analytics**: Time-series data with automatic aggregations

### Key Features

- **Smart Content Pools**: Reusable content elements with performance tracking
- **Variant Generation**: Systematic creation of video variants with unique combinations
- **Real-time Metrics**: Live performance data with historical tracking
- **Experiment Framework**: Built-in A/B testing with statistical analysis
- **Asset Management**: Centralized media storage with usage rights tracking
- **Template System**: Reusable templates with performance insights

## 🚀 Quick Start

### Prerequisites

- [Supabase Account](https://supabase.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Node.js 18+ and pnpm

### Installation

1. **Clone and setup**:
```bash
cd roi-video-tool
chmod +x supabase/setup.sh
./supabase/setup.sh
```

2. **Configure environment**:
Create `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. **Run migrations**:
```bash
supabase db push
```

4. **Start development**:
```bash
pnpm dev
```

## 📊 Database Schema

### Core Modules

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Organizations  │────▶│    Projects     │────▶│  Video Variants │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Members     │     │  Content Pools  │     │  Variant Metrics│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `organizations` | Multi-tenant isolation | Subscription tiers, settings |
| `projects` | Campaign management | Goals, targeting, legal auth |
| `video_variants` | Video versions | UTM config, performance metrics |
| `content_pools` | Reusable content | Hooks, CTAs, music, etc. |
| `variant_metrics` | Time-series data | Partitioned by month |
| `experiments` | A/B testing | Statistical analysis |
| `assets` | Media files | Usage rights, tagging |

## 🔒 Security Model

### Row-Level Security (RLS)

All tables implement RLS policies based on organization membership:

```sql
-- Example: Users can only see their organization's data
CREATE POLICY "org_isolation" ON projects
FOR ALL USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);
```

### Role-Based Access Control

| Role | Permissions |
|------|------------|
| `owner` | Full access to organization |
| `admin` | Manage projects and team |
| `editor` | Create/edit content |
| `viewer` | Read-only access |

## 📈 Performance Optimization

### Indexing Strategy

- **Primary lookups**: B-tree indexes on foreign keys
- **Search**: GIN indexes for JSONB and array fields  
- **Analytics**: Partial indexes for active records
- **Time-series**: BRIN indexes on timestamp columns

### Materialized Views

Pre-computed aggregations refreshed hourly:
- `project_dashboard_stats`: Project overview metrics
- `top_performing_variants`: Best performing videos

### Data Partitioning

Tables partitioned by month:
- `variant_metrics`: Performance time-series
- `audit_logs`: Activity tracking

## 🛠 Maintenance

### Backup Strategy

```bash
# Daily backup
supabase db dump -f backup-$(date +%Y%m%d).sql

# Restore from backup
supabase db reset
psql $DATABASE_URL < backup-20240118.sql
```

### Monitoring Queries

```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;

-- Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### Data Cleanup

```sql
-- Archive old metrics (run monthly)
INSERT INTO variant_metrics_archive
SELECT * FROM variant_metrics
WHERE timestamp < CURRENT_DATE - INTERVAL '6 months';

-- Clean audit logs (run yearly)
DELETE FROM audit_logs
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
```

## 📚 Documentation

- [Database Design](./DATABASE_DESIGN.md) - Detailed schema documentation
- [Usage Guide](./USAGE_GUIDE.md) - Query examples and best practices
- [Migration Scripts](./migrations/) - SQL migration files

## 🧪 Testing

### Test Data Generation

```sql
-- Generate test organization
INSERT INTO organizations (name, slug) 
VALUES ('Test Org', 'test-org');

-- Generate test projects
INSERT INTO projects (organization_id, name, optimization_goal)
SELECT 
    'org-uuid',
    'Test Project ' || generate_series,
    (ARRAY['ctr', 'cvr', 'roas'])[1 + random() * 2]
FROM generate_series(1, 10);

-- Generate test variants
INSERT INTO video_variants (project_id, variant_code, metrics)
SELECT 
    'project-uuid',
    'TEST-' || LPAD(generate_series::text, 3, '0'),
    jsonb_build_object(
        'views', (random() * 10000)::int,
        'clicks', (random() * 500)::int,
        'conversions', (random() * 50)::int
    )
FROM generate_series(1, 100);
```

## 🚨 Troubleshooting

### Common Issues

1. **RLS blocking access**:
```sql
-- Check current user's organizations
SELECT * FROM organization_members WHERE user_id = auth.uid();
```

2. **Slow queries**:
```sql
-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM your_query;
```

3. **Storage issues**:
```bash
# Check bucket policies
supabase storage ls
```

## 🤝 Contributing

1. Create feature branch
2. Update migrations in `supabase/migrations/`
3. Test locally with `supabase db reset`
4. Submit PR with migration and documentation

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/your-org/roi-video-tool/issues)
- [Documentation](https://docs.your-domain.com)

---

Built with ❤️ using [Supabase](https://supabase.com) and [Next.js](https://nextjs.org)