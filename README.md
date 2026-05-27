# 蓝屿后端部署指南

## 文件说明

- `api/chat.js` - 聊天接口，对接小米 MiMo
- `vercel.json` - Vercel 部署配置
- `package.json` - 项目信息

## 部署步骤

### 1. 准备工作

- 注册 GitHub 账号：https://github.com
- 注册 Vercel 账号：https://vercel.com（用 GitHub 登录）
- 安装 Node.js：https://nodejs.org（下载 LTS 版本）

### 2. 创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 仓库名填 `lanyu-backend`
4. 选择 "Public"（公开）
5. 点击 "Create repository"

### 3. 上传代码

#### 方式 A：网页上传（简单）

1. 在 GitHub 仓库页面，点击 "uploading an existing file"
2. 把这三个文件拖进去：
   - `api/chat.js`
   - `vercel.json`
   - `package.json`
3. 点击 "Commit changes"

#### 方式 B：命令行（如果你会用）

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/你的用户名/lanyu-backend.git
git push -u origin main
```

### 4. 部署到 Vercel

1. 登录 Vercel（用 GitHub 账号）
2. 点击 "Add New Project"
3. 选择你刚创建的 `lanyu-backend` 仓库
4. 点击 "Import"
5. 在 Environment Variables 区域添加：
   - Name: `MOONSHOT_API_KEY`
   - Value: 你的月之暗面 API Key
6. 点击 "Deploy"

等待 1-2 分钟，部署完成后会显示一个网址，比如：
`https://lanyu-backend-xxx.vercel.app`

### 5. 测试接口

打开浏览器，访问：
```
https://你的域名/api/chat
```

如果看到 `{"error":"只支持 POST 请求"}`，说明部署成功！

### 6. 配置前端

把部署后的域名发给前端开发者，填入前端代码的 `API_BASE_URL` 中。

## 费用说明

- Vercel：免费额度每月 100GB 流量，个人使用足够
- 月之暗面：按 token 计费，约 0.006元/千token，一次对话约 0.01-0.05元

## 常见问题

**Q: 部署失败怎么办？**
A: 检查 Vercel 的 Build Logs，看错误信息。通常是文件路径问题。

**Q: 如何更新代码？**
A: 修改 GitHub 仓库的文件，Vercel 会自动重新部署。

**Q: 如何查看用量？**
A: 月之暗面后台可以看到 API 调用次数和费用。
