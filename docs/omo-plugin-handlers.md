# Oh My OpenCode Plugin Handlers

Oh-my-opencode 플러그인의 설정 핸들러(config-handler)는 OpenCode의 설정을 확장하고, 에이전트를 구성하며, Sisyphus 오케스트레이션 시스템을 초기화합니다.

## 개요

`src/plugin-handlers/config-handler.ts`는 플러그인이 로드될 때 OpenCode 설정을 수정하고, 커스텀 에이전트를 등록하며, 다양한 기능을 활성화하는 핵심 로직을 포함합니다.

**주요 역할:**
- 빌트인 에이전트 생성 및 등록
- Claude Code 호환 컴포넌트 로드
- Sisyphus 오케스트레이션 시스템 설정
- 에이전트 퍼미션 관리
- MCP, Commands, Skills 통합

## 핵심 함수

### `createConfigHandler(deps: ConfigHandlerDeps)`

OpenCode 설정을 처리하는 메인 핸들러 함수입니다. OpenCode에서 `config` 이벤트가 발생할 때마다 호출됩니다.

#### 의존성 (ConfigHandlerDeps)

```typescript
{
  ctx: { directory: string },           // 프로젝트 디렉토리 경로
  pluginConfig: OhMyOpenCodeConfig,    // 플러그인 설정
  modelCacheState: ModelCacheState      // 모델 메타데이터 캐시
}
```

#### 처리 흐름

```
1. Provider 설정 캐싱 (Anthropic 1M Context, 모델별 Context 제한)
2. Claude Code 플러그인 컴포넌트 로드 (선택적)
3. 빌트인 에이전트 생성
4. 사용자/프로젝트/플러그인 에이전트 로드
5. Sisyphus 시스템 설정
6. 퍼미션 구성
7. MCP 서버 등록
8. Commands 및 Skills 로드
```

## 기능별 상세 설명

### 1. Provider 설정 캐싱

OpenCode의 provider 설정에서 모델별 context 제한과 Anthropic의 1M context 베타 기능을 감지하여 캐싱합니다.

```typescript
// Anthropic 1M context 베타 감지
const anthropicBeta = providers?.anthropic?.options?.headers?.["anthropic-beta"];
modelCacheState.anthropicContext1MEnabled =
  anthropicBeta?.includes("context-1m") ?? false;

// 모델별 context 제한 캐싱
for (const [providerID, providerConfig] of Object.entries(providers)) {
  for (const [modelID, modelConfig] of Object.entries(providerConfig?.models ?? {})) {
    const contextLimit = modelConfig?.limit?.context;
    if (contextLimit) {
      modelCacheState.modelContextLimitsCache.set(
        `${providerID}/${modelID}`,
        contextLimit
      );
    }
  }
}
```

### 2. Claude Code 호환 컴포넌트 로드

Claude Code 플러그인 시스템과 호환되도록 마켓플레이스 플러그인의 컴포넌트를 로드합니다.

**로드되는 컴포넌트:**
- Commands
- Skills
- Agents
- MCP Servers
- Hook Configurations

```typescript
const pluginComponents = (pluginConfig.claude_code?.plugins ?? true)
  ? await loadAllPluginComponents({
      enabledPluginsOverride: pluginConfig.claude_code?.plugins_override,
    })
  : { /* 기본값 */ };
```

**설정 옵션:**

```json
{
  "claude_code": {
    "plugins": true,                           // 전체 플러그인 시스템 활성화
    "plugins_override": {                       // 특정 플러그인 비활성화
      "claude-mem@thedotmack": false,
      "some-other-plugin@marketplace": false
    }
  }
}
```

### 3. 빌트인 에이전트 생성

Oh-my-opencode의 빌트인 에이전트를 생성합니다.

**빌트인 에이전트 목록:**

| 에이전트 | 기본 모델 | 목적 |
|---------|----------|------|
| Sisyphus | anthropic/claude-opus-4-5 | 메인 오케스트레이터 |
| oracle | openai/gpt-5.2 | 전략적 조언, 디버깅 |
| librarian | opencode/glm-4.7-free | 문서 검색, GitHub 리서치 |
| explore | opencode/grok-code | 빠른 코드베이스 탐색 |
| frontend-ui-ux-engineer | google/gemini-3-pro-preview | UI/UX 개발 |
| document-writer | google/gemini-3-flash | 기술 문서 작성 |
| multimodal-looker | google/gemini-3-flash | PDF/이미지 분석 |
| Metis (Plan Consultant) | anthropic/claude-sonnet-4-5 | 사전 계획 분석 |
| Momus (Plan Reviewer) | anthropic/claude-sonnet-4-5 | 계획 검증 |
| orchestrator-sisyphus | anthropic/claude-opus-4-5 | 오케스트레이터 후크 |

```typescript
const builtinAgents = createBuiltinAgents(
  pluginConfig.disabled_agents,      // 비활성화할 에이전트 목록
  pluginConfig.agents,                // 에이전트 오버라이드 설정
  ctx.directory,                     // 프로젝트 디렉토리
  config.model,                      // 시스템 기본 모델
  pluginConfig.categories,           // 카테고리 설정
  pluginConfig.git_master            // Git Master 설정
);
```

### 4. 사용자/프로젝트/플러그인 에이전트 로드

에이전트 로드 우선순위:

```
1. Sisyphus 시스템 (활성화된 경우)
2. 빌트인 에이전트 (Sisyphus 제외)
3. 사용자 에이전트 (~/.claude/agents/*.md)
4. 프로젝트 에이전트 (./.claude/agents/*.md)
5. 플러그인 에이전트 (Claude Code 마켓플레이스)
6. 기존 config 에이전트 (build, plan 등)
```

```typescript
// 사용자 에이전트 (퍼미션 마이그레이션 없음 - Claude Code는 whitelist 기반)
const userAgents = (pluginConfig.claude_code?.agents ?? true)
  ? loadUserAgents()
  : {};

const projectAgents = (pluginConfig.claude_code?.agents ?? true)
  ? loadProjectAgents()
  : {};

// 플러그인 에이전트 (퍼미션 마이그레이션 적용 - OpenCode 호환)
const pluginAgents = Object.fromEntries(
  Object.entries(rawPluginAgents).map(([k, v]) => [
    k,
    migrateAgentConfig(v)
  ])
);
```

### 5. Sisyphus 오케스트레이션 시스템

Sisyphus가 활성화된 경우, OpenCode의 기본 에이전트들을 Sisyphus 시스템으로 대체합니다.

#### 활성화 조건

```typescript
const isSisyphusEnabled = pluginConfig.sisyphus_agent?.disabled !== true;
const builderEnabled = pluginConfig.sisyphus_agent?.default_builder_enabled ?? false;
const plannerEnabled = pluginConfig.sisyphus_agent?.planner_enabled ?? true;
const replacePlan = pluginConfig.sisyphus_agent?.replace_plan ?? true;
```

#### 설정 동작

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `sisyphus_agent.disabled` | `false` | `true`로 설정하면 Sisyphus 비활성화, 기본 OpenCode 에이전트 유지 |
| `sisyphus_agent.default_builder_enabled` | `false` | OpenCode-Builder 에이전트 표시 |
| `sisyphus_agent.planner_enabled` | `true` | Prometheus(Planner) 에이전트 활성화 |
| `sisyphus_agent.replace_plan` | `true` | 기본 plan 에이전트를 subagent로 격하 |

#### Sisyphus 활성화 시 에이전트 변화

```typescript
if (isSisyphusEnabled) {
  // 기본 에이전트를 Sisyphus로 변경
  config.default_agent = "Sisyphus";

  // build 에이전트: subagent + hidden (UI에서 숨김)
  config.agent.build = { ...buildConfig, mode: "subagent", hidden: true };

  // plan 에이전트: replace_plan=true이면 subagent로 격하
  if (replacePlan) {
    config.agent.plan = { mode: "subagent" };
  }
}
```

#### Sisyphus 시스템 에이전트

| 에이전트 | 모델 | 설명 |
|---------|------|------|
| Sisyphus | claude-opus-4-5 | 메인 오케스트레이터 (default_agent) |
| Sisyphus-Junior | claude-opus-4-5 | 위임된 작업 실행용 서브에이전트 |
| OpenCode-Builder | build config | OpenCode의 기본 build 에이전트 (이름 변경) |
| Prometheus (Planner) | claude-opus-4-5 | 전략적 계획 에이전트 (OpenCode plan 대체) |

### 6. 에이전트 퍼미션 구성

각 에이전트의 툴 액세스 퍼미션을 설정합니다.

#### 전역 퍼미션

```typescript
config.permission = {
  webfetch: "allow",
  external_directory: "allow",
  delegate_task: "deny",  // 전역 delegate_task 비활성화
};
```

#### 에이전트별 퍼미션

| 에이전트 | delegate_task | call_omo_agent | task | 그 외 퍼미션 |
|---------|--------------|----------------|------|--------------|
| Sisyphus | allow | deny | - | - |
| Prometheus (Planner) | allow | deny | - | - |
| Sisyphus-Junior | allow | - | - | - |
| librarian | - | - | - | grep_app_*: allow |
| multimodal-looker | - | - | deny | - |
| orchestrator-sisyphus | allow | deny | deny | - |

```typescript
// 예시: Librarian에 grep_app 툴 허용
if (agentResult.librarian) {
  const agent = agentResult.librarian as AgentWithPermission;
  agent.permission = { ...agent.permission, "grep_app_*": "allow" };
}

// 예시: Multimodal-Looker에서 task 툴 차단
if (agentResult["multimodal-looker"]) {
  const agent = agentResult["multimodal-looker"] as AgentWithPermission;
  agent.permission = { ...agent.permission, task: "deny", look_at: "deny" };
}
```

### 7. MCP 서버 등록

MCP (Model Context Protocol) 서버를 등록합니다.

**우선순위:**
```
1. 빌트인 MCP (websearch, context7, grep_app)
2. Claude Code MCP (~/.claude/.mcp.json, ./.mcp.json)
3. OpenCode 글로벌 MCP (~/.config/opencode/mcp/)
4. OpenCode 프로젝트 MCP (./.opencode/mcp/)
5. 플러그인 MCP
```

```typescript
config.mcp = {
  ...createBuiltinMcps(pluginConfig.disabled_mcps),
  ...mcpResult.servers,
  ...pluginComponents.mcpServers,
};
```

**비활성화 설정:**

```json
{
  "disabled_mcps": ["websearch", "context7", "grep_app"]
}
```

### 8. Commands 및 Skills 로드

모든 커맨드와 스킬을 병렬로 로드합니다.

**로드 순서:**

```
1. 빌트인 Commands
2. 사용자 Commands (~/.claude/commands/*.md)
3. 사용자 Skills (~/.claude/skills/*/)
4. OpenCode 글로벌 Commands (~/.config/opencode/command/)
5. OpenCode 글로벌 Skills (~/.config/opencode/skills/)
6. 시스템 Commands (opencode.json)
7. 프로젝트 Commands (./.claude/commands/*.md)
8. 프로젝트 Skills (./.claude/skills/*/)
9. 프로젝트 OpenCode Commands (./.opencode/command/)
10. 프로젝트 OpenCode Skills (./.opencode/skills/)
11. 플러그인 Commands
12. 플러그인 Skills
```

```typescript
const [
  userCommands,
  projectCommands,
  opencodeGlobalCommands,
  opencodeProjectCommands,
  userSkills,
  projectSkills,
  opencodeGlobalSkills,
  opencodeProjectSkills,
] = await Promise.all([
  includeClaudeCommands ? loadUserCommands() : Promise.resolve({}),
  includeClaudeCommands ? loadProjectCommands() : Promise.resolve({}),
  loadOpencodeGlobalCommands(),
  loadOpencodeProjectCommands(),
  includeClaudeSkills ? loadUserSkills() : Promise.resolve({}),
  includeClaudeSkills ? loadProjectSkills() : Promise.resolve({}),
  loadOpencodeGlobalSkills(),
  loadOpencodeProjectSkills(),
]);

config.command = {
  ...builtinCommands,
  ...userCommands,
  ...userSkills,
  ...opencodeGlobalCommands,
  ...opencodeGlobalSkills,
  ...systemCommands,
  ...projectCommands,
  ...projectSkills,
  ...opencodeProjectCommands,
  ...opencodeProjectSkills,
  ...pluginComponents.commands,
  ...pluginComponents.skills,
};
```

## 카테고리 설정 해결

### `resolveCategoryConfig(categoryName, userCategories?)`

카테고리 이름으로 전체 카테고리 설정(model, temperature, tools 등)을 해결합니다.

**기본 카테고리:**

| 카테고리 | 기본 모델 | Temperature | 설명 |
|---------|----------|-------------|------|
| `visual-engineering` | google/gemini-3-pro-preview | 0.7 | UI/UX, 디자인 |
| `ultrabrain` | openai/gpt-5.2 | 0.1 | 전략적 사고, 복잡한 논리 |
| `artistry` | google/gemini-3-pro-preview | 0.7 | 창의적 작업 |
| `quick` | anthropic/claude-haiku-4-5 | 0.1 | 빠른 작업 |
| `most-capable` | anthropic/claude-opus-4-5 | 0.1 | 최고 성능 |
| `writing` | google/gemini-3-flash | 0.3 | 글쓰기 |
| `general` | anthropic/claude-sonnet-4-5 | 0.1 | 일반 작업 |

**사용 예시:**

```typescript
// 기본 ultrabrain 카테고리 사용
const config = resolveCategoryConfig("ultrabrain");
// => { model: "openai/gpt-5.2", temperature: 0.1, ... }

// 사용자 카테고리 오버라이드
const userCategories = {
  ultrabrain: {
    model: "google/antigravity-claude-opus-4-5-thinking",
    temperature: 0.1,
  },
};
const config = resolveCategoryConfig("ultrabrain", userCategories);
// => { model: "google/antigravity-claude-opus-4-5-thinking", temperature: 0.1, ... }
```

## 설정 예시

### 전체 설정 예시

```json
{
  "sisyphus_agent": {
    "disabled": false,
    "default_builder_enabled": false,
    "planner_enabled": true,
    "replace_plan": true
  },
  "agents": {
    "oracle": {
      "model": "openai/gpt-5.2"
    },
    "Prometheus (Planner)": {
      "category": "ultrabrain"
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3-pro-preview",
      "temperature": 0.7,
      "prompt_append": "Use shadcn/ui components."
    }
  },
  "claude_code": {
    "agents": true,
    "commands": true,
    "skills": true,
    "mcp": true,
    "plugins": true,
    "plugins_override": {
      "claude-mem@thedotmack": false
    }
  },
  "disabled_mcps": [],
  "disabled_agents": [],
  "disabled_hooks": [],
  "disabled_skills": []
}
```

### Sisyphus 비활성화 (기본 OpenCode 에이전트 유지)

```json
{
  "sisyphus_agent": {
    "disabled": true
  }
}
```

### Plan 에이전트 대체하지 않기

```json
{
  "sisyphus_agent": {
    "disabled": false,
    "replace_plan": false  // Prometheus(Planner)와 기본 plan 공존
  }
}
```

## 요약

Config Handler는 다음을 담당합니다:

1. **Provider 설정 캐싱**: Anthropic 1M context, 모델별 제한
2. **Claude Code 호환성**: 마켓플레이스 플러그인 지원
3. **에이전트 구성**: 빌트인, 사용자, 프로젝트, 플러그인 에이전트 병합
4. **Sisyphus 오케스트레이션**: 기본 에이전트 대체 및 시스템 초기화
5. **퍼미션 관리**: 에이전트별 툴 액세스 제어
6. **MCP 통합**: 다중 소스 MCP 서버 등록
7. **Commands/Skills 로드**: 병렬 로드 및 우선순위 관리
8. **카테고리 설정**: 재사용 가능한 에이전트 설정 템플릿

이 핸들러는 플러그인의 초기화 단계에서 실행되어, Oh My OpenCode의 모든 기능이 올바르게 구성되도록 보장합니다.
