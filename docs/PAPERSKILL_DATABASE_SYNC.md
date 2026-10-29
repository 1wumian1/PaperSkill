# PR 合并后的 PaperSkill 数据库同步

PR 合并进 `main` 后，新增的 `Sync PaperSkill database` 工作流读取各版本的 `paper.json`，以 `multipart/form-data` 调用对方的 `create_version`。同步不执行教程代码，不需要安装教程依赖，也不涉及另一个仓库的 AI 评分。

## 维护者首次启用

1. 将本次脚本、工作流和配置文件通过 PR 合并到 `main`。
2. 在仓库 **Actions → Sync PaperSkill database → Run workflow** 选择 `main`，保持 `apply=false`。默认预览全部历史版本；`only` 可填写 `attention_is_all_you_need/wangjiahao1025`，预览该版本及其祖先。预览不会请求接口或写入同步状态。
3. 下载本次运行的 `paperskill-sync-report` artifact，检查其中的 `blocked`。缺 GitHub 用户名或无 arXiv/DOI 的项目不会伪造数据，会列出原因。可以先同步其他正常版本，再逐步补齐。
4. **先登记已经存在的数据库记录**：在 `catalog/paperskill-overrides.json` 中填写已知版本的真实 `remote_id`。对方截图里数据库已经有部分版本，本接口没有提供查重/查询能力；不登记时无法辨认这些历史记录，可能再次创建。`remote_id` 必须来自对应环境的真实入库结果，并且表示该记录已与当前元数据一致。
5. 在仓库 **Settings → Secrets and variables → Actions → Variables** 新建：

   | 名称 | 值 |
   | --- | --- |
   | `PAPERSKILL_SYNC_ENABLED` | `true`：开启主分支更新后的自动同步 |
   | `PAPERSKILL_API_BASE_URL` | `https://php-testbed-lyx.reduct.cn`，当前测试服务器；以后换域名在此调整 |

6. 在 Actions 手动运行一次，勾选 `apply=true`。第一次可填写一个尚未入库的 `only` 版本做联调；留空则补录全部符合条件的历史版本。真正发送失败时在报告中查看结果。
7. 此后每次 PR 合并更新 `main`，自动化会重新扫描：已同步且数据相同的跳过；新版本创建并保存返回的 `data.id`；此前因缺字段未能提交的版本，在补齐后自动处理。直接推送到 `main` 也会触发。

无需在 Apifox 手工填写全部版本，也无需配置其测试环境。脚本使用完整 URL。工作流独立于 Pages 发布，不会被 Pages 工作流的取消机制中断；这里的入库成功不代表网页文件已上传到对方服务器。

## 字段转换

| 接口字段 | 来源 |
| --- | --- |
| `version_name` | 版本目录名 / `version` |
| `version_date` | `versionDate`，必须为完整有效日期 |
| `user_display_name` | `participants[0].name` |
| `user_github_name` | `participants[0].github`，去掉开头的 `@` |
| `page_path` | `papers/<paperName>/<version>/`，相对路径 |
| `arxiv_id` / `doi` | 从 `paperUrl` 解析；仅发送其中一种 |
| `ancestors` | 将 `github/version` 转换为 `user_github_name/version_name`，`JSON.stringify` 后作为单个表单值 |
| `tags` | `topics` 用英文逗号连接 |
| `uuid` | 默认不发送；只有明确的覆盖配置或确认后的可选映射才发送 |

当前接口每版只有一组作者字段；多作者版本将报告问题，不能静默丢掉其他作者。来源是会议网站、GitHub、公众号等链接时，不猜测 arXiv/DOI。

覆盖文件示例（以下值仅示范格式，请用真实数据替换）：

```json
{
  "example_paper/alice1027": {
    "arxiv_id": "1706.03762",
    "user_github_name": "alice"
  },
  "another_paper/bob1027": {
    "doi": "10.1000/example",
    "remote_id": 123
  }
}
```

可覆盖字段是 `arxiv_id`、`doi`、`user_display_name`、`user_github_name`、`uuid`、`remote_id`。覆盖 arXiv/DOI 时只提供其中一种。未知字段会报错。原始 `paper.json` 不必增加不符合现有 schema 的字段。

`participants[].jianlunId` 是否等于接口的 `uuid` 尚未经确认，因此默认不发送。确认两者相同后，才将 Actions variable `PAPERSKILL_INCLUDE_JIANLUN_UUID` 设为 `true`；个别版本也可以显式覆盖 `uuid`。预览和报告不输出 UUID 值。

## 认证

Apifox 的截图显示父级认证组件已删除，不能据此判断服务器是否需要认证。默认请求不附带认证头，先以实际结果联调。如果对方提供所需请求头，将 JSON 对象存入 Actions **Secret** `PAPERSKILL_API_HEADERS`，例如：

```json
{"Authorization":"Bearer 实际令牌"}
```

不要把令牌放入代码、普通 variable、覆盖文件或报告。不要设置 `Content-Type`，Node 的 `FormData` 会生成带 boundary 的 multipart 请求头。

## 状态、失败与重复创建

自动化使用同一仓库的独立分支 `paperskill-sync-state` 保存 `paperskill-sync-state.json`，包含每个版本的数据库 ID、提交数据摘要及状态。该分支首次从默认分支创建，不更改 `main`。可通过 variable `PAPERSKILL_STATE_BRANCH` 更换独立状态分支名。工作流需要对此分支具有 `contents: write` 权限；若组织规则禁止创建/更新分支，需要管理员为该状态分支配置相应权限。

状态不依赖短期 cache 或 artifact。报告 artifact 只是供查看，数据库 ID 的持久保存依赖状态分支。首次运行时间与符合条件的历史版本数成正比；为控制 GitHub 写入速率，状态检查点至少间隔 1.5 秒。不要删除状态分支或状态文件，否则会失去已入库记录的凭据。

GitHub 状态存储遇到网络错误、HTTP 429 或 5xx 时，会有限重试并逐步延长等待。保存请求的结果不确定时，先读回状态：内容已经保存则直接继续；仍为旧 SHA 才重试保存；其他写入改变了 SHA 则停止，避免覆盖。此重试仅针对 GitHub 状态存储，不会重发数据库的创建 POST。权限错误不会按临时服务错误重试。

如果日志显示 `created` 后出现 GitHub 保存失败，数据库记录已经创建，不能删除状态后重新导入。下载该次运行的报告，找到对应版本的 `created` 项及 `id`，把这个真实 ID 填入覆盖文件的 `remote_id` 后再运行。即使流程中断，报告仍保留已处理记录及其 ID；新版日志也直接显示 ID，Summary 会显示已处理数量及中断提示。

每个 POST 前先保存 `pending`，得到 HTTP 成功、JSON `code=200` 和有效数字 `data.id` 后记为 `synced`。下一次检查点或本轮结束时保存成功结果。如果发生超时、非 JSON、业务失败或流程被中断，该版本保持 `pending/uncertain`，后续运行不会盲目重发。

- 已实际创建：向覆盖文件添加真实 `remote_id`，运行后登记该 ID。
- 已确认没有创建：从状态分支文件移除对应待核对的版本项，再运行。
- 缺必填数据：修正元数据或覆盖文件；未发送的版本下次可以正常处理。
- 祖先未同步：先解决祖先版本；脚本按祖先在前的顺序提交。
- 部分失败：成功记录仍会保存，工作流显示失败并上传问题报告；修复后再次运行或等待下一次合并。

首次远端请求失败后，本轮停止提交其他新版本（`deferred`），避免认证或服务器故障导致全部历史版本都进入待核对状态。已经成功的记录仍会保存。

对方的接口没有提供幂等键、已存在版本查询或通用更新接口，因此无法声称跨系统实现严格的“恰好一次”。状态检查点用于防止自动重复发送，结果不确定时仍需要核对。

**已入库版本的作者、论文标识、标签或溯源被修改时，脚本会报告需要更新接口，不会把 create 当成 update 再插入一条。** 按现有仓库流程，修改教程应创建新版本，新版本合并后会自动创建记录；仅修改同一路径下的教程源码且元数据不变时，无需改变数据库记录。删除/改名也不会自动删除旧数据库行。若要求同步这些行为，需对方补充 upsert/update/delete 的接口合同。

状态与完整接口地址绑定。测试数据库切换正式数据库时使用新的 `PAPERSKILL_STATE_BRANCH`，并重新登记正式库的已有记录；如果只是同一数据库换域名，维护者确认后可同步修改状态文件的 `endpoint`。不要将测试库 ID 当作正式库 ID。

## 本地使用

需要 Node.js 20+，无新增 npm 依赖。

```powershell
# 只检查数据，不进行网络请求
npm run sync:paperskill

# 预览单个版本及其祖先
npm run sync:paperskill -- --only attention_is_all_you_need/wangjiahao1025

# 实际上传；本地状态保存在 tmp/paperskill-sync/state.json
npm run sync:paperskill -- --apply --only attention_is_all_you_need/wangjiahao1025

# 验证转换、真实 multipart、本地模拟响应、去重和中断恢复
npm run test:paperskill-sync
```

本地状态与 Actions 状态彼此独立。不要用两份空状态向同一数据库重复上传；正式操作优先使用 Actions，或明确复用它的状态。报告默认在 `tmp/paperskill-sync/report.json`，工作目录已加入 `.gitignore`。

## 网页文件

本接口不接收 HTML/JS/CSS/图片，只保存版本信息和页面相对路径。对方网站若要独立展示完整交互教程，仍须约定构建文件的上传/托管流程。这次自动化不假定存在尚未提供的文件上传接口。
