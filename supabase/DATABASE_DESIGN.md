# ROI Video Tool 数据库设计文档

## 设计理念

### 核心原则
1. **模块化设计**：将系统分为独立的功能模块，便于维护和扩展
2. **性能优先**：合理使用索引、分区和物化视图优化查询性能
3. **数据完整性**：通过外键约束和触发器保证数据一致性
4. **安全性**：使用 RLS (Row Level Security) 实现细粒度权限控制
5. **审计追踪**：关键表包含 created_at、updated_at、deleted_at 字段

## 数据库架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户与团队模块                          │
├─────────────────────────────────────────────────────────────┤
│  organizations ──┬── organization_members ── users(auth)     │
│                  └── team_roles                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         项目管理模块                           │
├─────────────────────────────────────────────────────────────┤
│  projects ──┬── project_platforms                            │
│             ├── project_utm_configs                          │
│             └── project_members                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       内容变体生成模块                         │
├─────────────────────────────────────────────────────────────┤
│  content_pools ──── content_pool_items                       │
│       │                                                      │
│       └──── video_variants ──── variant_elements             │
│                    │                                         │
│                    └──── variant_utm_links                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      性能分析与实验模块                        │
├─────────────────────────────────────────────────────────────┤
│  experiments ──── experiment_variants                        │
│       │                                                      │
│       └──── variant_metrics (时序数据)                        │
│             └── daily_metrics_summary (物化视图)              │
└─────────────────────────────────────────────────────────────┘
```

## 详细表结构

### 1. 用户与团队模块

#### organizations (组织表)
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL友好的唯一标识
    logo_url TEXT,
    settings JSONB DEFAULT '{}', -- 组织级设置
    subscription_tier VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
**设计理由**：
- 支持多租户架构，一个组织可以有多个项目
- slug 用于生成友好的 URL
- settings 使用 JSONB 存储灵活的配置项
- 包含订阅信息用于 SaaS 计费

#### organization_members (组织成员表)
```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- owner, admin, editor, viewer
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
```
**设计理由**：
- 连接用户和组织的多对多关系
- 角色基于 RBAC 模型
- 记录邀请关系用于审计

### 2. 项目管理模块

#### projects (项目表)
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed, archived
    optimization_goal VARCHAR(50), -- ctr, cvr, roas
    
    -- 目标受众
    target_audience JSONB DEFAULT '{}',
    unique_selling_points TEXT[],
    
    -- 法律授权
    legal_authorization BOOLEAN DEFAULT FALSE,
    legal_authorization_details JSONB,
    
    -- 统计数据（定期更新的缓存）
    stats JSONB DEFAULT '{"variants_count": 0, "total_views": 0, "total_clicks": 0}',
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_projects_org_status (organization_id, status)
);
```
**设计理由**：
- 项目是核心业务实体，包含所有营销活动的元数据
- 使用 JSONB 存储灵活的目标受众数据
- stats 字段缓存常用统计，避免频繁聚合计算
- 支持软删除（archived_at）

#### project_platforms (项目平台配置表)
```sql
CREATE TABLE project_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- tiktok, instagram, facebook, youtube
    is_active BOOLEAN DEFAULT TRUE,
    platform_config JSONB DEFAULT '{}', -- 平台特定配置
    
    -- 平台特定的规格限制
    video_specs JSONB DEFAULT '{
        "aspect_ratio": "9:16",
        "max_size_mb": 500,
        "max_duration_seconds": 60,
        "format": ["mp4", "mov"]
    }',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, platform)
);
```
**设计理由**：
- 一个项目可以发布到多个平台
- 每个平台有不同的视频规格要求
- 使用 JSONB 存储平台特定配置，便于扩展

### 3. 内容池与变体模块

#### content_pools (内容池表)
```sql
CREATE TABLE content_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    pool_type VARCHAR(50) NOT NULL, -- hook, cta, music, voiceover, subtitle_style
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_content_pools_project_type (project_id, pool_type)
);
```
**设计理由**：
- 内容池是变体生成的基础
- 支持多种内容类型的池
- 便于批量管理和复用内容

#### content_pool_items (内容池项目表)
```sql
CREATE TABLE content_pool_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID REFERENCES content_pools(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- 额外的元数据
    usage_count INTEGER DEFAULT 0, -- 使用次数统计
    performance_score DECIMAL(5,2), -- 0-100 的性能评分
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_pool_items_performance (pool_id, performance_score DESC)
);
```
**设计理由**：
- 存储实际的内容项
- 跟踪使用频率和性能
- 支持基于性能的智能推荐

#### video_variants (视频变体表)
```sql
CREATE TABLE video_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    variant_code VARCHAR(50) UNIQUE NOT NULL, -- 如 VAR-001
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft', -- draft, processing, ready, published, archived
    
    -- 视频文件信息
    video_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    
    -- 使用的内容元素（通过 variant_elements 表关联）
    
    -- UTM 配置
    utm_config JSONB DEFAULT '{}',
    
    -- 性能数据（实时更新）
    metrics JSONB DEFAULT '{
        "views": 0,
        "clicks": 0,
        "conversions": 0,
        "revenue": 0
    }',
    
    -- AI 生成的元数据
    ai_analysis JSONB, -- 情感分析、场景识别等
    
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_variants_project_status (project_id, status),
    INDEX idx_variants_performance (project_id, (metrics->>'clicks')::int DESC)
);
```
**设计理由**：
- 每个变体是一个独立的视频版本
- 包含完整的性能追踪
- 支持 AI 分析结果存储
- 使用 JSONB 存储灵活的 UTM 配置

#### variant_elements (变体元素关联表)
```sql
CREATE TABLE variant_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES video_variants(id) ON DELETE CASCADE,
    element_type VARCHAR(50) NOT NULL, -- hook, cta, music, etc
    pool_item_id UUID REFERENCES content_pool_items(id),
    custom_content TEXT, -- 如果不使用池中的内容
    position INTEGER, -- 元素在变体中的位置/顺序
    
    UNIQUE(variant_id, element_type, position)
);
```
**设计理由**：
- 记录每个变体使用了哪些内容元素
- 支持自定义内容（不从池中选择）
- 保持元素顺序信息

### 4. 资产管理模块

#### assets (资产表)
```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    asset_type VARCHAR(50) NOT NULL, -- video, image, audio, font
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    
    -- 媒体元数据
    metadata JSONB DEFAULT '{}', -- 分辨率、时长、编码等
    
    -- 标签和分类
    tags TEXT[],
    category VARCHAR(100),
    
    -- 使用权限
    usage_rights VARCHAR(50), -- owned, licensed, ugc
    usage_rights_details JSONB,
    
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_assets_org_type (organization_id, asset_type),
    INDEX idx_assets_tags (tags) USING GIN
);
```
**设计理由**：
- 集中管理所有媒体资产
- 支持标签系统便于搜索
- 记录使用权限避免法律风险
- 支持软删除保留历史

### 5. 实验与分析模块

#### experiments (实验表)
```sql
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    hypothesis TEXT,
    experiment_type VARCHAR(50), -- ab_test, multivariate
    status VARCHAR(50) DEFAULT 'draft', -- draft, running, paused, completed
    
    -- 实验配置
    traffic_allocation JSONB DEFAULT '{}', -- 流量分配比例
    success_metrics JSONB DEFAULT '{}', -- 成功指标定义
    
    -- 实验时间
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- 结果
    results JSONB,
    winner_variant_id UUID REFERENCES video_variants(id),
    confidence_level DECIMAL(5,2), -- 统计置信度
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_experiments_project_status (project_id, status)
);
```
**设计理由**：
- 支持 A/B 测试和多变量测试
- 记录完整的实验生命周期
- 存储统计分析结果

#### variant_metrics (变体指标时序表)
```sql
CREATE TABLE variant_metrics (
    variant_id UUID REFERENCES video_variants(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    
    -- 展示指标
    impressions INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    view_duration_avg DECIMAL(10,2), -- 平均观看时长（秒）
    completion_rate DECIMAL(5,2), -- 完播率
    
    -- 互动指标
    clicks INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    
    -- 转化指标
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    
    -- 计算指标
    ctr DECIMAL(8,4), -- 点击率
    cvr DECIMAL(8,4), -- 转化率
    cpc DECIMAL(10,2), -- 每次点击成本
    roas DECIMAL(10,2), -- 广告支出回报率
    
    PRIMARY KEY (variant_id, timestamp, platform)
) PARTITION BY RANGE (timestamp);

-- 创建月度分区
CREATE TABLE variant_metrics_2024_01 PARTITION OF variant_metrics
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- ... 继续创建其他月份分区
```
**设计理由**：
- 时序数据表，适合存储历史指标
- 使用分区提高查询性能
- 支持多平台数据分离
- 包含所有关键业务指标

### 6. 辅助功能模块

#### templates (模板表)
```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    thumbnail_url TEXT,
    
    -- 模板配置
    template_config JSONB NOT NULL, -- 完整的模板定义
    
    -- 使用统计
    usage_count INTEGER DEFAULT 0,
    avg_performance_score DECIMAL(5,2),
    
    is_public BOOLEAN DEFAULT FALSE, -- 是否公开给其他组织
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_templates_org_category (organization_id, category)
);
```
**设计理由**：
- 支持模板复用提高效率
- 可以分享模板形成社区
- 跟踪模板使用效果

#### audit_logs (审计日志表)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL, -- create, update, delete, export, etc
    entity_type VARCHAR(50) NOT NULL, -- project, variant, asset, etc
    entity_id UUID,
    
    -- 变更详情
    changes JSONB, -- 记录具体的变更内容
    
    -- 上下文信息
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 创建月度分区
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```
**设计理由**：
- 合规性要求，记录所有重要操作
- 使用分区管理大量日志数据
- 支持安全审计和问题排查

## 索引策略

### 主要查询模式的索引
```sql
-- 项目列表查询
CREATE INDEX idx_projects_org_updated ON projects(organization_id, updated_at DESC);

-- 变体性能排序
CREATE INDEX idx_variants_metrics_ctr ON video_variants(project_id, (metrics->>'ctr')::decimal DESC);

-- 内容池项目推荐
CREATE INDEX idx_pool_items_score ON content_pool_items(pool_id, performance_score DESC) 
    WHERE is_active = TRUE;

-- 资产搜索
CREATE INDEX idx_assets_search ON assets 
    USING GIN(to_tsvector('english', file_name || ' ' || COALESCE(category, '')));

-- 实验状态查询
CREATE INDEX idx_experiments_active ON experiments(project_id) 
    WHERE status = 'running';
```

## 物化视图

### 项目仪表板统计
```sql
CREATE MATERIALIZED VIEW project_dashboard_stats AS
SELECT 
    p.id as project_id,
    p.organization_id,
    COUNT(DISTINCT v.id) as total_variants,
    COUNT(DISTINCT CASE WHEN v.status = 'published' THEN v.id END) as published_variants,
    SUM((v.metrics->>'views')::int) as total_views,
    SUM((v.metrics->>'clicks')::int) as total_clicks,
    SUM((v.metrics->>'conversions')::int) as total_conversions,
    SUM((v.metrics->>'revenue')::decimal) as total_revenue,
    AVG((v.metrics->>'ctr')::decimal) as avg_ctr,
    AVG((v.metrics->>'cvr')::decimal) as avg_cvr,
    MAX(v.updated_at) as last_activity
FROM projects p
LEFT JOIN video_variants v ON p.id = v.project_id
GROUP BY p.id, p.organization_id;

-- 每小时刷新
CREATE INDEX idx_dashboard_stats_org ON project_dashboard_stats(organization_id);
```

## RLS (Row Level Security) 策略

### 组织级别隔离
```sql
-- 启用 RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_variants ENABLE ROW LEVEL SECURITY;

-- 组织成员可以查看组织数据
CREATE POLICY "组织成员查看" ON organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- 项目访问控制
CREATE POLICY "项目访问" ON projects
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- 基于角色的写权限
CREATE POLICY "编辑者写权限" ON video_variants
    FOR INSERT, UPDATE
    USING (
        project_id IN (
            SELECT p.id 
            FROM projects p
            JOIN organization_members om ON p.organization_id = om.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('owner', 'admin', 'editor')
        )
    );
```

## 触发器

### 自动更新时间戳
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用到所有主要表
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### 统计缓存更新
```sql
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects
    SET stats = jsonb_build_object(
        'variants_count', (SELECT COUNT(*) FROM video_variants WHERE project_id = NEW.project_id),
        'total_views', (SELECT SUM((metrics->>'views')::int) FROM video_variants WHERE project_id = NEW.project_id),
        'total_clicks', (SELECT SUM((metrics->>'clicks')::int) FROM video_variants WHERE project_id = NEW.project_id)
    )
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_variant_change
    AFTER INSERT OR UPDATE OR DELETE ON video_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_project_stats();
```

## 性能优化建议

1. **分区策略**
   - variant_metrics 按月分区
   - audit_logs 按月分区
   - 定期清理旧分区

2. **缓存策略**
   - 使用 Redis 缓存热点数据
   - 项目统计使用物化视图
   - 定期刷新物化视图

3. **查询优化**
   - 使用 EXPLAIN ANALYZE 优化慢查询
   - 避免 N+1 查询问题
   - 使用批量操作减少数据库往返

4. **数据归档**
   - 超过 6 个月的指标数据归档到冷存储
   - 使用 TimescaleDB 扩展处理时序数据

## 备份与恢复策略

1. **备份计划**
   - 每日全量备份
   - 每小时增量备份
   - 跨区域备份存储

2. **恢复测试**
   - 每月进行恢复演练
   - 记录 RTO 和 RPO 指标

3. **数据保留策略**
   - 业务数据永久保留
   - 日志数据保留 1 年
   - 指标数据保留 2 年

## 扩展性考虑

1. **水平扩展**
   - 使用 Supabase 的读副本
   - 分库分表准备（按组织 ID）

2. **垂直扩展**
   - 监控数据库性能指标
   - 根据负载调整实例规格

3. **未来功能预留**
   - JSONB 字段支持灵活扩展
   - 预留 metadata 字段
   - 使用 UUID 便于分布式系统