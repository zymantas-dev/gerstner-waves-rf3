import { Component, type ErrorInfo, type ReactNode } from 'react'

export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function Fallback() {
  return (
    <div className="webgl-fallback" role="alert">
      <p>3D preview unavailable</p>
      <span>
        The ocean and the location map both render with WebGL, which your browser or device has
        disabled. Enable hardware acceleration (or try another browser) and reload.
      </span>
    </div>
  )
}

// R3F and MapLibre both throw during render when the GL context cannot be
// created, which would otherwise blank the whole page.
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Ocean scene failed to render', error, info.componentStack)
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children
  }
}

export default function WebGLGuard({ children }: { children: ReactNode }) {
  return isWebGLAvailable() ? <Boundary>{children}</Boundary> : <Fallback />
}
