# OMO CLI 문서

**생성일**: 2026-01-19
**대상**: `src/cli/` 디렉토리 구조 및 명령어

---

## 개요

Oh-My-OpenCode는 `bunx oh-my-opencode` 명령어로 접근 가능한 CLI 도구를 제공합니다. 대화형 설치 마법사, 환경 진단 도구, 세션 러너 등의 기능을 포함하고 있습니다.

---

## 디렉토리 구조

```
src/cli/
├── index.ts              # Commander.js 기반 메인 진입점, 5개의 서브명령
├── install.ts            # 대화형 TUI 설치 마법사 (462줄)
├── config-manager.ts     # JSONC 파싱, 다중 레벨 설정 병합 (730줄)
├── types.ts              # InstallArgs, InstallConfig, DetectedConfig 타입 정의
├── doctor/
│   ├── index.ts          # Doctor 명령어 진입점
│   ├── runner.ts         # 점검 실행 오케스트레이션
│   ├── formatter.ts      # 컬러 출력, 심볼, JSON 포맷팅
│   ├── constants.ts      # 점검 ID, 카테고리, 심볼 정의
│   ├── types.ts          # CheckResult, CheckDefinition, DoctorResult 타입
│   └── checks/           # 14개 점검 항목, 6개 카테고리
│       ├── version.ts    # OpenCode + 플러그인 버전 점검
│       ├── config.ts     # JSONC 유효성, Zod 검증 점검
│       ├── auth.ts       # Anthropic, OpenAI, Google 인증 점검
│       ├── dependencies.ts # AST-Grep, Comment Checker 의존성 점검
│       ├── lsp.ts        # LSP 서버 연결성 점검
│       ├── mcp.ts        # MCP 서버 유효성 점검
│       ├── gh.ts         # GitHub CLI 가용성 점검
│       ├── plugin.ts     # 플러그인 등록 상태 점검
│       └── opencode.ts   # OpenCode 설치 상태 점검
├── run/
│   ├── index.ts          # Run 명령어 진입점
│   ├── runner.ts         # 세션 러너 구현 (122줄)
│   ├── events.ts         # 이벤트 처리, 상태 관리
│   ├── completion.ts     # 완료 조건 검사 (TODO, 백그라운드 태스크)
│   └── types.ts          # RunOptions, RunContext 타입
└── get-local-version/
    ├── index.ts          # 버전 감지 명령어
    └── formatter.ts      # 버전 출력 포맷팅
```

---

## 사용 가능한 명령어

| 명령어 | 설명 | 상세 기능 |
|--------|--------|----------|
| `install` | 대화형 설치 마법사 | TUI 기반, 구독 탐지, 자동 설정 |
| `doctor` | 환경 진단 | 14개 health checks, `--verbose`, `--json`, `--category` |
| `run` | OpenCode 세션 러너 | TODO 완료 강제, 백그라운드 태스크 대기 |
| `get-local-version` | 버전 감지 | 현재 설치된 버전, 업데이트 체크 |
| `version` | 버전 정보 표시 | 간단한 버전 문자열 출력 |

---

## `install` - 대화형 설치 마법사

`@clack/prompts` 기반의 아름다운 TUI(Text User Interface)를 제공합니다. 사용자의 구독 상태를 탐지하고 적절한 설정을 자동으로 생성합니다.

### 사용법

```bash
# 대화형 TUI 모드 (기본)
bunx oh-my-opencode install

# 비대화형 모드 (CI/CD용)
bunx oh-my-opencode install --no-tui --claude=yes --chatgpt=yes --gemini=no --copilot=no

# 인증 안내 건너뛰기
bunx oh-my-opencode install --skip-auth
```

### 옵션

| 옵션 | 설명 | 값 |
|------|--------|-----|
| `--no-tui` | 비대화형 모드 (모든 옵션 필수) | - |
| `--claude` | Claude 구독 상태 | `no`, `yes`, `max20` |
| `--chatgpt` | ChatGPT 구독 상태 | `no`, `yes` |
| `--gemini` | Gemini 통합 여부 | `no`, `yes` |
| `--copilot` | GitHub Copilot 구독 상태 | `no`, `yes` |
| `--skip-auth` | 인증 안내 건너뛰기 | - |

### TUI 프롬프트 순서

1. **Claude Pro/Max 구독 여부**
   - `no`: opencode/glm-4.7-free fallback 사용
   - `yes`: Claude Opus 4.5 for orchestration
   - `max20`: Full power with Claude Sonnet 4.5 for Librarian

2. **ChatGPT Plus/Pro 구독 여부**
   - `no`: Oracle fallback model 사용
   - `yes`: GPT-5.2 for debugging and architecture

3. **Google Gemini 통합 여부**
   - `no`: Frontend/docs agents fallback 사용
   - `yes`: Beautiful UI generation with Gemini 3 Pro

4. **GitHub Copilot 구독 여부**
   - `no`: Native providers만 사용
   - `yes`: Fallback option when native providers unavailable

### 설치 단계

1. **OpenCode 설치 확인**
   - `opencode` 또는 `opencode-desktop` 바이너리 탐지
   - 버전 >= 1.0.150 확인

2. **플러그인 등록**
   - `opencode.json` 또는 `opencode.jsonc`에 플러그인 추가
   - 기존 플러그인 유지, 버전 업데이트

3. **인증 플러그인 추가** (Gemini 선택 시)
   - `opencode-antigravity-auth` 최신 버전 탐지
   - 플러그인 배열에 추가

4. **Provider 설정 추가** (Gemini 선택 시)
   - Google provider config 병합
   - `antigravity-` 접두사 모델 사용

5. **oh-my-opencode 설정 작성**
   - Agent 모델 설정 (구독에 따라)
   - Category 모델 설정
   - `~/.config/opencode/oh-my-opencode.json` 생성

### Agent 모델 할당 로직

| Agent | Claude (max20) | Claude (std) | ChatGPT | Gemini | Copilot |
|-------|---------------|--------------|---------|--------|---------|
| **Sisyphus** | claude-opus-4-5 | claude-opus-4-5 | - | - | github-copilot/claude-opus-4.5 |
| **Oracle** | gpt-5.2 | gpt-5.2 | gpt-5.2 | - | github-copilot/gpt-5.2 |
| **Librarian** | claude-sonnet-4.5 | glm-4.7-free | glm-4.7-free | - | glm-4.7-free |
| **Explore** | claude-haiku-4-5 | grok-code | grok-code | antigravity-gemini-3-flash | github-copilot/grok-code-fast-1 |
| **Frontend** | claude-opus-4-5 | claude-opus-4-5 | claude-opus-4.5 | antigravity-gemini-3-pro-high | github-copilot/gemini-3-pro-preview |

### Config Manager 기능

#### JSONC 지원
- **주석**: `// comment`, `/* comment */`
- **후행 콤마**: `{ "key": "value", }`
- `.jsonc` 파일이 `.json`보다 우선순위 높음

#### 다중 소스 병합
```typescript
// User + Project config merge
// Project: .opencode/oh-my-opencode.json
// User: ~/.config/opencode/oh-my-opencode.json
const merged = deepMerge(existingConfig, newConfig)
```

#### 디렉토리 우선순위
1. `OPENCODE_CONFIG_DIR` 환경변수 (프로필 격리용)
2. `~/.config/opencode/` (macOS/Linux)
3. `%APPDATA%\opencode\` (Windows fallback)

---

## `doctor` - 환경 진단 도구

14개 health checks across 6 categories를 실행하여 OpenCode 및 플러그인 설치 상태를 점검합니다.

### 사용법

```bash
# 전체 점검
bunx oh-my-opencode doctor

# 특정 카테고리만 점검
bunx oh-my-opencode doctor --category authentication

# 상세 정보 포함
bunx oh-my-opencode doctor --verbose

# JSON 형식 출력
bunx oh-my-opencode doctor --json
```

### 옵션

| 옵션 | 설명 |
|------|--------|
| `--verbose` | 상세 진단 정보 포함 |
| `--json` | JSON 형식으로 결과 출력 |
| `--category <name>` | 특정 카테고리만 점검 |

### 점검 카테고리

| 카테고리 | 점검 항목 |
|----------|-----------|
| **installation** | OpenCode 버전 (>= 1.0.150), 플러그인 등록 상태 |
| **configuration** | JSONC 유효성, Zod 스키마 검증 |
| **authentication** | Anthropic, OpenAI, Google 인증 상태 |
| **dependencies** | AST-Grep CLI/NAPI, Comment Checker 설치 상태 |
| **tools** | LSP 서버 연결성, MCP 서버 유효성 |
| **updates** | 버전 비교, 업데이트 가용성 |

### 출력 예시

```
┌─────────────────────────────────────────────┐
│ Oh-My-OpenCode Doctor                       │
└─────────────────────────────────────────────┘

Installation
  ✓ OpenCode version: 1.0.155 (>= 1.0.150) [12ms]
  ✓ Plugin registered in opencode.json [8ms]

Configuration
  ✓ oh-my-opencode.json is valid JSONC [5ms]
  ✓ Configuration matches Zod schema [15ms]

Authentication
  ✓ Anthropic API key configured [23ms]
  ✓ OpenAI API key configured [18ms]
  ✗ Google API key not found [0ms]

Dependencies
  ✓ AST-Grep CLI installed [45ms]
  ✓ Comment Checker available [32ms]

Tools
  ✓ LSP server connectivity OK [67ms]
  ✓ MCP server validation passed [52ms]

Updates
  ⚠ New version available: 3.0.1 (current: 3.0.0) [156ms]

─────────────────────────────────────────────
Summary: 10 passed, 1 warning, 1 failed, 0 skipped
Duration: 493ms
─────────────────────────────────────────────
```

### JSON 출력 예시

```json
{
  "results": [
    {
      "id": "opencode-version",
      "name": "OpenCode Version Check",
      "category": "installation",
      "status": "pass",
      "message": "OpenCode 1.0.155 installed (>= 1.0.150)",
      "duration": 12
    },
    ...
  ],
  "summary": {
    "total": 14,
    "passed": 10,
    "failed": 1,
    "warnings": 1,
    "skipped": 0,
    "duration": 493
  }
}
```

### 새로운 점검 항목 추가 방법

1. `src/cli/doctor/checks/my-check.ts` 생성:

```typescript
import type { CheckDefinition } from "../types"

export function getMyCheckDefinition(): CheckDefinition {
  return {
    id: "my-check",
    name: "My Custom Check",
    category: "configuration",
    check: async () => {
      // 점검 로직
      const isOk = await someValidation()

      return {
        status: isOk ? "pass" : "fail",
        message: isOk ? "All good" : "Something is wrong"
      }
    }
  }
}
```

2. `src/cli/doctor/checks/index.ts`에 export:

```typescript
export * from "./my-check"
```

3. `getAllCheckDefinitions()`에 추가:

```typescript
export function getAllCheckDefinitions(): CheckDefinition[] {
  return [
    // ... 기존 점검들
    getMyCheckDefinition(),  // 새 점검 추가
  ]
}
```

---

## `run` - OpenCode 세션 러너

OpenCode 세션을 실행하고 작업 완료를 모니터링합니다. `opencode run`과 달리, TODO 완료 및 백그라운드 태스크 대기까지 세션을 유지합니다.

### 사용법

```bash
# 기본 실행
bunx oh-my-opencode run "Fix the bug in index.ts"

# 특정 에이전트 지정
bunx oh-my-opencode run --agent Sisyphus "Implement feature X"

# 작업 디렉토리 지정
bunx oh-my-opencode run --directory /path/to/project "Refactor code"

# 타임아웃 설정 (30분)
bunx oh-my-opencode run --timeout 1800000 "Large refactoring task"
```

### 옵션

| 옵션 | 설명 | 기본값 |
|------|--------|--------|
| `-a, --agent <name>` | 사용할 에이전트 | `Sisyphus` |
| `-d, --directory <path>` | 작업 디렉토리 | 현재 디렉토리 |
| `-t, --timeout <ms>` | 타임아웃 (밀리초) | 무제한 |

### 완료 조건

`run` 명령어는 다음 조건이 모두 충족될 때까지 세션을 유지합니다:

1. **메인 세션 Idle 상태**
   - 에이전트가 더 이상 작업 중이지 않음

2. **모든 TODO 완료 또는 취소**
   - `todoread`로 확인

3. **모든 자식 세션 (백그라운드 태스크) Idle**
   - `call_omo_agent`로 생성된 백그라운드 태스크

### 이벤트 처리

```typescript
// 이벤트 상태 관리
const eventState = createEventState()

// 이벤트 스트림 처리
const events = await client.event.subscribe()
const eventProcessor = processEvents(ctx, events.stream, eventState)

// 폴링 루프 (500ms 간격)
while (!abortController.signal.aborted) {
  await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

  if (!eventState.mainSessionIdle) continue
  if (eventState.mainSessionError) break

  const shouldExit = await checkCompletionConditions(ctx)
  if (shouldExit) break
}
```

### SIGINT 처리

```typescript
process.on("SIGINT", () => {
  console.log(pc.yellow("\nInterrupted. Shutting down..."))
  cleanup()
  process.exit(130)  // SIGINT exit code
})
```

---

## `get-local-version` - 버전 감지

현재 설치된 버전과 npm의 최신 버전을 비교하여 업데이트 여부를 확인합니다.

### 사용법

```bash
# 기본 실행
bunx oh-my-opencode get-local-version

# JSON 형식 출력
bunx oh-my-opencode get-local-version --json

# 특정 디렉토리의 설정 확인
bunx oh-my-opencode get-local-version --directory /path/to/project
```

### 옵션

| 옵션 | 설명 |
|------|--------|
| `-d, --directory <path>` | 설정 확인용 작업 디렉토리 |
| `--json` | JSON 형식으로 결과 출력 |

### 출력 정보

| 항목 | 설명 |
|------|--------|
| `currentVersion` | 현재 설치된 버전 |
| `latestVersion` | npm의 최신 버전 |
| `isUpToDate` | 최신 버전 여부 |
| `isLocalDev` | 로컬 개발 모드 여부 |
| `isPinned` | 버전 고정 여부 |
| `pinnedVersion` | 고정된 버전 |
| `status` | 상태 (`up-to-date`, `outdated`, `local-dev`, `pinned`, `error`, `unknown`) |

### 출력 예시

```
Current Version:  3.0.0
Latest Version:   3.0.1
Status:           ⚠ OUTDATED

Update available! Run: bunx oh-my-opencode install
```

### 특수 모드

1. **로컬 개발 모드**
   - 프로젝트 루트에 `package.json`이 있고 `name`이 `oh-my-opencode`인 경우
   - `status: "local-dev"` 출력

2. **버전 고정**
   - `opencode.json`에서 플러그인 버전 고정된 경우
   - `status: "pinned"` 출력

---

## `version` - 버전 정보 표시

간단한 버전 문자열을 출력합니다.

### 사용법

```bash
bunx oh-my-opencode version
```

### 출력 예시

```
oh-my-opencode v3.0.0
```

---

## 설정 파일 위치

CLI는 다음 위치 (우선순위 순)에서 설정 파일을 검색합니다:

### OpenCode 설정

| 플랫폼 | 경로 |
|---------|------|
| **macOS/Linux** | `~/.config/opencode/opencode.json` |
| **Windows** | `%APPDATA%\opencode\opencode.json` |

### Oh-My-OpenCode 설정

| 플랫폼 | 경로 |
|---------|------|
| **macOS/Linux** | `~/.config/opencode/oh-my-opencode.json` |
| **Windows** | `%APPDATA%\opencode\oh-my-opencode.json` |

### 프로젝트 레벨 설정

- `.opencode/opencode.json`
- `.opencode/opencode.jsonc`
- `.opencode/oh-my-opencode.json`

---

## 심볼 및 출력 포맷

Doctor 명령어에서 사용하는 심볼:

| 심볼 | 의미 |
|------|------|
| ✓ (check) | 통과 (pass) |
| ✗ (cross) | 실패 (fail) |
| ⚠ (warn) | 경고 (warn) |
| ○ (circle) | 건너뜀 (skip) |
| → (arrow) | 화살표 |
| • (bullet) | 불렛 포인트 |
| ℹ (info) | 정보 |
| ★ (star) | 별 |

### 컬러 라이브러리

- **picocolors**: `pc.green()`, `pc.red()`, `pc.yellow()`, `pc.cyan()`, `pc.dim()`

---

## TUI 프레임워크

### @clack/prompts 사용 패턴

```typescript
import * as p from "@clack/prompts"

// 시작 메시지
p.intro("oMoMoMoMo...")

// 스피너
const s = p.spinner()
s.start("Checking installation...")
// ... 작업
s.stop("Installation complete ✓")

// 프롬프트
const answer = await p.select({
  message: "Select option",
  options: [
    { value: "yes", label: "Yes", hint: "Description" },
    { value: "no", label: "No" },
  ],
  initialValue: "yes",
})

// 취소 확인
if (p.isCancel(answer)) {
  p.cancel("Operation cancelled")
  return
}

// 정보 노트
p.note("Some important info", "Title")

// 종료 메시지
p.outro("Success!")
```

---

## 오류 처리

### Config Manager 오류 포맷

```typescript
function formatErrorWithSuggestion(err: unknown, context: string): string {
  // 권한 오류
  if (isPermissionError(err)) {
    return "Permission denied: Cannot ${context}. Try running with elevated permissions."
  }

  // 파일 없음 오류
  if (isFileNotFoundError(err)) {
    return "File not found while trying to ${context}. The file may have been deleted."
  }

  // JSON 구문 오류
  if (err instanceof SyntaxError) {
    return "JSON syntax error while trying to ${context}: ${err.message}. Check for missing commas, brackets, or invalid characters."
  }

  // 디스크 꽉 참
  if (message.includes("ENOSPC")) {
    return "Disk full: Cannot ${context}. Free up disk space and try again."
  }

  // 읽기 전용 파일 시스템
  if (message.includes("EROFS")) {
    return "Read-only filesystem: Cannot ${context}. Check if filesystem is mounted read-only."
  }
}
```

---

## Anti-Patterns

### 하지 말아야 할 것

| 패턴 | 이유 | 대안 |
|------|------|------|
| `mkdir/touch/rm/cp/mv` | 파일 작업은 bash tool 사용 | `bash` tool로 파일 작업 |
| 직접 `JSON.parse()` | JSONC 지원 필요 | `parseJsonc()` 함수 사용 |
| 하드코딩된 경로 | `ConfigManager` 사용 | `getConfigContext()` 함수 사용 |
| TTY가 아닌 환경에서 TUI 실행 | `process.stdout.isTTY` 체크 필요 | 비대화형 모드로 fallback |

---

## 개발자 참고

### 새로운 CLI 명령어 추가

1. `src/cli/`에 새로운 명령어 디렉토리 생성
2. `index.ts`에 명령어 등록

```typescript
// src/cli/index.ts
import { myCommand } from "./my-command"

program
  .command("my-command")
  .description("My custom command")
  .option("--verbose", "Show verbose output")
  .action(async (options) => {
    const exitCode = await myCommand(options)
    process.exit(exitCode)
  })
```

### 타입 정의

```typescript
// src/cli/types.ts
export interface MyCommandArgs {
  verbose?: boolean
  outputPath?: string
}

export interface MyCommandResult {
  success: boolean
  outputPath?: string
  error?: string
}
```

---

## 참고

- **TUI 프레임워크**: [@clack/prompts](https://github.com/natemoo-re/clack)
- **커맨드 라인 파서**: [commander.js](https://github.com/tj/commander.js)
- **컬러 라이브러리**: [picocolors](https://github.com/alexeyraspopov/picocolors)
