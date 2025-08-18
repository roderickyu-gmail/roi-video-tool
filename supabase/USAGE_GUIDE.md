# ROI Video Tool 数据库使用指南

## 快速开始

### 1. 在 Supabase 中创建项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 创建新项目
3. 等待数据库初始化完成

### 2. 运行迁移脚本

在 Supabase SQL Editor 中运行：

```sql
-- 运行 migrations/001_initial_schema.sql
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 常用查询示例

### 用户和组织管理

#### 创建组织并添加成员
```sql
-- 创建组织
INSERT INTO organizations (name, slug, subscription_tier) 
VALUES ('Acme Corp', 'acme-corp', 'pro')
RETURNING id;

-- 添加成员到组织
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('org-uuid', 'user-uuid', 'owner');
```

#### 获取用户的所有组织
```sql
SELECT o.*, om.role
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
WHERE om.user_id = auth.uid();
```

### 项目管理

#### 创建项目
```sql
INSERT INTO projects (
    organization_id,
    name,
    description,
    optimization_goal,
    target_audience,
    unique_selling_points,
    created_by
) VALUES (
    'org-uuid',
    'Summer Sale Campaign',
    'Video campaign for summer collection',
    'roas',
    '{"age": "25-35", "gender": "female", "interests": ["fashion", "sustainability"]}',
    ARRAY['Eco-friendly materials', '30-day returns', 'Free shipping'],
    auth.uid()
) RETURNING id;
```

#### 获取项目详情及统计
```sql
-- 使用物化视图获取项目统计
SELECT * FROM project_dashboard_stats
WHERE organization_id = 'org-uuid'
ORDER BY last_activity DESC;

-- 获取项目的所有变体
SELECT 
    v.*,
    COUNT(DISTINCT ve.id) as element_count
FROM video_variants v
LEFT JOIN variant_elements ve ON v.id = ve.variant_id
WHERE v.project_id = 'project-uuid'
GROUP BY v.id
ORDER BY v.created_at DESC;
```

### 内容池管理

#### 创建内容池和项目
```sql
-- 创建 Hook 内容池
INSERT INTO content_pools (project_id, pool_type, name)
VALUES ('project-uuid', 'hook', 'Summer Campaign Hooks')
RETURNING id;

-- 添加内容到池中
INSERT INTO content_pool_items (pool_id, content, metadata)
VALUES 
    ('pool-uuid', 'Stop scrolling if you love sustainable fashion', '{"emotion": "curiosity"}'),
    ('pool-uuid', 'POV: You found the perfect summer dress', '{"emotion": "excitement"}'),
    ('pool-uuid', 'This changed how I shop forever', '{"emotion": "transformation"}');
```

#### 获取性能最好的内容
```sql
SELECT 
    cpi.*,
    cp.pool_type,
    COUNT(ve.id) as usage_count
FROM content_pool_items cpi
JOIN content_pools cp ON cpi.pool_id = cp.id
LEFT JOIN variant_elements ve ON cpi.id = ve.pool_item_id
WHERE cp.project_id = 'project-uuid'
GROUP BY cpi.id, cp.pool_type
ORDER BY cpi.performance_score DESC NULLS LAST, usage_count DESC
LIMIT 10;
```

### 视频变体管理

#### 创建视频变体
```sql
-- 生成变体代码
SELECT generate_variant_code('project-uuid') as variant_code;

-- 创建变体
INSERT INTO video_variants (
    project_id,
    variant_code,
    name,
    status,
    utm_config
) VALUES (
    'project-uuid',
    'SUM-001',
    'Summer Sale - Hook A + CTA B',
    'draft',
    '{"source": "tiktok", "medium": "video", "campaign": "summer-sale-2024", "content": "SUM-001"}'
) RETURNING id;

-- 关联内容元素
INSERT INTO variant_elements (variant_id, element_type, pool_item_id, position)
VALUES 
    ('variant-uuid', 'hook', 'hook-item-uuid', 1),
    ('variant-uuid', 'cta', 'cta-item-uuid', 2);
```

#### 更新变体指标
```sql
-- 更新实时指标
UPDATE video_variants
SET metrics = jsonb_build_object(
    'views', 10000,
    'clicks', 500,
    'conversions', 25,
    'revenue', 2500.00
)
WHERE id = 'variant-uuid';

-- 插入时序指标数据
INSERT INTO variant_metrics (
    variant_id,
    timestamp,
    platform,
    impressions,
    views,
    clicks,
    conversions,
    revenue,
    ctr,
    cvr,
    roas
) VALUES (
    'variant-uuid',
    NOW(),
    'tiktok',
    15000,
    10000,
    500,
    25,
    2500.00,
    5.0,  -- CTR: 500/10000 * 100
    5.0,  -- CVR: 25/500 * 100
    10.0  -- ROAS: 2500/250 (假设花费250)
);
```

### 实验管理

#### 创建 A/B 测试
```sql
-- 创建实验
INSERT INTO experiments (
    project_id,
    name,
    hypothesis,
    experiment_type,
    status,
    traffic_allocation,
    success_metrics,
    created_by
) VALUES (
    'project-uuid',
    'Hook Test: Curiosity vs Urgency',
    'Urgency-based hooks will increase CTR by 20%',
    'ab_test',
    'draft',
    '{"control": 50, "variant": 50}',
    '{"primary": "ctr", "secondary": ["cvr", "roas"]}',
    auth.uid()
) RETURNING id;

-- 添加变体到实验
INSERT INTO experiment_variants (experiment_id, variant_id, traffic_percentage, is_control)
VALUES 
    ('experiment-uuid', 'variant-1-uuid', 50, true),
    ('experiment-uuid', 'variant-2-uuid', 50, false);
```

#### 分析实验结果
```sql
-- 获取实验性能对比
SELECT 
    ev.is_control,
    v.variant_code,
    v.name,
    AVG((v.metrics->>'ctr')::decimal) as avg_ctr,
    AVG((v.metrics->>'cvr')::decimal) as avg_cvr,
    SUM((v.metrics->>'revenue')::decimal) as total_revenue,
    COUNT(*) as variant_count
FROM experiment_variants ev
JOIN video_variants v ON ev.variant_id = v.id
WHERE ev.experiment_id = 'experiment-uuid'
GROUP BY ev.is_control, v.variant_code, v.name
ORDER BY ev.is_control DESC;
```

### 资产管理

#### 上传资产
```sql
-- 记录上传的资产
INSERT INTO assets (
    organization_id,
    project_id,
    asset_type,
    file_name,
    file_url,
    file_size_bytes,
    mime_type,
    tags,
    category,
    usage_rights,
    uploaded_by
) VALUES (
    'org-uuid',
    'project-uuid',
    'video',
    'summer-collection-raw.mp4',
    'https://storage.supabase.co/...',
    104857600,
    'video/mp4',
    ARRAY['summer', 'fashion', 'raw'],
    'source-footage',
    'owned',
    auth.uid()
);
```

#### 搜索资产
```sql
-- 按标签搜索
SELECT * FROM assets
WHERE organization_id = 'org-uuid'
  AND tags && ARRAY['summer', 'fashion']
  AND asset_type = 'video'
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- 按文件名搜索
SELECT * FROM assets
WHERE organization_id = 'org-uuid'
  AND file_name ILIKE '%summer%'
  AND deleted_at IS NULL;
```

### 性能分析

#### 获取最佳表现的变体
```sql
-- 使用物化视图
SELECT * FROM top_performing_variants
WHERE organization_id = 'org-uuid'
ORDER BY ctr DESC
LIMIT 10;

-- 实时查询
SELECT 
    v.*,
    calculate_performance_score(
        (v.metrics->>'views')::int,
        (v.metrics->>'clicks')::int,
        (v.metrics->>'conversions')::int
    ) as performance_score
FROM video_variants v
WHERE v.project_id = 'project-uuid'
  AND v.status = 'published'
ORDER BY performance_score DESC
LIMIT 10;
```

#### 获取趋势数据
```sql
-- 获取最近7天的性能趋势
SELECT 
    DATE(timestamp) as date,
    SUM(impressions) as total_impressions,
    SUM(views) as total_views,
    SUM(clicks) as total_clicks,
    SUM(conversions) as total_conversions,
    SUM(revenue) as total_revenue,
    AVG(ctr) as avg_ctr,
    AVG(cvr) as avg_cvr
FROM variant_metrics
WHERE variant_id IN (
    SELECT id FROM video_variants WHERE project_id = 'project-uuid'
)
  AND timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

### 审计日志

#### 记录操作
```sql
-- 记录重要操作
INSERT INTO audit_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    changes,
    ip_address
) VALUES (
    'org-uuid',
    auth.uid(),
    'update',
    'video_variant',
    'variant-uuid',
    '{"status": {"old": "draft", "new": "published"}}',
    '192.168.1.1'::inet
);
```

#### 查询审计历史
```sql
-- 获取最近的操作记录
SELECT 
    al.*,
    u.email as user_email
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
WHERE al.organization_id = 'org-uuid'
  AND al.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY al.created_at DESC
LIMIT 100;
```

## TypeScript 类型定义

创建 `types/database.ts`:

```typescript
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          settings: Record<string, any>
          subscription_tier: 'free' | 'pro' | 'enterprise'
          subscription_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Organizations['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Organizations['Insert']>
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
          optimization_goal: 'ctr' | 'cvr' | 'roas' | null
          target_audience: Record<string, any>
          unique_selling_points: string[]
          legal_authorization: boolean
          legal_authorization_details: Record<string, any> | null
          stats: {
            variants_count: number
            total_views: number
            total_clicks: number
          }
          created_by: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: Omit<Projects['Row'], 'id' | 'created_at' | 'updated_at' | 'stats'>
        Update: Partial<Projects['Insert']>
      }
      video_variants: {
        Row: {
          id: string
          project_id: string
          variant_code: string
          name: string | null
          status: 'draft' | 'processing' | 'ready' | 'published' | 'archived'
          video_url: string | null
          thumbnail_url: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          utm_config: Record<string, any>
          metrics: {
            views: number
            clicks: number
            conversions: number
            revenue: number
          }
          ai_analysis: Record<string, any> | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<VideoVariants['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<VideoVariants['Insert']>
      }
    }
    Views: {
      project_dashboard_stats: {
        Row: {
          project_id: string
          organization_id: string
          project_name: string
          project_status: string
          total_variants: number
          published_variants: number
          total_views: number
          total_clicks: number
          total_conversions: number
          total_revenue: number
          avg_ctr: number
          avg_cvr: number
          last_activity: string | null
        }
      }
      top_performing_variants: {
        Row: {
          variant_id: string
          project_id: string
          variant_code: string
          variant_name: string | null
          organization_id: string
          views: number
          clicks: number
          conversions: number
          ctr: number
          cvr: number
          revenue: number
        }
      }
    }
    Functions: {
      generate_variant_code: {
        Args: { project_id: string }
        Returns: string
      }
      calculate_performance_score: {
        Args: {
          views: number
          clicks: number
          conversions: number
        }
        Returns: number
      }
    }
  }
}
```

## Supabase 客户端配置

创建 `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper functions
export async function getOrganizationProjects(organizationId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      video_variants (
        id,
        variant_code,
        status,
        metrics
      )
    `)
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getProjectStats(projectId: string) {
  const { data, error } = await supabase
    .from('project_dashboard_stats')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (error) throw error
  return data
}

export async function createVideoVariant(
  projectId: string,
  data: Partial<Database['public']['Tables']['video_variants']['Insert']>
) {
  // Generate variant code
  const { data: variantCode } = await supabase
    .rpc('generate_variant_code', { project_id: projectId })

  const { data: variant, error } = await supabase
    .from('video_variants')
    .insert({
      project_id: projectId,
      variant_code: variantCode,
      ...data
    })
    .select()
    .single()

  if (error) throw error
  return variant
}
```

## 维护和监控

### 刷新物化视图

创建定期任务（使用 Supabase Edge Functions 或 cron）：

```sql
-- 每小时刷新
REFRESH MATERIALIZED VIEW CONCURRENTLY project_dashboard_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY top_performing_variants;
```

### 监控查询性能

```sql
-- 查找慢查询
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;

-- 检查表大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 检查索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### 数据清理

```sql
-- 清理旧的审计日志（保留1年）
DELETE FROM audit_logs
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- 归档旧的指标数据
INSERT INTO variant_metrics_archive
SELECT * FROM variant_metrics
WHERE timestamp < CURRENT_DATE - INTERVAL '6 months';

DELETE FROM variant_metrics
WHERE timestamp < CURRENT_DATE - INTERVAL '6 months';
```

## 最佳实践

1. **使用事务**：确保数据一致性
```typescript
const { data, error } = await supabase.rpc('create_project_with_pools', {
  project_data: {...},
  pools_data: [...]
})
```

2. **批量操作**：减少数据库往返
```typescript
const { data, error } = await supabase
  .from('content_pool_items')
  .insert([...items])
```

3. **使用 RLS**：确保数据安全
```typescript
// RLS 会自动过滤用户无权访问的数据
const { data } = await supabase
  .from('projects')
  .select('*')
// 只返回用户所在组织的项目
```

4. **缓存策略**：使用 React Query 或 SWR
```typescript
import { useQuery } from '@tanstack/react-query'

function useProjects(orgId: string) {
  return useQuery({
    queryKey: ['projects', orgId],
    queryFn: () => getOrganizationProjects(orgId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

5. **错误处理**：优雅地处理数据库错误
```typescript
try {
  const data = await createVideoVariant(projectId, variantData)
  return { success: true, data }
} catch (error) {
  console.error('Failed to create variant:', error)
  return { success: false, error: error.message }
}
```