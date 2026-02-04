# Puppet - LLM-Driven Marionette Puppets with MuJoCo WASM

A web-based system for articulating marionette puppets using MuJoCo physics simulation (WASM) and LLM-driven control.

## Overview

This project creates physically accurate marionette puppets that can be controlled through natural language instructions. The puppets are simulated using MuJoCo's physics engine running in WebAssembly, and their movements are orchestrated by an LLM that interprets text commands and generates control sequences.

## Features

- **Physics Simulation**: MuJoCo WASM for realistic puppet physics
- **Marionette Control**: String-based control system for traditional marionette puppets
- **LLM-Driven**: Natural language commands translated to puppet movements
- **Web Interface**: Real-time visualization and interaction
- **Multiple Puppets**: Support for multiple puppets in a single scene

## Architecture

```
┌─────────────────┐
│  LLM Controller │  ← Natural language input
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Motion Planner │  ← Generates control sequences
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  String Control │  ← Marionette string manipulation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MuJoCo WASM    │  ← Physics simulation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Web Renderer   │  ← 3D visualization
└─────────────────┘
```

## Installation

```bash
cd puppet
npm install
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. Open the web interface
2. Enter natural language commands (e.g., "make the puppet wave", "have it dance")
3. The LLM interprets the command and generates control sequences
4. The puppet executes the movements with realistic physics

## Project Structure

```
puppet/
├── src/
│   ├── mujoco/          # MuJoCo WASM integration
│   ├── puppets/         # Puppet model definitions
│   ├── llm/             # LLM control system
│   ├── controls/        # String control logic
│   ├── renderer/        # WebGL/Three.js rendering
│   └── app.tsx          # Main application
├── public/
│   └── mujoco/          # MuJoCo WASM files
├── index.html
├── package.json
└── README.md
```

## Dependencies

- **MuJoCo**: Physics simulation engine (WASM)
- **Three.js**: 3D rendering
- **OpenRouter API**: LLM integration for control
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety

## License

Part of the Inquiry Institute project.
