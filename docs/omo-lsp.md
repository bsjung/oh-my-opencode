# OMO의 LSP (Language Server Protocol) 구조

## 개요

OMO(Oh My OpenCode)는 LSP를 통해 AI 에이전트가 소스 코드를 **의미적으로** 이해하고 수정할 수 있는 기능을 제공합니다.

## LSP 서버 생명주기

### 1. On-Demand 시작

LSP 서버는 상시 실행되지 않고, **필요할 때만** 시작됩니다.

```typescript
// client.ts:93-132
async getClient(root: string, server: ResolvedServer): Promise<LSPClient> {
  // 이미 실행 중인 클라이언트가 있으면 재사용
  if (managed && managed.client.isAlive()) {
    managed.refCount++
    return managed.client
  }

  // 없으면 새로 시작
  const client = new LSPClient(root, server)
  await client.start()      // 프로세스 스폰
  await client.initialize() // LSP 초기화
}
```

### 2. 5분 Idle 시 자동 종료

```typescript
// client.ts:76-91
private cleanupIdleClients(): void {
  const now = Date.now()
  for (const [key, managed] of this.clients) {
    // 참조 카운트가 0이고 5분 이상 사용 안 했으면 종료
    if (managed.refCount === 0 && now - managed.lastUsedAt > this.IDLE_TIMEOUT) {
      managed.client.stop()
      this.clients.delete(key)
    }
  }
}
```

### 3. OpenCode 세션 종료 시 모두 정리

```typescript
// client.ts:27-63
process.on("exit", cleanup)
process.on("SIGINT", () => { cleanup(); process.exit(0) })
process.on("SIGTERM", () => { cleanup(); process.exit(0) })
```

## 포트 사용 여부

### 결론: **TCP 포트를 사용하지 않음**

LSP 서버는 **stdio(표준 입출력)** 기반으로 실행되어 별도의 포트가 필요하지 않습니다.

```typescript
// client.ts:225-235
this.proc = spawn(this.server.command, {
  stdin: "pipe",   // 표준 입력 파이프
  stdout: "pipe",  // 표준 출력 파이프
  stderr: "pipe",  // 표준 에러 파이프
  cwd: this.root,
})
```

### 통신 방식

LSP 서버와 클라이언트는 JSON-RPC 프로토콜을 사용하여 stdio로 통신합니다.

```
┌─────────────────┐    stdin (pipe)    ┌──────────────────────┐
│                 │ ──────────────────> │ typescript-language  │
│   OpenCode      │                    │        server         │
│ (LSP Client)   │ <──────────────────  │  (자식 프로세스)      │
│                 │    stdout (pipe)    └──────────────────────┘
└─────────────────┘
```

**메시지 형식:**
```
Content-Length: 123

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "textDocument/definition",
  "params": { ... }
}
```

### 실제 실행 확인

LSP tool 실행 후 네트워크 연결을 확인한 결과:

```powershell
=== Node processes after LSP start ===
   Id ProcessName      CPU WorkingSet
   -- -----------      --- ----------
 8744 node         0.28   70332416
13144 node        0.125   48541696
29040 node        0.312   68444160
29284 node        0.328   70733824

=== Network connections for Node processes ===
(출력 없음)
```

**확인 결과:**
- Node 프로세스: 새로 4개 생성됨
- TCP 포트: **사용하지 않음**

## 왜 포트가 필요 없는가?

### 이유

1. **IPC (Inter-Process Communication)**: 로컬 프로세스 간 통신은 파이프로 충분
2. **Security**: 포트 노출 없이 로컬에서만 통신
3. **Efficiency**: 네트워크 스택 오버헤드 없음
4. **Portability**: 포트 충돌 걱정 없음

### Editor와의 호환성

LSP 서버는 특정 editor에 종속되지 않습니다:

| Editor | 지원 방식 |
|--------|-----------|
| VS Code | stdio 또는 TCP |
| Vim/Neovim | stdio |
| Emacs | stdio 또는 TCP |
| OMO | **stdio만 지원** |

OMO는 포트 없는 stdio 방식을 사용하여 더 간단하고 안전하게 동작합니다.

## LSP를 통한 소스 코드 수정 방식

### 1. Agent가 LSP Tool 호출

```typescript
// 변수/함수 이름 변경 예시
lsp_rename(
  "src/utils.ts",
  10,      // line (1-based)
  5,       // character (0-based)
  "newName"
)
```

### 2. LSP 서버가 WorkspaceEdit 계산

```json
{
  "changes": {
    "file:///src/utils.ts": [
      {
        "range": {
          "start": {"line": 10, "character": 5},
          "end": {"line": 10, "character": 12}
        },
        "newText": "newName"
      }
    ],
    "file:///src/index.ts": [...]
  },
  "documentChanges": [...]
}
```

### 3. 파일에 직접 적용

```typescript
// utils.ts:277-311
function applyTextEditsToFile(filePath: string, edits: TextEdit[]) {
  // 1. 파일 읽기
  let content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")

  // 2. Edits를 역순으로 정렬 (뒤에서부터 적용)
  const sortedEdits = [...edits].sort((a, b) => {
    if (b.range.start.line !== a.range.start.line) {
      return b.range.start.line - a.range.start.line
    }
    return b.range.start.character - a.range.start.character
  })

  // 3. 각 edit 적용
  for (const edit of sortedEdits) {
    const startLine = edit.range.start.line
    const startChar = edit.range.start.character
    const endLine = edit.range.end.line
    const endChar = edit.range.end.character

    if (startLine === endLine) {
      // 같은 라인 내에서 문자열 교체
      const line = lines[startLine] || ""
      lines[startLine] = line.substring(0, startChar) + edit.newText + line.substring(endChar)
    } else {
      // 여러 라인 교체
      const firstLine = lines[startLine] || ""
      const lastLine = lines[endLine] || ""
      const newContent = firstLine.substring(0, startChar) + edit.newText + lastLine.substring(endChar)
      lines.splice(startLine, endLine - startLine + 1, ...newContent.split("\n"))
    }
  }

  // 4. 파일 쓰기
  writeFileSync(filePath, lines.join("\n"), "utf-8")
}
```

### 4. 결과 보고

```
Applied 15 edit(s) to 3 file(s):
  - src/utils.ts
  - src/index.ts
  - src/components/Button.tsx
```

## LSP의 장점

| 특징 | 설명 |
|------|------|
| **의미 있는 수정** | 단순 텍스트 치환이 아니라 심볼 이해를 통한 정확한 수정 |
| **전체 워크스페이스** | 한 파일의 수정이 다른 파일에 영향 주는 경우 모두 자동 처리 |
| **자동 생성** | Agent가 수정 로직을 직접 짤 필요 없음 - LSP가 다 계산해줌 |
| **언어 독립적** | TypeScript, Python, Rust, Go 등 다양한 언어 지원 |

## 지원하는 LSP Tools

| Tool | 설명 |
|------|------|
| `lsp_goto_definition` | 심볼 정의 위치 찾기 |
| `lsp_find_references` | 심볼 사용 위치 전체 찾기 |
| `lsp_symbols` | 파일/워크스페이스 심볼 목록 |
| `lsp_diagnostics` | 에러/경고/힌트 확인 |
| `lsp_prepare_rename` | 이름 변경 가능 여부 확인 |
| `lsp_rename` | 심볼 이름 전체 변경 |
| `lsp_hover` | 심볼 정보 표시 |
| `lsp_code_actions` | 코드 수정 제안 가져오기 |

## 설정

LSP 서버는 `oh-my-opencode.json`에서 설정할 수 있습니다:

```json
{
  "lsp": {
    "typescript-language-server": {
      "command": ["typescript-language-server", "--stdio"],
      "extensions": [".ts", ".tsx", ".js", ".jsx"],
      "priority": 10
    },
    "pylsp": {
      "command": ["pylsp"],
      "extensions": [".py"],
      "priority": 5
    }
  }
}
```

## 요약

1. **LSP 서버는 필요할 때만 켜지고, 5분간 사용 안 하면 꺼짐**
2. **TCP 포트를 사용하지 않고 stdio 파이프로 통신**
3. **의미 있는 소스 코드 수정: 단순 텍스트 치환이 아니라 심볼 이해 기반**
4. **전체 워크스페이스에서 자동으로 관련 코드 모두 수정**
