# AbsoluteJS RAG Vector Example

This demo is pinned to `@absolutejs/absolute@0.19.0-beta.644 + @absolutejs/ai@0.0.2 + @absolutejs/rag@0.0.1`.

This example now demonstrates three backend modes in one repo:

- `sqlite-native`
  - packaged SQLite `vec0`
  - mode shows as `native_vec0`
- `sqlite-fallback`
  - owned JSON fallback path
  - mode shows as `json_fallback`
- `postgres`
  - PostgreSQL + `pgvector`
  - mode shows as `native_pgvector`

The frontend stays the same across all six framework pages. The `Backend mode`
selector swaps the page between explicit backend routes, so the diagnostics and retrieval
results always come from the selected backend.

Every framework page is intended to stay in parity:

- retrieval and source inspection
- diagnostics and ops health
- release control
- quality/evaluation views
- document inspection and chunk previews

There is no separate smoke-only demo surface that carries features the pages do not.

It also exercises the newer public RAG package surfaces from the published beta:

- `@absolutejs/rag`
- `@absolutejs/rag/ui`

## Run It

### SQLite only

This gives you:
- `sqlite-native`
- `sqlite-fallback`

```bash
cd ~/alex/absolutejs-rag-vector-example
bun dev
```

### SQLite + PostgreSQL

Start the local pgvector container (safe to rerun):

```bash
cd ~/alex/absolutejs-rag-vector-example
bun run pg:start
```

Then run the example with PostgreSQL enabled:

```bash
bun run dev:docker
```

Stop the local pgvector container when you are done:

```bash
bun run pg:stop
```

If you want container logs:

```bash
bun run pg:logs
```

## Use a Hosted PostgreSQL Database

Docker is only the default local test path.

You can also point the example at a real PostgreSQL database:

```bash
cd ~/alex/absolutejs-rag-vector-example
RAG_POSTGRES_URL='postgresql://USER:PASS@HOST:PORT/DBNAME?sslmode=require' bun dev
```

Requirements:
- PostgreSQL
- `pgvector` extension available
- permission to create the extension, or it already enabled

## How To Test

Open any page:

- `http://localhost:3000/react`
- `http://localhost:3000/svelte`
- `http://localhost:3000/vue`
- `http://localhost:3000/angular`
- `http://localhost:3000/html`
- `http://localhost:3000/htmx`

In the `Diagnostics` card:

1. Select `SQLite Native`
2. Confirm:
   - backend: `sqlite`
   - mode: `native_vec0`

3. Select `SQLite Fallback`
4. Confirm:
   - backend: `sqlite`
   - mode: `json_fallback`

5. If PostgreSQL is enabled, select `PostgreSQL`
6. Confirm:
   - backend: `postgres`
   - mode: `native_pgvector`

Then in all modes:

1. Add a document with a unique phrase like `glacier-fox-9182`
2. Search for that phrase
3. Confirm:
   - the result text contains the phrase
   - the source label matches the indexed document

## Direct API Checks

Default selected mode:

```bash
curl -s http://localhost:3000/rag/status
```

Force fallback:

```bash
curl -s 'http://localhost:3000/rag/status?mode=sqlite-fallback'
```

Force PostgreSQL:

```bash
curl -s 'http://localhost:3000/rag/status?mode=postgres'
```

Run a search:

```bash
curl -s -X POST 'http://localhost:3000/rag/search?mode=postgres' \
  -H 'Content-Type: application/json' \
  -d '{"query":"metadata filters","topK":2}'
```

## Notes

- `sqlite-native` uses `@absolutejs/absolute-rag-sqlite`
- `postgres` uses `@absolutejs/absolute-rag-postgresql`
- PostgreSQL is optional; the example still works without it
- Windows arm64 support is still limited on the SQLite native line because upstream `sqlite-vec` does not currently ship that target
