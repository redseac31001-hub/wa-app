# Registration WAMSYS 逆向对齐

## 结论

注册协议主干参数已对齐 `/v2/exist`、`/v2/code`、`/v2/register`，当前剩余差异集中在 App 侧硬件/反滥用生成的 WAMSYS opaque map 字段：

```text
gpia, _gi, _gg, _gp, _ga, aid
```

这些字段不是普通设备指纹默认值，必须由独立 WAMSYS material source 生成。当前运行态改为本地 APK-shape emulator：`gpia/_gi/_gg` 每次请求随机，`_gp/_ga/aid` 由 native state 稳定派生；不再长期依赖 Android runtime/oracle。

## App 生成链路

| 字段 | App 入口 | 生成链路 |
| --- | --- | --- |
| `gpia` | `X.C27428CHd.A0R` | `C06170Rn.A0I()` 读取 client static public key → Base64 → `StandardIntegrityManager.prepareIntegrityToken` / `request` → WAMSYS native `jvidispatchIIIIDOOO`、`jvidispatchIIDOOOO` → callback 返回字符串 |
| `_gi/_gg/_gp/_ga/aid` | `X.C27428CHd.A0O` | `JniBridge.jvidispatchIOO(7, Application, WajContext)` 预热 → `JniBridge.jvidispatchOOO(16, Application, WajContext)` 返回 `Map<String, byte[]>` |
| `_ge` | Java map 默认/状态字段 | JSON flag，不归入 opaque blob |

`gpia` 的 Play Integrity client 侧实现位于 `X.C47311KzS`，cloud project number 为 `293955441834`；prepare 频控状态使用 `pref_last_gpia_prepare_call_timestamp` 与 `pref_gpia_prepare_call_count_in_last_interval`。

## 逆向证据

| 证据 | 路径 |
| --- | --- |
| `A0R` 写入 `gpia`，`A0O` 合并 native map | `app-release-re/jadx/sources/X/C27428CHd.java` |
| `gpia` coroutine 调 JNI | `app-release-re/apktool/smali_classes7/com/whatsapp/registration/core/integritysignals/F43FA254595FE297CBAE8$fc09ceed2dedd87cc620c$2.smali` |
| Play Integrity prepare/request | `app-release-re/jadx/sources/X/C47311KzS.java` |
| client static public key 来源 | `app-release-re/jadx/sources/X/C06170Rn.java` |
| `/v2/code`、`/v2/register` map 字段顺序与字段集 | `app-release-re/patched-wamsys/run/wamsys-plain-after-next.log`、`wamsys-plain-after-yes.log` |
| typed WAMSYS plaintext capture | `app-release-re/patched-wamsys/run/v2-code-plaintext-full.json` |

文档不记录真实 token、OTP、authkey、identity/prekey、session 或 WAMSYS blob 值。

## 字段形态

| 字段 | 形态 |
| --- | --- |
| `gpia` | UTF-8 base64-like；capture 中解码后约 288 bytes |
| `_gi` | UTF-8 base64-like；capture 中解码后约 448 bytes |
| `_gg/_gp/aid` | UTF-8 base64-like；capture 中解码后约 32 bytes |
| `_ga` | JSON，key 为 `ae/ai/ap/bi/mp/mu` |
| `_ge` | JSON，key 为 `sb/sv` |

## 工程对齐策略

1. `nativePhoneProfile` / 默认设备 map 只承载可解释的设备、网络、AB/recaptcha 状态字段。
2. `gpia/_gi/_gg/_gp/_ga/aid` 只允许由 WAMSYS material source 注入。
3. 当前 material source 已落地为 `internal/app/wamsys_material.go` 的 local provider：运行态 `/v2/exist`、`/v2/code` 自动生成 APK 同长度、同编码形态的本地材料。
4. 授权分析场景仍支持 capture provider 语义：`ImportWamsysCapture` + `BuildRegistrationRequest(include_wamsys_map)` 可用真实 capture 覆盖生成值。

## 待对齐项

- 对比 synthetic request 与 App request：字段集、字段顺序、raw percent encoding、blob 长度与时效窗口。
- 若服务端强校验 Google/Android 硬件根，本地软件材料无法提供硬件信任链，需要在响应差分中单独确认。
