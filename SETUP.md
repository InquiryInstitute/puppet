# Puppet Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Modern browser with WebAssembly support

## Installation

1. Install dependencies:
```bash
npm install
```

2. Download MuJoCo WASM files:
   - Visit https://github.com/google-deepmind/mujoco/releases
   - Download the latest MuJoCo WASM build
   - Extract `mujoco.wasm` and `mujoco.data` to `public/mujoco/`

   Alternatively, you can use a CDN or build from source.

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## MuJoCo WASM Integration

The MuJoCo WASM integration is currently a placeholder. To fully integrate:

1. **Option 1: Use MuJoCo.js** (Recommended)
   ```bash
   npm install mujoco
   ```
   Then update `src/mujoco/useMuJoCo.ts` to use the mujoco package.

2. **Option 2: Manual WASM Loading**
   - Download MuJoCo WASM files to `public/mujoco/`
   - Implement WASM loading in `useMuJoCo.ts`
   - Load the model from `src/puppets/marionette.xml`

## LLM Integration

To enable full LLM control:

1. Set up OpenRouter API key (or your preferred LLM provider)
2. Create `.env.local`:
   ```
   VITE_OPENROUTER_API_KEY=your_api_key_here
   ```
3. Update `src/llm/motionGenerator.ts` to use the actual API

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
puppet/
├── src/
│   ├── components/      # React components
│   │   ├── Puppet.tsx   # Puppet 3D model
│   │   ├── PuppetScene.tsx
│   │   └── ControlPanel.tsx
│   ├── mujoco/          # MuJoCo integration
│   ├── llm/             # LLM control system
│   ├── puppets/         # Puppet model definitions (XML)
│   └── App.tsx
├── public/
│   └── mujoco/          # MuJoCo WASM files
└── package.json
```

## Troubleshooting

### MuJoCo WASM not loading
- Ensure WASM files are in `public/mujoco/`
- Check browser console for CORS or loading errors
- Verify WebAssembly is enabled in your browser

### LLM commands not working
- Check API key is set in `.env.local`
- Verify network requests in browser DevTools
- Check console for error messages

### Puppet not animating
- Verify MuJoCo model is loaded
- Check that motion sequences are being generated
- Inspect Three.js scene in browser DevTools
