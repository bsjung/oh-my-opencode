# OMO Hooks 가이드

**생성일**: 2026-01-18
**작성 목적**: OhMyOpenCode의 31개 라이프사이클 훅(Hook) 시스템에 대한 포괄적인 한국어 정리 문서

---

## 1. 개요

이 문서는 OhMyOpenCode의 **hooks/** 디렉토리에 있는 31개 라이프사이클 훅을 카테고리별로 정리하여, 각 훅의 역할, 실행 순서, 사용 시나리오에 대한 설명을 제공합니다.

---

## 2. 훅 카테고리

### 2.1 오케스트레이션 (Orchestration)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| sisyphus-orchestrator | 메인 오케스트레이터, 에이전트 위임 및 실행 조정 | src/hooks/sisyphus-orchestrator/index.ts |

**역할**: 작업 계획, 에이전트 위임, 세션 상태 추적

**실행 순서**: 모든 훅 중 가장 먼저 실행

---

### 2.2 세션 관리 (Session Management)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| session-recovery | 세션 충돌 복구, thinking block 오류 복구 | src/hooks/session-recovery/ |
| session-notification | 백그라운드 작업 완료 알림(OS 알림) | src/hooks/session-notification.ts |
| context-window-monitor | 컨텍스트 윈도우 감시, 사용자 알림 | src/hooks/context-window-monitor/ |
| anthropic-context-window-limit-recovery | 토큰 사용량 초과 시 자동 요약 | src/hooks/anthropic-context-window-limit-recovery/ |

**역할**: 세션 상태 관리, 오류 복구, 컨텍스트 최적화

**실행 순서**: 오케스트레이터 다음에 실행

---

### 2.3 Todo 관리 (Task Management)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| todo-continuation-enforcer | 에이전트가 TODO를 완료하지 않고 멈출 때 강제로 완료 | src/hooks/todo-continuation-enforcer/ |
| ralph-loop | 자기 참조적 개발 루프 (완료될 때까지 반복) | src/hooks/ralph-loop/ |

**역할**: 작업 완료 강제, 자동화된 개발 루프

**실행 순서**: 세션 시작 시 실행

---

### 2.4 툴 관리 (Tool Management)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| tool-output-truncator | 도구 출력 자르기, 컨텍스트 보존 | src/hooks/tool-output-truncator/ |
| delegate-task-retry | 위임 작업 실패 시 재시도 | src/hooks/delegate-task-retry/ |
| empty-task-response-detector | 빈 응답 감지 | src/hooks/empty-task-response-detector/ |

**역할**: 도구 사용 최적화, 위임 실패 복구

**실행 순서**: tool.execute.after 이벤트에서 실행

---

### 2.5 에이전트 관리 (Agent Management)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| agent-usage-reminder | 에이전트 사용 팁 제공 | src/hooks/agent-usage-reminder/ |

**역할**: 에이전트에게 적절한 사용법 안내

**실행 순서**: chat.message 이벤트에서 실행

---

### 2.6 컨텍스트 주입 (Context Injection)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| directory-agents-injector | AGENTS.md/README.md 파일 자동 주입 | src/hooks/directory-agents-injector/ |
| directory-readme-injector | README.md 파일 자동 주입 | src/hooks/directory-readme-injector/ |
| rules-injector | .claude/rules/ 폴더 규칙 주입 | src/hooks/rules-injector/ |

**역할**: 프로젝트 컨텍스트 자동 주입

**실행 순서**: read 도구 사용 후에 실행

---

### 2.7 에러 복구 (Error Recovery)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| edit-error-recovery | 편집 도구 실패 시 복구 로직 | src/hooks/edit-error-recovery/ |
| thinking-block-validator | thinking block 유효성 검증 | src/hooks/thinking-block-validator/ |

**역할**: 에러 발생 시 자동 복구

**실행 순서**: 오류 감지 시 실행

---

### 2.8 백그라운드 작업 (Background Tasks)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| background-compaction | 훅 실행 결과 요약 | src/hooks/background-compaction/ |
| compaction-context-injector | 백그라운드 컨텍스트 주입 | src/hooks/compaction-context-injector/ |

**역할**: 백그라운드 작업 결과 요약 및 컨텍스트 보존

**실행 순서**: tool.execute.after 이벤트에서 실행

---

### 2.9 시스템 훅 (System Hooks)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| auto-slash-command | 슬래시 명령 감지 및 실행 | src/hooks/auto-slash-command/ |
| auto-update-checker | 업데이트 확인 | src/hooks/auto-update-checker/ |
| think-mode | 동적 thinking 예산 설정 | src/hooks/think-mode/ |

**역할**: 시스템 기반 자동화, 업데이트 확인

**실행 순서**: 항상 백그라운드로 실행

---

### 2.10 호환성 훅 (Compatibility Hooks)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| claude-code-hooks | Claude Code 호환성 레이어 | src/hooks/claude-code-hooks/ |
| prometheus-md-only | Prometheus .md 작성 제한 | src/hooks/prometheus-md-only/ |
| non-interactive-env | 비대화형 모드 환경변수 설정 | src/hooks/non-interactive-env/ |

**역할**: Claude Code 호환성 지원, 플러그인 제약

**실행 순서**: 초기화 시 실행

---

### 2.11 특수 훅 (Special Hooks)

| 훅 | 설명 | 파일 위치 |
|-----|--------|---------|
| interactive-bash-session | 대화형 bash 세션 관리 | src/hooks/interactive-bash-session/ |
| task-resume-info | 작업 재개 정보 수집 | src/hooks/task-resume-info/ |
| start-work | /start-work 슬래시 명령 처리 | src/hooks/start-work/ |

**역할**: 특수 명령어 처리, 작업 재개

**실행 순서**: 필요 시에 실행

---

## 3. 훅 실행 순서

OhMyOpenCode에서 훅은 다음 순서로 실행됩니다.

### 3.1 초기화 단계

1. **index.ts**: 모든 훅 import 및 등록
2. **호환성 훅**: 환경 설정 확인 및 훅 비활성화 처리
3. **AGENTS.md**: hook 파일 읽기 및 주입 준비

### 3.2 메시지 처리 단계

```
[사용자 입력]
      ↓
chat.message (keyword-detector)
      ↓
claude-code-hooks (호환성 설정)
      ↓
auto-slash-command, non-interactive-env (시스템 훅)
      ↓
[context 주입]
directory-agents-injector, directory-readme-injector, rules-injector
      ↓
[도구 호출 준비]
tool-output-truncator, delegate-task-retry, empty-task-response-detector
      ↓
tool.execute.before
[도구 호출]
[모든 훅의 tool.execute.before 이벤트 발생]
      ↓
tool.execute.after
[도구 완료 후]
tool-output-truncator, delegate-task-retry, empty-task-response-detector, thinking-block-validator
      ↓
[에이전트 위임 시작]
sisyphus-orchestrator
      ↓
[세션/백그라운드 관리]
session-recovery, session-notification, background-compaction, compaction-context-injector
```

### 3.3 실행 시나리오

| 이벤트 | 실행 시점 | 주요 훅 |
|----------|-------------|----------|
| **초기** | Plugin 초기화 | claude-code-hooks, AGENTS.md 로드 |
| **도구 호출 전** | tool.execute.before | 모든 훅 (주입, 검사, 에러 복구) |
| **도구 호출 중** | 도구 실행 중 | 해당 훅 (자르기, 유효성 검사 등) |
| **도구 호출 후** | tool.execute.after | tool-output-truncator, delegate-task-retry, 에러 복구 |
| **에이전트 작업** | 전체 과정 | sisyphus-orchestrator가 위임 및 관리 |

---

## 4. 훅 설계 패턴

### 4.1 훅 구조

모든 훅은 `createXxxHook(ctx)` 팩토리 함수로 생성됩니다.

```typescript
// 훅 생성 패턴
export const createMyHook = (ctx: PluginInput) => {
  return {
    "tool.execute.before": async (input, output) => { /* 이벤트 처리 로직 */ },
    "tool.execute.after": async (input, output) => { /* 이벤트 후 처리 로직 */ },
    "user.prompt.submit": async (input, output) => { /* 프롬프트 제출 시 로직 */ },
    // ... 다른 이벤트들
  }
}
```

### 4.2 이벤트 핸들러

| 이벤트 | 핸들러 | 목적 |
|----------|--------|------|
| tool.execute.before | 도구 호출 전처리 | 인자 유효성 검사, 컨텍스트 주입 |
| tool.execute.after | 도구 호출 후처리 | 출력 자르기, 에러 복구 |
| user.prompt.submit | 프롬프트 제출 | 키워드 감지, 모드 전환 |

---

## 5. 설정 및 사용자 정의

### 5.1 훅 비활성화

`oh-my-opencode.json`에서 훅을 비활성화할 수 있습니다.

```jsonc
{
  "disabled_hooks": [
    "keyword-detector",
    "ralph-loop"
  ]
}
```

### 5.2 새로운 훅 추가

새로운 훅을 추가하려면 다음 단계를 따르세요:

1. 훅 디렉토리 생성: `src/hooks/my-hook/`
2. 훅 팩토리 함수 작성: `createMyHook(ctx)`
3. 훅 등록: `src/config/schema.ts`의 `HookNameSchema`에 추가
4. 메인 인덱스에 등록: `src/hooks/index.ts`

---

## 6. 참고

- **주요 파일**:
  - `src/hooks/index.ts` - 훅 등록 및 이벤트 핸들러
  - `src/hooks/AGENTS.md` - 훅 지식 베이스
  - `src/hooks/claude-code-hooks/` - Claude Code 호환성 레이어

- **관련 문서**:
  - `omo-sisyphus-agent.md` - Sisyphus 오케스트레이터 설명
  - `omo-hooks-reference.md` (추천 생성) - 훅 개발 가이드

---

**문서 버전**: 1.0.0
**최종 수정일**: 2026-01-18
