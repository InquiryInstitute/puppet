# Puppet Architecture

## System Overview

The Puppet system is a web-based marionette puppet simulator that uses:
- **MuJoCo WASM** for physics simulation
- **LLM** (via OpenRouter) for natural language command interpretation
- **Three.js/React Three Fiber** for 3D rendering
- **React** for UI and state management

## Component Architecture

### 1. UI Layer (`src/components/`)

- **App.tsx**: Main application component, sets up Three.js canvas
- **ControlPanel.tsx**: Command input interface with quick actions
- **PuppetScene.tsx**: Orchestrates MuJoCo simulation and puppet rendering
- **Puppet.tsx**: 3D puppet model with body parts and animations
- **MarionetteStrings.tsx**: Visual representation of control strings

### 2. MuJoCo Integration (`src/mujoco/`)

- **useMuJoCo.ts**: React hook for MuJoCo WASM initialization and simulation loop
- Loads MuJoCo model from XML
- Manages physics simulation step loop
- Provides model and scene state

### 3. LLM Control System (`src/llm/`)

- **useLLMController.ts**: React hook for LLM command execution
- **motionGenerator.ts**: Converts natural language to motion sequences
- **types.ts**: TypeScript definitions for motion sequences

#### Motion Sequence Structure

```typescript
MotionSequence {
  steps: MotionStep[]
  totalDuration: number
}

MotionStep {
  startTime: number
  duration: number
  rotations: BodyRotations
  stringControls?: StringControls
}
```

### 4. Puppet Models (`src/puppets/`)

- **marionette.xml**: MuJoCo XML model definition
  - Defines puppet body parts (head, torso, arms, legs)
  - Sets up joints and constraints
  - Configures string tendons for marionette control
  - Defines actuators for string manipulation

## Data Flow

```
User Input (Text Command)
    ↓
ControlPanel → executeCommand()
    ↓
LLM Controller → generateMotionSequence()
    ↓
LLM API (OpenRouter) → JSON Response
    ↓
Motion Sequence Parser → MotionSequence
    ↓
PuppetScene → Apply to Puppet
    ↓
Puppet Component → Update rotations
    ↓
Three.js Renderer → Visual output
```

## MuJoCo Integration (Future)

Currently, MuJoCo integration is a placeholder. Full integration requires:

1. **WASM Loading**: Load MuJoCo WASM files from `public/mujoco/`
2. **Model Loading**: Parse `marionette.xml` and create MuJoCo model
3. **Simulation Loop**: Call `mj_step()` each frame
4. **State Sync**: Extract joint positions/rotations from MuJoCo and apply to Three.js meshes
5. **String Control**: Map motion sequence string controls to MuJoCo actuators

## LLM Integration

The LLM integration uses a structured prompt to generate motion sequences:

```
Generate a motion sequence for a marionette puppet to: {command}
Return a JSON object with an action name and an array of steps.
Each step should have: part (head, torso, leftArm, rightArm, leftLeg, rightLeg),
rotation (object with x, y, z in radians), and duration (seconds).
```

The response is parsed into a `MotionSequence` and applied to the puppet.

## Extension Points

### Adding New Puppet Types

1. Create new XML model in `src/puppets/`
2. Update `Puppet.tsx` to render new body parts
3. Extend `BodyRotations` type if needed
4. Update motion generator to handle new parts

### Adding New Motion Types

1. Extend `motionGenerator.ts` with new command patterns
2. Add corresponding motion sequences
3. Update quick commands in `ControlPanel.tsx`

### Integrating Different LLM Providers

1. Update `motionGenerator.ts` `callLLM()` function
2. Add provider-specific API calls
3. Handle different response formats

## Performance Considerations

- **MuJoCo Step Rate**: Currently runs at 60fps, can be throttled
- **LLM API Calls**: Cached responses for common commands
- **Three.js Rendering**: Uses React Three Fiber for efficient updates
- **Motion Interpolation**: Consider adding smooth interpolation between steps

## Future Enhancements

1. **Full MuJoCo Integration**: Complete WASM integration with physics
2. **Multiple Puppets**: Support for multiple puppets in scene
3. **String Visualization**: Real-time string physics visualization
4. **Recording/Playback**: Save and replay motion sequences
5. **Advanced LLM Prompts**: More sophisticated motion generation
6. **Puppet Customization**: Different puppet models and styles
7. **Real-time Control**: Direct string manipulation interface
