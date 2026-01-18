# OMO 피처(Features) 시스템

**생성일**: 2026-01-18
**작성 목적**: src/features/ 디렉토리 분석 및 한국어로 정리

---

## 1. 개요

이 문서는 OhMyOpenCode의 **features/** 디렉토리에 있는 주요 피처(Features) 시스템에 대한 포괄적인 한국어 정리 문서입니다.

---

## 2. 피처 분류

### 2.1 백그라운드 에이전트 관리 (Background Agent Management)

| 폴더 | 주요 파일 | 역할 |
|--------|---------|--------|
| background-agent | manager.ts (1165줄) | 백그라운드 에이전트 관리, 세션 추적, 동시성 제어 |
| task-toast-manager | index.ts | 백그라운드 작업 완료 알림(TOAST) |
| concurrency | index.ts | 공급자 관리, 슬롯 기반 동시성 제어 |

### 2.2 상태 관리 (State Management)

| 폴더 | 주요 파일 | 역할 |
|--------|---------|--------|
| boulder-state | index.ts, storage.ts | 계획(Plan) 상태, 세션 ID 관리, 진행 상황 저장 |
| claude-code-session-state | index.ts | Claude Code 세션 상태 추적 |

### 2.3 내장 명령어 (Built-in Commands)

| 폴더 | 주요 파일 | 역할 |
|--------|---------|--------|
| builtin-commands | templates/, runner.ts | 내장 명령어 리스티 (git-master, help, version 등) |
| builtin-skills | templates/, index.ts | 스킬(MCP) 시스템 관리 |

### 2.4 Claude Code 호환성 (Claude Code Compatibility)

| 폴더 | 주요 파일 | 역할 |
|--------|---------|--------|
| claude-code-agent-loader | index.ts | settings.json에서 에이전트 로드 |
| claude-code-command-loader | index.ts | Claude Code 명령어 로드 (/command) |
| claude-code-mcp-loader | index.ts | Claude Code MCP 서버 로드 (.claude/mcp.json) |
| claude-code-plugin-loader | index.ts | Claude Code 플러그인 로드 (.claude/plugins/) |
| claude-code-session-state | index.ts | Claude Code 세션 상태 |

### 2.5 컨텍스트 주입 (Context Injection)

| 폴더 | 주요 파일 | 역할 |
|--------|---------|--------|
| context-injector | index.ts, types.ts | AGENTS.md, README.md 파일 자동 주입 |
| hook-message-injector | index.ts, constants.ts | 시스템 지시어(Reminder, Directive) 주입 |

### 2.6 기타 (Others)

| 폴더 | 주요 파일 | 역할 |
|--------|---------|--------|
| opencode-skill-loader | index.ts | 스킬(SKILL.md) 파일 로드 |
| task-toast-manager | index.ts | 알림 매니저(TOAST) |

---

## 3. 백그라운드 에이전트 관리 (Background Agent Management)

### 3.1 핵심 기능

백그라운드 에이전트 관리 시스템은 다음 기능을 제공합니다.

| 기능 | 설명 |
|--------|--------|------|
| **태스크 실행** | 독립 세션에서 에이전트를 비동기로 실행 (fire-and-forget) |
| **동시성 제어** | 프로바이더별, 모델별 동시성 제한 설정 가능 |
| **폴링 기반 결과 집계** | 에이전트 실행 완료 시 상위 세션에 결과 수집 |
| **알림 시스템** | 작업 완료 시 OS 알림(TOAST) 전송 |

### 3.2 동시성 관리 (Concurrency Management)

동시성 제어는 다음 기준으로 작동합니다.

| 수준 | 기본 설정 | 설명 |
|--------|-----------|--------|
| **기본값** | 5개 동시 실행 | oh-my-opencode.json에 별도 설정 없을 때 |
| **프로바이더별** | Anthropic 3개, OpenAI 5개, Google 10개 | oh-my-opencode.json에서 설정 가능 |
| **모델별** | Claude Opus 2개 | 프로젝트별로 모델별 설정 가능 |

### 3.3 컨피그 (Configuration)

```jsonc
{
  "background_task": {
    "defaultConcurrency": 5,
    "providerConcurrency": {
      "anthropic": 3,
      "openai": 5,
      "google": 10
    }
  }
}
```

---

## 4. 상태 관리 (State Management)

### 4.1 Boulder State

계획(Plan) 상태를 관리하는 시스템입니다. Prometheus가 생성한 계획 파일 경로, 현재 진행 상황, 세션 ID 등을 저장합니다.

| 기능 | 설명 |
|--------|--------|------|
| **계획 저장** | `.sisyphus/plans/{name}.md` 파일 경로 저장 |
| **세션 ID 추적** | 생성/실행 중인 계획과 연결된 세션 ID 관리 |
| **진행 상황 추적** | 현재 계획의 진행 상황, 완료된 작업 추적 |

### 4.2 Claude Code 세션 상태

Claude Code 호환성을 위한 세션 상태 추적 시스템입니다. Claude Code 에이전트의 세션 정보를 관리합니다.

| 기능 | 설명 |
|--------|--------|------|
| **에이전트 세션 ID 추적** | 각 Claude Code 에이전트의 세션 ID를 관리 |
| **전환 세션 추적** | 메인 세션과 Claude Code 서브세션 간의 ID 매핑 |

---

## 5. 내장 명령어 (Built-in Commands)

### 5.1 git-master

Git 작업을 자동화하는 스킬입니다.

| 기능 | 설명 |
|--------|--------|------|
| **원자적 커밋** | 단일 커밋 단위로 작업 |
| **rebase 전략** | 커밋 히스토리를 분석하여 최적의 rebase 전략 자동 생성 |
| **이력 검색** | `git log -S`, `git blame`, `git bisect` 등의 빠른 검색 |

### 5.2 help

도움말과 사용법을 제공합니다.

---

## 6. Claude Code 호환성 (Claude Code Compatibility)

### 6.1 로더 시스템

설정 파일과 디렉토리에서 Claude Code 호환성을 위한 각종 로더를 제공합니다.

| 로더 | 목적 | 파일 경로 |
|--------|--------|--------|
| **Agent Loader** | .claude/agents/*.md → 에이전트 로드 | .claude/agents/ |
| **Command Loader** | .claude/commands/* → 명령어 로드 | .claude/commands/ |
| **MCP Server Loader** | .claude/mcp.json → MCP 서버 로드 | .claude/mcp.json |
| **Plugin Loader** | .claude/plugins/*.json → 플러그인 로드 | .claude/plugins/ |
| **Session State** | 메인 세션 ↔ 서브세션 매핑 관리 | index.ts |

---

## 7. 컨텍스트 주입 (Context Injection)

### 7.1 파일 주입

AGENTS.md와 README.md 파일을 자동으로 주입하여 에이전트에게 프로젝트 컨텍스트를 제공합니다.

| 주입 대상 | 설명 |
|--------|--------|------|
| **AGENTS.md** | 프로젝트별 AGENTS.md | 프로젝트 패턴, 팀 규칙, 컨벤션 |
| **README.md** | 프로젝트 루트 폴더 | 프로젝트 개요, 설치 가이드 |

### 7.2 시스템 지시어 주입

시스템 리마인더(Reminder), 지시어(Directive)을 에이전트에게 전달합니다.

| 지시어 | 예시 |
|--------|--------|------|
| **Remainder**: 남은 컨텍스트 용량 경고 |
| **Directive**: 특정 작업 전/후 지시 |

---

## 8. 스킬 시스템 (Skill System)

### 8.1 스킬 MCP 서버 관리

스킬(SKILL.md) 파일에 정의된 MCP 서버를 자동으로 관리합니다.

| 기능 | 설명 |
|--------|--------|------|
| **자동 시작** | SKILL.md 파일 감지 시 자동 시작 |
| **서버 관리** | MCP 서버 생성, 중지, 상태 추적 |
| **스킬 라이프사이클** | 스킬에서 MCP 도구 사용 시 서버 로드 |

---

## 9. 알림 시스템 (Notification System)

### 9.1 OS 알림

백그라운드 작업 완료 시 OS 네이티브 알림을 보냅니다.

| 플랫폼 | 설명 |
|--------|--------|------|
| **macOS** | afplay 소리 파일 재생 |
| **Linux** | notify-send 명령어 |
| **Windows** | 알림 소리 재생 |

---

## 10. 참고

**관련 문서**:
- `omo-sisyphus-agent.md` - Sisyphus 오케스트레이터 설명
- `omo-boulder-state.md` - Boulder State 설명
- `omo-hooks.md` - Hooks 시스템 정리

**코드베이스**:
- `src/features/background-agent/manager.ts`
- `src/features/boulder-state/`
- `src/features/claude-code-session-state/`
- `src/features/context-injector/`

---

**문서 버전**: 1.0.0
**최종 수정일**: 2026-01-18
