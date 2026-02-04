# MuJoCo Marionette Model

## Overview

The marionette model uses MuJoCo physics to simulate a realistic marionette puppet controlled by strings attached to a handle (crossbar).

## Model Structure

### Handle (Control Bar)
- **Position**: `(0, 0, 1.6)` - Above the puppet
- **Type**: Free joint (can move in 6 DOF)
- **Components**:
  - Crossbar: Horizontal bar from `-0.18` to `0.18` on X-axis
  - Stem: Vertical grip extending downward `-0.20` on Z-axis
- **String Attachment Sites**:
  - `h_left`: Left side of crossbar
  - `h_right`: Right side of crossbar
  - `h_front`: Front of crossbar
  - `h_back`: Back of crossbar
  - `h_center`: Center of stem (for head/torso strings)

### Puppet Body
- **Position**: `(0, 0, 1.15)` - Hanging below handle
- **Type**: Free joint (can move freely)
- **Components**:
  - **Torso**: Capsule from `(0, 0, 0.10)` to `(0, 0, -0.12)`
  - **Head**: Ball joint at `(0, 0, 0.16)`, sphere geometry
  - **Arms**: 
    - Ball joints at shoulders
    - Hinge joints at elbows (range: -120° to 0°)
    - Upper arms and forearms as capsules
  - **Legs**:
    - Ball joints at hips
    - Hinge joints at knees (range: -5° to 130°)
    - Thighs and shins as capsules
    - Feet as boxes

## Strings (Spatial Tendons)

Strings are implemented as MuJoCo spatial tendons connecting handle sites to puppet sites:

1. **Head String** (`t_head`): `h_center` → `p_head_top`
2. **Chest String** (`t_chest`): `h_center` → `p_chest`
3. **Left Hand** (`t_l_hand`): `h_left` → `p_l_hand`
4. **Right Hand** (`t_r_hand`): `h_right` → `p_r_hand`
5. **Left Shoulder** (`t_l_shoulder`): `h_front` → `p_l_shoulder`
6. **Right Shoulder** (`t_r_shoulder`): `h_back` → `p_r_shoulder`
7. **Left Foot** (`t_l_foot`): `h_front` → `p_l_foot`
8. **Right Foot** (`t_r_foot`): `h_back` → `p_r_foot`

## Actuators

Position actuators control string length (tendon length):

- **Head** (`a_head`): kp=200, gear=0.05
- **Chest** (`a_chest`): kp=200, gear=0.05
- **Left Hand** (`a_l_hand`): kp=200, gear=0.08
- **Right Hand** (`a_r_hand`): kp=200, gear=0.08
- **Left Shoulder** (`a_l_sh`): kp=150, gear=0.06
- **Right Shoulder** (`a_r_sh`): kp=150, gear=0.06
- **Left Foot** (`a_l_foot`): kp=250, gear=0.08
- **Right Foot** (`a_r_foot`): kp=250, gear=0.08

## Physics Settings

- **Timestep**: 0.002s (500 Hz)
- **Gravity**: `(0, 0, -9.81)` m/s²
- **Solver**: Newton with 50 iterations
- **Default Friction**: 0.8 (sliding), 0.1 (torsional), 0.1 (rolling)
- **Default Density**: 400 kg/m³
- **Joint Damping**: 1.0 (default), varies by joint
- **Joint Armature**: 0.01

## Control

To control the puppet:
1. Set actuator control values (0-1 range typically)
2. Positive values shorten the string (pull up)
3. Negative values lengthen the string (relax)
4. The `gear` parameter scales the control input

## Integration

The model is loaded in `src/mujoco/useMuJoCo.ts` and can be used to:
- Simulate realistic puppet physics
- Control puppet movement via string actuators
- Visualize puppet and strings in 3D
