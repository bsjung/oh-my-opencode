# Oh My OpenCode MCP 아키텍처

## 개요

`src/mcp/` 디렉토리는 OpenCode 플러그인에서 제공하는 빌트인 Model Context Protocol (MCP) 서버의 구성을 관리합니다. 이 시스템은 세 가지 핵심 MCP 서버를 제공하여 AI 에이전트의 검색 및 정보 수집 능력을 향상시킵니다.

## 구조

```
src/mcp/
├── index.ts           # MCP 관리 및 내보내기
├── types.ts           # 타입 정의
├── websearch.ts       # Exa AI 웹 검색 MCP
├── context7.ts        # 공식 문서 검색 MCP
├── grep-app.ts        # GitHub 코드 검색 MCP
└── index.test.ts      # 테스트
```

## 빌트인 MCP 서버

### websearch

**Exa AI** 기반 실시간 웹 검색을 제공합니다.

**설명**: 고급 검색 엔진인 Exa AI를 통해 웹에서 관련 콘텐츠를 검색하고 반환합니다.

**구성**:
```typescript
{
  type: "remote",
  url: "https://mcp.exa.ai/mcp?tools=web_search_exa",
  enabled: true,
  headers: { "x-api-key": process.env.EXA_API_KEY },
  oauth: false
}
```

**특징**:
- 실시간 웹 검색
- API 키 기반 인증 (`EXA_API_KEY` 환경 변수)
- OAuth 비활성화 (Exa는 API 키 방식 사용)

---

### context7

최신 **공식 문서**를 검색하여 라이브러리의 사용법을 제공합니다.

**설명**: Context7를 통해 최신 버전의 공식 문서를 가져옵니다.

**구성**:
```typescript
{
  type: "remote",
  url: "https://mcp.context7.com/mcp",
  enabled: true,
  oauth: false
}
```

**특징**:
- 공식 문서 검색
- OAuth 비필요
- 항상 최신 정보 유지

---

### grep_app

수백만 개의 **GitHub 저장소**에서 코드를 초고속으로 검색할 수 있습니다.

**설명**: grep.app 서비스를 통해 전체 GitHub 코드베이스에서 구현 예제를 찾을 수 있습니다.

**구성**:
```typescript
{
  type: "remote",
  url: "https://mcp.grep.app",
  enabled: true,
  oauth: false
}
```

**특징**:
- 초고속 GitHub 코드 검색
- 수백만 개의 저장소 지원
- 구현 예제 찾기에 최적

---

## API

### `createBuiltinMcps()`

비활성화된 MCP를 필터링하여 사용 가능한 MCP 목록을 반환합니다.

**시그네처**:
```typescript
function createBuiltinMcps(disabledMcps: string[] = []): Record<string, RemoteMcpConfig>
```

**매개변수**:
- `disabledMcps`: 비활성화할 MCP 이름 배열

**동작**:
1. 모든 빌트인 MCP를 순회
2. `disabledMcps` 배열에 포함된 MCP 제외
3. 필터링된 MCP 목록 반환

**사용 예시**:
```typescript
// 모든 MCP 사용
const mcps = createBuiltinMcps()

// websearch 비활성화
const mcps = createBuiltinMcps(["websearch"])

// 여러 MCP 비활성화
const mcps = createBuiltinMcps(["websearch", "grep_app"])
```

---

## 타입 정의

### `McpName`

빌트인 MCP 이름의 유니온 열거형입니다.

**정의**:
```typescript
export type McpName = "websearch" | "context7" | "grep_app"
```

### `RemoteMcpConfig`

원격 MCP 서버 구성 객체입니다.

**타입**:
```typescript
type RemoteMcpConfig = {
  type: "remote",
  url: string,
  enabled: boolean,
  headers?: Record<string, string>,
  oauth?: false
}
```

**속성**:
| 속성 | 타입 | 설명 | 필수 여부 |
|--------|--------|--------|----------|
| `type` | `"remote"` | MCP 유형 (항상 원격) | ✅ |
| `url` | `string` | MCP 서버 URL | ✅ |
| `enabled` | `boolean` | 활성화 여부 | ✅ |
| `headers` | `Record<string, string>` | HTTP 헤더 (인증용) | ❌ |
| `oauth` | `false` | OAuth 비활성화 | ❌ |

---

## 설정 및 사용

### MCP 활성화/비활성화

`oh-my-opencode.json` 설정 파일에서 `disabled_mcps` 배열을 사용하여 특정 MCP를 비활성화할 수 있습니다.

**설정 파일 위치**:
- 사용자 설정: `~/.config/opencode/oh-my-opencode.json`
- 프로젝트 설정: `.opencode/oh-my-opencode.json`

**예시**:
```json
{
  "disabled_mcps": ["websearch", "grep_app"]
}
```

**비활성화 가능한 MCP 목록**:
- `websearch`
- `context7`
- `grep_app`

### 환경 변수

#### EXA_API_KEY

websearch MCP 사용을 위한 Exa API 키입니다.

**설정 방법**:
```bash
# Linux/macOS
export EXA_API_KEY=your_api_key_here

# Windows (PowerShell)
$env:EXA_API_KEY=your_api_key_here
```

**참고**: API 키는 [Exa AI](https://exa.ai/)에서 발급받을 수 있습니다.

---

## 테스트

테스트 파일은 `index.test.ts`에 위치하며, 빌트인 MCP 기능을 검증합니다.

**테스트 실행**:
```bash
bun test src/mcp/index.test.ts
```

---

## 아키텍처 다이어그램

이 MCP 시스템은 다음과 같은 3계층 아키텍처를 따릅니다:

1. **원격 MCP 서버**: Exa, Context7, Grep.app와 같은 외부 원격 서버
2. **구성 계층**: `src/mcp/index.ts`에서 각 서버의 연결 정보를 관리
3. **적용 계층**: OpenCode 플러그인에서 이 구성을 사용하여 AI 에이전트에게 도구 제공

이 구조를 통해 새로운 MCP 서버를 쉽게 추가하고 기존 서버를 관리할 수 있습니다.

---

## 사용 사례

### 웹 검색

AI 에이전트가 최신 기술 뉴스나 라이브러리 정보를 찾아야 할 때 websearch MCP를 사용합니다.

**예시 프롬프트**:
```
// "React 19의 새로운 기능은 무엇인가요?"
// → websearch MCP가 최신 React 릴리스를 검색하여 답변 제공
```

### 구현 예제 찾기

특정 기능 구현 방법을 찾을 때 grep_app MCP를 사용합니다.

**예시 프롬프트**:
```
// "TensorFlow에서 데이터셋을 로드하는 방법을 알려줘"
// → grep_app MCP가 GitHub에서 TensorFlow 사용 예제를 찾아 답변
```

### 공식 문서 참조

라이브러리의 정확한 사용법을 알아야 할 때 context7 MCP를 사용합니다.

**예시 프롬프트**:
```
// "Next.js 14의 App Router를 어떻게 사용하나요?"
// → context7 MCP가 Next.js 공식 문서에서 최신 정보를 가져와 답변 제공
```

---

## 확장

### 새로운 MCP 추가하기

새로운 빌트인 MCP를 추가하려면 다음 단계를 따르세요:

1. `src/mcp/` 디렉토리에 새로운 MCP 구성 파일 생성 (예: `mymcp.ts`)
2. `src/mcp/types.ts`에 `McpNameSchema`에 새로운 MCP 이름 추가
3. `src/mcp/index.ts`의 `allBuiltinMcps` 객체에 새로운 MCP 등록

**예시**:
```typescript
// 1. src/mcp/mymcp.ts 생성
export const mymcp = {
  type: "remote" as const,
  url: "https://api.example.com/mcp",
  enabled: true,
  oauth: false as const,
}

// 2. src/mcp/index.ts에 추가
import { websearch } from "./websearch"
import { context7 } from "./context7"
import { grep_app } from "./grep-app"
import { mymcp } from "./mymcp"  // 새로운 MCP 추가

const allBuiltinMcps: Record<McpName | "mymcp", RemoteMcpConfig> = {
  websearch,
  context7,
  grep_app,
  mymcp,  // 새로운 MCP 등록
}
```

---

## 결론

`src/mcp/` 디렉토리는 Oh My OpenCode 플러그인의 검색 및 정보 수집 기능을 담당하는 핵심 모듈입니다.

**핵심 기능**:
- Exa AI 기반 실시간 웹 검색 (websearch)
- 공식 문서 검색 (context7)
- GitHub 코드 검색 (grep_app)
- MCP 관리 및 비활성화 시스템

이 시스템을 통해 AI 에이전트는 웹, 공식 문서, 오픈소스 코드베이스에서 정보를 자유롭게 찾아내어 더 정확한 답변을 제공할 수 있습니다.
