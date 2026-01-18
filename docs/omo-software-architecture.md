# OhMyOpenCode 소프트웨어 아키텍처

**생성일**: 2026-01-18
**커밋**: 255f535a
**브랜치**: dev

---

## 개요

OhMyOpenCode는 OpenCode용 다중 모델 AI 에이전트 오케스트레이션 플러그인입니다. 31개의 라이프사이클 훅, 20개 이상의 도구(LSP, AST-Grep, 위임), 10개의 전문화 에이전트, Claude Code 호환성 레이어를 포함합니다. OpenCode를 위한 "oh-my-zsh"와 같습니다.

---

## 시스템 아키텍처

```
oh-my-opencode/
├── src/
│   ├── agents/        # 10개 AI 에이전트 (Sisyphus, oracle, librarian, explore, frontend 등)
│   ├── hooks/         # 31개 라이프사이클 훅 (PreToolUse, PostToolUse, Stop 등)
│   ├── tools/         # 20개 이상 도구 (LSP, AST-Grep, 위임, 세션)
│   ├── features/      # 백그라운드 에이전트, Claude Code 호환성 레이어
│   ├── shared/        # 43개 공통 유틸리티
│   ├── cli/           # CLI 인스톨러, doctor, run
│   ├── mcp/           # 내장형 MCP: websearch, context7, grep_app
│   ├── config/        # Zod 스키마, TypeScript 타입
│   └── index.ts       # 메인 플러그인 엔트리 포인트 (590줄)
├── script/            # build-schema.ts, publish.ts, build-binaries.ts
├── packages/          # 7개 플랫폼 별 바이너리
└── dist/              # 빌드 결과물 (ESM + .d.ts)
```

### 핵심 컴포넌트

| 컴포넌트 | 역할 | 라인 수 | 설명 |
|----------|--------|---------|--------|
| **Plugins** | 플러그인 시스템 | `index.ts` (590줄) | OpenCode Plugin SDK 구현, 훅/도구 등록 |
| **Agents** | AI 에이전트 정의 | 각 에이전트 파일 (100~1531줄) | 10개 전문화 에이전트, 프롬프트 작성 |
| **Hooks** | 라이프사이클 훅 | `src/hooks/[name]/` | 도구 실행 전후 가로채기, 세션 관리 |
| **Tools** | 도구 구현 | `src/tools/[name]/` | LSP, AST-Grep, 세션, 위임 도구 |
| **Features** | 기능 모듈 | `src/features/[name]/` | 백그라운드 에이전트, MCP 관리, 호환성 |
| **Shared** | 공통 유틸리티 | 43개 파일 | 로깅, 권한, 설정 로드 등 |
| **Config** | 설정 관리 | `src/config/schema.ts` | Zod 스키마, 타입 정의 |

---

## 1. 플러그인 엔트리 포인트 (`src/index.ts`)

### 초기화 흐름

```typescript
const OhMyOpenCodePlugin: Plugin = async (ctx) => {
  // 1. 플러그인 설정 로드
  const pluginConfig = loadPluginConfig(ctx.directory, ctx)

  // 2. 라이프사이클 훅 생성 (disabled_hooks 체크)
  const contextWindowMonitor = createContextWindowMonitorHook(ctx)
  const sessionRecovery = createSessionRecoveryHook(ctx)
  const todoContinuationEnforcer = createTodoContinuationEnforcer(ctx, {...})
  // ... 31개 훅 생성

  // 3. 백그라운드 에이전트 매니저 초기화
  const backgroundManager = new BackgroundManager(ctx)
  initTaskToastManager(ctx.client)

  // 4. 도구 생성
  const callOmoAgent = createCallOmoAgent(ctx, backgroundManager)
  const delegateTask = createDelegateTask({manager, client, ...})
  const skillTool = createSkillTool({...})
  const skillMcpTool = createSkillMcpTool({...})
  const slashcommandTool = createSlashcommandTool({...})

  // 5. 스킬 로딩 (6개 소스에서 병렬 로드)
  const [userSkills, globalSkills, projectSkills, ...] = await Promise.all([...])
  const mergedSkills = mergeSkills(builtinSkills, ...)

  // 6. Plugin 리턴
  return {
    tool: { ...builtinTools, call_omo_agent, delegate_task, ... },
    "chat.message": async (input, output) => {...},
    "experimental.chat.messages.transform": async (input, output) => {...},
    config: configHandler,
    event: async (input) => {...},
    "tool.execute.before": async (input, output) => {...},
    "tool.execute.after": async (input, output) => {...},
  }
}
```

### 이벤트 처리 순서

| 이벤트 | 처리 순서 | 주요 작업 |
|--------|----------|----------|
| `chat.message` | 수신 시 훅 체인 | todo-continuation, start-work, ralph-loop |
| `tool.execute.before` | 도구 실행 전 | claude-code-hooks, comment-checker, directory-agents-injector |
| `tool.execute.after` | 도구 실행 후 | tool-output-truncator, empty-task-response-detector, sisyphus-orchestrator |
| `event` | 세션 이벤트 | session-recovery, context-window-monitor, background-notification |

---

## 2. AI 에이전트 시스템 (`src/agents/`)

### 에이전트 아키텍처

```
agents/
├── sisyphus.ts              # 메인 에이전트 프롬프트 (640줄)
├── orchestrator-sisyphus.ts # 오케스트레이터 (1531줄)
├── sisyphus-junior.ts       # 위임받은 작업 실행자
├── sisyphus-prompt-builder.ts # 동적 프롬프트 생성
├── oracle.ts                # GPT-5.2 기반 전략 고문
├── librarian.ts              # GLM-4.7 기반 문서/GitHub 연구원
├── explore.ts               # Grok Code 기반 코드베이스 탐색
├── frontend-ui-ux-engineer.ts # Gemini 3 Pro 기반 UI 전문가
├── document-writer.ts         # Gemini 3 Flash 기반 기술 문서 작성
├── multimodal-looker.ts      # Gemini 3 Flash 기반 미디어 분석
├── prometheus-prompt.ts       # Prompethus 플래너 (1196줄, 인터뷰 모드)
├── metis.ts                 # 사전 계획 분석
├── momus.ts                 # 계획 검증
└── index.ts                 # builtinExperts export
```

### 에이전트 모델 할당

| 에이전트 | 모델 | Temperature | 역할 |
|---------|--------|-------------|------|
| **Sisyphus** | anthropic/claude-opus-4-5 | 0.1 | 기본 오케스트레이터, todo 주도형 |
| **oracle** | openai/gpt-5.2 | 0.1 | 읽기 전용 상담, 디버깅, 아키텍처 설계 |
| **librarian** | opencode/glm-4.7-free | 0.1 | 다중 저장소 연구, 공식 문서 조회, GitHub 검색 |
| **explore** | opencode/grok-code | 0.1 | 빠른 코드베이스 탐색, 패턴 매칭 |
| **frontend-ui-ux-engineer** | google/gemini-3-pro-preview | 0.7 | UI 생성, 시각적 디자인 (높은 창의성) |
| **document-writer** | google/gemini-3-flash | 0.3 | 기술 문서 작성 |
| **multimodal-looker** | google/gemini-3-flash | 0.1 | PDF/이미지 분석 |
| **Prometheus** | anthropic/claude-opus-4-5 | 0.1 | 전략적 계획, 인터뷰 모드 |
| **Metis** | anthropic/claude-sonnet-4-5 | 0.1 | 사전 계획 격차 분석 |
| **Momus** | anthropic/claude-sonnet-4-5 | 0.1 | 계획 검증 |

### Sisyphus 오케스트레이터

**핵심 철학**: 시간이 지나면 우리는 모두 같은 바위를 굴린다. LLM 에이전트도 예외는 아니다.

#### 7단계 위임 프로세스

1. **Phase 0 - 의도 게이트 (Intent Gate)**
   - 키워드 감지: 외부 라이브러리 → librarian, 복잡한 모듈 → explore
   - GitHub 멘션 (@mention) → 완전 사이클: 조사 → 구현 → PR 생성

2. **Phase 1 - 요청 유형 분류**
   ```
   | 유형 | 신호 | 액션 |
   |-------|--------|--------|
   | Trivial | 단일 파일, 명확한 명령 | 직접 도구 사용 |
   | Exploratory | "How does X work?", "Find Y" | explore + 도구 병렬 실행 |
   | Open-ended | "Improve", "Refactor" | 코드베이스 먼저 평가 |
   | GitHub Work | 이슈 언급, "look into X and create PR" | 전체 사이클: 조사 → 구현 → PR |
   ```

3. **Phase 2A - 탐색 및 연구**
   - 도구 선택: `grep`, `glob`, `lsp_*`, `ast_grep` (무료)
   - explore 에이전트: 복잡한 탐색, 익숙한 모듈 구조
   - librarian 에이전트: 외부 문서, GitHub 예제, OSS 구현 참조
   - 병렬 실행 기본: explore/librarian (백그라운드) + 도구

4. **Phase 2B - 구현**
   - Todo 즉시 생성 (2+ 단계 필수)
   - 프론트엔드 파일 분류: 시각적 변경 → 위임, 로직 → 직접 처리
   - 위임 7섹션 프롬프트: TASK, EXPECTED OUTCOME, REQUIRED SKILLS, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT

5. **Phase 2C - 실패 복구**
   - 3회 연속 실패 시: 중단 → 되돌리기 → 문서화 → Oracle 상담

6. **Phase 3 - 완료**
   - 모든 todo 완료 확인
   - Diagnostics 청소
   - 빌드/테스트 통과

7. **최종 보고 전 백그라운드 태스크 정리**: `background_cancel(all=true)`

#### 위임 의사결정 매트릭스

| 작업 유형 | 사용 방법 |
|-----------|-----------|
| 프론트엔드 구현 | `category="visual"` 또는 `agent="frontend-ui-ux-engineer"` |
| 백엔드 로직 | `category="business-logic"` 또는 `agent="oracle"` |
| 코드베이스 탐색 | `agent="explore"` |
| 문서/GitHub 조사 | `agent="librarian"` |
| 디버깅 | `agent="oracle"` |
| Git 커밋 | `agent="git-master"` (skill) |

---

## 3. 라이프사이클 훅 시스템 (`src/hooks/`)

### 훅 분류 및 실행 순서

```
tool.execute.before (도구 실행 전)
  ├─> comment-checker (코멘트 과다 방지)
  ├─> directory-agents-injector (AGENTS.md/README.md 주입)
  ├─> directory-readme-injector (README.md 주입)
  ├─> claude-code-hooks (Claude Code 호환성)
  └─> rules-injector (.claude/rules/* 조건부 주입)

[도구 실행]

tool.execute.after (도구 실행 후)
  ├─> tool-output-truncator (출력 자르기)
  ├─> empty-task-response-detector (빈 응답 감지)
  ├─> sisyphus-orchestrator (위임 결과 수집)
  ├─> delegate-task-retry (위임 실패 재시도)
  └─> todo-continuation-enforcer (todo 완료 강제)

event (세션 이벤트)
  ├─> session-recovery (세션 복구)
  ├─> context-window-monitor (컨텍스트 윈도우 감시)
  ├─> background-notification (백그라운드 완료 알림)
  └─> ralph-loop (자기 참조적 개발 루프)
```

### 주요 훅

| 훅 | 위치 | 핵심 기능 |
|-----|--------|----------|
| **todo-continuation-enforcer** | `src/hooks/todo-continuation-enforcer/` | 에이전트가 todo 완료 전에 멈추는 것을 방지 |
| **context-window-monitor** | `src/hooks/context-window-monitor/` | 70%+ 사용 시 여유 공간 알림 |
| **tool-output-truncator** | `src/hooks/tool-output-truncator/` | 남은 컨텍스트 50% 유지하며 최대 50k 토큰까지 자르기 |
| **ralph-loop** | `src/hooks/ralph-loop/` | 자기 참조적 루프, 완료까지 반복 |
| **comment-checker** | `src/hooks/comment-checker/` | 코멘트 추가 억제 (BBD, 지시어, docstring 제외) |
| **keyword-detector** | `src/hooks/keyword-detector/` | `ultrawork`, `search`, `analyze` 키워드 감지 |
| **auto-update-checker** | `src/hooks/auto-update-checker/` | 업데이트 확인, 시작 시 토스트 알림 |

---

## 4. 도구 시스템 (`src/tools/`)

### 도구 카테고리

| 카테고리 | 도구 | 설명 |
|----------|-------|--------|
| **LSP (11개)** | lsp_goto_definition, lsp_find_references, lsp_symbols, lsp_diagnostics, lsp_prepare_rename, lsp_rename | 구문적 코드 인텔리전스 |
| **AST-Grep (2개)** | ast_grep_search, ast_grep_replace | 25개 언어 AST-인식 패턴 매칭 (C++ 바인딩) |
| **Search (2개)** | grep, glob | 패턴 발견 (타임아웃/파일 제한 포함) |
| **Session (4개)** | session_list, session_read, session_search, session_info | OpenCode 세션 기록 탐색 |
| **Agent 위임 (3개)** | delegate_task, call_omo_agent, background_output, background_cancel | 에이전트 작업 위임 및 관리 |
| **System (2개)** | interactive_bash, look_at | CLI 명령, 멀티모달 분석 |
| **Skill (3개)** | skill, skill_mcp, slashcommand | 스킬 실행 및 MCP 호출 |

### LSP 도구 구현

```typescript
// LSP 클라이언트 관리 (client.ts - 597줄)
class LSPClient {
  - private proc: Subprocess            // LSP 서버 프로세스
  - private pending: Map<id, handler> // 진행 중 요청
  - private diagnosticsStore: Map<uri, Diagnostic[]> // 진단 정보 캐시

  async start()       // stdio로 서버 시작
  async initialize()  // LSP 핸드셰이크 교환
  async openFile()   // 파일 열기
  async definition()   // 정의로 이동
  async references()  // 참조 검색
  async diagnostics() // 진단 확인
  async rename()      // 심볼 리네임
}

// 싱글턴 매니저 (client.ts)
class LSPServerManager {
  - private clients: Map<key, ManagedClient>
  - private cleanupInterval: Timer (60초)

  async getClient(root, server)  // ref counting, 유휨한 것 정리
  async stopAll()                  // 모든 클라이언트 중지
}
```

**LSP 프로토콜**:
- 표준 JSON-RPC 2.0
- `Content-Length` 헤더 + `\r\n\r\n` + JSON body
- 15초 타임아웃

### AST-Grep 도구

```typescript
// @ast-grep/napi C++ 바인딩 (ast-grep/napi.ts)
ast_grep_search(pattern: string, lang: string, context: number)
  // $VAR: 단일 노드 매칭
  // $$$: 다중 노드 매칭

ast_grep_replace(pattern: string, rewrite: string, lang: string, dryRun: boolean)
  // AST-인식 코드 교체
  // dry-run: true로 시험 후 적용
```

**지원 언어**: TypeScript, JavaScript, Python, Java, Kotlin, Go, Rust, Scala, Solidity, Swift, Bash, Elixir, C, C++, C#, CSS, HTML, YAML (25개)

### 위임 도구 (`delegate_task`)

**카테고리 기반 모델 우선순위**:
```
1. 사용자 정의 모델 (config.json)
2. 카테고리 기본값
3. 부모 세션 모델 (상속)
4. 시스템 기본값
```

**카테고리별 설정**:
| 카테고리 | 기본 모델 | Temperature | 용도 |
|----------|-----------|-------------|------|
| `visual-engineering` | `google/gemini-3-pro-preview` | 0.7 | 프론트엔드, UI/UX |
| `ultrabrain` | `openai/gpt-5.2` | 0.1 | 백엔드 로직, 아키텍처 |
| `general` | `anthropic/claude-opus-4-5` | 0.1 | 일반 작업 (기본) |

---

## 5. 백그라운드 에이전트 시스템 (`src/features/background-agent/`)

### 매니저 아키텍처 (1166줄)

```typescript
class BackgroundManager {
  private tasks: Map<taskID, BackgroundTask>
  private notifications: Map<sessionID, BackgroundTask[]>
  private pendingByParent: Map<sessionID, Set<taskID>>
  private concurrencyManager: ConcurrencyManager

  async launch(input: LaunchInput): Promise<BackgroundTask>
  async resume(input: ResumeInput): Promise<BackgroundTask>
  async trackTask(input: TaskTrackInput): Promise<BackgroundTask>
  handleEvent(event: Event): void
  shutdown(): void
}
```

### 태스크 수명주기

```
launch()
  └─> concurrency.acquire()         // 동시성 제한 슬롯 획득
      └─> client.session.create()        // 백그라운드 세션 생성
            └─> prompt() (fire-and-forget)  // 프롬프트 전송
                  └─> [polling 시작, 2초 간격]
                        └─> session.idle 이벤트 감지
                              └─> validateSessionHasOutput()  // 실제 출력 확인
                                    └─> tryCompleteTask()     // 완료 처리
                                          └─> concurrency.release()   // 슬롯 해제
                                                └─> notifyParentSession() // 시스템 리마인더 전송
```

### 완료 감지 전략

| 조건 | 설명 |
|-------|--------|
| **세션 idle** | 세션 상태가 `idle`일 때 |
| **안정성 확인** | 3회 연속 폴링에서 메시지 수량 동일 |
| **출력 검증** | 최소 1개의 assistant/tool 메시지 + 실제 내용 확인 |
| **Todo 완료** | incomplete todo가 0개일 때 |

### 동시성 관리

```typescript
class ConcurrencyManager {
  acquire(key: string): Promise<void>      // 슬롯 대기
  release(key: string): void                // 슬롯 해제
  clear(): void                            // 모든 대기 해제 (종료 시)
}
```

**제한 설정**:
```jsonc
{
  "background_task": {
    "defaultConcurrency": 5,
    "providerConcurrency": {
      "anthropic": 3,
      "openai": 5,
      "google": 10
    },
    "modelConcurrency": {
      "anthropic/claude-opus-4-5": 2,
      "google/gemini-3-flash": 10
    }
  }
}
```

**우선순위**: `modelConcurrency` > `providerConcurrency` > `defaultConcurrency`

---

## 6. MCP (Model Context Protocol) 시스템 (`src/mcp/`)

### 3계층 MCP 아키텍처

```
1. 내장형 (Built-in) MCP:
   - websearch: Exa AI 기반 실시간 웹 검색
   - context7: 공식 문서 조회 (context7.io)
   - grep_app: GitHub 코드 검색 (grep.app)

2. Claude Code 호환성 MCP:
   - ~/.claude/.mcp.json
   - ./.mcp.json
   - ~/.claude/.mcp.json
   - 환경 변수 확장: ${VAR} 문법 지원

3. 스킬 임베디드 MCP:
   - SKILL.md frontmatter에 mcp 구성
   - skill-mcp-manager가 관리
   - 세션 범위 라이프사이클, 5분 유휨 시 정리
```

### Skill-Embedded MCP 예시

```yaml
---
description: Browser automation skill
mcp:
  playwright:
    command: npx
    args: ["-y", "@anthropic-ai/mcp-playwright"]
---
```

**MCP 도구 호출** (`skill_mcp`):
```typescript
skill_mcp(
  mcp_name: "playwright",
  tool_name: "navigate",
  arguments: '{"url": "https://example.com"}'
)
```

---

## 7. 스킬 시스템 (`src/features/`)

### 스킬 로딩 순위

```
1. .opencode/skill/          (프로젝트, 최우선)
2. ~/.config/opencode/skill/  (사용자 전역)
3. .claude/skills/*/SKILL.md  (프로젝트, Claude Code 호환성)
4. ~/.claude/skills/*/SKILL.md (사용자, Claude Code 호환성)
5. opencode-global (글로벌, oh-my-opencode 내장형)
6. opencode-project (프로젝트, oh-my-opencode 내장형)
```

### 내장형 스킬

| 스킬 | MCP | 설명 |
|------|-----|------|
| **playwright** | @anthropic-ai/mcp-playwright | 브라우저 자동화, 스크래핑, 테스트, 스크린샷 |
| **git-master** | - | 원자적 커밋, rebase/squash, 이력 검색 (blame, bisect, log -S) |

### 스킬 실행 프로세스

```typescript
// skill 도구 (src/tools/skill/tools.ts)
1. 스킬 이름으로 스킬 콘텐츠 확인
2. SKILL.md의 프롬프트 + 사용자 prompt 병합
3. 스킬에 MCP가 있으면 skill-mcp-manager가 클라이언트 생성
4. client.session.prompt()로 실행
```

---

## 8. Claude Code 호환성 레이어 (`src/features/claude-code-*-loader/`)

### 로더별 로딩 경로

| 로더 | 경로 (우선순위) |
|------|-------------------|
| **command-loader** | `.opencode/command/` > `~/.config/opencode/command/` > `.claude/commands/` > `~/.claude/commands/` |
| **skill-loader** | `.opencode/skill/` > `~/.config/opencode/skill/` > `.claude/skills/` |
| **agent-loader** | `.claude/agents/*.md` > `~/.claude/agents/*.md` |
| **mcp-loader** | `.claude/.mcp.json` > `.mcp.json` > `~/.claude/.mcp.json` |
| **hooks-loader** | `~/.claude/settings.json` > `./.claude/settings.json` > `~/.claude/settings.local.json` |

### 호환성 토글

```jsonc
{
  "claude_code": {
    "mcp": false,           // .mcp.json 건너뛰기
    "commands": false,       // commands/*.md 건너뛰기
    "skills": false,        // skills/*/SKILL.md 건너뛰기
    "agents": false,         // agents/*.md 건너뛰기
    "hooks": false,         // settings.json 훅 건너뛰기
    "plugins_override": {     // 특정 플러그인 비활성화
      "claude-mem@thedotmack": false
    }
  }
}
```

---

## 9. 컨텍스트 주입 시스템 (`src/features/context-injector/`)

### AGENTS.md/README.md 주입

```
파일을 읽을 때:
  → 파일 디렉토리에서 프로젝트 루트까지 순회
  → 경로의 모든 AGENTS.md 파일 수집
  → 각 디렉토리의 AGENTS.md는 세션당 한 번만 주입

예:
  project/AGENTS.md              # 프로젝트 전역 컨텍스트
  src/AGENTS.md                  # src 전용 컨텍스트
  src/components/AGENTS.md        # components 전용 컨텍스트

Button.tsx 읽을 때 주입 순서:
  1. project/AGENTS.md
  2. src/AGENTS.md
  3. src/components/AGENTS.md
```

### 규칙 주입 (`.claude/rules/`)

```markdown
---
globs: ["*.ts", "src/**/*.js"]
description: "TypeScript/JavaScript 코딩 규칙"
---

- 인터페이스 이름은 PascalCase 사용
- 함수 이름은 camelCase 사용
```

**로딩 순서**:
```
파일 디렉토리 → 프로젝트 루트 → ~/.claude/rules/
조건: globs 패턴 매칭
항상 적용: alwaysApply: true
```

---

## 10. 설정 시스템 (`src/config/`)

### 설정 파일 위치 (우선순위)

```
1. .opencode/oh-my-opencode.jsonc  (프로젝트, JSONC 지원)
2. ~/.config/opencode/oh-my-opencode.json  (사용자, 플랫폼 의존)
3. %APPDATA%\opencode\oh-my-opencode.json  (Windows 폴백업)
```

### 설정 스키마 (Zod)

```typescript
// schema.ts의 핵심 타입
interface OhMyOpenCodeConfig {
  agents?: Record<string, AgentOverrideConfig>        // 에이전트 모델/프롬프트 재정의
  categories?: CategoriesConfig                     // 사용자 정의 카테고리
  disabled_hooks?: HookName[]                      // 비활성화할 훅
  disabled_skills?: string[]                        // 비활성화할 스킬
  disabled_mcps?: string[]                          // 비활성화할 MCP
  disabled_agents?: string[]                         // 비활성화할 에이전트
  background_task?: BackgroundTaskConfig            // 동시성 제한
  git_master?: GitMasterConfig                    // git-master 행동
  sisyphus_agent?: SisyphusAgentConfig          // Sisyphus 오케스트레이터
  claude_code?: ClaudeCodeConfig                    // 호환성 토글
  experimental?: ExperimentalConfig                  // 실험적 기능
}

interface AgentOverrideConfig {
  model?: string                 // provider/model 형식
  temperature?: number         // 0.0~1.0
  top_p?: number              // 0.0~1.0
  maxTokens?: number          // 최대 토큰
  prompt?: string            // 프롬프트 완전 재정의
  prompt_append?: string     // 기본 프롬프트에 추가
  tools?: {include?: string[], exclude?: string[]} // 도구 허용/차단
  disable?: boolean           // 에이전트 비활성화
  permission?: {               // 권한 제한
    edit?: "ask" | "allow" | "deny"
    bash?: "ask" | "allow" | "deny" | Record<string, "allow" | "deny">
    webfetch?: "ask" | "allow" | "deny"
  }
}
```

### JSONC 지원

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",

  /* 주석 허용 */
  // 한 줄 주석
  /* 블록 주석 */
  "agents": {
    "oracle": {
      "model": "openai/gpt-5.2"  // 라인 끝 쉼표 허용
    },
  },
}
```

---

## 11. 공통 유틸리티 (`src/shared/`)

### 주요 유틸리티 모듈

| 모듈 | 기능 | 핵심 내용 |
|------|--------|-----------|
| **agent-variant** | 에이전트 모델 변형 적용 | first-message-variant 게이트, resolveAgentVariant |
| **permission-compat** | 권한 호환성 | createAgentToolRestrictions, 권한 매핑 |
| **config-errors** | 설정 오류 보고 | ConfigLoadError, 포맷팅, 사용자 친화적 메시지 |
| **log** | 로깅 | 구조화된 로깅, 환경 변수 조건부 로깅 |

---

## 12. Ralph Loop (`src/hooks/ralph-loop/`)

### 자기 참조적 개발 루프

```
/ralph-loop "Build a REST API"
  └─> 반복 시작
      └─> <promise>DONE</promise> 감지 → 완료
      └─> agent 완료 전 → 자동 계속
      └─> 최대 반복 회수 (기본 100)
      └─> /cancel-ralph → 취소
```

**완료 감지**:
- `<promise>DONE</promise>` 텍스트 프레이스
- `completion-promise="DONE"` 옵션 지원

**구성**:
```jsonc
{
  "ralph_loop": {
    "enabled": true,
    "default_max_iterations": 100
  }
}
```

---

## 13. 데이터 흐름 패턴

### 에이전트 위임 흐름

```
메인 에이전트 (Sisyphus)
  ├─> delegate_task(category="visual", background=true, prompt="...")
  │   └─> BackgroundManager.launch()
  │       └─> 별도 세션 생성 + 프롬프트 전송
  │           └─> [polling]
  │               └─> 완료 감지 → notifyParentSession()
  │                   └─> 시스템 리마인더 삽입
  └─> background_output(task_id="bg_xxx")  ← 사용자가 결과 조회 시 결과 반환
```

### LSP 도구 호출 흐름

```
도구 호출
  ├─> LSPServerManager.getClient(root, server)
  │   ├─> refCount++ (기존 클라이언트)
  │   └─> new LSPClient() (새 클라이언트)
  │       └─> client.start() → client.initialize()
  │           └─> JSON-RPC 요청 전송
  │               └─> pending[id] = resolve/reject
  │                   └─> 응답 처리 (15초 타임아웃)
```

### MCP 도구 호출 흐름

```
skill_mcp(mcp_name, tool_name, arguments)
  ├─> SkillMcpManager.getClient(mcp_name)
  │   └─> 지연 초기화 (첫 호출 시)
  │       └─> process/stdio/http 전송 시작
  │           └─> 스키마 발견 (tool list)
  │               └─> 클라이언트 캐시 (세션 범위)
  │                   └─> 5분 유휨 시 정리
```

---

## 14. 안티 패턴 및 모범 사례

### 안티 패턴 (금지 사항)

| 카테고리 | 금지 패턴 | 이유 |
|----------|-----------|------|
| **타입 안전성** | `as any`, `@ts-ignore`, `@ts-expect-error` | 타입 오류 억제 |
| **에러 처리** | `catch(e) {}` 빈 catch 블록 | 에러 무시 |
| **테스트** | 실패한 테스트 삭제 → "통과" | 거짓 긍정 |
| **검색** | 단일 줄 오타 수정에 에이전트 발동 | 과도한 에이전트 사용 |
| **프론트엔드** | 직접 시각적 코드 수정 → 전문가 위임 필요 | UI 전문성 부족 |
| **디버깅** | 샷건 디버깅 (랜덤 변경) | 근본 원인 미탐색 |
| **에이전트 호출** | 순차적 호출 → 병렬 병목 | 성능 저하 |

### 모범 사례

| 패턴 | 설명 |
|------|--------|
| **병렬 탐색** | explore/librarian 백그라운드로 동시 호출 → 결과 집계 |
| **위임 분리** | 시각적 → frontend-ui-ux, 논리직 → oracle/explore |
| **상태 전달** | 이전 작업 학습 → 다음 태스크 프롬프트에 포함 |
| **검증 강제** | subagent 완료 → lsp_diagnostics + 빌드 + 테스트 |
| **컨텍스트 보존** | Compaction 시 AGENTS.md/README.md 유지 |
| **백그라운드 활용** | 독립 작업 → 병렬 실행, 메인 작업 계속 |

---

## 15. CLI 시스템 (`src/cli/`)

### CLI 구조

```
cli/
├── install.ts       # 대화형 TUI 인스톨러 (462줄)
├── run/
│   ├── runner.ts      # 명령어 실행기
│   ├── events.ts      # 이벤트 처리
│   ├── completion.ts  # 셸 자동완성
│   └── index.ts       # 바이너리 진입점
├── doctor/
│   ├── runner.ts      # 상태 확인
│   ├── formatter.ts   # 출력 포맷팅
│   ├── checks/        # 14개 카테고리별 검사
│   └── index.ts       # doctor 명령어
├── get-local-version/  # 로컬 버전 확인
└── index.ts           # CLI 메인 진입점
```

### 인스톨러 흐름

```typescript
// install.ts (462줄)
1. Claude 구독 확인 → --claude=yes/no/max20
2. ChatGPT 구독 확인 → --chatgpt=yes/no
3. Gemini 사용 확인 → --gemini=yes/no
4. GitHub Copilot 확인 → --copilot=yes/no
5. opencode.json 수정 (플러그인 등록)
6. 에이전트 모델 설정
7. 인증 가이드 제공
8. 검증 명령어 제안
9. ⭐ 요청 (사용자 동의 시)
```

---

## 16. 빌드 및 배포

### 빌드 명령어

```bash
bun run typecheck      # TypeScript 타입 검사
bun run build          # ESM + 선언 파일 생성
bun run rebuild        # clean + build
bun run build:schema   # 스키마만 빌드
bun test               # 84개 테스트 파일 실행
```

### 빌드 결과물

```
dist/
├── index.js            # ESM 번들
├── index.d.ts          # TypeScript 선언
├── tools/
│   └── *.js          # 도구 모듈
├── agents/
│   └── *.js          # 에이전트 모듈
└── features/
    └── *.js          # 기능 모듈
```

### CI 파이프라인

**ci.yml**:
1. 병렬: `bun test` + `bun run typecheck`
2. 빌드: `bun run build`
3. 스키마 자동 커밋 (master 브랜치)
4. rolling `next` release

**publish.yml** (workflow_dispatch):
1. 버전 증가: patch/minor/major
2. CHANGELOG 생성
3. 8개 패키지 OIDC npm publish
4. master 브랜치 force push

---

## 17. 성능 최적화

### 동시성 전략

| 레벨 | 전략 | 예시 |
|------|--------|------|
| **백그라운드 에이전트** | 독립 작업 병렬 실행 | explore/librarian 동시에 여러 개 실행 |
| **LSP 클라이언트** | ref counting | 동일 서버 재사용, 5분 유휨 시 정리 |
| **MCP 클라이언트** | 지연 초기화 | 첫 호출 시만 생성, 5분 유휨 시 정리 |
| **훅 실행** | 가벼운 PreToolUse | PreToolUse에서 계산 없이, PostToolUse에서 집계 |

### 컨텍스트 관리

| 전략 | 구현 | 효과 |
|--------|--------|------|
| **도구 출력 자르기** | 남은 컨텍스트 50% 유지 | 100k 남았을 때 최대 50k만 사용 |
| **사전 Compaction** | 85% 사용 시 요약 | 하드 리밋 도달 전 자동 요약 |
| **AGENTS.md 캐싱** | 디렉토리별 세션당 한 번 주입 | 중복 주입 방지 |
| **메시지 안정성** | 3회 폴링 동일 메시지 수량 | 조기 완료 방지 |

---

## 18. 보안성 및 신뢰성

### 보안 고려사항

1. **도구 제한**: 각 에이전트별 허용 도구 허용목록 (`tools: {include/exclude}`)
2. **권한 제어**: `edit: ask/deny`, `bash: ask/deny` 등 세밀한 제어
3. **에러 처리**: 빈 catch 블록 금지, 의미 있는 에러 메시지
4. **입력 검증**: 모든 사용자 입력 검증, SQL Injection 방지
5. **비밀 보호**: 민감 정보(토큰, 키) 로그에 미포함
6. **파일 경로 검증**: `resolve()` 사용, 경로 순회 공격 방지

### 신뢰성 보장

1. **하위 에이전트 검증**: subagent "완료" 주장 → lsp_diagnostics + 빌드 + 테스트
2. **상태 복구**: 세션 오류 복구, thinking block 오류 복구
3. **출력 검증**: 실제 assistant/tool 메시지 + 내용 확인
4. **동시성 보장**: 슬롯 기반으로 초과 실행 방지
5. **타임아웃 처리**: LSP 15초, 폴링 10분 타임아웃

---

## 19. 확장성 및 모듈성

### 새 에이전트 추가

```typescript
// 1. 에이전트 파일 생성
// src/agents/my-agent.ts
export const MY_AGENT_PROMPT_METADATA: AgentPromptMetadata = {
  name: "my-agent",
  description: "...",
  model: "openai/gpt-5.2",
}

// 2. 내장형 에이전트 등록
// src/agents/index.ts
export const builtinAgents = {
  myAgent: createMyAgent(),
  // ... 기존 에이전트
}

// 3. AgentNameSchema 업데이트
// src/config/schema.ts
const AgentNameSchema = z.enum([
  "oracle", "librarian", "explore",
  "frontend-ui-ux-engineer", "document-writer",
  "multimodal-looker", "my-agent", // 추가
])
```

### 새 도구 추가

```typescript
// 1. 도구 폴더 생성
// src/tools/my-tool/
// ├── index.ts (export)
// ├── tools.ts (logic)
// ├── types.ts (Zod schema)
// └── constants.ts

// 2. 도구 등록
// src/tools/index.ts
import { myTool } from "./my-tool"

export const builtinTools = {
  myTool,
  // ... 기존 도구
}
```

### 새 훅 추가

```typescript
// 1. 훅 생성
// src/hooks/my-hook/index.ts
export const createMyHook = (ctx: PluginInput) => {
  return {
    "tool.execute.before": async (input, output) => {...},
    "tool.execute.after": async (input, output) => {...},
  }
}

// 2. 훅 등록 및 훅 체크
// src/index.ts
const myHook = isHookEnabled("my-hook")
  ? createMyHook(ctx)
  : null
```

---

## 20. 결론

OhMyOpenCode는 OpenCode 생태계를 위한 **다층적 오케스트레이션 플랫폼**입니다.

### 핵심 특징

1. **다중 모델**: Claude, GPT, Gemini, Grok, GLM 최적 활용
2. **전문화 에이전트**: 10개 에이전트로 도메인별 최적화
3. **백그라운드 병렬처리**: 독립 작업 동시 실행, 메인 작업 중단 없음
4. **LSP/AST-Grep**: 구문적 코드 인텔리전스와 안전한 리팩터링
5. **호환성**: Claude Code 완전 호환성, 기존 설정 재사용
6. **모듈성**: 플러그형 훅/도구/기능 분리, 확장 용이
7. **생산성**: Todo 강제, 자동 완료 감지, 세션 복구
8. **TDD**: RED-GREEN-REFACTOR 기반 테스트 문화

### 아키텍처 철학

> **"AI도 인간처럼 코드를 작성한다면, 우리는 인간처럼 그들에게 도구를 주어야 한다."**

- 에이전트에게 최고의 도구(LSP, AST-Grep) 제공
- 전문가에게 전문 도구 프링(Frontend → Gemini, Backend → GPT)
- 오케스트레이터에게 조정 능력(Sisyphus + delegate_task) 부여
- 개발자에게 생산성(Todo 강제, 백그라운드 병렬) 보장

---

**문서 버전**: 1.0.0
**최종 수정**: 2026-01-18
