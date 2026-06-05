# Analysis Process

## Step 1: Project Structure

```text
# Find entry points
glob: **/main.{ts,js,py,go}
glob: **/app.{ts,js,py}
glob: **/index.{ts,js}

# Find routes/controllers
glob: **/routes/**/*.{ts,js}
glob: **/controllers/**/*.{ts,js}
search_file_content: @Controller|@Get|@Post|router\.|app\.get
```

## Step 2: Data Models

```text
# Database schemas
glob: **/models/**/*.{ts,js,py}
glob: **/schema*.{ts,js,py,sql}
glob: **/migrations/**/*
search_file_content: @Entity|class.*Model|schema\s*=
```

## Step 3: Business Logic

```text
# Services and logic
glob: **/services/**/*.{ts,js}
search_file_content: async.*function|export.*class
```

## Step 4: Authentication & Security

```text
# Auth patterns
glob: **/auth/**/*
glob: **/guards/**/*
search_file_content: @Guard|middleware|passport|jwt
```

## Step 5: External Integrations

```text
# External calls
search_file_content: fetch\(|axios\.|HttpService|request\(
glob: **/integrations/**/*
glob: **/clients/**/*
```

## Step 6: Configuration

```text
# Config files
glob: **/*.config.{ts,js}
glob: **/.env*
glob: **/config/**/*
```

## Quick Reference

| Pattern | Purpose |
|---------|---------|
| `**/main.{ts,js,py}` | Entry points |
| `**/routes/**/*` | API routes |
| `**/models/**/*` | Data models |
| `@Controller\|@Get` | NestJS patterns |
| `router.\|app.get` | Express patterns |
