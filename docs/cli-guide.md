# CLI 가이드

**생성일**: 2026-01-18
**번역 원본**: cli-guide.md (영문)

---

## 1. 개요

Oh-My-OpenCode CLI 도구를 사용하여 **oh-my-opencode 플러그인**의 다양한 기능에 접근할 수 있는 포괄적인 가이드입니다. `bunx oh-my-opencode` 명령어를 통해 플러그인 설치, 환경 진단, 세션 실행 등의 기능을 사용할 수 있습니다.

---

## 2. 사용 가능한 명령어

| 명령어 | 설명 |
|---------|--------|
| `install` | 대화형 설치 마법사 |
| `doctor` | 환경 진단 및 상태 점견 |
| `run` | OpenCode 세션 러너 |
| `auth` | Google Antigravity 인증 관리 |
| `version` | 버전 정보 표시 |

---

## 3. `install` - 대화형 설치 마법사

`@clack/prompts` 기반의 아름다운 TUI(Text User Interface)를 제공하는 대화형 설치 도구입니다.

### 사용법

```bash
# 기본 실행 (도움링 표시)
bunx oh-my-opencode

# 또는 npx 사용
npx oh-my-opencode
```

### 설치 과정

1. **제공자 선택**: Claude, ChatGPT, 또는 Gemini 중에서 AI 제공자를 선택합니다.
2. **API 키 입력**: 선택된 제공자의 API 키를 입력합니다.
3. **설정 파일 생성**: `opencode.json` 또는 `oh-my-opencode.json` 파일을 생성합니다.
4. **플러그인 등록**: OpenCode 설정 파일에 oh-my-opencode 플러그인을 자동으로 등록합니다.

### 옵션

| 옵션 | 설명 |
|--------|--------|
| `--no-tui` | TUI 없이 비대화형 모드로 실행(CI/CD 환경용) |
| `--verbose` | 상세 로그 표시 |

---

## 4. `doctor` - 환경 진단

oh-my-opencode가 올바르게 작동하는지 확인하기 위해 17개 이상의 상태 점견을 수행합니다.

### 사용법

```bash
bunx oh-my-opencode doctor
```

### 진단 카테고리

| 카테고리 | 점검 항목 |
|-----------|-------------|
| **Installation** | OpenCode 버전(>= 1.0.150), 플러그인 등록 상태 |
| **Configuration** | 설정 파일 유효성, JSONC 파싱 |
| **Authentication** | Anthropic, OpenAI, Google API 키 유효성 |
| **Dependencies** | Bun, Node.js, Git 설치 상태 |
| **Tools** | LSP 서버 상태, MCP 서버 상태 |
| **Updates** | 최신 버전 확인 |

### 옵션

| 옵션 | 설명 |
|--------|--------|
| `--category <name>` | 특정 카테고리만 점견(예: `--category authentication`) |
| `--json` | JSON 형식으로 결과 출력 |
| `--verbose` | 상세 정보 포함 |

### 예시 출력

```
oh-my-opencode doctor
┌─────────────────────────────────────────────┐
│ Oh-My-OpenCode Doctor                           │
└─────────────────────────────────────────────┘

Installation
  ✓ OpenCode version: 1.0.155 (>= 1.0.150)
  ✓ Plugin registered in opencode.json

Configuration
  ✓ oh-my-opencode.json is valid
  ⚠ categories.visual-engineering: using default model

Authentication
  ✓ Anthropic API key configured
  ✓ OpenAI API key configured
  ✗ Google API key not found

Dependencies
  ✓ Bun 1.2.5 installed
  ✓ Node.js 22.0.0 installed
  ✓ Git 2.45.0 installed

Summary: 10 passed, 1 warning, 1 failed
```

---

## 5. `run` - OpenCode 세션 러너

OpenCode 세션을 실행하고 작업 완료를 모니터링합니다.

### 사용법

```bash
bunx oh-my-opencode run [prompt]
```

### 옵션

| 옵션 | 설명 |
|--------|--------|
| `--enforce-completion` | 모든 TODO 완료될 때까지 세션 유지 |
| `--timeout <seconds>` | 최대 실행 시간 설정 |

---

## 6. `auth` - 인증 관리

Gemini 모델 사용 시 필요한 Google Antigravity OAuth 인증을 관리합니다.

### 사용법

```bash
# 로그인
bunx oh-my-opencode auth login

# 로그아웃
bunx oh-my-opencode auth logout

# 현재 상태 확인
bunx oh-my-opencode auth status
```

---

## 7. 설정 파일

CLI는 다음 위치(우선순)에서 설정 파일을 검색합니다.

1. **프로젝트 레벨**: `.opencode/oh-my-opencode.json`
2. **사용자 레벨**: `~/.config/opencode/oh-my-opencode.json`
3. **Windows 폴백업**: `%APPDATA%\opencode\oh-my-opencode.json`

### JSONC 지원

설정 파일은 **JSONC(JSON with Comments)** 형식을 지원합니다. 주석과 후행 콤마를 사용할 수 있습니다.

```jsonc
{
  // 에이전트 설정
  "sisyphus_agent": {
    "disabled": false,
    "planner_enabled": true,
  },

  /* 카테고리 커스터마이제이션 */
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3-pro-preview",
    },
  },

  // 특정 스킬 비활성화
  "disabled_skills": ["playwright"]
}
```

---

## 8. 문제 해결

### "OpenCode 버전이 너무 오래되었습니다" 오류

```bash
# OpenCode 업데이트
npm install -g opencode@latest
# 또는
bun install -g opencode@latest
```

### "플러그인이 등록되지 않았습니다" 오류

```bash
# 플러그인 재설치
bunx oh-my-opencode install
```

### Doctor 점견 실패 시

```bash
# 상세 정보로 진단
bunx oh-my-opencode doctor --verbose

# 특정 카테고리만 점검
bunx oh-my-opencode doctor --category authentication

# JSON 형식으로 결과 저장
bunx oh-my-opencode doctor --json > doctor-report.json
```

---

## 9. 개발자 정보

### CLI 구조

```
src/cli/
├── index.ts              # Commander.js 기반 메인 진입점
├── install.ts            # @clack/prompts 기반 TUI 설치 마법사
├── config-manager.ts     # JSONC 파싱, 다중 소스 설정 관리
├── doctor/               # 상태 점검 시스템
│   ├── index.ts          # Doctor 명령어 진입점
│   └── checks/           # 17개 이상의 개별 점견 모듈
├── run/                  # 세션 러너
└── commands/auth.ts      # 인증 관리
```

### 새로운 Doctor 점견 항목 추가

1. `src/cli/doctor/checks/my-check.ts` 생성:

```typescript
import type { DoctorCheck } from "../types"

export const myCheck: DoctorCheck = {
  name: "my-check",
  category: "environment",
  check: async () => {
    // 점견 로직
    const isOk = await someValidation()
    
    return {
      status: isOk ? "pass" : "fail",
      message: isOk ? "모든 것이 좋아 보입니다" : "문제가 있습니다"
    }
  },
}
```

2. `src/cli/doctor/checks/index.ts`에 등록:

```typescript
export { myCheck } from "./my-check"
```

---

## 10. 참고

- **번역 원본**: `cli-guide.md` (273줄)
- **번역 완료일**: 2026-01-18
