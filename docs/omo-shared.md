# Oh My OpenCode 공유 유틸리티 모듈

## 개요

`src/shared/` 디렉토리는 Oh My OpenCode 플러그인 전체에서 사용되는 **43개의 크로스플랫폼 유틸리티**를 제공합니다. 이 유틸리티들은 경로 해결, 설정 파싱, 토큰 제한, Claude Code 호환성 등 다양한 기능을 제공합니다.

## 구조

```
src/shared/
├── index.ts                    # 모든 유틸리티 내보내기
├── logger.ts                  # 파일 기반 로깅 (tmpdir/oh-my-opencode.log)
├── permission-compat.ts         # 에이전트 툴 제한 (ask/allow/deny)
├── dynamic-truncator.ts       # 토큰 인지 트렁케이션 (50% 헤드룸 유지)
├── frontmatter.ts              # YAML frontmatter 파싱
├── jsonc-parser.ts             # JSON with Comments 지원
├── data-path.ts                # XDG-호환 저장소 (~/.local/share)
├── opencode-config-dir.ts      # ~/.config/opencode 경로 해결
├── claude-config-dir.ts        # ~/.claude 경로 해결
├── migration.ts                # 레거시 설정 마이그레이션 (omo → Sisyphus)
├── opencode-version.ts         # 버전 비교 (>= 1.0.150)
├── external-plugin-detector.ts  # OAuth 스프링 감지
├── shell-env.ts                # 셸 유형 탐지 및 환경 변수 설정
├── env-expander.ts             # ${VAR} 확장
├── system-directive.ts         # 시스템 디렉티브 타입
├── hook-utils.ts               # 훅 헬퍼 도움 함수
├── config-path.ts              # 설정 파일 경로 결정
├── config-errors.ts            # 설정 오류 처리
├── command-executor.ts         # 명령어 실행
├── model-sanitizer.ts          # 모델 이름 정규화
├── zip-extractor.ts            # ZIP 파일 추출 (Windows 호환)
├── agent-variant.ts            # 에이전트 변형
├── session-cursor.ts           # 세션 커서 관리
├── file-utils.ts              # 파일 유틸리티
├── file-reference-resolver.ts   # 파일 참조 해결
├── deep-merge.ts              # 깊은 병합
├── tool-name.ts                # 툴 이름 처리
├── pattern-matcher.ts          # 패턴 매칭
├── snake-case.ts               # 스네이크 케이스 변환
└── *.test.ts                  # 테스트 파일 (배치)
```

## 사용 시나리오

| 작업 | 유틸리티 | 사용 방법 |
|------|----------|----------|
| **로그 출력** | `logger.ts` | `log(message, data)` 함수로 디버그 로깅 |
| **컨텍스트 제한** | `dynamic-truncator.ts` | `dynamicTruncate(ctx, sessionId, output)`로 토큰 제한 |
| **Frontmatter 파싱** | `frontmatter.ts` | `parseFrontmatter(content)`로 YAML frontmatter 파싱 |
| **JSONC 로딩** | `jsonc-parser.ts` | `parseJsonc(text)` 또는 `readJsoncFile(path)`로 JSONC 파싱 |
| **툴 제한** | `permission-compat.ts` | `createAgentToolAllowlist(tools)`로 에이전트 툴 제한 |
| **경로 해결** | `*-config-dir.ts` | `getOpenCodeConfigDir()`, `getClaudeConfigDir()`로 경로 해결 |
| **설정 마이그레이션** | `migration.ts` | `migrateConfigFile(path, rawConfig)`으로 레거시 설정 마이그레이션 |
| **버전 비교** | `opencode-version.ts` | `isOpenCodeVersionAtLeast("1.1.0")`으로 버전 비교 |

## 핵심 유틸리티

### 1. logger.ts

파일 기반 로깅 시스템입니다. `console.log` 대신 사용하여 백그라운드 에이전트의 로깅을 지원합니다.

**특징**:
- 로그 파일 위치: `tmpdir/oh-my-opencode.log`
- 디버그 데이터와 함께 로그 저장

**사용 예시**:
```typescript
import { log } from "./logger"

// 메시지 로깅
log("프로세스 시작", { action: "start", pid: process.pid })

// 디버그 데이터 로깅
log("API 요청", { url: "https://api.example.com", status: 200 })
```

---

### 2. dynamic-truncator.ts

토큰 창을 인지하고 동적으로 출력을 트렁케이트하는 유틸리티입니다. 50% 헤드룸을 유지하여 컨텍스트 창이 발생하는 것을 방지합니다.

**특징**:
- 토큰 사용량 기반 트렁케이션
- 최대 50,000 토큰 캡
- 사용 가능한 토큰 공간 유지

**사용 예시**:
```typescript
import { dynamicTruncate } from "./dynamic-truncator"

// 토큰 인지 트렁케이션
const { result } = await dynamicTruncate(ctx, sessionID, largeBuffer)

if (result.truncated) {
  console.log(`출력이 ${result.tokenCount} 토큰으로 트렁케이션됨`)
}
```

---

### 3. frontmatter.ts

YAML frontmatter를 파싱하여 마크다운 파일의 메타데이터를 추출합니다.

**특징**:
- YAML frontmatter 파싱
- 파일 내용과 메타데이터 분리

**사용 예시**:
```typescript
import { parseFrontmatter } from "./frontmatter"

const content = `
---
title: 문서 제목
author: 작성자
---

본문 내용입니다.
`

const { frontmatter, body } = parseFrontmatter(content)

console.log(frontmatter) // { title: "문서 제목", author: "작성자" }
console.log(body)     // "본문 내용입니다."
```

---

### 4. jsonc-parser.ts

JSON with Comments (JSONC) 형식을 파싱하여 설정 파일에서 주석을 지원합니다.

**특징**:
- 주석 지원 (`//` 및 `/* */`)
- 후행 콤마 허용
- 타입 안전한 파싱

**사용 예시**:
```typescript
import { parseJsonc } from "./jsonc-parser"

// JSONC 텍스트 파싱
const settings = parseJsonc<Settings>(jsoncText)

// JSONC 파일 읽기
const config = readJsoncFile<Settings>(configPath)
```

---

### 5. permission-compat.ts

에이전트의 툴 접근 권한을 관리하는 호환성 계층입니다. 레거시 형식과 새 형식 간의 변환을 지원합니다.

**권한 옵션**:
- `ask`: 사용자에게 물어봄
- `allow`: 허용
- `deny`: 거부

**사용 예시**:
```typescript
import { migrateToolsToPermission } from "./permission-compat"

// 레거시 형식에서 새 형식으로 변환
const permissions = migrateToolsToPermission(legacyTools)

// 허용 목록 생성
const allowlist = createAgentToolAllowlist(tools)
```

---

### 6. path resolution 유틸리티

#### opencode-config-dir.ts

OpenCode 설정 디렉토리 경로를 해결합니다.

**지원되는 플랫폼**:
- Linux/macOS: `~/.config/opencode`
- Windows: `~/.config/opencode` 또는 `%APPDATA%\opencode`

**사용 예시**:
```typescript
import { getOpenCodeConfigDir } from "./opencode-config-dir"

const configDir = getOpenCodeConfigDir()
console.log(configDir) // /home/user/.config/opencode
```

#### claude-config-dir.ts

Claude Code 호환 설정 디렉토리 경로를 해결합니다.

**지원되는 경로**:
- `~/.claude` (사용자)
- `.claude/` (프로젝트)
- `.claude/.claude/` (로컬)

**사용 예시**:
```typescript
import { getClaudeConfigDir } from "./claude-config-dir"

const claudeDir = getClaudeConfigDir()
console.log(claudeDir) // /home/user/.claude
```

#### data-path.ts

XDG 호환을 따르는 저장소 경로를 제공합니다.

**특징**:
- `~/.local/share/oh-my-opencode/` (Linux/macOS)
- Windows AppData 호환

#### config-path.ts

다양한 설정 소스(OpenCode, Claude Code, 프로젝트)에서 설정 파일 경로를 결정합니다.

---

### 7. migration.ts

레거시 설정 형식(`omo`)에서 새 형식(`sisyphus`)으로 마이그레이션합니다.

**마이그레이션 작업**:
- 키 이름 변환 (카멜 케이스 → 파스칼 케이스)
- 권한 형식 변환
- 호환성 유지

---

### 8. opencode-version.ts

OpenCode 버전을 비교하여 버전 게이트 기능을 제어합니다.

**사용 예시**:
```typescript
import { isOpenCodeVersionAtLeast } from "./opencode-version"

// 버전 비교
if (isOpenCodeVersionAtLeast("1.1.0")) {
  // 새 기능 사용
} else {
  // 레거시 기능 사용
}
```

---

### 9. shell-env.ts

현재 셸 유형을 탐지하고 환경 변수를 설정합니다.

**지원되는 셸**:
- Unix/Linux: `sh`, `bash`, `zsh`
- Windows: `cmd`, `powershell`

**기능**:
- 셸 유형 자동 탐지
- 환경 변수 안전한 설정
- `buildEnvPrefix()`로 여러 환경 변수 설정

**사용 예시**:
```typescript
import { detectShellType, buildEnvPrefix } from "./shell-env"

// 셸 탐지
const shellType = detectShellType() // "unix" | "powershell" | "cmd"

// 환경 변수 접두사 생성
const envPrefix = buildEnvPrefix(
  { API_KEY: "abc123", SECRET: "xyz" },
  "unix"
)
// 결과: "export API_KEY=abc123 SECRET=xyz;"
```

---

### 10. zip-extractor.ts

Windows 환경에서 ZIP 파일을 추출하는 크로스플랫폼 유틸리티입니다.

**특징**:
- Windows 빌드 번호 탐지
- 세 가지 추출 옵션:
  - **tar**: Windows 10+ (17034 빌드 이상)
  - **pwsh**: PowerShell에 포함될 때
  - **powershell**: 기본값

**사용 예시**:
```typescript
import { extractZip } from "./zip-extractor"

// ZIP 파일 추출
await extractZip(archivePath, destDir)
```

---

### 11. env-expander.ts

설정 파일에서 `${VAR}` 형식의 환경 변수 확장을 처리합니다.

**사용 예시**:
```typescript
// 설정 파일
{
  "path": "${HOME}/config"
  "apiUrl": "${API_BASE_URL}/v1"
}

// 환경 변수 확장 후
{
  "path": "/home/user/config"
  "apiUrl": "https://api.example.com/v1"
}
```

---

## 핵심 패턴

### 토큰 인지 트렁케이션

```typescript
// 항상 토큰 사용량 확인
const { result } = await dynamicTruncate(ctx, sessionID, largeOutput)

// 50% 헤드룸 유지하면서 트렁케이션
if (result.tokenCount > 50000) {
  // 출력 자름
}
```

### JSONC 파싱

```typescript
// 주석이 포함된 JSONC 파싱
const settings = parseJsonc<Settings>(jsoncContent)

// 타입 안전하게 파싱 (Zod 스키마 사용)
```

### 경로 해결

```typescript
// OpenCode 설정 디렉토리 경로 얻기
const configDir = getOpenCodeConfigDir()

// Claude Code 설정 디렉토리 경로 얻기
const claudeDir = getClaudeConfigDir()

// 결합 경로
const configPath = path.join(configDir, "oh-my-opencode.json")
```

### 버전 게이팅

```typescript
// 특정 버전 이상에서만 기능 활성화
if (isOpenCodeVersionAtLeast("1.1.0")) {
  // 새 기능 사용
}
```

---

## 안티 패턴

다음 패턴을 피해야 합니다:

| 안티 패턴 | 설명 | 올바른 대안 |
|---------|------|-----------|
| **Raw JSON.parse 사용** | `jsonc-parser.ts` 사용하여 주석 지원 | ✅ |
| **하드코딩된 경로** | `*-config-dir.ts` 유틸리티 사용 | ✅ |
| **console.log 사용** | `logger.ts` 사용하여 로깅 | ✅ |
| **제한 없는 출력** | `dynamic-truncator.ts` 사용하여 토큰 제한 | ✅ |
| **수동 버전 파싱** | `opencode-version.ts` 사용하여 버전 비교 | ✅ |

---

## 테스트

모든 유틸리티는 해당하는 테스트 파일(`*.test.ts`)을 포함합니다.

**테스트 실행**:
```bash
bun test src/shared/
```

---

## 아키텍처 다이어그램

이 모듈은 다음 설계 원칙을 따릅니다:

1. **크로스플랫폼 호환성**: Linux/macOS/Windows에서 모두 동작
2. **재사용성**: 각 유틸리티는 독립적으로 사용 가능
3. **안전성**: 타입 안전한 파싱 및 유효성 검사
4. **유연보수성**: 레거시 형식과 새 형식 간 호환성 유지

---

## 요약

`src/shared/`는 Oh My OpenCode의 인프라스트럭처를 담당하는 핵심 모듈입니다. 이 유틸리티들을 통해 플러그인은:

- **크로스플랫폼 호환성**: 다양한 운영체제에서 안정적으로 동작
- **안전한 설정 관리**: JSONC 지원, 버전 게이팅, 마이그레이션
- **토큰 최적화**: 컨텍스트 창 예방 및 자동 트렁케이션
- **에이전트 제어**: 세분화된 권한 관리 시스템

이 유틸리티들은 플러그인의 다른 모듈(에이전트, 훅, MCP, LSP 도구 등)에서 사용되며, Oh My OpenCode의 안정성과 확장성에 기여합니다.
