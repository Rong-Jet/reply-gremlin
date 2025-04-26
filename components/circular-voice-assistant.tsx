"use client"

import { useState, useRef, useEffect } from "react"

interface CircularVoiceAssistantProps {
  size?: number
  color?: string
  isConnected?: boolean
  isListening?: boolean
  onToggleConnection?: () => void
}

export function CircularVoiceAssistant({ 
  size = 120, 
  color = "#3b82f6",
  isConnected = false,
  isListening = false,
  onToggleConnection = () => {}
}: CircularVoiceAssistantProps) {
  // Use the passed isListening prop for active state
  const isActive = isListening
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const particlesRef = useRef<Array<{ x: number; y: number; radius: number; velocity: number; angle: number }>>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  // Set isMounted to true when the component is mounted
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Debug logging for props
  useEffect(() => {
    console.log("CircularVoiceAssistant props updated:", { isConnected, isListening });
  }, [isConnected, isListening]);

  useEffect(() => {
    if (!isMounted) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = size
    canvas.height = size

    // Initialize particles
    const particleCount = 40
    particlesRef.current = Array(particleCount)
      .fill(0)
      .map(() => ({
        x: size / 2,
        y: size / 2,
        radius: Math.random() * 3 + 1,
        velocity: 0,
        angle: Math.random() * Math.PI * 2,
      }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw outer circle
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2)
      ctx.strokeStyle = (isActive || isPressed) ? color : "#4b5563"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw inner circle glow
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      gradient.addColorStop(0, (isActive || isPressed) ? `${color}50` : "#4b556320")
      gradient.addColorStop(0.7, (isActive || isPressed) ? `${color}10` : "#4b556310")
      gradient.addColorStop(1, "transparent")

      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Update and draw particles
      if (isActive || isPressed) {
        particlesRef.current.forEach((particle) => {
          // Update particle position
          particle.velocity = Math.random() * 2 + 1
          particle.x += Math.cos(particle.angle) * particle.velocity
          particle.y += Math.sin(particle.angle) * particle.velocity

          // Draw particle
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.globalAlpha = 1 - Math.sqrt((particle.x - size / 2) ** 2 + (particle.y - size / 2) ** 2) / (size / 2)
          ctx.fill()
          ctx.globalAlpha = 1

          // Reset particle if it goes out of bounds
          const distance = Math.sqrt((particle.x - size / 2) ** 2 + (particle.y - size / 2) ** 2)
          if (distance > size / 2) {
            particle.x = size / 2
            particle.y = size / 2
            particle.angle = Math.random() * Math.PI * 2
          }
        })
      } else {
        // Draw static center dot
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2)
        ctx.fillStyle = "#4b5563"
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, isPressed, size, color, isMounted])

  const handleClick = (e: React.MouseEvent) => {
    console.log("CircularVoiceAssistant clicked!");
    onToggleConnection();
  };

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="cursor-pointer transition-transform duration-200 hover:scale-105"
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
      />
      <div className="text-sm text-gray-400 mt-2">
        {isConnected ? (isActive ? "Listening..." : "Connected") : "Click to connect"}
      </div>
    </div>
  )
}
