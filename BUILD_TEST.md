# Quick Local Build Test

Run these commands locally to test if the build works:

```bash
# Install dependencies
npm install --legacy-peer-deps

# Set environment variable
export NEXT_PUBLIC_API_URL=https://3.83.217.40/api/v1

# Try to build
npm run build
```

If you get errors, please share them so we can fix them before deploying to Amplify.

## Common Issues:
1. **Dynamic routes**: App Router pages using dynamic features need to be converted
2. **Missing components**: Some imports might be broken
3. **TypeScript errors**: We disabled strict checking but some errors might remain
