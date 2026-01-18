# 오케스트레이션 가이드

**생성일**: 2026-01-18
**번역 원본**: orchestration-guide.md (영문)

---

## 1. 개요

이 문서는 Oh-My-OpenCode의 **오케스트레이션 시스템**에 대한 포괄적인 가이드를 제공합니다. 이 시스템은 **"계획(Planning)과 실행(Execution)의 분리"**라는 OhMyOpenCode의 핵심 철학입니다.

---

## 2. TL;DR - 언제 사용할 것인가요?

| 복잡도 | 접근 방법 | 사용 시기 |
|----------|--------|------------|
| **단순(Simple)** | 그냥 프롬프트 | 간단한 작업, 빠른 수정, 단일 파일 변경 |
| **복잡 + 게으름(Complex + Lazy)** | 그냥 프롬프트 | 복잡한 작업, 문맥 설명이 지루한 작업. 에이전트가 알아서 파악합니다. |
| **복잡 + 정밀(Complex + Precise)** | `@plan` → `/start-work` | 정밀하고 단계별 작업. 계획 후 실행. Prometheus가 계획, Sisyphus가 실행합니다. |

### 의사 결정 흐름

```mermaid
flowchart TD
    User[사용자 요청] --> IsQuickSimple{단순한가요?}
    
    IsQuickSimple -- 예 --> JustPrompt[그냥 프롬프트]
    IsQuickSimple -- 아니 --> ContextTedious{문맥 설명이 지루운가요?}
    
    ContextTedious -- 예 --> TypeULW{그냥 프롬프트}
    ContextTedious -- 아니 --> IsPreciseNeeded{정밀함이 필요한가요?}
    
    IsPreciseNeeded -- 예 --> TypePlanUse{`@plan` 사용}
    IsPreciseNeeded -- 아니 --> JustUseULW{`ulw` 또는 `ultrawork` 그냥 사용}
    
    TypePlanUse -- 예 --> UseAtPlan[Prometheus → 계획 생성 → `/start-work`]
    
    IsPreciseNeeded -- 예 --> StartWithPrometheus{Prometheus 사용}
    
    StartWithPrometheus --> PrometheusPlan[Prometheus가 계획 생성]
    PrometheusPlan --> StartWork[//start-work]
    StartWork --> Execute[Sisyphus가 실행]
```

---

## 3. 전체 아키텍처

전통적인 AI 에이전트는 계획과 실행을 혼합하여 문맥 오염, 목표 드리프트, AI 슬롭(low-quality code)을 유발합니다.

OhMyOpenCode는 이 문제를 두 가지 역할로 명확하게 분리하여 해결합니다.

### 문제 해결

| 문제 | 전통적인 접근 | OhMyOpenCode의 해결책 |
|--------|----------------|-------------------|
| **문맥 오염** | 계획과 실행 분리 | Prometheus가 계획만, Sisyphus가 실행만 |
| **목표 드리프트** | 명확한 목표 설정 | `.sisyphus/plans/{name}.md`로 계획 저장 |
| **AI 슬롭** | 저품질 코드 | 전문화 에이전트에 위임, LSP/AST-Grep 사용 |

---

## 4. 핵심 컴포넌트

### 🔮 Prometheus (계획가)

- **모델**: `anthropic/claude-opus-4-5`
- **역할**: 전략적 계획
- **제약**: **READ-ONLY**. `.sisyphus/` 디렉토리 내에서만 markdown 파일을 생성/수정 가능
- **특징**: 코드를 직접 작성하지 않음. 오직 "어떻게 하는지"에만 집중

### 🦉 Metis (사전 분석 전문가)

- **모델**: `anthropic/claude-opus-4-5`
- **역할**: 요구사항 분석 및 빈검 탐지
- **기능**: 사용자의 숨겨진 의도 식별, AI 슬롭 패턴 방지, 명확한 질문 생성

### ⚖️ Momus (계획 검증자)

- **모델**: `openai/gpt-5.2`
- **역할**: 높은 정밀도로 계획 검증
- **기능**: 계획의 갭(누락된 내용, 불확실한 참조)을 무자비하게 찾아내어 거부
- **트리거**: "고정밀도(High Accuracy)" 모드 요청 시 활성화

### 🪨 Sisyphus (오케스트레이터)

- **모델**: `anthropic/claude-opus-4-5` (확장된 Thinking 32k 토큰)
- **역할**: 실행 및 위임
- **특징**: 모든 작업을 직접 하지 않음. 전문화 에이전트에 위임

---

## 5. 워크플로우

### Phase 1: 인터뷰 및 계획 (Interview Mode)

Prometheus는 기본적으로 **인터뷰 모드**로 시작합니다.

1. **의도 식별**: 사용자 요청이 리팩터링, 신규 기능 추가, 아키텍처 설계 중 어느 것인지 분류
2. **문맥 수집**: `explore` 및 `librarian` 에이전트를 통해 기존 코드베이스와 외부 문서를 조사
3. **초안(Draft) 생성**: `.sisyphus/drafts/{name}.md` 파일에 논의 내용을 지속적으로 기록
4. **자동 전환 조건 확인**: 모든 요구사항이 명확해지면 자동으로 계획 생성 모드로 전환

### Phase 2: 계획 생성 (Plan Generation)

사용자가 명시적으로 요청하거나 모든 것이 명확해지면 계획 생성이 시작됩니다.

1. **Metis 자문**: 계획 생성 전에 Metis에게 빈검 탐지 및 방어책 요청
2. **계획 작성**: `.sisyphus/plans/{name}.md` 파일에 단일 계획 작성
3. **결과 요약**: 핵심 결정사항을 사용자에게 요약

### Phase 3: 실행 (Execution)

사용자가 `/start-work`를 실행하면 실행 단계가 시작됩니다.

1. **상태 관리**: `.sisyphus/boulder.json` 파일에 현재 계획과 세션 ID를 저장
2. **TODO 처리**: 계획에 있는 모든 TODO를 순서대로 하나씩 처리
3. **위임**: 프론트엔드 작업은 Frontend 에이전트에, 복잡한 로직은 Oracle 에이전트에 위임
4. **연속성**: 세션이 중단되어도 다음 세션에서 작업이 중단된 곳부터 계속

---

## 6. 사용 가능한 명령어

### `/@plan [요청]`

Prometheus를 시작하여 계획 세션을 엽니다.

```bash
@plan "인증 시스템을 NextAuth로 리팩터링하고 싶어요"
```

### `/start-work`

저장된 계획을 실행합니다. `.sisyphus/plans/` 디렉토리에서 계획을 찾아 실행합니다.

```bash
/start-work
```

**기능**:
- `.sisyphus/boulder.json` 파일 생성 (상태 관리)
- TODO 완료될 때까지 세션 유지(`--enforce-completion`)
- 중단 시 자동으로 재개

---

## 7. 설정 가이드

`oh-my-opencode.json` 파일에서 관련 기능을 세밀하게 제어할 수 있습니다.

### Sisyphus 에이전트 설정

```jsonc
{
  "sisyphus_agent": {
    "disabled": false,          // Sisyphus 활성화 (기본값)
    "planner_enabled": true,     // Prometheus 활성화 (기본값)
    "replace_plan": true        // 기본 계획 대신 Prometheus 사용
  }
}
```

### Prometheus 설정

```jsonc
{
  "sisyphus_agent": {
    "planner_enabled": false    // Prometheus 비활성화
  }
}
```

### Hook 설정

```jsonc
{
  // 특정 훅 비활성화
  "disabled_hooks": [
    "start-work",              // 실행 트리거 비활성화
    "prometheus-md-only"      // Prometheus의 .md 쓰기 제한 해제 (권장하지 않음)
  ]
}
```

---

## 8. 모범 사례

### 📋 계획을 통해 정밀한 작업

**사용 시나리오**:
1. Prometheus를 호출하여 요구사항을 명확화
2. `/start-work`로 계획 실행
3. Sisyphus가 각 TODO를 꼼꼼하게 처리

**장점**:
- 계획이 완벽하게 문서화됨
- 실행 경로가 명확함
- 중단 시 자동으로 재개

### ⚡ 빠른 수정에 단순 프롬프트

**사용 시나리오**:
1. 그냥 Sisyphus에게 작업 요청
2. 단일 명령어로 빠르게 처리

**장점**:
- 빠른 응답
- 불필요한 계획 과정 건너뜀
- 간단 작업에 효율적

---

## 9. 참고

- **번역 원본**: `orchestration-guide.md` (153줄)
- **번역 완료일**: 2026-01-18
- **관련 에이전트**: Prometheus, Metis, Momus, Sisyphus
