# AI API Gateway 前端重新设计规范

## 为什么

当前前端设计虽然功能完整，但视觉上缺乏独特性和精致感。用户需要一个既专业又令人印象深刻的管理界面，以匹配高端AI服务的定位。

## 设计愿景

创造一个极致简约、高端精致的用户界面，受Apple官方产品界面启发。设计语言强调：
- **克制与精准**：每个元素都有其存在的理由
- **空间呼吸感**：大量留白，内容层次分明
- **微妙动效**：优雅的过渡动画，提升交互体验
- **细节打磨**：像素级别的精致感

## 设计方向

### 美学风格：极致Apple简约
- 灵感来源：Apple官方产品页面、Apple Human Interface Guidelines
- 核心理念："形式追随功能"，去除一切不必要的装饰
- 视觉特征：纯净、精致、专业

### 配色方案：经典Apple白
```css
--apple-white: #ffffff;           /* 主背景 */
--apple-gray-bg: #f5f5f7;        /* 页面背景 */
--apple-gray-light: #fbfbfd;      /* 卡片背景 */
--apple-blue: #0071e3;           /* 主强调色 */
--apple-blue-hover: #0077ed;     /* 悬停状态 */
--apple-blue-subtle: #e8f4fd;    /* 浅蓝背景 */
--apple-text: #1d1d1f;           /* 主文字 */
--apple-text-secondary: #6e6e73;  /* 次要文字 */
--apple-text-tertiary: #86868b;  /* 辅助文字 */
--apple-border: #d2d2d7;         /* 边框 */
--apple-border-light: #e5e5ea;    /* 浅边框 */
--apple-success: #34c759;        /* 成功状态 */
--apple-warning: #ff9500;         /* 警告状态 */
--apple-error: #ff3b30;           /* 错误状态 */
```

### 字体系统
- **主字体**：SF Pro Display / -apple-system / BlinkMacSystemFont
- **中文字体回退**：PingFang SC / Hiragino Sans GB
- **等宽字体**：SF Mono / Menlo（用于代码和密钥显示）

### 圆角规范
- **小元素**（按钮、输入框）：8px
- **中等元素**（卡片、弹窗）：12px
- **大元素**（模态框、面板）：16px

### 阴影规范
- **微妙阴影**：0 1px 3px rgba(0,0,0,0.04)
- **卡片阴影**：0 2px 8px rgba(0,0,0,0.06)
- **悬停阴影**：0 4px 16px rgba(0,0,0,0.08)
- **模态阴影**：0 8px 32px rgba(0,0,0,0.12)

## 改动详情

### 1. 登录/注册页面 (Login.tsx)

**布局改进**：
- 居中卡片设计，卡片宽度限制为400px
- 卡片背景：纯白，微妙阴影
- 页面背景：渐变灰色 (#f5f5f7 → #e8e8ed)

**Logo区域**：
- 简洁的AI图标，圆角矩形背景
- 无渐变，使用纯色Apple蓝

**表单设计**：
- 输入框：纯白背景，细边框，圆角8px
- 聚焦状态：边框变为Apple蓝，微妙的蓝色光晕
- 标签：上方对齐，12px，浅灰色
- 错误提示：红色边框，浅红背景

**按钮设计**：
- 主按钮：Apple蓝，纯白文字，圆角8px
- 悬停：颜色加深，微妙的向上移动（translateY -1px）
- 按下：轻微缩小（scale 0.98）
- 禁用：50%透明度

**动效设计**：
- 页面加载：卡片淡入 + 轻微上移（300ms ease-out）
- 表单聚焦：边框颜色过渡（200ms）
- 按钮悬停：轻微上浮 + 阴影增强

### 2. 仪表盘/首页 (Home.tsx)

**布局系统**：
- 页面使用apple-gray背景
- 内容区域使用卡片，白色背景
- 卡片间距：24px
- 内边距：24px

**统计卡片**：
- 纯白背景，微妙阴影
- 圆角12px
- 图标区域：浅色背景圆形 + 彩色图标
- 数字：24px，粗体，主色
- 标签：13px，次要文字色

**图表容器**：
- 纯白背景，与统计卡片风格一致
- 标题：16px，左对齐
- 图表区域：留有足够空间

**数据展示**：
- 数字突出显示
- 单位使用较小字号
- 对比数据使用颜色区分

### 3. 导航布局 (Layout.tsx)

**侧边栏设计**：
- 宽度：240px（展开）/ 64px（折叠）
- 背景：纯白
- 顶部Logo区：16px高度，含图标和文字
- 底部用户区：头像 + 邮箱 + 退出按钮

**导航项**：
- 默认状态：透明背景，灰色文字
- 悬停状态：极浅灰背景（#f5f5f7）
- 选中状态：Apple蓝背景，白色文字
- 图标 + 文字，文字14px
- 圆角：8px

**折叠功能**：
- 切换按钮在顶部
- 折叠时只显示图标
- 悬停显示Tooltip

**响应式**：
- 移动端：侧边栏隐藏，汉堡菜单触发
- 遮罩层：半透明黑色

### 4. 设置页面 (Settings.tsx)

**三栏布局**：
- 左侧：提供商列表（220px）
- 中间：编辑表单（flex-1）
- 右侧：模型预览（可选，280px）

**提供商列表项**：
- 白色背景卡片
- 名称 + 状态指示器
- 悬停效果
- 选中状态：浅蓝背景 + 蓝色左边框

**表单设计**：
- 分组布局，相关字段放一起
- 标签 + 输入框 + 提示文字
- 测试按钮：次要样式

### 5. API密钥页面 (ApiKeys.tsx)

**布局**：
- 顶部：标题 + 创建按钮
- 主体：密钥列表表格

**表格设计**：
- 白色背景
- 表头：浅灰背景，12px粗体文字
- 行：白色背景，悬停浅灰
- 边框：极浅灰色
- 圆角：顶部12px

**密钥显示**：
- 遮罩显示：sk-xxxx...xxxx
- 复制按钮：点击显示成功反馈
- 删除按钮：红色，悬停显示

### 6. 监控页面 (Monitor.tsx)

**实时数据展示**：
- 数字大而突出
- 状态使用颜色编码（绿/黄/红）
- 更新时有微妙的脉冲动画

**图表**：
- 折线图显示趋势
- 纯色线条，无渐变填充
- 网格线：极浅灰色

### 7. 审计日志页面 (AuditLogs.tsx)

**日志列表**：
- 时间线风格或表格风格
- 清晰的操作类型标识
- 用户/时间/操作详情

## 通用组件规范

### 按钮组件
```typescript
// 主按钮
<button className="px-4 py-2 bg-apple-blue text-white rounded-lg
                   hover:bg-apple-blue-hover active:scale-[0.98]
                   transition-all duration-200 shadow-sm">
  按钮文字
</button>

// 次要按钮
<button className="px-4 py-2 bg-white text-apple-text border border-apple-border
                   rounded-lg hover:bg-gray-50 active:scale-[0.98]
                   transition-all duration-200">
  按钮文字
</button>

// 危险按钮
<button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg
                   hover:bg-red-100 active:scale-[0.98]
                   transition-all duration-200">
  删除
</button>
```

### 输入框组件
```typescript
<input className="w-full px-4 py-2.5 bg-white border border-apple-border-light
                  rounded-lg text-apple-text placeholder:text-apple-text-tertiary
                  focus:outline-none focus:border-apple-blue focus:ring-1
                  focus:ring-apple-blue/20 transition-all duration-200" />
```

### 卡片组件
```typescript
<div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]
                hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow duration-300">
  内容
</div>
```

### 状态徽章
```typescript
// 成功
<span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
  启用
</span>

// 禁用
<span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
  禁用
</span>
```

## 动效规范

### 页面过渡
- 淡入：opacity 0 → 1（300ms ease-out）
- 上移：translateY 8px → 0（300ms ease-out）
- 组合：淡入 + 上移同时进行

### 悬停效果
- 按钮：translateY -1px，阴影增强（200ms）
- 卡片：阴影增强（200ms）
- 列表项：背景色微变（150ms）

### 点击反馈
- 按钮：scale 0.98（100ms）
- 列表项：背景色变深（100ms）

### 加载状态
- 旋转器：Apple蓝边框，上边框透明
- 尺寸：16px（小）/ 24px（中）/ 32px（大）
- 动画：旋转360度，1s linear infinite

## 响应式断点

- **桌面**：≥1024px，完整布局
- **平板**：768px - 1023px，简化的侧边栏
- **手机**：< 768px，底部导航或汉堡菜单

## 技术实现要点

1. **CSS变量**：所有颜色使用CSS变量，便于主题切换
2. **Tailwind配置**：扩展默认配置，添加Apple设计Token
3. **组件化**：提取可复用组件（Button、Input、Card）
4. **动画库**：使用CSS动画，必要时引入Framer Motion
5. **图标库**：Lucide React（已安装），保持一致的描边宽度
6. **字体**：系统字体栈，无需额外加载

## 影响范围

### 受影响文件
- `/workspace/frontend/src/index.css` - 全局样式
- `/workspace/frontend/tailwind.config.js` - Tailwind配置
- `/workspace/frontend/src/pages/Login.tsx` - 登录页
- `/workspace/frontend/src/pages/Home.tsx` - 仪表盘
- `/workspace/frontend/src/components/Layout.tsx` - 布局组件
- `/workspace/frontend/src/pages/Settings.tsx` - 设置页
- `/workspace/frontend/src/pages/ApiKeys.tsx` - API密钥页
- `/workspace/frontend/src/pages/Monitor.tsx` - 监控页
- `/workspace/frontend/src/pages/AuditLogs.tsx` - 审计日志页

### 保持不变
- 所有后端代码
- API服务层
- 状态管理（Zustand store）
- 路由配置
- 类型定义

## 验收标准

1. ✅ 所有页面保持功能完整
2. ✅ 设计符合Apple Human Interface Guidelines
3. ✅ 响应式布局在所有断点正常
4. ✅ 动效流畅，无性能问题
5. ✅ 颜色对比度符合WCAG 2.1 AA标准
6. ✅ 加载状态和错误处理保持一致
