# 快驴情报站 — 部署使用说明

## 方式A：直接在Claude对话中使用（无需部署）
打开和我（Claude）的对话，代码已经在右侧运行，直接用即可。

---

## 方式B：部署成独立网站（推荐，全组共用）

### 第一步：上传到 GitHub

1. 打开 https://github.com，注册/登录账号
2. 点右上角 "+" → "New repository"
3. 名字填：kuailv-intel，选 Public，点 "Create repository"
4. 点 "uploading an existing file"
5. 把这整个文件夹里所有文件拖进去上传
6. 点 "Commit changes"

### 第二步：一键部署到 Vercel

1. 打开 https://vercel.com，用 GitHub 账号登录
2. 点 "Add New Project"
3. 找到 kuailv-intel，点 "Import"
4. 什么都不用改，直接点 "Deploy"
5. 等待约2分钟，会得到一个网址，如：https://kuailv-intel.vercel.app
6. 把这个网址发给全组同事，直接打开就能用！

---

## 日常使用流程（5步搞定周报）

1. 打开网站
2. 点「AI扫描餐饮」→ 等30秒 → 点「AI扫描流通」
3. 手动补充自己刷到的好文章
4. 切换「周报预览」→ 点「生成完整周报」
5. 复制全文粘贴到大象文档，复制群消息发群

---

## 常见问题

Q: 搜索没反应？
A: 刷新页面重试，或检查网络

Q: 生成的内容不准？
A: 可以手动删除不准的条目，或手动添加正确信息，再重新生成周报

Q: 能多人同时用吗？
A: 可以，但每人的数据相互独立（刷新后清空）
   如需多人共享数据，需要后端支持，可以后续迭代
