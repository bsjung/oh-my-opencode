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

### 3.1 전체 실행 흐름

```
사용자 Chat Message
    ↓
┌─────────────────────────────────────────┐
│ 1. chat.message                       │
│    - Agent 업데이트                    │
│    - keywordDetector                   │ (ultrawork 감지)
│    - claudeCodeHooks                  │ (Claude Code 호환)
│    - autoSlashCommand                 │ (슬래시 명령)
│    - startWork                        │
│    - ralphLoop (조건부)               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. experimental.chat.messages.transform │
│    - contextInjector                  │ (AGENTS.md, README.md)
│    - thinkingBlockValidator            │ (<thinking> 검증)
└─────────────────────────────────────────┘
    ↓
Agent가 Tool 실행 시
    ↓
┌─────────────────────────────────────────┐
│ 3. tool.execute.before               │
│    - claudeCodeHooks                 │
│    - nonInteractiveEnv                 │
│    - commentChecker                   │
│    - directoryAgentsInjector           │
│    - directoryReadmeInjector          │
│    - rulesInjector                   │
│    - prometheusMdOnly                │
└─────────────────────────────────────────┘
    ↓
    Tool 실행
    ↓
┌─────────────────────────────────────────┐
│ 4. tool.execute.after                │
│    - claudeCodeHooks                 │
│    - toolOutputTruncator              │
│    - contextWindowMonitor             │
│    - commentChecker                   │
│    - directoryAgentsInjector           │
│    - directoryReadmeInjector          │
│    - rulesInjector                   │
│    - emptyTaskResponseDetector         │
│    - agentUsageReminder               │
│    - interactiveBashSession           │
│    - editErrorRecovery               │
│    - delegateTaskRetry               │
│    - sisyphusOrchestrator           │
│    - taskResumeInfo                  │
└─────────────────────────────────────────┘
```

### 3.2 단계별 상세 설명

#### 3.2.1 chat.message 이벤트

사용자가 메시지를 보내면 가장 먼저 실행됩니다.

**실행 순서:**

```typescript
// src/index.ts:309-382
"chat.message": async (input, output) => {
  // 1. Agent 정보 업데이트
  updateSessionAgent(input.sessionID, input.agent);

  // 2. First message variant 적용 (메시지 우선순위/모드 설정)
  if (firstMessageVariantGate.shouldOverride(input.sessionID)) {
    const variant = resolveAgentVariant(pluginConfig, input.agent)
    if (variant !== undefined) {
      message.variant = variant  // 예: "max" (ultrawork 모드)
    }
  } else {
    applyAgentVariant(pluginConfig, input.agent, message);
  }

  // 3. Hook 순차적 실행
  await keywordDetector?.["chat.message"]?.(input, output);     // 3-1. 키워드 감지
  await claudeCodeHooks["chat.message"]?.(input, output);      // 3-2. Claude Code hooks
  await autoSlashCommand?.["chat.message"]?.(input, output);    // 3-3. 슬래시 명령 감지
  await startWork?.["chat.message"]?.(input, output);          // 3-4. 시작 작업 처리

  // 4. Ralph Loop 템플릿 감지 (조건부)
  if (ralphLoop) {
    const isRalphLoopTemplate =
      promptText.includes("You are starting a Ralph Loop") &&
      promptText.includes("<user-task>");
    const isCancelRalphTemplate = promptText.includes(
      "Cancel currently active Ralph Loop"
    );

    if (isRalphLoopTemplate) {
      ralphLoop.startLoop(input.sessionID, prompt, options);
    } else if (isCancelRalphTemplate) {
      ralphLoop.cancelLoop(input.sessionID);
    }
  }
}
```

| Hook | 역할 |
|------|------|
| `keywordDetector` | ultrawork/ulw/analyze 등 키워드 감지 → 모드 전환 |
| `claudeCodeHooks` | Claude Code의 UserPromptSubmit hooks 실행 |
| `autoSlashCommand` | 슬래시 명령 (`/command`) 감지 |
| `startWork` | `/start-work` 슬래시 명령 처리 |
| `ralphLoop` (조건부) | Ralph Loop 시작/취소 템플릿 감지 |

#### 3.2.2 experimental.chat.messages.transform 이벤트

메시지가 실제로 처리되기 전 변환 단계입니다. Context 인젝션이 이때 일어납니다.

**실행 순서:**

```typescript
// src/index.ts:384-395
"experimental.chat.messages.transform": async (input, output) => {
  // 1. AGENTS.md, README.md, rules 인젝션
  await contextInjectorMessagesTransform?.["experimental.chat.messages.transform"]?.(input, output);

  // 2. Thinking block 유효성 검사
  await thinkingBlockValidator?.["experimental.chat.messages.transform"]?.(input, output);
}
```

| Hook | 역할 |
|------|------|
| `contextInjectorMessagesTransform` | AGENTS.md, README.md 자동 인젝션 |
| `thinkingBlockValidator` | `<thinking>` 블록 형식 검증 |

#### 3.2.3 tool.execute.before 이벤트

Agent가 Tool을 실행하기 직전에 실행됩니다. 입력 유효성 검사, context 인젝션 등을 수행합니다.

**실행 순서:**

```typescript
// src/index.ts:480-553
"tool.execute.before": async (input, output) => {
  // 1. Claude Code hooks
  await claudeCodeHooks["tool.execute.before"](input, output);

  // 2. 비대화형 환경 체크
  await nonInteractiveEnv?.["tool.execute.before"](input, output);

  // 3. 주석 검사 (전처리)
  await commentChecker?.["tool.execute.before"](input, output);

  // 4. AGENTS.md 인젝션
  await directoryAgentsInjector?.["tool.execute.before"]?.(input, output);

  // 5. README.md 인젝션
  await directoryReadmeInjector?.["tool.execute.before"]?.(input, output);

  // 6. Rules 인젝션
  await rulesInjector?.["tool.execute.before"]?.(input, output);

  // 7. Prometheus MD 제한
  await prometheusMdOnly?.["tool.execute.before"]?.(input, output);

  // 8. Task tool 제한 (explore/librarian용)
  if (input.tool === "task") {
    const args = output.args as Record<string, unknown>;
    const subagentType = args.subagent_type as string;
    const isExploreOrLibrarian = ["explore", "librarian"].includes(subagentType);

    args.tools = {
      ...(args.tools as Record<string, boolean> | undefined),
      delegate_task: false,        // explore/librarian에서 delegate_task 비활성화
      ...(isExploreOrLibrarian ? { call_omo_agent: false } : {}),
    };
  }

  // 9. Slash command 처리 (ralph-loop, ulw-loop 등)
  if (ralphLoop && input.tool === "slashcommand") {
    const args = output.args as { command?: string } | undefined;
    const command = args?.command?.replace(/^\//, "").toLowerCase();
    const sessionID = input.sessionID || getMainSessionID();

    if (command === "ralph-loop" && sessionID) {
      ralphLoop.startLoop(sessionID, prompt, options);
    } else if (command === "cancel-ralph" && sessionID) {
      ralphLoop.cancelLoop(sessionID);
    } else if (command === "ulw-loop" && sessionID) {
      ralphLoop.startLoop(sessionID, prompt, { ultrawork: true });
    }
  }
}
```

| Hook | 역할 |
|------|------|
| `claudeCodeHooks` | Claude Code의 PreToolUse hooks 실행 |
| `nonInteractiveEnv` | 비대화형 환경 감지 |
| `commentChecker` | 주석 검사 (전처리) |
| `directoryAgentsInjector` | AGENTS.md 인젝션 |
| `directoryReadmeInjector` | README.md 인젝션 |
| `rulesInjector` | .claude/rules/ 인젝션 |
| `prometheusMdOnly` | Prometheus에서 markdown만 사용 제한 |

**특수 처리:**
- `task` tool 실행 시 explore/librarian용 `delegate_task` 비활성화
- `slashcommand` tool 실행 시 ralph-loop 관련 명령 처리

#### 3.2.4 tool.execute.after 이벤트

Tool이 실행된 후 결과를 가공합니다. 출력 자르기, 에러 복구, 알림 등을 수행합니다.

**실행 순서:**

```typescript
// src/index.ts:555-570
"tool.execute.after": async (input, output) => {
  // 1. Claude Code hooks
  await claudeCodeHooks["tool.execute.after"](input, output);

  // 2. 출력 자르기
  await toolOutputTruncator?.["tool.execute.after"](input, output);

  // 3. 컨텍스트 윈도우 모니터링
  await contextWindowMonitor?.["tool.execute.after"](input, output);

  // 4. 주석 검사 (후처리)
  await commentChecker?.["tool.execute.after"](input, output);

  // 5-7. Context 인젝션 후처리
  await directoryAgentsInjector?.["tool.execute.after"]?.(input, output);
  await directoryReadmeInjector?.["tool.execute.after"]?.(input, output);
  await rulesInjector?.["tool.execute.after"](input, output);

  // 8. 빈 응답 감지
  await emptyTaskResponseDetector?.["tool.execute.after"](input, output);

  // 9. 에이전트 사용 알림
  await agentUsageReminder?.["tool.execute.after"](input, output);

  // 10. Interactive bash 세션 관리
  await interactiveBashSession?.["tool.execute.after"](input, output);

  // 11. 편집 에러 복구
  await editErrorRecovery?.["tool.execute.after"](input, output);

  // 12. Delegate Task 재시도
  await delegateTaskRetry?.["tool.execute.after"](input, output);

  // 13. Sisyphus 오케스트레이션
  await sisyphusOrchestrator?.["tool.execute.after"]?.(input, output);

  // 14. 작업 재개 정보
  await taskResumeInfo["tool.execute.after"](input, output);
}
```

| Hook | 역할 |
|------|------|
| `claudeCodeHooks` | Claude Code의 PostToolUse hooks 실행 |
| `toolOutputTruncator` | 너무 긴 tool 출력 자르기 (컨텍스트 절약) |
| `contextWindowMonitor` | 컨텍스트 사용량 모니터링 및 경고 |
| `commentChecker` | 주석 검사 (후처리) |
| `directoryAgentsInjector` | AGENTS.md 인젝션 (후처리) |
| `directoryReadmeInjector` | README.md 인젝션 (후처리) |
| `rulesInjector` | rules 인젝션 (후처리) |
| `emptyTaskResponseDetector` | Task가 빈 응답 반환했는지 감지 |
| `agentUsageReminder` | 직접 tool 호출 시 에이전트 사용 알림 |
| `interactiveBashSession` | tmux 세션 관리 |
| `editErrorRecovery` | 편집 에러 자동 복구 |
| `delegateTaskRetry` | Delegate Task 실패 시 재시도 |
| `sisyphusOrchestrator` | Sisyphus 오케스트레이션 (전문가 위임) |
| `taskResumeInfo` | 작업 재개 정보 저장 |

### 3.3 event 이벤트

기타 시스템 이벤트 (session.created, session.deleted, session.error 등) 처리:

```typescript
// src/index.ts:399-478
"event": async (input) => {
  // 1. 업데이트 체크
  await autoUpdateChecker?.event(input);

  // 2. Claude Code 이벤트
  await claudeCodeHooks.event(input);

  // 3. 백그라운드 알림
  await backgroundNotificationHook?.event(input);

  // 4. 세션 알림
  await sessionNotification?.event(input);

  // 5. TODO 강제 완료
  await todoContinuationEnforcer?.handler(input);

  // 6. 컨텍스트 윈도우 모니터
  await contextWindowMonitor?.event(input);

  // 7-9. Context 인젝션 이벤트
  await directoryAgentsInjector?.event(input);
  await directoryReadmeInjector?.event(input);
  await rulesInjector?.event(input);

  // 10. Think 모드
  await thinkMode?.event(input);

  // 11. Anthropic 컨텍스트 제한 복구
  await anthropicContextWindowLimitRecovery?.event(input);

  // 12. 에이전트 사용 알림
  await agentUsageReminder?.event(input);

  // 13. Interactive bash 세션
  await interactiveBashSession?.event(input);

  // 14. Ralph Loop
  await ralphLoop?.event(input);

  // 15. Sisyphus 오케스트레이션
  await sisyphusOrchestrator?.handler(input);

  // 특정 이벤트 처리
  if (event.type === "session.created") {
    // 메인 세션 설정
    setMainSession(sessionInfo?.id);
    firstMessageVariantGate.markSessionCreated(sessionInfo);
  }

  if (event.type === "session.deleted") {
    // 세션 정리
    clearSessionAgent(sessionInfo.id);
    resetMessageCursor(sessionInfo.id);
    await skillMcpManager.disconnectSession(sessionInfo.id);
    await lspManager.cleanupTempDirectoryClients();
  }

  if (event.type === "message.updated") {
    // 메시지 업데이트 처리
    if (role === "user") {
      updateSessionAgent(sessionID, agent);
    }
  }

  if (event.type === "session.error") {
    // 세션 에러 복구
    if (sessionRecovery?.isRecoverableError(error)) {
      await sessionRecovery.handleSessionRecovery(messageInfo);
      // 자동으로 "continue" 메시지 전송
    }
  }
}
```

| 이벤트 타입 | 처리하는 Hook | 설명 |
|-------------|---------------|------|
| `session.created` | event hooks | 새 세션 생성 시 메인 세션 설정 |
| `session.deleted` | event hooks | 세션 삭제 시 리소스 정리 |
| `message.updated` | event hooks | 메시지 업데이트 시 Agent 정보 업데이트 |
| `session.error` | event hooks + session-recovery | 세션 에러 발생 시 자동 복구 |

### 3.4 실행 시나리오 요약

| 이벤트 | 실행 시점 | 주요 Hook |
|----------|-------------|-----------|
| **메시지 수신** | chat.message | keywordDetector, claudeCodeHooks, autoSlashCommand, ralphLoop |
| **메시지 변환** | experimental.chat.messages.transform | contextInjector, thinkingBlockValidator |
| **도구 실행 전** | tool.execute.before | 모든 주입/검사 Hook |
| **도구 실행 후** | tool.execute.after | 모든 후처리 Hook (자르기, 복구, 오케스트레이션) |
| **시스템 이벤트** | event | 업데이트, 알림, 세션 관리 Hook |

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

| 이벤트 | 핸들러 | 목적 | 실행 시점 |
|----------|--------|------|-----------|
| chat.message | 메시지 수신 | 키워드 감지, 모드 전환, 슬래시 명령 감지 | 메시지 수신 시 |
| experimental.chat.messages.transform | 메시지 변환 | 컨텍스트 인젝션, thinking block 검증 | 메시지 처리 전 |
| tool.execute.before | 도구 호출 전처리 | 인자 유효성 검사, 컨텍스트 주입 | 도구 실행 직전 |
| tool.execute.after | 도구 호출 후처리 | 출력 자르기, 에러 복구 | 도구 실행 직후 |
| event | 시스템 이벤트 | 세션 관리, 업데이트, 알림 | 해당 이벤트 발생 시 |

### 4.3 Chat Message 처리 순서에서의 훅 관계

Chat Message가 들어왔을 때, 각 훅이 어떤 역할을 하는지 정리하면:

```
사용자 Chat Message
    ↓
┌─────────────────────────────────────────┐
│ [1단계] chat.message              │
│ - keywordDetector:                    │ → "ultrawork" 감지 → message.variant = "max"
│   ultrawork/ulw/analyze 키워드 감지  │ → 모드 전환 트리거
│                                     │
│ - claudeCodeHooks:                   │ → Claude Code의 UserPromptSubmit 실행
│   Claude Code 호환성                │ → settings.json의 hooks 처리
│                                     │
│ - autoSlashCommand:                  │ → "/command" 패턴 감지
│   슬래시 명령 감지                 │ → 자동으로 command 실행
│                                     │
│ - startWork:                         │ → "/start-work" 명령 처리
│   작업 시작 명령 처리               │
│                                     │
│ - ralphLoop (조건부):               │ → Ralph Loop 템플릿 감지
│   자기 참조 개발 루프             │ → 루프 시작/취소
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ [2단계] experimental.chat.messages.transform │
│                                     │
│ - contextInjectorMessagesTransform:      │ → 파일 경로 검색
│   AGENTS.md, README.md 인젝션      │ → 해당 디렉토리의 파일 읽기
│                                     │ → 세션별 캐싱 (중복 방지)
│                                     │ → output.messages에 추가
│                                     │
│ - thinkingBlockValidator:              │ → <thinking> 블록 파싱
│   thinking block 유효성 검사        │ → 형식 오류 감지 및 수정
└─────────────────────────────────────────┘
    ↓
Agent가 도구 실행을 결정
    ↓
┌─────────────────────────────────────────┐
│ [3단계] tool.execute.before          │
│                                     │
│ - claudeCodeHooks:                   │ → Claude Code의 PreToolUse 실행
│   PreToolUse hooks                  │ → settings.json의 hooks 실행
│                                     │ → 입력 수정/차단 가능
│                                     │
│ - nonInteractiveEnv:                 │ → CI 환경변수 감지
│   비대화형 환경 체크             │ → 대화형 tool 사용 제한
│                                     │
│ - commentChecker:                   │ → 불필요한 주석 감지
│   주석 검사 (전처리)               │ → 주석 추가 경고
│                                     │
│ - directoryAgentsInjector:            │ → AGENTS.md 파일 인젝션
│   프로젝트 컨텍스트 주입          │ → 디렉토리 탐색 및 읽기
│                                     │ → output에 추가
│                                     │
│ - directoryReadmeInjector:           │ → README.md 파일 인젝션
│   프로젝트 문서 주입               │ → 디렉토리 탐색 및 읽기
│                                     │ → output에 추가
│                                     │
│ - rulesInjector:                     │ → .claude/rules/ 인젝션
│   조건부 규칙 주입                 │ → glob 패턴 매칭
│                                     │ → 해당 파일 내용을 output에 추가
│                                     │
│ - prometheusMdOnly:                  │ → Prometheus 에이전트 제한
│   Prometheus MD 제한                 │ → markdown 파일만 사용하도록 설정
│                                     │
│ [특수 처리]                         │
│ - task tool 제한:                   │ → explore/librarian 순환 참조 방지
│   delegate_task 비활성화              │
│ - slashcommand 처리:                  │ → ralph-loop, ulw-loop 명령 처리
│   Ralph Loop 시작/취소               │
└─────────────────────────────────────────┘
    ↓
    도구 실제 실행
    ↓
┌─────────────────────────────────────────┐
│ [4단계] tool.execute.after           │
│                                     │
│ - claudeCodeHooks:                   │ → Claude Code의 PostToolUse 실행
│   PostToolUse hooks                 │ → settings.json의 hooks 실행
│                                     │ → 경고/컨텍스트 추가
│                                     │
│ - toolOutputTruncator:              │ → 너무 긴 출력 자르기
│   출력 자르기                        │ → 남은 컨텍스트 확인
│                                     │ → 동적 길이 계산
│                                     │ → output.truncated 플래그 설정
│                                     │
│ - contextWindowMonitor:             │ → 컨텍스트 사용량 모니터링
│   컨텍스트 모니터                   │ → 70%, 85%에서 경고
│                                     │ → 남은 헤드룸 알림
│                                     │
│ - commentChecker:                   │ → 주석 검사 (후처리)
│   주석 검사 (후처리)               │ → 불필요한 주석 감지
│                                     │ → 정당성 확인
│                                     │
│ - directoryAgentsInjector:            │ → AGENTS.md 인젝션 후처리
│   컨텍스트 주입 (후처리)           │ → 캐싱 상태 업데이트
│                                     │
│ - directoryReadmeInjector:           │ → README.md 인젝션 후처리
│   컨텍스트 주입 (후처리)           │ → 캐싱 상태 업데이트
│                                     │
│ - rulesInjector:                     │ → rules 인젝션 후처리
│   규칙 주입 (후처리)               │ → 캐싱 상태 업데이트
│                                     │
│ - emptyTaskResponseDetector:         │ → 빈 응답 감지
│   빈 응답 감지                       │ → tool 결과가 비었는지 확인
│                                     │ → 경고 메시지 출력
│                                     │
│ - agentUsageReminder:               │ → 에이전트 사용 알림
│   에이전트 사용 알림                 │ → 직접 tool 호출 시
│                                     │ → 적절한 에이전트 사용 안내
│                                     │
│ - interactiveBashSession:           │ → tmux 세션 관리
│   대화형 bash 세션 관리            │ → 세션 생성/연결/정리
│                                     │
│ - editErrorRecovery:               │ → 편집 에러 복구
│   편집 에러 복구                     │ → 실패한 편집 재시도
│                                     │ → 수동 지시
│                                     │
│ - delegateTaskRetry:               │ → Delegate Task 재시도
│   Delegate Task 재시도               │ → 실패한 작업 자동 재시도
│                                     │ → 최대 재시도 횟수
│                                     │
│ - sisyphusOrchestrator:           │ → Sisyphus 오케스트레이션
│   오케스트레이션                       │ → 전문가 위임 결정
│                                     │ → 병렬 작업 시작
│                                     │ → 작업 완료 확인
│                                     │
│ - taskResumeInfo:                  │ → 작업 재개 정보
│   작업 재개 정보                       │ → 작업 상태 저장
│                                     │ → 복구 시 사용
└─────────────────────────────────────────┘
```

### 4.4 훅 간의 의존성

Chat Message 처리 순서에서 훅 간의 의존성:

```
keywordDetector
    ↓ (message.variant 설정)
thinkingBlockValidator
    ↓ (메시지 변환)
tool.execute.before hooks
    ↓ (context 인젝션, 검사)
[tool 실행]
    ↓ (결과 반환)
tool.execute.after hooks
    ↓ (결과 가공)
sisyphusOrchestrator (최종 오케스트레이션)
```

**주요 의존성:**
1. `keywordDetector` → `thinkingBlockValidator`: 메시지 변환이 필요
2. `contextInjector` → `tool.execute.before`: 컨텍스트가 주입되어야 함
3. `tool.execute.after` → `sisyphusOrchestrator`: 결과 가공 후 오케스트레이션 필요
4. `toolOutputTruncator` → `contextWindowMonitor`: 컨텍스트 사용량 계산 필요

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

**문서 버전**: 2.0.0
**최종 수정일**: 2026-01-19
**업데이트 내용**: Chat Message 처리 순서 상세 보강
