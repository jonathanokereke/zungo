// Set required env vars before any module is imported
process.env['NODE_ENV'] = 'test'
process.env['DATABASE_URL'] = 'postgres://unused:unused@localhost:5432/unused'
process.env['AUTH0_DOMAIN'] = 'test.auth0.com'
process.env['AUTH0_AUDIENCE'] = 'https://test-api'
process.env['ANTHROPIC_API_KEY'] = 'test-key'
