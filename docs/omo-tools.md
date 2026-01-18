# OMO 도구 시스템 가이드

**생성일**: 2026-01-18
**작성 목적**: src/tools 디렉토리를 분석하고 한국어로 정리 문서 작성

---

## 1. 개요

이 문서는 OhMyOpenCode의 **tools/** 디렉토리에 있는 12개 주요 도구 시스템에 대한 포괄적인 가이드입니다.

---

## 2. 도구 시스템 분류

### 2.1 코드 검색 및 분석

| 도구 하위 폴더 | 주요 기능 | 파일 위치 |
|--------------|--------------|-----------|----------|
| **ast-grep** | AST-Aware 패턴 매칭 및 교체 (25개 언어 지원) | src/tools/ast-grep/ |
| **glob** | 파일 패턴 매칭 (*, **, 경로 와일드카드) | src/tools/glob/ |
| **grep** | 정규표현식을 사용한 텍스트 내용 검색 | src/tools/grep/ |

### 2.2 LSP (Language Server Protocol)

| 도구 하위 폴더 | 주요 기능 | 파일 위치 |
|--------------|--------------|-----------|----------|
| **lsp** | 구문적 코드 인텔리전스 (11개 하위 도구) | src/tools/lsp/ |

### 2.3 세션 및 백그라운드 작업

| 도구 하위 폴더 | 주요 기능 | 파일 위치 |
|--------------|--------------|-----------|----------|
| **background-task** | 백그라운드 에이전트 관리 (태스크 수명주기, 완료 감지) | src/tools/background-task/ |
| **call-omo-agent** | 에이전트 호출 기능 | src/tools/call-omo-agent/ |
| **delegate-task** | 작업 위임 시스템 (카테고리 기반, 에이전트 선택) | src/tools/delegate-task/ |

### 2.4 세션 관리

| 도구 하위 폴더 | 주요 기능 | 파일 위치 |
|--------------|--------------|-----------|----------|
| **session-manager** | 세션 상태 추적, 세션 ID 관리, 세션 복구 | src/tools/session-manager/ |

### 2.5 스킬 시스템

| 도구 하위 폴더 | 주요 기능 | 파일 위치 |
|--------------|--------------|-----------|----------|
| **skill** | 스킬 파일 관리, 스킬 MCP 서버 연동 | src/tools/skill/ |
| **slashcommand** | 슬래시 명령어 스킬 (`/playwright`, `/start-work` 등) | src/tools/slashcommand/ |

### 2.6 미디어 및 기타

| 도구 하위 폴더 | 주요 기능 | 파일 위치 |
|--------------|--------------|-----------|----------|
| **look-at** | 미디어 파일 분석 (PDF, 이미지, 다이어그램) | src/tools/look-at/ |
| **interactive-bash** | tmux를 사용한 대화형 bash 세션 관리 | src/tools/interactive-bash/ |

---

## 3. AST-Grep

### 3.1 개요

@ast-grep/napi C++ 바인딩을 사용한 AST-인식 코드 패턴 매칭 및 교체 도구입니다. 25개 프로그래밍 언어를 지원하며, 구문적 분석을 통해 안전한 리팩터링을 지원합니다.

### 3.2 사용 가능한 도구

| 도구 | 설명 | 사용법 |
|------|--------|--------|
| **ast_grep_search** | AST 패턴 매칭 | 메타변수 `$VAR`(단일 노드), `$$$`(다중 노드) 사용하여 패턴 검색 |
| **ast_grep_replace** | AST 패턴 교체 | 검색 패턴을 다른 패턴으로 교체 (dry-run으로 시험 가능) |

### 3.3 주요 패턴

```typescript
// 단일 노드 매칭
ast_grep_search(
  pattern: "const $NAME = function($$$) { return $$$ }",
  lang: "typescript"
)

// 다중 노드 매칭
ast_grep_search(
  pattern: "export async function $NAME($$$) { await $$$ }",
  lang: "typescript"
)

// 구조적 패턴 검색
ast_grep_search(
  pattern: "class $NAME extends Component { $$$ }",
  lang: "typescript"
)
```

---

## 4. LSP

### 4.1 개요

Language Server Protocol(LSP)을 구현한 11개 하위 도구입니다. LSP 서버와 통신하여 구문적 코드 분석, 심볼 탐색, 참조 찾기, 진단 정보 확인, 심볼 이름 변경 등의 기능을 제공합니다.

### 4.2 사용 가능한 도구

| 도구 | 설명 |
|------|--------|
| **lsp_goto_definition** | 심볼 정의 위치로 이동 |
| **lsp_find_references** | 심볼의 모든 사용 위치 찾기 |
| **lsp_symbols** | 파일 내의 심볼 정의 목록 가져오기 |
| **lsp_diagnostics** | 파일의 오류, 경고, 힌트 정보 확인 |
| **lsp_document_symbols** | 특정 파일의 심볼 정의 목록 (계층적) |
| **lsp_workspace_symbols** | 워크스페이스 전체에서 심볼 검색 |
| **lsp_prepare_rename** | 안전한 심볼 이름 변경 준비 |
| **lsp_rename** | 심볼 이름 변경 (함수, 변수, 클래스 등) |
| **lsp_code_actions** | 코드 액션(서식 제거, 코드 정렬 등) 수행 |

### 4.3 LSP 서버 관리

- **ref counting**: 동일 서버에 대한 참조 카운트를 유지하며, 유휴한 경우 정리
- **connection pooling**: 최대 10개 서버까지 연결 풀을 유지
- **cleanup**: 사용하지 않는 서버는 5분 후 자동으로 종료

---

## 5. Glob

### 5.1 개요

glob은 파일 패턴 매칭을 위한 유틸리티 도구입니다. 와일드카드(`*`, `**`), 경로(`**/*.ts`) 등의 패턴을 사용하여 파일을 찾을 수 있습니다.

### 5.2 사용법

```typescript
// 모든 TypeScript 파일 찾기
glob("**/*.ts")

// src 디렉토리와 하위 디렉토리 모든 테스트 파일 찾기
glob("**/*.test.ts")

// 특정 폴더의 파일 찾기
glob("src/components/**/*")
```

### 5.3 지원하는 패턴

| 패턴 | 설명 | 예시 |
|--------|--------|--------|
| `*` | 모든 파일 | `*.ts` (모든 .ts 파일) |
| `**` | 0개 이상의 하위 디렉토리 | `src/**/*` (src 및 모든 하위 폴더) |
| `?` | 단일 문자 와일드카드 | `file?.ts` (file 또는 .ts) |

---

## 6. Grep

### 6.1 개요

grep은 정규표현식을 사용한 텍스트 검색 도구입니다. 파일 내용 검색, 코드 주석 검색, 로그 파일 분석 등의 기능을 제공합니다.

### 6.2 사용법

```typescript
// 특정 패턴 검색
grep("async function fetch", {
  include: ["*.ts", "*.tsx"],
  exclude: ["node_modules"]
})

// 대소문자 구분 옵션
grep("Error", {
  ignoreCase: true
})

// 여러 파일 병렬 검색
glob("**/*.ts").then(files => {
  grep("const API_ENDPOINT", files)
})
```

### 6.3 주요 옵션

| 옵션 | 설명 |
|--------|--------|
| `include` | 검색 대상 파일 패턴 (예: `["*.ts", "*.tsx"]`) |
| `exclude` | 검색 제외 파일 패턴 (예: `["node_modules", "dist"]`) |
| `context` | 매칭 라인의 전후 컨텍스트 지정 (예: `10줄`) |

---

## 7. Background Task

### 7.1 개요

background-task는 백그라운드 에이전트 실행 시스템의 핵심 컴포넌트입니다. 별도의 세션에서 독립적으로 에이전트를 실행하고 완료 시 OS 알림을 보냅니다.

### 7.2 주요 기능

| 기능 | 설명 |
|--------|--------|
| **태스크 관리** | `Map<taskID, BackgroundTask>` 구조로 에이전트 추적 |
| **동시성 제어** | 카테고리별/모델별 동시 실행 수 제한 |
| **완료 감지** | 세션 상태 분석(idle 감지)을 통해 에이전트 완료 판정 |
| **알림 시스템** | OS 네이티브 알림(Mac: afplay, Linux: notify-send) 연동 |
| **세션 복구** | `delegate_task`의 `resume` 파라미터를 통해 중단된 작업 재개 |

### 7.3 태스크 수명주기

```typescript
interface BackgroundTask {
  id: string
  sessionID: string
  prompt: string
  agent: string
  createdAt: Date
  status: "pending" | "running" | "completed" | "failed"
  result?: unknown
  completedAt?: Date
}
```

---

## 8. Call OMO Agent

### 8.1 개요

call-omo-agent는 `explore`, `librarian`, `frontend-ui-ux-engineer` 등의 전문화 에이전트를 호출하는 기능입니다. 백그라운드 실행 및 동기 실행을 지원합니다.

### 8.2 사용법

```typescript
// 백그라운드 실행
call_omo_agent(
  subagent_type="explore",
  prompt="인증 구현 찾기",
  background=true
)

// 동기 실행
call_omo_agent(
  subagent_type="librarian",
  prompt="공식 문서 찾기",
  background=false
)

// 작업 재개
call_omo_agent(
  resume="ses_abc123",
  prompt="중단된 부분 확인"
)
```

### 8.3 에이전트 타입

| 에이전트 | 설명 |
|--------|--------|
| `explore` | 코드베이스 탐색 전문가 (Grok Code) |
| `librarian` | 문서 및 GitHub 연구 전문가 (GLM-4.7-free) |
| `frontend-ui-ux-engineer` | UI/UX 엔지니어 (Gemini 3 Pro) |
| `multimodal-looker` | 미디어 파일 분석 (Gemini 3 Flash) |
| `document-writer` | 기술 문서 작성 전문가 (Gemini 3 Flash) |

---

## 9. Delegate Task

### 9.1 개요

delegate_task는 작업을 적절한 에이전트에게 위임하는 시스템입니다. 카테고리(Category) 기반, 사용자 정의한 에이전트 등을 지원하며, Todo를 통한 작업 추적을 강화합니다.

### 9.2 카테고리(Category) 시스템

### 기본 카테고리

| 카테고리 | 모델 | Temperature | 용도 |
|-----------|-------|-----------|--------|
| `visual-engineering` | `google/gemini-3-pro` | 0.7 | 프론트엔드, UI/UX |
| `ultrabrain` | `openai/gpt-5.2` | 0.1 | 백엔드 로직, 아키텍처 |
| `artistry` | `google/gemini-3-pro` | 0.9 | 창의적 아이디어 |
| `quick` | `claude-haiku` | 0.3 | 빠른 작업, 스크립트 작성 |
| `writing` | `google/gemini-3-flash` | 0.5 | 문서 작성 |

### 9.3 위임 프롬프트 구조

```typescript
delegate_task({
  category: "visual-engineering",
  agent: "frontend-ui-ux-engineer",
  prompt: "대시보드 페이지 컴포넌트 추가",
  background: true
})
```

---

## 10. Session Manager

### 10.1 개요

session-manager는 세션 상태 추적, 세션 ID 관리, 세션 복구를 담당하는 도구입니다. Sisyphus 오케스트레이터의 핵심 상태 저장소로 사용됩니다.

### 10.2 주요 기능

| 기능 | 설명 |
|--------|--------|
| **세션 ID 관리** | `Map<sessionID, SessionState>` 구조로 세션 상태 추적 |
| **TODO 추적** | 각 세션의 진행 중인 TODO 목록 관리 |
| **세션 복구** | 세션 충돌 시 마지막 활성 상태 복구 |
| **세션 데이터 저장** | `.sisyphus/boulder.json` 파일에 상태 저장 |

### 10.3 세션 상태 데이터 구조

```typescript
interface SessionState {
  id: string
  messages: Message[]
  isActive: boolean
  boulder?: BoulderState
}
```

---

## 11. Interactive Bash

### 11.1 개요

interactive-bash는 tmux를 사용한 대화형 bash 세션 관리를 담당합니다. `interactive_bash` 도구를 통해 tmux 세션에서 명령어를 안전하게 실행할 수 있습니다.

### 11.2 주요 기능

| 기능 | 설명 |
|--------|--------|
| **세션 관리** | omo-{name} 형식의 tmux 세션 생성/접속 |
| **독립 실행** | 사용자가 대화형 쉘을 통해 독립적으로 명령어 실행 |
| **안전성** | tmux의 세션 격리를 사용하여 사용자 작업 영역 보호 |

---

## 12. Look At

### 12.1 개요

look-at은 PDF, 이미지, 다이어그램 등의 미디어 파일 분석 도구입니다. Gemini 3 Flash 모델을 사용하여 미디어 파일의 내용을 이해하고, 주요 정보를 추출합니다.

### 12.2 사용법

```typescript
look_at(
  file_path: "docs/architecture.pdf",
  goal: "PDF에서 아키텍처 다이어그램과 데이터 흐름 추출"
)
```

### 12.3 추출 가능한 정보

- PDF 문서의 텍스트 내용 및 구조화된 데이터
- 이미지에서 UI 요소, 레이아웃, 텍스트 캡션
- 다이어그램의 노드 구조, 엔티티 타입, 데이터 흐름
- 아키텍처 다이어그램의 서비스 관계 및 클라이언트-서버 통신

---

## 13. Slash Command

### 13.1 개요

slashcommand는 스킬(Skill)을 슬래시 명령어로 노출하는 시스템입니다. `/playwright`, `/start-work`, `/plan` 등의 사용자 정의 스킬을 슬래시 명령어로 변환하여 사용할 수 있게 합니다.

### 13.2 스킬 등록

SKILL.md 파일 구조:
```markdown
---
name: playwright
description: 브라우저 자동화 스킬
mcp:
  playwright:
    command: npx
    args: ["-y", "@anthropic-ai/mcp-playwright"]

---

# Playwright 스킬 프롬프트
...
```

### 13.3 스킬 실행

```typescript
// 스킬 도구 사용 (예: Playwright MCP)
skill_mcp(
  mcp_name: "playwright",
  tool_name: "navigate",
  arguments: '{"url": "https://example.com"}'
)
```

---

## 14. Skill System

### 14.1 개요

skill은 스킬 파일 관리 시스템입니다. `.opencode/skills/` 또는 `~/.claude/skills/` 디렉토리에서 스킬(SKILL.md)을 정의하고, 스킬 MCP 서버를 관리합니다.

### 14.2 스킬 파일 구조

```markdown
---
name: my-skill
description: 나만의 특수 스킬

mcp:
  my-mcp:
    command: npx
    args: ["-y", "my-mcp-server"]

---

# 내 스킬 프롬프트
...
```

### 14.3 스킬 MCP 연동

skill 시스템은 MCP 서버를 자동으로 시작하고, 에이전트에 MCP 도구를 노출합니다. Playwright MCP, git-master MCP 등이 통합되어 있습다.

---

## 참고

**관련 문서**:
- `omo-sisyphus-agent.md` - Sisyphus 오케스트레이터 (도구 위임 시스템 사용)
- `omo-category-skill-guide.md` - 카테고리 및 스킬 시스템

**문서 버전**: 1.0.0
**최종 수정일**: 2026-01-18
