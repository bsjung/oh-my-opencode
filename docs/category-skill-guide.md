# 카테고리 및 스킬 시스템 가이드

**생성일**: 2026-01-18
**번역 원본**: category-skill-guide.md (영문)

---

## 1. 개요

이 문서는 **Category**와 **Skill** 시스템에 대한 포괄적인 가이드를 제공합니다. 이 두 가지 개념은 OhMyOpenCode의 확장성 핵심입니다.

---

## 2. Category 시스템

Category는 특정 도메인에 최적화된 에이전트 설정 프리셋입니다.

### 내장 카테고리

| 카테고리 | 최적 모델 | 특성 | 사용 사례 |
|-----------|-----------|--------|-----------|
| `visual-engineering` | `gemini-3-pro` | 높은 창의력 (Temp 0.7) | 프론트엔드, UI/UX, 애니메이션, 스타일링 |
| `ultrabrain` | `gpt-5.2` | 최대 논리적 추론 (Temp 0.1) | 아키텍처 설계, 복잡한 비즈니스 로직, 디버깅 |
| `artistry` | `gemini-3-pro` | 예술적 (Temp 0.9) | 창의적 아이디어, 디자인 컨셉, 스토리텔링 |
| `quick` | `claude-haiku` | 빠른 (Temp 0.3) | 간단 작업, 리팩터링, 스크립트 작성 |
| `writing` | `gemini-3-flash` | 자연스러운 흐름 (Temp 0.5) | 문서 작성, 기술 블로그, README 작성 |
| `most-capable` | `claude-opus` | 최고 성능 (Temp 0.1) | 매우 어려운 복잡한 작업 |

### 사용법

`delegate_task` 도구를 호출할 때 `category` 파라미터를 지정하세요:

```typescript
delegate_task(
  category="visual-engineering",
  prompt="대시보드 페이지에 반응형 차트 컴포넌트 추가"
)
```

---

## 3. Skill 시스템

Skill은 특정 도메인에 전문화된 지식(Context)과 도구(MCP)를 에이전트에 주입하는 메커니즘입니다.

### 내장 스킬

#### 1. git-master

- **기능**: Git 전문가
- **MCP**: 없음 (Git 명령어 사용)
- **사용처**: 커밋 작성, 이력 검색, 브랜치 관리에 필수
- **사용 예시**: 원자적 커밋, 리베이스 전략, 이력 검색(blame, bisect, log -S)

#### 2. playwright

- **기능**: 브라우저 자동화
- **MCP**: `@playwright/mcp` (자동 실행)
- **사용처**: 구현 후 UI 검증, E2E 테스트 작성, 스크린샷 촬영
- **사용 예시**: Post-구현 브라우저 테스트, 스크래핑, 데이터 추출

#### 3. frontend-ui-ux

- **기능**: 디자이너 마인드셋 주입
- **MCP**: 없음
- **사용처**: 단순 구현을 넘는 미학적 UI/UX 작업

---

## 4. Sisyphus-Junior (위임받은 실행자)

Category를 사용할 때 **Sisyphus-Junior**라는 특수 에이전트가 작업을 수행합니다.

| 특성 | 설명 |
|--------|--------|
| **불가능** | 다른 에이전트로 작업을 재위임할 수 없음 |
| **목적** | 무한 위임 루프와 포커스 유지 방지 |
| **용도** | 계획 완료 보장 |

---

## 5. 조합 전략 (Combinations)

Category와 Skill을 결합하여 강력한 전문화 에이전트를 생성할 수 있습니다.

### 🎨 디자이너 (UI 구현)

- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux", "playwright"]`
- **효과**: 미학적 UI 구현 + 브라우저 직접 검증
- **구현**: Frontend 엔지니어가 Playwright MCP로 UI를 구현하고, 바로 브라우저에서 렌더링 결과를 검증

### 🏗️ 아키텍트 (설계 검토)

- **Category**: `ultrabrain`
- **Skills**: `[]` (순수 추론)
- **효과**: GPT-5.2의 논리적 추론을 활용한 심도 아키텍처 분석
- **구현**: Oracle 엔지니어가 복잡한 시스템 설계를 심층하게 분석

### ⚡ 유지보수자 (빠른 수정)

- **Category**: `quick`
- **Skills**: `["git-master"]`
- **효과**: 비용 효율적인 모델(Haiku)로 빠른 수정과 깨끗한 커밋 생성
- **구현**: Sisyphus-Junior가 빠르게 코드를 수정하고 git-master 스킬로 원자적 커밋을 자동 생성

---

## 6. delegate_task 프롬프트 가이드

`delegate_task`를 호출할 때 명확하고 구체적인 프롬프트를 작성하는 것이 필수적입니다.

### 필수 요소 (7개)

1. **TASK (작업)**: 수행해야 할 단일 목표
2. **EXPECTED OUTCOME (예상 결과)**: 구체적 결과물 및 성공 기준
3. **REQUIRED SKILLS (필요 스킬)**: 사용할 스킬 목록
4. **REQUIRED TOOLS (필요 도구)**: 허용 도구 허용목록 (허용 목록, 불필요한 도구 차단)
5. **MUST DO (반드시 수행)**: 철저한 요구사항 - 모든 것을 명시적으로 기술
6. **MUST NOT DO (금지 작업)**: 금지 작업 - 돌단적 동작 차단
7. **CONTEXT (문맥)**: 파일 경로, 기존 패턴, 참조 자료

### 좋은 예시

```typescript
delegate_task(
  category="visual",
  agent="frontend-ui-ux-engineer",
  skills=["playwright"],
  prompt=`**TASK**: LoginButton.tsx의 모바일 레이아웃 문제 수정

**EXPECTED OUTCOME**: 버튼들이 모바일에서 수직으로 정렬됨

**REQUIRED SKILLS**: ["playwright"]

**REQUIRED TOOLS**: {
  "include": ["read", "write", "edit", "lsp_*", "look_at"],
  "exclude": ["websearch", "webfetch"]
}

**MUST DO**:
- flex-direction을 md: 브레이크포인트에서 row로 변경
- Tailwind CSS 사용 유지
- 기존 데스크톱 레이아웃 수정하지 않음

**MUST NOT DO**:
- 데스크톱 레이아웃 전체를 수정
- 새로운 컴포넌트 추가 (버튼 외)
- 전역 CSS 변경

**CONTEXT**:
- 파일: src/components/LoginButton.tsx
- 패턴: Tailwind CSS 사용 (기존 버튼 참조)
- 디자인 가이드: docs/omo-frontend-ui-ux-engineer-agent.md
`
)
```

### 나쁜 예시

```typescript
delegate_task(
  category="ultrabrain",
  prompt="인증 문제 해결"
)
```

### 7요소 프롬프트

| 요소 | 설명 | 예시 |
|--------|--------|--------|
| **TASK** | 단일 목표 | "버그 수정" (나쁨) |
| **EXPECTED OUTCOME** | 구체적 결과물 | "로그인 성공" |
| **REQUIRED SKILLS** | 스킬 목록 | `["git-master"]` |
| **REQUIRED TOOLS** | 도구 허용/차단 | 허용 목록 없음 |
| **MUST DO** | 작업 내용 | 빈 줄 |
| **MUST NOT DO** | 금지 작업 | 빈 줄 |
| **CONTEXT** | 문맥 | 빈 줄 |

---

## 7. Configuration 가이드 (oh-my-opencode.json)

`oh-my-opencode.json` 파일에서 Category와 Skill을 세밀하게 설정할 수 있습니다.

### Category 설정 스키마 (CategoryConfig)

| 필드 | 타입 | 설명 |
|--------|--------|--------|
| `model` | string | 사용할 AI 모델 ID (예: `anthropic/claude-opus-4-5`) |
| `temperature` | number | 창의력 수준 (0.0 ~ 2.0, 낮을수록 결정적) |
| `prompt_append` | string | 시스템 프롬프트에 추가할 내용 |
| `thinking` | object | 추론 모델 설정 (`{ type: "enabled", budgetTokens: 16000 }`) |
| `tools` | object | 도구 사용 제어 (`{ "tool_name": false }`로 특정 도구 비활성화) |
| `maxTokens` | number | 최대 응답 토큰 수 |

### 설정 예시

```jsonc
{
  // 새로운 커스텀 카테고리 정의
  "categories": {
    "korean-writer": {
      "model": "google/gemini-3-flash-preview",
      "temperature": 0.5,
      "prompt_append": "한국어 기술 문서 작성자입니다. 명확하고 친절한 어조를 유지하세요."
    },

    // 기존 카테고리 모델 변경
    "visual-engineering": {
      "model": "openai/gpt-5.2",
      "temperature": 0.8
    }
  },

  // 특정 스킬 비활성화
  "disabled_skills": ["playwright"]
}
```

---

## 8. Skill 커스터마이제이션 (SKILL.md)

`.opencode/skills/` 또는 `~/.claude/skills/` 디렉토리에서 커스텀 스킬을 정의할 수 있습니다.

### 스킬 구조

```markdown
---
name: 내-스킬
description: 나만의 특수 스킬

mcp:
  내-mcp:
    command: npx
    args: ["-y", "내-mcp-server"]
---

# 내 스킬 프롬프트
...
```

### MCP 서버 구성

| 필드 | 설명 |
|--------|--------|
| `mcp` | MCP 서버 이름 |
| `command` | 실행 명령어 (`npx`, `node`, `python` 등) |
| `args` | 명령어 인자 배열 |

---

## 9. 결론

Category와 Skill 시스템은 OhMyOpenCode의 확장성을 강화하는 핵심 메커니즘입니다.

### 주요 이점

1. **도메인 최적화**: 각 작업 유형에 최적 모델과 설정을 자동으로 선택
2. **전문가 주입**: 스킬을 통해 특정 도메인 지식을 에이전트에 주입
3. **MCP 통합**: 브라우저 자동화, Git 작업, UI 가이드라인 등을 MCP로 구현
4. **유연한 구성**: JSONC를 통한 세밀한 설정 관리

---

## 참고

- **원본**: `category-skill-guide.md` (201줄)
- **번역**: 원본 문서 내용을 한국어로 번역
